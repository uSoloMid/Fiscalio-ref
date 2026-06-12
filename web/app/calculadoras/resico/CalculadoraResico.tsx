"use client";

import { useState } from "react";
import type { Tarifa, TarifaRenglon } from "@/lib/db";
import { mxn, fechaLarga } from "@/lib/format";

const TOPE_ANUAL_RESICO = 3_500_000; // Art. 113-E LISR, primer párrafo

function encontrarRenglon(ingresos: number, renglones: TarifaRenglon[]): TarifaRenglon | null {
  return (
    renglones.find(
      (r) =>
        ingresos >= r.limite_inferior &&
        (r.limite_superior === null || ingresos <= r.limite_superior)
    ) ?? null
  );
}

export default function CalculadoraResico({ tarifa }: { tarifa: Tarifa }) {
  const [entrada, setEntrada] = useState("");
  const ingresos = parseFloat(entrada.replace(/,/g, ""));
  const esValida = !Number.isNaN(ingresos) && ingresos > 0;
  const renglon = esValida ? encontrarRenglon(ingresos, tarifa.renglones) : null;
  const isr = renglon ? ingresos * (renglon.porcentaje / 100) : null;
  const excedeTope = esValida && ingresos * 12 > TOPE_ANUAL_RESICO;

  return (
    <div className="max-w-3xl">
      <p className="text-xs font-bold uppercase tracking-[0.2em] text-emerald-700">Calculadora</p>
      <h1 className="mt-2 font-display text-4xl font-semibold tracking-tight text-ink">
        RESICO personas físicas — pago mensual
      </h1>
      <p className="mt-2 text-stone-600">
        Tasa directa sobre ingresos efectivamente cobrados (sin deducciones), conforme al{" "}
        <strong>{tarifa.fundamento}</strong>, vigente desde {fechaLarga(tarifa.vigencia_inicio)}.
      </p>

      <label className="mt-6 block">
        <span className="text-sm font-medium">Ingresos del mes efectivamente cobrados (MXN, con factura)</span>
        <input
          type="text"
          inputMode="decimal"
          value={entrada}
          onChange={(e) => setEntrada(e.target.value)}
          placeholder="Ej. 45,000"
          className="mt-1.5 w-full max-w-xs rounded-xl border border-stone-300 bg-white px-4 py-3 font-mono text-lg shadow-sm transition-shadow focus:border-emerald-600 focus:shadow-md focus:outline-none focus:ring-2 focus:ring-emerald-600/20"
        />
      </label>
      {entrada !== "" && !esValida && (
        <p className="mt-2 text-sm text-red-600">Captura un monto válido mayor que cero.</p>
      )}
      {excedeTope && (
        <p className="mt-2 max-w-md text-sm text-amber-700">
          Aviso: a este ritmo los ingresos anuales superarían el tope de {mxn(TOPE_ANUAL_RESICO)} del
          Art. 113-E LISR; al excederlo se deja de tributar en RESICO.
        </p>
      )}

      {renglon && isr !== null && (
        <section className="mt-8 overflow-hidden rounded-2xl border border-emerald-900/20 bg-gradient-to-br from-emerald-900 to-emerald-950 p-6 text-emerald-50 shadow-xl shadow-emerald-900/15">
          <h2 className="text-xs font-semibold uppercase tracking-widest text-emerald-300">
            ISR mensual a pagar
          </h2>
          <p className="mt-1 font-display text-5xl font-semibold tabular-nums">{mxn(isr)}</p>
          <p className="mt-3 text-sm text-emerald-100">
            Fórmula: {mxn(ingresos)} × {renglon.porcentaje}% = {mxn(isr)} (tasa del renglón aplicable,
            Art. 113-E LISR).
          </p>
          <p className="mt-1 text-xs text-emerald-300/80">
            No incluye la retención del 1.25% que aplican las personas morales que te paguen
            (Art. 113-J LISR) ni el IVA.
          </p>
        </section>
      )}

      <section className="mt-8">
        <h2 className="text-lg font-semibold">Tasas aplicables</h2>
        <p className="mt-1 text-sm text-stone-500">
          {tarifa.descripcion}.{" "}
          <a
            href={tarifa.fuente_url}
            target="_blank"
            rel="noopener noreferrer"
            className="font-medium text-emerald-700 underline"
          >
            Ver fuente oficial ({tarifa.fuente}) ↗
          </a>
        </p>
        <table className="mt-3 w-full max-w-lg border-collapse text-sm">
          <thead>
            <tr className="border-b-2 border-stone-300 text-left text-xs uppercase text-stone-500">
              <th className="py-2 pr-4">Ingresos mensuales hasta</th>
              <th className="py-2">Tasa</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-stone-200">
            {tarifa.renglones.map((r) => (
              <tr key={r.orden} className={renglon?.orden === r.orden ? "bg-emerald-50 font-medium" : ""}>
                <td className="py-1.5 pr-4 font-mono">
                  {r.limite_superior === null ? "En adelante" : mxn(r.limite_superior)}
                </td>
                <td className="py-1.5 font-mono">{r.porcentaje}%</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
    </div>
  );
}
