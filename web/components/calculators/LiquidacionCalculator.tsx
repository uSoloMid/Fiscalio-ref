"use client";

import { useState } from "react";
import { mxn } from "@/lib/format";
import {
  calcularLiquidacion,
  diasVacaciones,
  type MotivoLiquidacion,
} from "@/lib/calculations/liquidacion";
import { descargarRecibo } from "@/lib/pdf/recibo";
import BotonCopiar from "@/components/ui/BotonCopiar";

const MOTIVOS: { valor: MotivoLiquidacion; etiqueta: string }[] = [
  { valor: "rescision", etiqueta: "Despido injustificado (Art. 48)" },
  { valor: "muerte", etiqueta: "Muerte del trabajador" },
  { valor: "incapacidad", etiqueta: "Incapacidad permanente" },
];

export default function LiquidacionCalculator({ salarioMinimo }: { salarioMinimo: number }) {
  const [salarioStr, setSalarioStr] = useState("");
  const [anios, setAnios] = useState(1);
  const [motivo, setMotivo] = useState<MotivoLiquidacion>("rescision");
  const [vacPendStr, setVacPendStr] = useState("");
  const [mesesAguinaldo, setMesesAguinaldo] = useState(6);

  const salario = parseFloat(salarioStr.replace(/,/g, ""));
  const esValida = !Number.isNaN(salario) && salario > 0;
  const vacPendientes = parseFloat(vacPendStr) || 0;

  const resultado = esValida
    ? calcularLiquidacion({
        salarioDiario: salario,
        aniosTrabajados: anios,
        motivo,
        diasVacacionesPendientes: vacPendientes,
        mesesDesdeUltimoAguinaldo: mesesAguinaldo,
        salarioMinimoGeneral: salarioMinimo,
      })
    : null;

  function generarPdf() {
    if (!resultado) return;
    descargarRecibo({
      titulo: "Liquidación laboral — estimación",
      subtitulo: `Salario diario ${mxn(salario)} · ${anios} ${anios === 1 ? "año" : "años"} de antigüedad · ${
        MOTIVOS.find((m) => m.valor === motivo)?.etiqueta
      }.`,
      lineas: [
        ...resultado.conceptos.map((c) => ({
          etiqueta: c.concepto,
          valor: mxn(c.monto),
          fundamento: `${c.fundamento} — ${c.formula}`,
        })),
        { etiqueta: "TOTAL LIQUIDACIÓN (bruto)", valor: mxn(resultado.total), destacada: true },
      ],
      fundamentoLegal:
        "Arts. 48, 50, 76, 79, 80, 87, 162, 485 y 486 de la Ley Federal del Trabajo. Montos brutos: la indemnización puede tener tratamiento de ISR exento parcial (Art. 93 fracc. XIII LISR). Estimación informativa.",
      fuenteUrl: "https://www.diputados.gob.mx/LeyesBiblio/pdf/LFT.pdf",
      archivo: `liquidacion-${anios}anios.pdf`,
    });
  }

  return (
    <div className="max-w-3xl">
      <p className="text-xs font-bold uppercase tracking-[0.2em] text-accent">Calculadora</p>
      <h1 className="mt-2 font-display text-4xl font-semibold tracking-tight text-ink">
        Liquidación laboral
      </h1>
      <p className="mt-2 text-muted">
        Indemnización y partes proporcionales conforme a la <strong>Ley Federal del Trabajo</strong>,
        con el artículo exacto en cada concepto.
      </p>

      {/* Motivo */}
      <div className="mt-6 flex flex-wrap gap-2">
        {MOTIVOS.map((m) => (
          <button
            key={m.valor}
            onClick={() => setMotivo(m.valor)}
            className={`rounded-full px-4 py-2 text-sm font-medium transition-colors ${
              motivo === m.valor
                ? "bg-accent text-white dark:text-[#1a1f1c]"
                : "border border-line text-muted hover:border-accent hover:text-accent"
            }`}
          >
            {m.etiqueta}
          </button>
        ))}
      </div>

      <div className="mt-6 grid gap-5 sm:grid-cols-2">
        <label className="block">
          <span className="text-sm font-medium">Salario diario (MXN)</span>
          <input
            type="text"
            inputMode="decimal"
            value={salarioStr}
            onChange={(e) => setSalarioStr(e.target.value)}
            placeholder="Ej. 650"
            className="mt-1.5 block w-full rounded-xl border border-line bg-surface px-4 py-3 font-mono text-lg shadow-sm focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
          />
        </label>
        <label className="block">
          <span className="text-sm font-medium">Años trabajados: {anios}</span>
          <input
            type="range"
            min={1}
            max={40}
            value={anios}
            onChange={(e) => setAnios(parseInt(e.target.value))}
            className="mt-3 block w-full accent-[#1a4a3a]"
          />
          <input
            type="number"
            min={1}
            max={60}
            value={anios}
            onChange={(e) => setAnios(Math.max(1, parseInt(e.target.value) || 1))}
            className="mt-2 w-24 rounded-xl border border-line bg-surface px-3 py-2 font-mono text-sm focus:border-accent focus:outline-none"
            aria-label="Años trabajados (número)"
          />
        </label>
        <label className="block">
          <span className="text-sm font-medium">Días de vacaciones no gozados</span>
          <input
            type="text"
            inputMode="numeric"
            value={vacPendStr}
            onChange={(e) => setVacPendStr(e.target.value)}
            placeholder={`Le corresponden ${diasVacaciones(anios)} por año (Art. 76 LFT)`}
            className="mt-1.5 block w-full rounded-xl border border-line bg-surface px-4 py-3 font-mono text-sm shadow-sm focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
          />
        </label>
        <label className="block">
          <span className="text-sm font-medium">Meses desde el último aguinaldo: {mesesAguinaldo}</span>
          <input
            type="range"
            min={0}
            max={12}
            value={mesesAguinaldo}
            onChange={(e) => setMesesAguinaldo(parseInt(e.target.value))}
            className="mt-3 block w-full accent-[#1a4a3a]"
          />
        </label>
      </div>
      {salarioStr !== "" && !esValida && (
        <p className="mt-2 text-sm text-red-600">Captura un salario diario válido.</p>
      )}

      {resultado && (
        <section className="mt-8 overflow-hidden rounded-2xl border border-emerald-900/20 bg-gradient-to-br from-[#1a4a3a] to-[#10302a] p-6 text-emerald-50 shadow-xl shadow-emerald-900/15">
          <h2 className="text-xs font-semibold uppercase tracking-widest text-emerald-300">
            Total liquidación (bruto)
          </h2>
          <p className="mt-1 font-display text-5xl font-semibold tabular-nums">{mxn(resultado.total)}</p>
          <BotonCopiar valor={resultado.total.toFixed(2)} oscuro />

          <table className="mt-5 w-full text-sm">
            <tbody className="divide-y divide-emerald-50/15">
              {resultado.conceptos.map((c) => (
                <tr key={c.concepto}>
                  <td className="py-2 pr-3">
                    <p className="font-medium">{c.concepto}</p>
                    <p className="text-[11px] text-emerald-300/70">
                      {c.fundamento} · {c.formula}
                    </p>
                  </td>
                  <td className="py-2 text-right align-top font-mono">{mxn(c.monto)}</td>
                </tr>
              ))}
            </tbody>
          </table>
          {resultado.salarioPrimaAntiguedadTopado && (
            <p className="mt-3 text-[11px] text-emerald-300/70">
              Para la prima de antigüedad el salario se topó al doble del salario mínimo general
              ({mxn(2 * salarioMinimo)}), Arts. 485 y 486 LFT.
            </p>
          )}

          <button
            onClick={generarPdf}
            className="mt-4 rounded-full bg-emerald-50/10 px-4 py-2 text-xs font-semibold text-emerald-100 transition-colors hover:bg-emerald-50/20"
          >
            ⬇ Descargar desglose PDF
          </button>
        </section>
      )}

      <p className="mt-6 text-xs text-muted">
        Montos brutos conforme a la LFT; la indemnización tiene tratamiento parcialmente exento de
        ISR (Art. 93 fracc. XIII LISR). En caso de despido, también procede el pago de salarios
        vencidos si hay juicio (Art. 48 LFT). No sustituye asesoría laboral profesional.
      </p>
    </div>
  );
}
