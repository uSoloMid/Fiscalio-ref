"""Actualización automática de UMA e INPC vía API oficial de INEGI (BISE).

Requiere token gratuito: https://www.inegi.org.mx/app/api/denue/v1/tokenVerify.aspx
(registro en https://www.inegi.org.mx/app/desarrolladores/generatoken/Usuarios/token_Verify.aspx)

Configurar en variable de entorno INEGI_TOKEN.

Series BISE utilizadas:
- 620706 / 620707 / 620708: UMA diaria / mensual / anual
- 910392: INPC general (base 2da quincena julio 2018 = 100)

Nota: verificar los IDs de serie en https://www.inegi.org.mx/servicios/api_indicadores.html
antes de la primera corrida en producción; si una serie no existe, la API
devuelve error y la corrida queda registrada como 'error' sin tocar datos.
"""
from __future__ import annotations

import os
import sys
from pathlib import Path

import requests

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))
from db import get_connection, upsert_indicador, registrar_corrida, cerrar_corrida

BISE_URL = (
    "https://www.inegi.org.mx/app/api/indicadores/desarrolladores/jsonxml/"
    "INDICATOR/{serie}/es/0700/false/BISE/2.0/{token}?type=json"
)
SERIES_UMA = {"620706": "uma_diaria", "620707": "uma_mensual", "620708": "uma_anual"}
SERIE_INPC = "910392"
FUND_UMA = "Art. 26 apartado B CPEUM; Ley para Determinar el Valor de la UMA (DOF 30/12/2016)"
FUND_INPC = "Art. 59 fracc. III Ley del Sistema Nacional de Información Estadística y Geográfica; Art. 20 Bis CFF"


def fetch_serie(serie: str, token: str) -> list[dict]:
    """Devuelve observaciones [{periodo, valor}] de una serie BISE."""
    resp = requests.get(BISE_URL.format(serie=serie, token=token), timeout=60)
    resp.raise_for_status()
    data = resp.json()
    obs = data["Series"][0]["OBSERVATIONS"]
    return [{"periodo": o["TIME_PERIOD"], "valor": float(o["OBS_VALUE"])} for o in obs]


def periodo_a_fecha(periodo: str, *, uma: bool) -> str:
    """Convierte un periodo BISE a fecha de inicio de vigencia ISO.

    UMA anual ('2026') entra en vigor el 1 de febrero; INPC mensual
    ('2026/05') corresponde al mes indicado.
    """
    if uma:
        return f"{periodo.strip()}-02-01"
    anio, mes = periodo.split("/")
    return f"{anio}-{int(mes):02d}-01"


def run() -> None:
    token = os.environ.get("INEGI_TOKEN")
    conn = get_connection()
    corrida = registrar_corrida(conn, "inegi_api")
    if not token:
        cerrar_corrida(conn, corrida, "error", "Falta INEGI_TOKEN en el entorno")
        print("[inegi_api] OMITIDO — define INEGI_TOKEN para actualizar UMA/INPC desde la API oficial")
        return

    try:
        cambios = 0
        for serie, clave in SERIES_UMA.items():
            for o in fetch_serie(serie, token):
                cambios += upsert_indicador(
                    conn, clave=clave, valor=o["valor"], unidad="MXN",
                    vigencia_inicio=periodo_a_fecha(o["periodo"], uma=True),
                    fuente="INEGI (API BISE)",
                    fuente_url=f"https://www.inegi.org.mx/temas/uma/ (serie {serie})",
                    fundamento=FUND_UMA,
                )
        for o in fetch_serie(SERIE_INPC, token):
            cambios += upsert_indicador(
                conn, clave="inpc_general", valor=o["valor"], unidad="indice",
                vigencia_inicio=periodo_a_fecha(o["periodo"], uma=False),
                fuente="INEGI (API BISE)",
                fuente_url=f"https://www.inegi.org.mx/temas/inpc/ (serie {SERIE_INPC})",
                fundamento=FUND_INPC,
            )
        cerrar_corrida(conn, corrida, "ok", f"{cambios} cambios")
        print(f"[inegi_api] OK — {cambios} cambios")
    except Exception as e:
        cerrar_corrida(conn, corrida, "error", str(e))
        print(f"[inegi_api] ERROR — {e}")
        raise


if __name__ == "__main__":
    run()
