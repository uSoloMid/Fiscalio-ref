# Fiscalio Info

**Plataforma pública y gratuita de referencia fiscal mexicana**, auto-actualizada desde fuentes oficiales. Proyecto de contribución a la sociedad: código abierto, datos con fundamento legal exacto.

> Cada dato muestra su fuente oficial (artículo, DOF, fecha de entrada en vigor). Sin "yo creo que es así".

## Principios

1. **Cero datos inventados.** Todo valor viene de una fuente oficial verificable (DOF, INEGI, SAT, CONASAMI, IMSS, CONAC) con URL y fecha de publicación.
2. **Historial completo.** Cada cambio queda registrado: qué decía antes, qué dice ahora, desde cuándo aplica.
3. **Fundamento visible.** Las calculadoras muestran la fórmula exacta y el artículo que la sustenta.

## Estructura

```
fiscalio-info/
├── scrapers/          # Python: actualización automática desde fuentes oficiales
│   ├── db.py          # Esquema SQLite (compatible con migración a PostgreSQL)
│   ├── seed.py        # Datos iniciales verificados (UMA, salario mínimo, tarifas ISR/RESICO)
│   ├── run_all.py     # Corrida nocturna (cron)
│   └── fuentes/       # Un scraper por fuente oficial
├── web/               # Next.js: sitio público (indicadores + calculadoras)
├── data/              # fiscalio.db (SQLite, generada localmente)
└── docs/
```

## Arranque local

```bash
# 1. Base de datos con valores oficiales verificados
cd scrapers
python seed.py

# 2. Sitio web
cd ../web
npm install
npm run dev   # http://localhost:3000
```

### Actualización automática (opcional)

Registra un token gratuito de la [API de INEGI](https://www.inegi.org.mx/servicios/api_indicadores.html) y configúralo:

```bash
set INEGI_TOKEN=tu_token
python scrapers/run_all.py
```

## Datos incluidos (verificados)

| Dato | Vigencia | Fuente |
|------|----------|--------|
| UMA diaria/mensual/anual 2017–2026 | 01/02 de cada año | INEGI; 2026: DOF 09/01/2026 |
| Salario mínimo general y ZLFN 2022–2026 | 01/01 de cada año | CONASAMI; 2026: DOF 09/12/2025 |
| Tarifa ISR mensual (Art. 96 LISR) | 2026 | Anexo 8 RMF 2026, DOF 28/12/2025 |
| Tasas RESICO PF (Art. 113-E LISR) | desde 2022 | LISR vigente |

## Stack

- **Web:** Next.js (App Router) + Tailwind
- **Datos:** SQLite local → PostgreSQL + pgvector en producción (ver `docs/`)
- **Scrapers:** Python 3.12 (requests)
- **Fase 2:** Chat con IA + RAG (Claude API) citando solo la base verificada

## Licencia

Por definir (sugerencia: MIT para el código; los datos son información pública oficial).
