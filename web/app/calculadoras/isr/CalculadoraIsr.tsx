"use client";

import { useState } from "react";
import type { Tarifa, TarifaRenglon } from "@/lib/db";
import { mxn, fechaLarga } from "@/lib/format";

interface Resultado {
  renglon: TarifaRenglon;
  excedente: number;
  impuestoMarginal: number;
  isr: number;
}

function calcularIsr(baseGravable: number, renglones: TarifaRenglon[]): Resultado | null {
  const renglon = renglones.find(
    (r) =>
      baseGravable >= r.limite_inferior &&
      (r.limite_superior === null || baseGravable <= r.limite_superior)
  );
  if (!renglon) return null;
  const excedente = baseGravable - renglon.limite_inferior;
  const impuestoMarginal = excedente * (renglon.porcentaje / 100);
  return { renglon, excedente, impuestoMarginal, isr: renglon.cuota_fija + impuestoMarginal };
}

export default function CalculadoraIsr({ tarifa }: { tarifa: Tarifa }) {
  const [entrada, setEntrada] = useState("");
  const base = parseFloat(entrada.replace(/,/g, ""));
  const esValida = !Number.isNaN(base) && base > 0;
  const resultado = esValida ? calcularIsr(base, tarifa.renglones) : null;

  return (
    <div className="max-w-3xl">
      <h1 className="text-3xl font-bold tracking-tight">ISR mensual de asalariados</h1>
      <p className="mt-2 text-stone-600">
        Retención mensual conforme a la tarifa del <strong>{tarifa.fundamento}</strong>, vigente desde el{" "}
        {fechaLarga(tarifa.vigencia_inicio)}
        {tarifa.publicado_dof && <> (DOF {fechaLarga(tarifa.publicado_dof)})</>}.
      </p>

      <label className="mt-6 block">
        <span className="text-sm font-medium">Ingreso mensual gravable (MXN)</span>
        <input
          type="text"
          inputMode="decimal"
          value={entrada}
          onChange={(e) => setEntrada(e.target.value)}
          placeholder="Ej. 25,000"
          className="mt-1 w-full max-w-xs rounded border border-stone-300 bg-white px-3 py-2 text-lg focus:border-emerald-600 focus:outline-none"
        />
      </label>
      {entrada !== "" && !esValida && (
        <p className="mt-2 text-sm text-red-600">Captura un monto válido mayor que cero.</p>
      )}

      {resultado && (
        <section className="mt-6 rounded-lg border border-emerald-200 bg-emerald-50 p-5">
          <h2 className="text-sm font-medium text-emerald-900">ISR mensual a retener</h2>
          <p className="text-3xl font-bold text-emerald-900">{mxn(resultado.isr)}</p>

          <h3 className="mt-4 text-sm font-semibold text-emerald-900">
            Desglose (fórmula del Art. 96 LISR)
          </h3>
          <table className="mt-2 w-full text-sm">
            <tbody className="divide-y divide-emerald-200">
              <tr>
                <td className="py-1">Base gravable</td>
                <td className="py-1 text-right font-mono">{mxn(base)}</td>
              </tr>
              <tr>
                <td className="py-1">(−) Límite inferior del renglón</td>
                <td className="py-1 text-right font-mono">{mxn(resultado.renglon.limite_inferior)}</td>
              </tr>
              <tr>
                <td className="py-1">(=) Excedente</td>
                <td className="py-1 text-right font-mono">{mxn(resultado.excedente)}</td>
              </tr>
              <tr>
                <td className="py-1">(×) Tasa sobre excedente</td>
                <td className="py-1 text-right font-mono">{resultado.renglon.porcentaje}%</td>
              </tr>
              <tr>
                <td className="py-1">(=) Impuesto marginal</td>
                <td className="py-1 text-right font-mono">{mxn(resultado.impuestoMarginal)}</td>
              </tr>
              <tr>
                <td className="py-1">(+) Cuota fija</td>
                <td className="py-1 text-right font-mono">{mxn(resultado.renglon.cuota_fija)}</td>
              </tr>
              <tr className="font-semibold">
                <td className="py-1">(=) ISR determinado</td>
                <td className="py-1 text-right font-mono">{mxn(resultado.isr)}</td>
              </tr>
            </tbody>
          </table>
          <p className="mt-3 text-xs text-emerald-800">
            No incluye subsidio para el empleo ni otras deducciones; es el impuesto conforme a la tarifa.
          </p>
        </section>
      )}

      <section className="mt-8">
        <h2 className="text-lg font-semibold">Tarifa aplicada</h2>
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
        <div className="mt-3 overflow-x-auto">
          <table className="w-full border-collapse text-sm">
            <thead>
              <tr className="border-b-2 border-stone-300 text-left text-xs uppercase text-stone-500">
                <th className="py-2 pr-4">Límite inferior</th>
                <th className="py-2 pr-4">Límite superior</th>
                <th className="py-2 pr-4">Cuota fija</th>
                <th className="py-2">% sobre excedente</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-200">
              {tarifa.renglones.map((r) => (
                <tr key={r.orden} className={resultado?.renglon.orden === r.orden ? "bg-emerald-50 font-medium" : ""}>
                  <td className="py-1.5 pr-4 font-mono">{mxn(r.limite_inferior)}</td>
                  <td className="py-1.5 pr-4 font-mono">
                    {r.limite_superior === null ? "En adelante" : mxn(r.limite_superior)}
                  </td>
                  <td className="py-1.5 pr-4 font-mono">{mxn(r.cuota_fija)}</td>
                  <td className="py-1.5 font-mono">{r.porcentaje}%</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
