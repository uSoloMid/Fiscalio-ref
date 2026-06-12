"use client";

import { useState } from "react";
import type { Tarifa } from "@/lib/db";
import { mxn, fechaLarga } from "@/lib/format";
import { calcularIsr, DIAS_PERIODO, type Periodicidad } from "@/lib/calculations/isr";
import { SUBSIDIO_EMPLEO_2026 } from "@/lib/data/subsidio";
import { descargarRecibo } from "@/lib/pdf/recibo";
import BotonCopiar from "@/components/ui/BotonCopiar";

const PERIODOS: { valor: Periodicidad; etiqueta: string }[] = [
  { valor: "mensual", etiqueta: "Mensual" },
  { valor: "quincenal", etiqueta: "Quincenal" },
  { valor: "semanal", etiqueta: "Semanal" },
  { valor: "diario", etiqueta: "Diario" },
];

export default function ISRCalculator({ tarifa }: { tarifa: Tarifa }) {
  const [entrada, setEntrada] = useState("");
  const [periodo, setPeriodo] = useState<Periodicidad>("mensual");
  const [conSubsidio, setConSubsidio] = useState(true);
  const [verProcedimiento, setVerProcedimiento] = useState(false);

  const ingreso = parseFloat(entrada.replace(/,/g, ""));
  const esValida = !Number.isNaN(ingreso) && ingreso > 0;
  const resultado = esValida ? calcularIsr(ingreso, tarifa.renglones, periodo, conSubsidio) : null;
  const factor = DIAS_PERIODO[periodo] / DIAS_PERIODO.mensual;

  function generarPdf() {
    if (!resultado) return;
    descargarRecibo({
      titulo: `ISR de asalariado — periodo ${periodo}`,
      subtitulo: `Cálculo conforme al Art. 96 LISR con la tarifa del Anexo 8 RMF 2026 (DOF ${
        tarifa.publicado_dof ? fechaLarga(tarifa.publicado_dof) : "28 de diciembre de 2025"
      }).`,
      lineas: [
        { etiqueta: "Ingreso gravable del periodo", valor: mxn(ingreso) },
        { etiqueta: "Límite inferior del renglón", valor: mxn(resultado.limiteInferior) },
        { etiqueta: "Excedente sobre el límite", valor: mxn(resultado.excedente) },
        { etiqueta: "Tasa sobre excedente", valor: `${resultado.renglon.porcentaje}%` },
        { etiqueta: "Impuesto marginal", valor: mxn(resultado.impuestoMarginal) },
        { etiqueta: "Cuota fija", valor: mxn(resultado.renglon.cuota_fija) },
        { etiqueta: "ISR determinado", valor: mxn(resultado.isrDeterminado), fundamento: "Art. 96 LISR" },
        {
          etiqueta: "Subsidio al empleo acreditado",
          valor: `− ${mxn(resultado.subsidioAplicado)}`,
          fundamento: "Decreto DOF 31/12/2025",
        },
        { etiqueta: "ISR a retener", valor: mxn(resultado.isrARetener), destacada: true },
        { etiqueta: "Salario neto del periodo", valor: mxn(resultado.neto), destacada: true },
      ],
      fundamentoLegal:
        "Art. 96 de la Ley del Impuesto sobre la Renta; tarifa del Anexo 8 de la RMF 2026 (DOF 28/12/2025); Decreto de subsidio para el empleo (DOF 31/12/2025). No incluye otras percepciones, deducciones ni cuotas IMSS.",
      fuenteUrl: tarifa.fuente_url,
      archivo: `isr-${periodo}-${ingreso.toFixed(0)}.pdf`,
    });
  }

  return (
    <div className="max-w-3xl">
      <p className="text-xs font-bold uppercase tracking-[0.2em] text-accent">Calculadora</p>
      <h1 className="mt-2 font-display text-4xl font-semibold tracking-tight text-ink">
        ISR de asalariados
      </h1>
      <p className="mt-2 text-muted">
        Retención conforme a la tarifa del <strong>{tarifa.fundamento}</strong>, vigente desde{" "}
        {fechaLarga(tarifa.vigencia_inicio)}
        {tarifa.publicado_dof && <> (DOF {fechaLarga(tarifa.publicado_dof)})</>}.
      </p>

      {/* Periodicidad */}
      <div className="mt-6 inline-flex rounded-full border border-line bg-surface p-1">
        {PERIODOS.map((p) => (
          <button
            key={p.valor}
            onClick={() => setPeriodo(p.valor)}
            className={`rounded-full px-4 py-1.5 text-sm font-medium transition-colors ${
              periodo === p.valor
                ? "bg-accent text-white dark:text-[#1a1f1c]"
                : "text-muted hover:text-accent"
            }`}
          >
            {p.etiqueta}
          </button>
        ))}
      </div>

      <div className="mt-5 flex flex-wrap items-end gap-6">
        <label className="block">
          <span className="text-sm font-medium">Ingreso {periodo} gravable (MXN)</span>
          <input
            type="text"
            inputMode="decimal"
            value={entrada}
            onChange={(e) => setEntrada(e.target.value)}
            placeholder={periodo === "mensual" ? "Ej. 25,000" : "Ej. 12,500"}
            className="mt-1.5 block w-64 rounded-xl border border-line bg-surface px-4 py-3 font-mono text-lg shadow-sm transition-shadow focus:border-accent focus:shadow-md focus:outline-none focus:ring-2 focus:ring-accent/20"
          />
        </label>
        <label className="flex cursor-pointer items-center gap-2 pb-3">
          <button
            role="switch"
            aria-checked={conSubsidio}
            onClick={() => setConSubsidio((v) => !v)}
            className={`relative h-6 w-11 rounded-full transition-colors ${
              conSubsidio ? "bg-accent" : "bg-line"
            }`}
          >
            <span
              className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform ${
                conSubsidio ? "translate-x-5.5 left-0" : "left-0.5"
              }`}
              style={{ transform: conSubsidio ? "translateX(22px)" : undefined }}
            />
          </button>
          <span className="text-sm text-foreground">Subsidio al empleo</span>
        </label>
      </div>
      {entrada !== "" && !esValida && (
        <p className="mt-2 text-sm text-red-600">Captura un monto válido mayor que cero.</p>
      )}

      {resultado && (
        <section className="mt-8 overflow-hidden rounded-2xl border border-emerald-900/20 bg-gradient-to-br from-[#1a4a3a] to-[#10302a] p-6 text-emerald-50 shadow-xl shadow-emerald-900/15">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <h2 className="text-xs font-semibold uppercase tracking-widest text-emerald-300">
                ISR a retener ({periodo})
              </h2>
              <p className="mt-1 font-display text-5xl font-semibold tabular-nums">
                {mxn(resultado.isrARetener)}
              </p>
              <BotonCopiar valor={resultado.isrARetener.toFixed(2)} oscuro />
            </div>
            <div className="text-right">
              <h2 className="text-xs font-semibold uppercase tracking-widest text-emerald-300">
                Salario neto
              </h2>
              <p className="mt-1 font-display text-3xl font-semibold tabular-nums">
                {mxn(resultado.neto)}
              </p>
            </div>
          </div>

          <table className="mt-5 w-full text-sm">
            <tbody className="divide-y divide-emerald-50/15">
              <tr><td className="py-1">Ingreso gravable</td><td className="py-1 text-right font-mono">{mxn(ingreso)}</td></tr>
              <tr><td className="py-1">(−) Límite inferior</td><td className="py-1 text-right font-mono">{mxn(resultado.limiteInferior)}</td></tr>
              <tr><td className="py-1">(=) Excedente</td><td className="py-1 text-right font-mono">{mxn(resultado.excedente)}</td></tr>
              <tr><td className="py-1">(×) Tasa sobre excedente</td><td className="py-1 text-right font-mono">{resultado.renglon.porcentaje}%</td></tr>
              <tr><td className="py-1">(=) Impuesto marginal</td><td className="py-1 text-right font-mono">{mxn(resultado.impuestoMarginal)}</td></tr>
              <tr><td className="py-1">(+) Cuota fija</td><td className="py-1 text-right font-mono">{mxn(resultado.renglon.cuota_fija)}</td></tr>
              <tr className="font-semibold"><td className="py-1">(=) ISR determinado</td><td className="py-1 text-right font-mono">{mxn(resultado.isrDeterminado)}</td></tr>
              <tr className="text-emerald-300">
                <td className="py-1">(−) Subsidio al empleo {resultado.aplicaSubsidio ? "" : "(no aplica)"}</td>
                <td className="py-1 text-right font-mono">{mxn(resultado.subsidioAplicado)}</td>
              </tr>
            </tbody>
          </table>

          <div className="mt-4 flex flex-wrap gap-3">
            <button
              onClick={generarPdf}
              className="rounded-full bg-emerald-50/10 px-4 py-2 text-xs font-semibold text-emerald-100 transition-colors hover:bg-emerald-50/20"
            >
              ⬇ Descargar recibo PDF
            </button>
            <button
              onClick={() => setVerProcedimiento((v) => !v)}
              className="rounded-full border border-emerald-50/20 px-4 py-2 text-xs font-semibold text-emerald-200 transition-colors hover:bg-emerald-50/10"
            >
              {verProcedimiento ? "Ocultar" : "Ver"} procedimiento Art. 96 LISR
            </button>
          </div>

          {verProcedimiento && (
            <ol className="mt-4 list-decimal space-y-1.5 border-t border-emerald-50/15 pl-5 pt-4 text-xs leading-relaxed text-emerald-200/90">
              <li>Se determina el ingreso gravable del periodo: {mxn(ingreso)}.</li>
              <li>Se ubica el renglón de la tarifa donde el ingreso queda entre límite inferior y superior{periodo !== "mensual" && <> (tarifa mensual proporcionada a {DIAS_PERIODO[periodo]} días, factor {factor.toFixed(4)})</>}.</li>
              <li>Excedente = ingreso − límite inferior = {mxn(resultado.excedente)}.</li>
              <li>Impuesto marginal = excedente × {resultado.renglon.porcentaje}% = {mxn(resultado.impuestoMarginal)}.</li>
              <li>ISR determinado = cuota fija + impuesto marginal = {mxn(resultado.isrDeterminado)}.</li>
              <li>
                Subsidio al empleo (Decreto DOF 31/12/2025): {mxn(SUBSIDIO_EMPLEO_2026.montoMensual)} mensuales si el
                ingreso mensual no excede {mxn(SUBSIDIO_EMPLEO_2026.topeIngresoMensual)}.
                {resultado.aplicaSubsidio ? " Aplica en este caso." : " No aplica para este ingreso."}
              </li>
              <li>El subsidio se acredita solo hasta el monto del ISR determinado (no genera saldo a favor ni pago en efectivo).</li>
              <li>ISR a retener = ISR determinado − subsidio acreditado = {mxn(resultado.isrARetener)}.</li>
            </ol>
          )}
        </section>
      )}

      {/* Tarifa */}
      <section className="mt-10">
        <h2 className="text-lg font-semibold text-ink">Tarifa aplicada (mensual)</h2>
        <p className="mt-1 text-sm text-muted">
          {tarifa.descripcion}.{" "}
          <a href={tarifa.fuente_url} target="_blank" rel="noopener noreferrer" className="font-medium text-accent underline">
            Ver fuente oficial ({tarifa.fuente}) ↗
          </a>
        </p>
        <div className="mt-3 overflow-x-auto rounded-2xl border border-line bg-surface p-5">
          <table className="w-full border-collapse text-sm">
            <thead>
              <tr className="border-b-2 border-line text-left text-xs uppercase text-muted">
                <th className="py-2 pr-4">Límite inferior</th>
                <th className="py-2 pr-4">Límite superior</th>
                <th className="py-2 pr-4">Cuota fija</th>
                <th className="py-2">% sobre excedente</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {tarifa.renglones.map((r) => (
                <tr key={r.orden} className={resultado?.renglon.orden === r.orden ? "bg-accent/10 font-medium" : ""}>
                  <td className="py-1.5 pr-4 font-mono">{mxn(r.limite_inferior)}</td>
                  <td className="py-1.5 pr-4 font-mono">{r.limite_superior === null ? "En adelante" : mxn(r.limite_superior)}</td>
                  <td className="py-1.5 pr-4 font-mono">{mxn(r.cuota_fija)}</td>
                  <td className="py-1.5 font-mono">{r.porcentaje}%</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <p className="mt-6 text-xs text-muted">
        Cálculo conforme al Art. 96 LISR, Anexo 8 RMF 2026 (DOF 28-dic-2025) y Decreto de subsidio
        para el empleo (DOF 31-dic-2025). No sustituye asesoría fiscal profesional.
      </p>
    </div>
  );
}
