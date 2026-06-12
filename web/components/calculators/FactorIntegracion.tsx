"use client";

import { useState } from "react";
import { diasVacaciones, factorIntegracion } from "@/lib/calculations/liquidacion";

const RANGOS = [
  { etiqueta: "1 año", anios: 1 },
  { etiqueta: "2–3 años", anios: 3 },
  { etiqueta: "4–5 años", anios: 5 },
  { etiqueta: "6–10 años", anios: 8 },
];

export default function FactorIntegracion() {
  const [anios, setAnios] = useState(1);
  const [primaPct, setPrimaPct] = useState("25");

  const prima = Math.max(parseFloat(primaPct) || 25, 25) / 100; // mínimo de ley 25%
  const vac = diasVacaciones(anios);
  const factor = factorIntegracion(anios, prima);

  return (
    <div className="grid gap-6 rounded-2xl border border-line bg-surface p-6 lg:grid-cols-2">
      <div>
        <p className="text-sm font-medium text-foreground">Años de antigüedad</p>
        <div className="mt-2 flex flex-wrap gap-2">
          {RANGOS.map((r) => (
            <button
              key={r.etiqueta}
              onClick={() => setAnios(r.anios)}
              className={`rounded-full px-4 py-2 text-sm font-medium transition-colors ${
                anios === r.anios
                  ? "bg-accent text-white dark:text-[#1a1f1c]"
                  : "border border-line text-muted hover:border-accent hover:text-accent"
              }`}
            >
              {r.etiqueta}
            </button>
          ))}
          <input
            type="number"
            min={1}
            max={50}
            value={anios}
            onChange={(e) => setAnios(Math.max(1, parseInt(e.target.value) || 1))}
            className="w-20 rounded-xl border border-line bg-background px-3 py-2 font-mono text-sm focus:border-accent focus:outline-none"
            aria-label="Años trabajados"
          />
        </div>

        <label className="mt-5 block">
          <span className="text-sm font-medium text-foreground">Prima vacacional (%)</span>
          <input
            type="number"
            min={25}
            max={100}
            value={primaPct}
            onChange={(e) => setPrimaPct(e.target.value)}
            className="mt-1.5 w-24 rounded-xl border border-line bg-background px-3 py-2 font-mono text-sm focus:border-accent focus:outline-none"
          />
          <span className="ml-2 text-xs text-muted">mínimo legal 25% (Art. 80 LFT)</span>
        </label>
      </div>

      <div className="rounded-xl bg-gradient-to-br from-[#1a4a3a] to-[#10302a] p-5 text-emerald-50">
        <p className="text-xs font-semibold uppercase tracking-widest text-emerald-300">
          Factor de integración
        </p>
        <p className="mt-1 font-display text-5xl font-semibold tabular-nums">{factor.toFixed(4)}</p>
        <dl className="mt-4 space-y-1.5 border-t border-emerald-50/15 pt-3 font-mono text-xs text-emerald-200/90">
          <div>Días de vacaciones ({anios} {anios === 1 ? "año" : "años"}): {vac} (Art. 76 LFT)</div>
          <div>Aguinaldo: 15 días (Art. 87 LFT)</div>
          <div>Prima vacacional: {(prima * 100).toFixed(0)}% × {vac} = {(vac * prima).toFixed(2)} días</div>
          <div className="pt-1 font-semibold text-white">
            F = 1 + (15 + {(vac * prima).toFixed(2)}) / 365 = {factor.toFixed(4)}
          </div>
        </dl>
        <p className="mt-3 text-[11px] text-emerald-300/60">
          Fundamento: Art. 84 LFT. El salario base de cotización IMSS se obtiene multiplicando el
          salario diario por este factor (Art. 27 LSS).
        </p>
      </div>
    </div>
  );
}
