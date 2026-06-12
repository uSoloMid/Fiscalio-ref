"use client";

import { useState } from "react";
import type { Tarifa } from "@/lib/db";
import { mxn, fechaLarga } from "@/lib/format";
import { calcularResico, TOPE_ANUAL_RESICO } from "@/lib/calculations/resico";
import { descargarRecibo } from "@/lib/pdf/recibo";
import BotonCopiar from "@/components/ui/BotonCopiar";

function Toggle({ activo, onClick, etiqueta }: { activo: boolean; onClick: () => void; etiqueta: string }) {
  return (
    <label className="flex cursor-pointer items-center gap-2">
      <button
        role="switch"
        aria-checked={activo}
        onClick={onClick}
        className={`relative h-6 w-11 rounded-full transition-colors ${activo ? "bg-accent" : "bg-line"}`}
      >
        <span
          className="absolute top-0.5 left-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform"
          style={{ transform: activo ? "translateX(20px)" : undefined }}
        />
      </button>
      <span className="text-sm text-foreground">{etiqueta}</span>
    </label>
  );
}

export default function RESICOCalculator({ tarifa }: { tarifa: Tarifa }) {
  const [entrada, setEntrada] = useState("");
  const [clientePm, setClientePm] = useState(false);
  const [tieneGastos, setTieneGastos] = useState(false);
  const [verProcedimiento, setVerProcedimiento] = useState(false);

  const ingresos = parseFloat(entrada.replace(/,/g, ""));
  const esValida = !Number.isNaN(ingresos) && ingresos > 0;
  const resultado = esValida ? calcularResico(ingresos, tarifa.renglones, clientePm) : null;
  const excedeTope = esValida && ingresos * 12 > TOPE_ANUAL_RESICO;

  function generarPdf() {
    if (!resultado) return;
    descargarRecibo({
      titulo: "RESICO personas físicas — pago mensual",
      subtitulo:
        "Cálculo conforme al Art. 113-E LISR (tasa directa sobre ingresos efectivamente cobrados) y Arts. 1 y 1-A LIVA.",
      lineas: [
        { etiqueta: "Ingresos del mes cobrados (CFDI)", valor: mxn(ingresos) },
        { etiqueta: "Tasa RESICO aplicable", valor: `${resultado.renglon.porcentaje}%`, fundamento: "Art. 113-E LISR" },
        { etiqueta: "ISR del mes", valor: mxn(resultado.isr) },
        ...(clientePm
          ? [
              { etiqueta: "Retención ISR 1.25% (persona moral)", valor: `− ${mxn(resultado.retencionIsrPm)}`, fundamento: "Art. 113-J LISR" },
              { etiqueta: "ISR a pagar en declaración", valor: mxn(resultado.isrAPagar) },
            ]
          : []),
        { etiqueta: "IVA trasladado (16%)", valor: mxn(resultado.ivaTrasladado), fundamento: "Art. 1 LIVA" },
        ...(clientePm
          ? [{ etiqueta: "IVA retenido por cliente (2/3)", valor: `− ${mxn(resultado.ivaRetenido)}`, fundamento: "Art. 1-A LIVA" }]
          : []),
        { etiqueta: "IVA a pagar en declaración", valor: mxn(resultado.ivaAPagar) },
        { etiqueta: "Total a pagar al SAT este mes", valor: mxn(resultado.totalSat), destacada: true },
      ],
      fundamentoLegal:
        "Arts. 113-E y 113-J de la Ley del ISR; Arts. 1 y 1-A de la Ley del IVA. RESICO aplica a personas físicas con actividad empresarial o profesional con ingresos anuales que no excedan $3,500,000.",
      fuenteUrl: tarifa.fuente_url,
      archivo: `resico-${ingresos.toFixed(0)}.pdf`,
    });
  }

  return (
    <div className="max-w-3xl">
      <p className="text-xs font-bold uppercase tracking-[0.2em] text-accent">Calculadora</p>
      <h1 className="mt-2 font-display text-4xl font-semibold tracking-tight text-ink">
        RESICO personas físicas — pago mensual
      </h1>
      <p className="mt-2 text-muted">
        Tasa directa sobre ingresos efectivamente cobrados (sin deducciones), conforme al{" "}
        <strong>{tarifa.fundamento}</strong>, vigente desde {fechaLarga(tarifa.vigencia_inicio)}.
      </p>

      <div className="mt-6 flex flex-wrap items-end gap-6">
        <label className="block">
          <span className="text-sm font-medium">Ingresos del mes cobrados (MXN, con CFDI)</span>
          <input
            type="text"
            inputMode="decimal"
            value={entrada}
            onChange={(e) => setEntrada(e.target.value)}
            placeholder="Ej. 45,000"
            className="mt-1.5 block w-64 rounded-xl border border-line bg-surface px-4 py-3 font-mono text-lg shadow-sm transition-shadow focus:border-accent focus:shadow-md focus:outline-none focus:ring-2 focus:ring-accent/20"
          />
        </label>
        <div className="space-y-2 pb-1">
          <Toggle activo={clientePm} onClick={() => setClientePm((v) => !v)} etiqueta="Mi cliente es persona moral" />
          <Toggle activo={tieneGastos} onClick={() => setTieneGastos((v) => !v)} etiqueta="Tengo gastos con CFDI" />
        </div>
      </div>
      {entrada !== "" && !esValida && (
        <p className="mt-2 text-sm text-red-600">Captura un monto válido mayor que cero.</p>
      )}
      {tieneGastos && (
        <p className="mt-3 max-w-lg rounded-lg bg-accent/10 px-4 py-2 text-xs leading-relaxed text-accent">
          En RESICO el ISR no admite deducciones (la tasa baja ya lo compensa), pero el IVA de tus
          gastos con CFDI sí es acreditable contra el IVA trasladado (Art. 5 LIVA).
        </p>
      )}
      {excedeTope && (
        <p className="mt-3 max-w-lg text-sm text-amber-600">
          Aviso: a este ritmo los ingresos anuales superarían el tope de {mxn(TOPE_ANUAL_RESICO)} del
          Art. 113-E LISR; al excederlo se deja de tributar en RESICO.
        </p>
      )}

      {resultado && (
        <section className="mt-8 overflow-hidden rounded-2xl border border-emerald-900/20 bg-gradient-to-br from-[#1a4a3a] to-[#10302a] p-6 text-emerald-50 shadow-xl shadow-emerald-900/15">
          <h2 className="text-xs font-semibold uppercase tracking-widest text-emerald-300">
            Total a pagar al SAT este mes
          </h2>
          <p className="mt-1 font-display text-5xl font-semibold tabular-nums">{mxn(resultado.totalSat)}</p>
          <BotonCopiar valor={resultado.totalSat.toFixed(2)} oscuro />

          <table className="mt-5 w-full text-sm">
            <tbody className="divide-y divide-emerald-50/15">
              <tr><td className="py-1">Ingreso cobrado</td><td className="py-1 text-right font-mono">{mxn(ingresos)}</td></tr>
              <tr><td className="py-1">Tasa RESICO aplicable</td><td className="py-1 text-right font-mono">{resultado.renglon.porcentaje}%</td></tr>
              <tr><td className="py-1">ISR del mes</td><td className="py-1 text-right font-mono">{mxn(resultado.isr)}</td></tr>
              {clientePm && (
                <>
                  <tr className="text-emerald-300"><td className="py-1">(−) Retención ISR 1.25% (Art. 113-J)</td><td className="py-1 text-right font-mono">{mxn(resultado.retencionIsrPm)}</td></tr>
                  <tr className="font-semibold"><td className="py-1">(=) ISR a pagar</td><td className="py-1 text-right font-mono">{mxn(resultado.isrAPagar)}</td></tr>
                </>
              )}
              <tr><td className="py-1">IVA trasladado (16%)</td><td className="py-1 text-right font-mono">{mxn(resultado.ivaTrasladado)}</td></tr>
              {clientePm && (
                <tr className="text-emerald-300"><td className="py-1">(−) IVA retenido por cliente (2/3, Art. 1-A LIVA)</td><td className="py-1 text-right font-mono">{mxn(resultado.ivaRetenido)}</td></tr>
              )}
              <tr className="font-semibold"><td className="py-1">(=) IVA a pagar en declaración</td><td className="py-1 text-right font-mono">{mxn(resultado.ivaAPagar)}</td></tr>
            </tbody>
          </table>

          <div className="mt-4 flex flex-wrap gap-3">
            <button onClick={generarPdf} className="rounded-full bg-emerald-50/10 px-4 py-2 text-xs font-semibold text-emerald-100 transition-colors hover:bg-emerald-50/20">
              ⬇ Descargar recibo PDF
            </button>
            <button
              onClick={() => setVerProcedimiento((v) => !v)}
              className="rounded-full border border-emerald-50/20 px-4 py-2 text-xs font-semibold text-emerald-200 transition-colors hover:bg-emerald-50/10"
            >
              {verProcedimiento ? "Ocultar" : "Ver"} procedimiento Art. 113-E LISR
            </button>
          </div>

          {verProcedimiento && (
            <ol className="mt-4 list-decimal space-y-1.5 border-t border-emerald-50/15 pl-5 pt-4 text-xs leading-relaxed text-emerald-200/90">
              <li>Se identifican los ingresos efectivamente cobrados del mes (con CFDI): {mxn(ingresos)}.</li>
              <li>Se localiza en la tabla el monto hasta el cual aplica la tasa: {resultado.renglon.porcentaje}%.</li>
              <li>ISR = ingreso × tasa = {mxn(resultado.isr)}.</li>
              <li>IVA trasladado = ingreso × 16% = {mxn(resultado.ivaTrasladado)} (Art. 1 LIVA).</li>
              {clientePm && <li>El cliente persona moral retiene 2/3 del IVA ({mxn(resultado.ivaRetenido)}, Art. 1-A LIVA) y 1.25% de ISR ({mxn(resultado.retencionIsrPm)}, Art. 113-J LISR).</li>}
              <li>IVA a enterar = IVA trasladado − IVA retenido = {mxn(resultado.ivaAPagar)}.</li>
              <li>Total SAT del mes = ISR a pagar + IVA a enterar = {mxn(resultado.totalSat)}.</li>
            </ol>
          )}
        </section>
      )}

      <section className="mt-10">
        <h2 className="text-lg font-semibold text-ink">Tasas aplicables</h2>
        <p className="mt-1 text-sm text-muted">
          {tarifa.descripcion}.{" "}
          <a href={tarifa.fuente_url} target="_blank" rel="noopener noreferrer" className="font-medium text-accent underline">
            Ver fuente oficial ({tarifa.fuente}) ↗
          </a>
        </p>
        <div className="mt-3 max-w-lg rounded-2xl border border-line bg-surface p-5">
          <table className="w-full border-collapse text-sm">
            <thead>
              <tr className="border-b-2 border-line text-left text-xs uppercase text-muted">
                <th className="py-2 pr-4">Ingresos mensuales hasta</th>
                <th className="py-2">Tasa</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {tarifa.renglones.map((r) => (
                <tr key={r.orden} className={resultado?.renglon.orden === r.orden ? "bg-accent/10 font-medium" : ""}>
                  <td className="py-1.5 pr-4 font-mono">{r.limite_superior === null ? "En adelante" : mxn(r.limite_superior)}</td>
                  <td className="py-1.5 font-mono">{r.porcentaje}%</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <p className="mt-6 text-xs text-muted">
        RESICO aplica a personas físicas con actividad empresarial o profesional con ingresos anuales
        ≤ $3.5M. Art. 113-E LISR vigente desde el 1 de enero de 2022. No sustituye asesoría fiscal
        profesional.
      </p>
    </div>
  );
}
