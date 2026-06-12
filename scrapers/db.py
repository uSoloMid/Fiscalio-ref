"""Capa de base de datos de Fiscalio Info.

SQLite local (data/fiscalio.db). El esquema usa tipos compatibles con
PostgreSQL para facilitar la migración futura (ver docs/migracion-postgres.md).

Principio central: ningún valor existe sin fuente oficial, URL y vigencia.
"""
from __future__ import annotations

import sqlite3
from datetime import datetime, timezone
from pathlib import Path

DB_PATH = Path(__file__).resolve().parent.parent / "data" / "fiscalio.db"

SCHEMA = """
-- Indicadores fiscales (UMA, salario mínimo, INPC, etc.)
-- Cada fila es un VALOR VIGENTE en un periodo: el historial completo vive aquí.
CREATE TABLE IF NOT EXISTS indicadores (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    clave TEXT NOT NULL,              -- ej. 'uma_diaria', 'salario_minimo_general'
    valor REAL NOT NULL,
    unidad TEXT NOT NULL,             -- 'MXN', 'indice', 'porcentaje'
    vigencia_inicio TEXT NOT NULL,    -- ISO date desde cuándo aplica
    vigencia_fin TEXT,                -- NULL = vigente actualmente
    fuente TEXT NOT NULL,             -- ej. 'INEGI', 'CONASAMI', 'DOF'
    fuente_url TEXT NOT NULL,         -- URL exacta del dato oficial
    fundamento TEXT,                  -- ej. 'Art. 123 CPEUM, DOF 27/01/2016'
    publicado_dof TEXT,               -- fecha de publicación en DOF si aplica
    capturado_en TEXT NOT NULL,       -- timestamp de cuándo lo obtuvo el scraper
    UNIQUE (clave, vigencia_inicio)
);

-- Tablas/tarifas legales (ISR art. 96, RESICO art. 113-E, cuotas IMSS...).
-- Una tarifa = conjunto de renglones con vigencia común.
CREATE TABLE IF NOT EXISTS tarifas (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    clave TEXT NOT NULL,              -- ej. 'isr_mensual_art96'
    descripcion TEXT NOT NULL,
    fundamento TEXT NOT NULL,         -- ej. 'Art. 96 LISR; Anexo 8 RMF 2025'
    vigencia_inicio TEXT NOT NULL,
    vigencia_fin TEXT,
    fuente TEXT NOT NULL,
    fuente_url TEXT NOT NULL,
    publicado_dof TEXT,
    capturado_en TEXT NOT NULL,
    UNIQUE (clave, vigencia_inicio)
);

CREATE TABLE IF NOT EXISTS tarifa_renglones (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    tarifa_id INTEGER NOT NULL REFERENCES tarifas(id) ON DELETE CASCADE,
    orden INTEGER NOT NULL,
    limite_inferior REAL NOT NULL,
    limite_superior REAL,             -- NULL = en adelante
    cuota_fija REAL NOT NULL DEFAULT 0,
    porcentaje REAL NOT NULL,         -- % sobre excedente del límite inferior
    UNIQUE (tarifa_id, orden)
);

-- Bitácora de cambios detectados por los scrapers (Módulo 5).
CREATE TABLE IF NOT EXISTS cambios (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    entidad TEXT NOT NULL,            -- 'indicador' | 'tarifa'
    clave TEXT NOT NULL,
    valor_anterior TEXT,
    valor_nuevo TEXT NOT NULL,
    detectado_en TEXT NOT NULL,
    fuente_url TEXT NOT NULL
);

-- Corridas de scrapers, para auditoría y alertas.
CREATE TABLE IF NOT EXISTS corridas (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    scraper TEXT NOT NULL,
    inicio TEXT NOT NULL,
    fin TEXT,
    estado TEXT NOT NULL DEFAULT 'en_curso',  -- 'ok' | 'error' | 'en_curso'
    mensaje TEXT
);

-- Notas del DOF descargadas del servicio oficial SIDOF (Módulo 1 y 5).
CREATE TABLE IF NOT EXISTS dof_notas (
    cod_nota INTEGER PRIMARY KEY,        -- código oficial del DOF
    fecha TEXT NOT NULL,                 -- fecha de publicación ISO
    edicion TEXT NOT NULL,               -- 'MAT' | 'VES' | 'EXT'
    titulo TEXT NOT NULL,
    organismo TEXT,
    texto TEXT,                          -- texto completo (HTML convertido a texto/markdown)
    es_fiscal INTEGER NOT NULL DEFAULT 0,-- 1 si coincide con keywords fiscales
    url TEXT NOT NULL,
    capturado_en TEXT NOT NULL
);

-- Documentos legales completos (leyes, RMF) convertidos a markdown.
CREATE TABLE IF NOT EXISTS documentos (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    clave TEXT NOT NULL,                 -- ej. 'lisr', 'lft', 'rmf_2026'
    titulo TEXT NOT NULL,
    tipo TEXT NOT NULL,                  -- 'ley' | 'rmf' | 'anexo' | 'reglamento'
    ultima_reforma TEXT,                 -- fecha de última reforma si se conoce
    fuente_url TEXT NOT NULL,
    contenido_md TEXT,                   -- texto markdown (markitdown)
    archivo_local TEXT,                  -- ruta del PDF original descargado
    capturado_en TEXT NOT NULL,
    UNIQUE (clave)
);

-- Suscriptores del boletín (newsletter).
CREATE TABLE IF NOT EXISTS suscriptores (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    email TEXT NOT NULL UNIQUE,
    creado_en TEXT NOT NULL,
    confirmado INTEGER NOT NULL DEFAULT 0,
    activo INTEGER NOT NULL DEFAULT 1
);

CREATE INDEX IF NOT EXISTS idx_indicadores_clave ON indicadores (clave, vigencia_inicio DESC);
CREATE INDEX IF NOT EXISTS idx_tarifas_clave ON tarifas (clave, vigencia_inicio DESC);
CREATE INDEX IF NOT EXISTS idx_dof_fecha ON dof_notas (fecha DESC);
CREATE INDEX IF NOT EXISTS idx_dof_fiscal ON dof_notas (es_fiscal, fecha DESC);
"""


def utcnow() -> str:
    return datetime.now(timezone.utc).isoformat(timespec="seconds")


def get_connection() -> sqlite3.Connection:
    DB_PATH.parent.mkdir(parents=True, exist_ok=True)
    conn = sqlite3.connect(DB_PATH, timeout=15)
    conn.row_factory = sqlite3.Row
    conn.execute("PRAGMA foreign_keys = ON")
    # WAL permite lecturas concurrentes mientras un scraper escribe.
    conn.execute("PRAGMA journal_mode = WAL")
    conn.execute("PRAGMA busy_timeout = 15000")
    conn.executescript(SCHEMA)
    return conn


def upsert_indicador(
    conn: sqlite3.Connection,
    *,
    clave: str,
    valor: float,
    unidad: str,
    vigencia_inicio: str,
    fuente: str,
    fuente_url: str,
    fundamento: str | None = None,
    publicado_dof: str | None = None,
    vigencia_fin: str | None = None,
) -> bool:
    """Inserta un valor de indicador. Si ya existe con el mismo valor, no hace nada.

    Si el valor cambió para la misma vigencia (corrección oficial), registra el
    cambio en la bitácora y actualiza. Devuelve True si hubo inserción o cambio.
    """
    existing = conn.execute(
        "SELECT id, valor FROM indicadores WHERE clave = ? AND vigencia_inicio = ?",
        (clave, vigencia_inicio),
    ).fetchone()

    if existing is None:
        # Cierra la vigencia del valor anterior si estaba abierta.
        conn.execute(
            """UPDATE indicadores SET vigencia_fin = ?
               WHERE clave = ? AND vigencia_fin IS NULL AND vigencia_inicio < ?""",
            (vigencia_inicio, clave, vigencia_inicio),
        )
        # Si se inserta un valor histórico (hay otro más reciente), su vigencia
        # termina donde inicia el siguiente.
        if vigencia_fin is None:
            siguiente = conn.execute(
                """SELECT MIN(vigencia_inicio) AS v FROM indicadores
                   WHERE clave = ? AND vigencia_inicio > ?""",
                (clave, vigencia_inicio),
            ).fetchone()
            if siguiente and siguiente["v"] is not None:
                vigencia_fin = siguiente["v"]
        conn.execute(
            """INSERT INTO indicadores
               (clave, valor, unidad, vigencia_inicio, vigencia_fin, fuente,
                fuente_url, fundamento, publicado_dof, capturado_en)
               VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)""",
            (clave, valor, unidad, vigencia_inicio, vigencia_fin, fuente,
             fuente_url, fundamento, publicado_dof, utcnow()),
        )
        conn.execute(
            """INSERT INTO cambios (entidad, clave, valor_anterior, valor_nuevo,
               detectado_en, fuente_url) VALUES ('indicador', ?, NULL, ?, ?, ?)""",
            (clave, str(valor), utcnow(), fuente_url),
        )
        conn.commit()
        return True

    if abs(existing["valor"] - valor) > 1e-9:
        conn.execute(
            "UPDATE indicadores SET valor = ?, capturado_en = ? WHERE id = ?",
            (valor, utcnow(), existing["id"]),
        )
        conn.execute(
            """INSERT INTO cambios (entidad, clave, valor_anterior, valor_nuevo,
               detectado_en, fuente_url) VALUES ('indicador', ?, ?, ?, ?, ?)""",
            (clave, str(existing["valor"]), str(valor), utcnow(), fuente_url),
        )
        conn.commit()
        return True

    return False


def upsert_tarifa(
    conn: sqlite3.Connection,
    *,
    clave: str,
    descripcion: str,
    fundamento: str,
    vigencia_inicio: str,
    fuente: str,
    fuente_url: str,
    renglones: list[dict],
    publicado_dof: str | None = None,
    vigencia_fin: str | None = None,
) -> bool:
    """Inserta una tarifa con sus renglones si no existe. Devuelve True si insertó."""
    existing = conn.execute(
        "SELECT id FROM tarifas WHERE clave = ? AND vigencia_inicio = ?",
        (clave, vigencia_inicio),
    ).fetchone()
    if existing is not None:
        return False

    conn.execute(
        """UPDATE tarifas SET vigencia_fin = ?
           WHERE clave = ? AND vigencia_fin IS NULL AND vigencia_inicio < ?""",
        (vigencia_inicio, clave, vigencia_inicio),
    )
    cur = conn.execute(
        """INSERT INTO tarifas
           (clave, descripcion, fundamento, vigencia_inicio, vigencia_fin,
            fuente, fuente_url, publicado_dof, capturado_en)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)""",
        (clave, descripcion, fundamento, vigencia_inicio, vigencia_fin,
         fuente, fuente_url, publicado_dof, utcnow()),
    )
    tarifa_id = cur.lastrowid
    for i, r in enumerate(renglones, start=1):
        conn.execute(
            """INSERT INTO tarifa_renglones
               (tarifa_id, orden, limite_inferior, limite_superior, cuota_fija, porcentaje)
               VALUES (?, ?, ?, ?, ?, ?)""",
            (tarifa_id, i, r["limite_inferior"], r.get("limite_superior"),
             r.get("cuota_fija", 0), r["porcentaje"]),
        )
    conn.execute(
        """INSERT INTO cambios (entidad, clave, valor_anterior, valor_nuevo,
           detectado_en, fuente_url) VALUES ('tarifa', ?, NULL, ?, ?, ?)""",
        (clave, f"tarifa nueva ({len(renglones)} renglones)", utcnow(), fuente_url),
    )
    conn.commit()
    return True


def registrar_corrida(conn: sqlite3.Connection, scraper: str) -> int:
    cur = conn.execute(
        "INSERT INTO corridas (scraper, inicio) VALUES (?, ?)", (scraper, utcnow())
    )
    conn.commit()
    return cur.lastrowid


def cerrar_corrida(conn: sqlite3.Connection, corrida_id: int, estado: str, mensaje: str = "") -> None:
    conn.execute(
        "UPDATE corridas SET fin = ?, estado = ?, mensaje = ? WHERE id = ?",
        (utcnow(), estado, mensaje, corrida_id),
    )
    conn.commit()
