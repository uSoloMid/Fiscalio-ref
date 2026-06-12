"""Corre todos los scrapers de actualización. Pensado para cron nocturno.

Uso: python run_all.py
Cada scraper registra su corrida en la tabla `corridas`; los cambios
detectados quedan en la tabla `cambios` (Módulo 5: historial).
"""
from __future__ import annotations

import importlib
import traceback

SCRAPERS = [
    "fuentes.inegi_api",   # UMA + INPC (requiere INEGI_TOKEN)
    # "fuentes.dof",       # pendiente: RMF y reformas (DOF tiene cadena SSL incompleta)
    # "fuentes.conasami",  # pendiente: gob.mx bloquea clientes no-navegador
]


def main() -> None:
    errores = []
    for nombre in SCRAPERS:
        try:
            importlib.import_module(nombre).run()
        except Exception:
            errores.append(nombre)
            traceback.print_exc()
    if errores:
        raise SystemExit(f"Scrapers con error: {', '.join(errores)}")
    print("Todas las corridas terminaron.")


if __name__ == "__main__":
    main()
