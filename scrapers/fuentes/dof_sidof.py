"""Descarga de notas del DOF vía el servicio web oficial SIDOF.

Endpoints públicos (los mismos que usa sidof.segob.gob.mx):
- Sumario del día:  https://sidofqa.segob.gob.mx/dof/sidof/notas/{DD-MM-AAAA}
- Nota completa:    https://sidofqa.segob.gob.mx/dof/sidof/notas/nota/{codNota}

Uso:
    python fuentes/dof_sidof.py             # últimos 30 días
    python fuentes/dof_sidof.py 2026-01-01  # desde esa fecha
"""
from __future__ import annotations

import re
import sys
import time
from datetime import date, timedelta
from html import unescape
from pathlib import Path

import requests

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))
from db import get_connection, registrar_corrida, cerrar_corrida, utcnow

BASE = "https://sidofqa.segob.gob.mx/dof/sidof/notas"
HEADERS = {"User-Agent": "FiscalioInfo/1.0 (proyecto publico de referencia fiscal)"}
PAUSA_SEG = 0.6  # cortesía con el servidor del DOF

# Palabras que marcan una nota como fiscalmente relevante.
KEYWORDS_FISCAL = re.compile(
    r"(?i)\b(resoluci[oó]n miscel[aá]nea|RMF|anexo\s+\d+|ISR|IVA|IEPS|c[oó]digo fiscal|"
    r"SAT|salario[s]? m[ií]nimo|UMA\b|INPC|impuesto|fiscal|CONASAMI|IMSS|INFONAVIT|"
    r"subsidio para el empleo|est[ií]mulo[s]? fiscal|comercio exterior|ley de ingresos|"
    r"ley federal del trabajo|seguro social|aduanera|contribuyente)"
)

EDICIONES = (("NotasMatutinas", "MAT"), ("NotasVespertinas", "VES"), ("NotasExtraordinarias", "EXT"))


def html_a_texto(html: str) -> str:
    """Convierte el HTML de una nota DOF a texto plano legible."""
    texto = re.sub(r"(?is)<(script|style).*?</\1>", " ", html)
    texto = re.sub(r"(?i)<br\s*/?>|</p>|</div>|</tr>", "\n", texto)
    texto = re.sub(r"<[^>]+>", " ", texto)
    texto = unescape(texto)
    texto = re.sub(r"[ \t]+", " ", texto)
    return re.sub(r"\n{3,}", "\n\n", texto).strip()


def descargar_dia(conn, fecha: date, con_texto: bool) -> tuple[int, int]:
    """Descarga el sumario de un día. Devuelve (notas_nuevas, fiscales)."""
    f = fecha.strftime("%d-%m-%Y")
    resp = requests.get(f"{BASE}/{f}", headers=HEADERS, timeout=40)
    resp.raise_for_status()
    data = resp.json()

    nuevas = fiscales = 0
    for campo, edicion in EDICIONES:
        for nota in data.get(campo) or []:
            cod = nota.get("codNota")
            titulo = (nota.get("titulo") or "").strip()
            if not cod or not titulo:
                continue
            existe = conn.execute(
                "SELECT 1 FROM dof_notas WHERE cod_nota = ?", (cod,)
            ).fetchone()
            if existe:
                continue

            es_fiscal = 1 if KEYWORDS_FISCAL.search(titulo) else 0
            texto = None
            if con_texto and es_fiscal:
                try:
                    time.sleep(PAUSA_SEG)
                    det = requests.get(f"{BASE}/nota/{cod}", headers=HEADERS, timeout=60)
                    det.raise_for_status()
                    contenido = (det.json().get("Nota") or {}).get("contenido") or ""
                    texto = html_a_texto(contenido) if contenido else None
                except requests.RequestException:
                    texto = None  # el título queda; el texto se reintenta en otra corrida

            conn.execute(
                """INSERT INTO dof_notas
                   (cod_nota, fecha, edicion, titulo, organismo, texto, es_fiscal, url, capturado_en)
                   VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)""",
                (cod, fecha.isoformat(), edicion, titulo,
                 (nota.get("nombreCodOrgaUno") or "").strip() or None,
                 texto, es_fiscal,
                 f"https://www.dof.gob.mx/nota_detalle.php?codigo={cod}&fecha={fecha.strftime('%d/%m/%Y')}",
                 utcnow()),
            )
            nuevas += 1
            fiscales += es_fiscal
    conn.commit()
    return nuevas, fiscales


def run(desde: date | None = None, con_texto: bool = True) -> None:
    conn = get_connection()
    corrida = registrar_corrida(conn, "dof_sidof")
    desde = desde or (date.today() - timedelta(days=30))
    try:
        total = total_fiscales = dias = 0
        dia = desde
        hoy = date.today()
        while dia <= hoy:
            try:
                n, f = descargar_dia(conn, dia, con_texto)
                total += n
                total_fiscales += f
                dias += 1
            except requests.RequestException as e:
                print(f"[dof_sidof] {dia}: error de red ({e}); continúo")
            time.sleep(PAUSA_SEG)
            dia += timedelta(days=1)
        msg = f"{dias} días, {total} notas nuevas ({total_fiscales} fiscales)"
        cerrar_corrida(conn, corrida, "ok", msg)
        print(f"[dof_sidof] OK — {msg}")
    except Exception as e:
        cerrar_corrida(conn, corrida, "error", str(e))
        raise


if __name__ == "__main__":
    inicio = date.fromisoformat(sys.argv[1]) if len(sys.argv) > 1 else None
    run(inicio)
