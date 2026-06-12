"use client";

import { useMemo, useState } from "react";
import { ACTUALIZACIONES_DOF } from "@/lib/data/dof-updates";
import { fechaLarga } from "@/lib/format";

const COLOR_CATEGORIA: Record<string, string> = {
  RMF: "bg-violet-500/15 text-violet-600 dark:text-violet-400",
  Reforma: "bg-red-500/15 text-red-600 dark:text-red-400",
  Criterio: "bg-sky-500/15 text-sky-600 dark:text-sky-400",
  Resolución: "bg-amber-500/15 text-amber-600 dark:text-amber-400",
  Decreto: "bg-emerald-500/15 text-emerald-700 dark:text-emerald-400",
};

const COLOR_IMPACTO: Record<string, string> = {
  Alto: "bg-red-500/15 text-red-600 dark:text-red-400",
  Medio: "bg-amber-500/15 text-amber-600 dark:text-amber-400",
  Informativo: "bg-sky-500/15 text-sky-600 dark:text-sky-400",
};

export default function CambiosTimeline() {
  const [filtroLey, setFiltroLey] = useState<string | null>(null);
  const [filtroCategoria, setFiltroCategoria] = useState<string | null>(null);

  const leyes = useMemo(
    () => [...new Set(ACTUALIZACIONES_DOF.flatMap((a) => a.leyes))].sort(),
    []
  );
  const categorias = useMemo(
    () => [...new Set(ACTUALIZACIONES_DOF.map((a) => a.categoria))],
    []
  );

  const items = ACTUALIZACIONES_DOF.filter(
    (a) =>
      (filtroLey === null || a.leyes.includes(filtroLey)) &&
      (filtroCategoria === null || a.categoria === filtroCategoria)
  );

  return (
    <div className="max-w-3xl">
      <p className="text-xs font-bold uppercase tracking-[0.2em] text-accent">Módulo 5</p>
      <h1 className="mt-2 font-display text-4xl font-semibold tracking-tight text-ink sm:text-5xl">
        Cambios recientes
      </h1>
      <p className="mt-3 text-muted">
        Qué cambió, qué decía antes y desde cuándo aplica — con liga al DOF original.
      </p>

      {/* Filtros */}
      <div className="mt-6 flex flex-wrap items-center gap-2">
        <span className="text-xs font-bold uppercase tracking-widest text-muted">Ley:</span>
        <button
          onClick={() => setFiltroLey(null)}
          className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
            filtroLey === null ? "bg-accent text-white dark:text-[#1a1f1c]" : "border border-line text-muted hover:text-accent"
          }`}
        >
          Todas
        </button>
        {leyes.map((ley) => (
          <button
            key={ley}
            onClick={() => setFiltroLey(filtroLey === ley ? null : ley)}
            className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
              filtroLey === ley ? "bg-accent text-white dark:text-[#1a1f1c]" : "border border-line text-muted hover:text-accent"
            }`}
          >
            {ley}
          </button>
        ))}
        <span className="ml-3 text-xs font-bold uppercase tracking-widest text-muted">Tipo:</span>
        {categorias.map((cat) => (
          <button
            key={cat}
            onClick={() => setFiltroCategoria(filtroCategoria === cat ? null : cat)}
            className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
              filtroCategoria === cat ? "bg-accent text-white dark:text-[#1a1f1c]" : "border border-line text-muted hover:text-accent"
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Timeline */}
      <ol className="relative mt-8 space-y-8 border-l-2 border-line pl-6">
        {items.map((item) => (
          <li key={item.url} className="relative">
            <span className="absolute -left-[31px] top-1.5 h-3 w-3 rounded-full border-2 border-background bg-accent" />
            <div className="flex flex-wrap items-center gap-2">
              <time className="font-mono text-xs text-muted">{fechaLarga(item.fecha)}</time>
              <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide ${COLOR_CATEGORIA[item.categoria]}`}>
                {item.categoria}
              </span>
              <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide ${COLOR_IMPACTO[item.impacto]}`}>
                Impacto {item.impacto.toLowerCase()}
              </span>
            </div>
            <h2 className="mt-2 font-display text-xl font-semibold text-ink">{item.titulo}</h2>
            <p className="mt-1 text-sm leading-relaxed text-muted">{item.resumen}</p>
            <div className="mt-3 grid gap-2 sm:grid-cols-2">
              <div className="rounded-xl border border-line bg-surface p-3">
                <p className="text-[10px] font-bold uppercase tracking-widest text-muted">Antes</p>
                <p className="mt-1 text-xs text-foreground">{item.antes}</p>
              </div>
              <div className="rounded-xl border border-accent/30 bg-accent/5 p-3">
                <p className="text-[10px] font-bold uppercase tracking-widest text-accent">Ahora</p>
                <p className="mt-1 text-xs text-foreground">{item.ahora}</p>
              </div>
            </div>
            <div className="mt-3 flex flex-wrap items-center gap-2">
              {item.leyes.map((ley) => (
                <span key={ley} className="rounded border border-line px-1.5 py-0.5 text-[10px] font-semibold text-muted">
                  {ley}
                </span>
              ))}
              <a
                href={item.url}
                target="_blank"
                rel="noopener noreferrer"
                className="ml-auto text-xs font-semibold text-accent hover:underline"
              >
                Ver publicación original →
              </a>
            </div>
          </li>
        ))}
        {items.length === 0 && (
          <li className="text-sm text-muted">Sin cambios que coincidan con los filtros.</li>
        )}
      </ol>
    </div>
  );
}
