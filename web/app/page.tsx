import Link from "next/link";
import { getIndicadoresVigentes } from "@/lib/db";
import { fechaLarga } from "@/lib/format";
import { ACTUALIZACIONES_DOF } from "@/lib/data/dof-updates";
import { factorIntegracion } from "@/lib/calculations/liquidacion";
import { CALCULADORAS } from "@/lib/data/calculadoras";
import IndicatorCard from "@/components/indicators/IndicatorCard";

export const dynamic = "force-dynamic";

const ORDEN = [
  "uma_diaria",
  "uma_mensual",
  "uma_anual",
  "salario_minimo_general",
  "salario_minimo_frontera",
  "inpc_general",
];

const CHIPS = [
  { texto: "¿Qué es la UMA?", href: "/indicadores#uma" },
  { texto: "ISR sobre mi sueldo", href: "/calculadoras/isr" },
  { texto: "Liquidación por año trabajado", href: "/calculadoras/liquidacion" },
  { texto: "Factor de integración", href: "/indicadores#factor" },
  { texto: "¿Cuánto pago en RESICO?", href: "/calculadoras/resico" },
];

const COLOR_CATEGORIA: Record<string, string> = {
  RMF: "bg-violet-500/15 text-violet-600 dark:text-violet-400",
  Reforma: "bg-red-500/15 text-red-600 dark:text-red-400",
  Criterio: "bg-sky-500/15 text-sky-600 dark:text-sky-400",
  Resolución: "bg-amber-500/15 text-amber-600 dark:text-amber-400",
  Decreto: "bg-emerald-500/15 text-emerald-700 dark:text-emerald-400",
};

export default function Home() {
  const indicadores = getIndicadoresVigentes();
  const ordenados = [...indicadores].sort((a, b) => ORDEN.indexOf(a.clave) - ORDEN.indexOf(b.clave));
  const factor1 = factorIntegracion(1);

  return (
    <div>
      {/* Hero */}
      <section className="mb-12 max-w-3xl">
        <p className="text-xs font-bold uppercase tracking-[0.2em] text-accent">
          Referencia fiscal mexicana
        </p>
        <h1 className="mt-3 font-display text-5xl font-semibold leading-[1.05] tracking-tight text-ink sm:text-6xl">
          Cada cifra, con su
          <em className="text-accent"> artículo y su DOF</em>.
        </h1>
        <p className="mt-5 max-w-xl text-lg leading-relaxed text-muted">
          Indicadores oficiales siempre vigentes y calculadoras que muestran la fórmula exacta de la
          ley. Sin interpretaciones, sin &ldquo;yo creo que es así&rdquo;.
        </p>
        <div className="mt-6 flex flex-wrap gap-3">
          <Link
            href="/calculadoras/isr"
            className="rounded-full bg-accent px-5 py-2.5 text-sm font-semibold text-white shadow-lg shadow-emerald-900/20 transition-colors hover:bg-accent-bright dark:text-[#1a1f1c]"
          >
            Calcular ISR asalariado
          </Link>
          <Link
            href="/calculadoras/resico"
            className="rounded-full border border-line bg-surface px-5 py-2.5 text-sm font-semibold text-foreground transition-colors hover:border-accent hover:text-accent"
          >
            Calcular RESICO
          </Link>
        </div>
        <div className="mt-5 flex flex-wrap gap-2">
          {CHIPS.map((chip) => (
            <Link
              key={chip.texto}
              href={chip.href}
              className="rounded-full border border-line bg-surface px-3 py-1 text-xs text-muted transition-colors hover:border-accent hover:text-accent"
            >
              {chip.texto}
            </Link>
          ))}
        </div>
      </section>

      {/* Indicadores */}
      <section className="mb-14">
        <div className="mb-4 flex items-baseline justify-between">
          <h2 className="text-sm font-bold uppercase tracking-widest text-muted">
            Indicadores vigentes
          </h2>
          <Link href="/indicadores" className="text-xs font-semibold text-accent hover:underline">
            Ver historial completo →
          </Link>
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {ordenados.map((ind, i) => (
            <IndicatorCard key={ind.clave} ind={ind} destacada={i === 0} />
          ))}
          {/* Factor de integración: derivado por fórmula de ley */}
          <article className="card-lift flex flex-col rounded-2xl border border-line bg-surface p-6">
            <h3 className="text-xs font-semibold uppercase tracking-widest text-muted">
              Factor de integración mínimo
            </h3>
            <p className="mt-2 font-display text-4xl font-semibold tracking-tight tabular-nums text-ink">
              {factor1.toFixed(4)}
            </p>
            <dl className="mt-4 space-y-1 text-xs text-muted">
              <div className="font-mono">1 + (15 + 12 × 0.25) / 365</div>
              <div className="pt-1 opacity-70">
                Art. 84 LFT · aguinaldo 15 días + prima vacacional 25% de 12 días (1er año, Art. 76
                LFT reformado 2023)
              </div>
            </dl>
            <div className="mt-auto pt-4">
              <Link
                href="/indicadores#factor"
                className="inline-flex items-center gap-1.5 rounded-full bg-accent/10 px-3.5 py-1.5 text-xs font-semibold text-accent transition-colors hover:bg-accent/20"
              >
                Ver cálculo completo →
              </Link>
            </div>
          </article>
        </div>
      </section>

      {/* Últimas actualizaciones DOF */}
      <section className="mb-14">
        <div className="mb-4 flex items-baseline justify-between">
          <h2 className="text-sm font-bold uppercase tracking-widest text-muted">
            Últimas actualizaciones del DOF
          </h2>
          <Link href="/cambios" className="text-xs font-semibold text-accent hover:underline">
            Línea de tiempo completa →
          </Link>
        </div>
        <div className="divide-y divide-line overflow-hidden rounded-2xl border border-line bg-surface">
          {ACTUALIZACIONES_DOF.map((item) => (
            <div key={item.url} className="flex flex-wrap items-center gap-x-4 gap-y-2 px-5 py-4">
              <time className="w-24 shrink-0 font-mono text-xs text-muted">
                {fechaLarga(item.fecha)}
              </time>
              <span
                className={`rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide ${
                  COLOR_CATEGORIA[item.categoria]
                }`}
              >
                {item.categoria}
              </span>
              <p className="min-w-0 flex-1 text-sm font-medium text-foreground">{item.titulo}</p>
              <div className="flex gap-1">
                {item.leyes.map((ley) => (
                  <span
                    key={ley}
                    className="rounded border border-line px-1.5 py-0.5 text-[10px] font-semibold text-muted"
                  >
                    {ley}
                  </span>
                ))}
              </div>
              <a
                href={item.url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs font-semibold text-accent hover:underline"
              >
                Ver en DOF →
              </a>
            </div>
          ))}
        </div>
      </section>

      {/* Calculadoras */}
      <section>
        <h2 className="mb-4 text-sm font-bold uppercase tracking-widest text-muted">
          Calculadoras con fundamento legal
        </h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {CALCULADORAS.map((c) =>
            c.disponible ? (
              <Link
                key={c.label}
                href={c.href}
                className="card-lift group flex flex-col rounded-2xl border border-line bg-surface p-5"
              >
                <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-accent/10 text-accent">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                    <rect x="4" y="2" width="16" height="20" rx="2" />
                    <path d="M8 6h8M8 10h.01M12 10h.01M16 10h.01M8 14h.01M12 14h.01M16 14h.01M8 18h.01M12 18h.01M16 18h.01" />
                  </svg>
                </span>
                <h3 className="mt-3 font-semibold text-foreground">{c.label}</h3>
                <p className="mt-1 text-xs text-muted">{c.fundamento}</p>
                <span className="mt-auto pt-3 text-xs font-semibold text-accent group-hover:underline">
                  Calcular →
                </span>
              </Link>
            ) : (
              <div
                key={c.label}
                className="flex flex-col rounded-2xl border border-dashed border-line bg-surface/50 p-5 opacity-60"
              >
                <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-line text-muted">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                    <rect x="4" y="2" width="16" height="20" rx="2" />
                    <path d="M8 6h8" />
                  </svg>
                </span>
                <h3 className="mt-3 font-semibold text-foreground">{c.label}</h3>
                <p className="mt-1 text-xs text-muted">{c.fundamento}</p>
                <span className="mt-auto pt-3 text-xs font-semibold text-muted">Próximamente</span>
              </div>
            )
          )}
        </div>
      </section>
    </div>
  );
}
