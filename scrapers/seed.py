"""Seed inicial de Fiscalio Info con valores oficiales VERIFICADOS.

Cada dato incluye su fuente oficial, URL y publicación en DOF.
Este seed se ejecuta una vez; las actualizaciones futuras vienen de los
scrapers automáticos (fuentes/*.py).

Verificación (12/06/2026):
- UMA 2026: DOF 09/01/2026 (nota 5778072) + comunicado INEGI 1/26.
- Salario mínimo 2026: resolución CONASAMI, DOF 09/12/2025 (nota 5775534).
- Tarifa ISR mensual 2026: Anexo 8 RMF 2026, DOF 28/12/2025; verificada
  contra dos transcripciones independientes.
- Tarifa RESICO PF: texto vigente del Art. 113-E LISR (sin cambios desde 2022).
"""
from __future__ import annotations

from db import get_connection, upsert_indicador, upsert_tarifa

DOF_UMA_2026 = "https://www.dof.gob.mx/nota_detalle.php?codigo=5778072&fecha=09/01/2026"
DOF_SM_2026 = "https://www.dof.gob.mx/nota_detalle.php?codigo=5775534&fecha=09/12/2025"
SAT_ANEXO8_2026 = "https://www.sat.gob.mx/minisitio/NormatividadRMFyRGCE/documentos2026/rmf/anexos/Anexo-8-RMF-2026_DOF-28122025.pdf"
INEGI_UMA = "https://www.inegi.org.mx/temas/uma/"
CONASAMI_URL = "https://www.gob.mx/conasami/articulos/incremento-a-los-salarios-minimos-para-2026"

FUND_UMA = "Art. 26 apartado B CPEUM; Arts. 4 y 5 Ley para Determinar el Valor de la UMA (DOF 30/12/2016)"
FUND_SM = "Art. 123 apartado A fracc. VI CPEUM; Arts. 90-96 LFT; Resolución del Consejo de Representantes de la CONASAMI"

# Valores diarios de UMA por año (vigentes desde el 1 de febrero de cada año).
# Mensual = diaria x 30.4; anual = mensual x 12 (Art. 4 Ley UMA) — se derivan.
UMA_DIARIA = {
    2017: 75.49, 2018: 80.60, 2019: 84.49, 2020: 86.88, 2021: 89.62,
    2022: 96.22, 2023: 103.74, 2024: 108.57, 2025: 113.14, 2026: 117.31,
}

# Salario mínimo general diario (vigente desde el 1 de enero de cada año).
SM_GENERAL = {
    2019: 102.68, 2020: 123.22, 2021: 141.70, 2022: 172.87,
    2023: 207.44, 2024: 248.93, 2025: 278.80, 2026: 315.04,
}
SM_FRONTERA = {
    2019: 176.72, 2020: 185.56, 2021: 213.39, 2022: 260.34,
    2023: 312.41, 2024: 374.89, 2025: 419.88, 2026: 440.87,
}

# INPC general (base 2a quincena julio 2018 = 100). Último dato verificado.
# Boletín INEGI 2a quincena mayo 2026.
INPC = {
    "2026-05-01": 145.527,
}
INPC_URL = "https://www.inegi.org.mx/contenidos/saladeprensa/boletines/2026/inpc/inpc_2q2026_05.pdf"
FUND_INPC = "Art. 59 fracc. III LSNIEG; Art. 20 Bis CFF"

# Tarifa mensual ISR 2026 — Art. 96 LISR, Anexo 8 RMF 2026 (DOF 28/12/2025).
ISR_MENSUAL_2026 = [
    {"limite_inferior": 0.01, "limite_superior": 844.59, "cuota_fija": 0.00, "porcentaje": 1.92},
    {"limite_inferior": 844.60, "limite_superior": 7168.51, "cuota_fija": 16.22, "porcentaje": 6.40},
    {"limite_inferior": 7168.52, "limite_superior": 12598.02, "cuota_fija": 420.95, "porcentaje": 10.88},
    {"limite_inferior": 12598.03, "limite_superior": 14644.64, "cuota_fija": 1011.68, "porcentaje": 16.00},
    {"limite_inferior": 14644.65, "limite_superior": 17533.64, "cuota_fija": 1339.14, "porcentaje": 17.92},
    {"limite_inferior": 17533.65, "limite_superior": 35362.83, "cuota_fija": 1856.84, "porcentaje": 21.36},
    {"limite_inferior": 35362.84, "limite_superior": 55736.68, "cuota_fija": 5665.16, "porcentaje": 23.52},
    {"limite_inferior": 55736.69, "limite_superior": 106410.50, "cuota_fija": 10457.09, "porcentaje": 30.00},
    {"limite_inferior": 106410.51, "limite_superior": 141880.66, "cuota_fija": 25659.23, "porcentaje": 32.00},
    {"limite_inferior": 141880.67, "limite_superior": 425641.99, "cuota_fija": 37009.69, "porcentaje": 34.00},
    {"limite_inferior": 425642.00, "limite_superior": None, "cuota_fija": 133488.54, "porcentaje": 35.00},
]

# Tarifa mensual RESICO personas físicas — Art. 113-E LISR (texto vigente desde 2022).
# Tasa directa sobre ingresos cobrados, sin cuota fija ni excedente.
RESICO_PF_MENSUAL = [
    {"limite_inferior": 0.01, "limite_superior": 25000.00, "cuota_fija": 0, "porcentaje": 1.00},
    {"limite_inferior": 25000.01, "limite_superior": 50000.00, "cuota_fija": 0, "porcentaje": 1.10},
    {"limite_inferior": 50000.01, "limite_superior": 83333.33, "cuota_fija": 0, "porcentaje": 1.50},
    {"limite_inferior": 83333.34, "limite_superior": 208333.33, "cuota_fija": 0, "porcentaje": 2.00},
    {"limite_inferior": 208333.34, "limite_superior": 3500000.00, "cuota_fija": 0, "porcentaje": 2.50},
]


def seed_uma(conn) -> int:
    n = 0
    for anio, diaria in sorted(UMA_DIARIA.items()):
        mensual = round(diaria * 30.4, 2)
        anual = round(mensual * 12, 2)
        vig = f"{anio}-02-01"
        url = DOF_UMA_2026 if anio == 2026 else INEGI_UMA
        for clave, valor in (("uma_diaria", diaria), ("uma_mensual", mensual), ("uma_anual", anual)):
            n += upsert_indicador(
                conn, clave=clave, valor=valor, unidad="MXN", vigencia_inicio=vig,
                fuente="INEGI", fuente_url=url, fundamento=FUND_UMA,
                publicado_dof="2026-01-09" if anio == 2026 else None,
            )
    return n


def seed_salario_minimo(conn) -> int:
    n = 0
    series = (("salario_minimo_general", SM_GENERAL), ("salario_minimo_frontera", SM_FRONTERA))
    for clave, valores in series:
        for anio, valor in sorted(valores.items()):
            vig = f"{anio}-01-01"
            es_2026 = anio == 2026
            n += upsert_indicador(
                conn, clave=clave, valor=valor, unidad="MXN", vigencia_inicio=vig,
                fuente="CONASAMI", fuente_url=DOF_SM_2026 if es_2026 else CONASAMI_URL,
                fundamento=FUND_SM, publicado_dof="2025-12-09" if es_2026 else None,
            )
    return n


def seed_inpc(conn) -> int:
    n = 0
    for vig, valor in sorted(INPC.items()):
        n += upsert_indicador(
            conn, clave="inpc_general", valor=valor, unidad="indice",
            vigencia_inicio=vig, fuente="INEGI", fuente_url=INPC_URL,
            fundamento=FUND_INPC,
        )
    return n


def seed_tarifas(conn) -> int:
    n = 0
    n += upsert_tarifa(
        conn,
        clave="isr_mensual_art96",
        descripcion="Tarifa mensual ISR para retenciones por sueldos y salarios",
        fundamento="Art. 96 LISR; Anexo 8 RMF 2026",
        vigencia_inicio="2026-01-01",
        fuente="SAT / DOF",
        fuente_url=SAT_ANEXO8_2026,
        publicado_dof="2025-12-28",
        renglones=ISR_MENSUAL_2026,
    )
    n += upsert_tarifa(
        conn,
        clave="resico_pf_mensual_art113e",
        descripcion="Tasas mensuales RESICO personas físicas (tasa directa sobre ingresos cobrados)",
        fundamento="Art. 113-E LISR",
        vigencia_inicio="2022-01-01",
        fuente="LISR",
        fuente_url="https://www.diputados.gob.mx/LeyesBiblio/pdf/LISR.pdf",
        renglones=RESICO_PF_MENSUAL,
    )
    return n


def main() -> None:
    conn = get_connection()
    i = seed_uma(conn) + seed_salario_minimo(conn) + seed_inpc(conn)
    t = seed_tarifas(conn)
    print(f"Seed completado: {i} valores de indicadores, {t} tarifas insertadas.")


if __name__ == "__main__":
    main()
