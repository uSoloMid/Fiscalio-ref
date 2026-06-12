"""Descarga las leyes fiscales/laborales vigentes (PDF oficial de la Cámara de
Diputados) y la RMF 2026 (SAT), las convierte a markdown con markitdown de
Microsoft y las guarda en la tabla `documentos`.

Fuente de leyes: https://www.diputados.gob.mx/LeyesBiblio/ (texto vigente oficial).
Los PDF quedan en data/leyes/ y el texto markdown en la base de datos.

Uso: python fuentes/leyes.py
"""
from __future__ import annotations

import sys
from pathlib import Path

import requests

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))
from db import get_connection, registrar_corrida, cerrar_corrida, utcnow

DIR_LEYES = Path(__file__).resolve().parent.parent.parent / "data" / "leyes"
HEADERS = {"User-Agent": "Mozilla/5.0 (FiscalioInfo; proyecto publico de referencia fiscal)"}

LEYES = [
    ("cpeum", "Constitución Política de los Estados Unidos Mexicanos", "ley",
     "https://www.diputados.gob.mx/LeyesBiblio/pdf/CPEUM.pdf"),
    ("lisr", "Ley del Impuesto sobre la Renta", "ley",
     "https://www.diputados.gob.mx/LeyesBiblio/pdf/LISR.pdf"),
    ("liva", "Ley del Impuesto al Valor Agregado", "ley",
     "https://www.diputados.gob.mx/LeyesBiblio/pdf/LIVA.pdf"),
    ("cff", "Código Fiscal de la Federación", "ley",
     "https://www.diputados.gob.mx/LeyesBiblio/pdf/CFF.pdf"),
    ("lft", "Ley Federal del Trabajo", "ley",
     "https://www.diputados.gob.mx/LeyesBiblio/pdf/LFT.pdf"),
    ("lss", "Ley del Seguro Social", "ley",
     "https://www.diputados.gob.mx/LeyesBiblio/pdf/LSS.pdf"),
    ("lieps", "Ley del Impuesto Especial sobre Producción y Servicios", "ley",
     "https://www.diputados.gob.mx/LeyesBiblio/pdf/LIEPS.pdf"),
    ("ley_uma", "Ley para Determinar el Valor de la Unidad de Medida y Actualización", "ley",
     "https://www.diputados.gob.mx/LeyesBiblio/pdf/LDVUMA_301216.pdf"),
    ("linfonavit", "Ley del INFONAVIT (Ley del Instituto del Fondo Nacional de la Vivienda para los Trabajadores)", "ley",
     "https://www.diputados.gob.mx/LeyesBiblio/pdf/LIFNVT.pdf"),
    ("anexo8_rmf_2026", "Anexo 8 RMF 2026 — Tarifas ISR (DOF 28/12/2025)", "anexo",
     "https://www.sat.gob.mx/minisitio/NormatividadRMFyRGCE/documentos2026/rmf/anexos/Anexo-8-RMF-2026_DOF-28122025.pdf"),
]


def pdf_a_markdown(ruta: Path) -> str | None:
    try:
        from markitdown import MarkItDown

        resultado = MarkItDown().convert(str(ruta))
        return resultado.text_content
    except Exception as e:
        print(f"  markitdown falló para {ruta.name}: {e}")
        return None


def descargar(clave: str, titulo: str, tipo: str, url: str, conn) -> bool:
    DIR_LEYES.mkdir(parents=True, exist_ok=True)
    destino = DIR_LEYES / f"{clave}.pdf"

    resp = requests.get(url, headers=HEADERS, timeout=120)
    resp.raise_for_status()
    if not resp.content.startswith(b"%PDF"):
        raise RuntimeError(f"{url} no devolvió un PDF (posible bloqueo o cambio de URL)")
    destino.write_bytes(resp.content)

    contenido = pdf_a_markdown(destino)
    conn.execute(
        """INSERT INTO documentos (clave, titulo, tipo, fuente_url, contenido_md, archivo_local, capturado_en)
           VALUES (?, ?, ?, ?, ?, ?, ?)
           ON CONFLICT(clave) DO UPDATE SET
             contenido_md = excluded.contenido_md,
             archivo_local = excluded.archivo_local,
             capturado_en = excluded.capturado_en""",
        (clave, titulo, tipo, url, contenido, str(destino), utcnow()),
    )
    conn.commit()
    kb = len(resp.content) // 1024
    md = f"{len(contenido) // 1024} KB md" if contenido else "sin conversión"
    print(f"  [{clave}] {kb} KB pdf → {md}")
    return contenido is not None


def run() -> None:
    conn = get_connection()
    corrida = registrar_corrida(conn, "leyes")
    ok = errores = 0
    try:
        for clave, titulo, tipo, url in LEYES:
            try:
                descargar(clave, titulo, tipo, url, conn)
                ok += 1
            except Exception as e:
                errores += 1
                print(f"  [{clave}] ERROR — {e}")
        msg = f"{ok} documentos descargados, {errores} errores"
        cerrar_corrida(conn, corrida, "ok" if errores == 0 else "error", msg)
        print(f"[leyes] {msg}")
    except Exception as e:
        cerrar_corrida(conn, corrida, "error", str(e))
        raise


if __name__ == "__main__":
    run()
