"use client";

import { useMemo, useState } from "react";
import type { Tarifa } from "@/lib/db";
import { mxn } from "@/lib/format";
import {
  calcularFiniquito,
  type TipoSalida,
  type VacacionesEstado,
} from "@/lib/calculations/finiquito";
import { descargarRecibo } from "@/lib/pdf/recibo";
import BotonCopiar from "@/components/ui/BotonCopiar";

const TIPOS: { valor: TipoSalida; etiqueta: string; ayuda: string }[] = [
  {
    valor: "despido_injustificado",
    etiqueta: "Me despidieron sin causa",
    ayuda: "Procede liquidación completa: 3 meses + prestaciones (Art. 48 LFT).",
  },
  {
    valor: "despido_justificado",
    etiqueta: "Despido con causa (Art. 47)",
    ayuda: "Sin indemnización, pero el finiquito y la prima de antigüedad sí se pagan.",
  },
  {
    valor: "renuncia",
    etiqueta: "Renuncié",
    ayuda: "Solo finiquito; prima de antigüedad únicamente con 15+ años.",
  },
];

const hoyISO = new Date().toISOString().slice(0, 10);

export default function FiniquitoCalculator({
  tarifa,
  umaDiaria,
  salarioMinimo,
}: {
  tarifa: Tarifa;
  umaDiaria: number;
  salarioMinimo: number;
}) {
  const [fechaIngreso, setFechaIngreso] = useState("");
  const [fechaSalida, setFechaSalida] = useState(hoyISO);
  const [salarioStr, setSalarioStr] = useState("");
  const [tipo, setTipo] = useState<TipoSalida>("despido_injustificado");
  const [vacaciones, setVacaciones] = useState<VacacionesEstado>("todas");
  const [diasVacStr, setDiasVacStr] = useState("");
  const [aguinaldoPagado, setAguinaldoPagado] = useState(false);
  const [diasPendStr, setDiasPendStr] = useState("");
  const [verExplicaciones, setVerExplicaciones] = useState(false);

  const salario = parseFloat(salarioStr.replace(/,/g, ""));
  const fechasValidas =
    fechaIngreso !== "" && fechaSalida !== "" && new Date(fechaIngreso) < new Date(fechaSalida);
  const esValida = fechasValidas && !Number.isNaN(salario) && salario > 0;
  const esDiciembre = fechaSalida !== "" && new Date(fechaSalida + "T00:00:00").getMonth() === 11;

  const resultado = useMemo(() => {
    if (!esValida) return null;
    return calcularFiniquito(
      {
        fechaIngreso,
        fechaSalida,
        salarioDiario: salario,
        tipoSalida: tipo,
        vacaciones,
        diasVacacionesDisfrutados: parseFloat(diasVacStr) || 0,
        aguinaldoYaPagado: esDiciembre ? aguinaldoPagado : false,
        diasSalarioPendientes: parseFloat(diasPendStr) || 0,
      },
      tarifa.renglones,
      umaDiaria,
      salarioMinimo
    );
  }, [esValida, fechaIngreso, fechaSalida, salario, tipo, vacaciones, diasVacStr, aguinaldoPagado, diasPendStr, esDiciembre, tarifa.renglones, umaDiaria, salarioMinimo]);

  function generarPdf() {
    if (!resultado) return;
    descargarRecibo({
      titulo: "Finiquito / liquidación — desglose con ISR",
      subtitulo: `Antigüedad ${resultado.antiguedadTexto} (del ${fechaIngreso} al ${fechaSalida}) · salario diario ${mxn(salario)} · ${TIPOS.find((t) => t.valor === tipo)?.etiqueta}.`,
      lineas: [
        ...resultado.conceptos.map((c) => ({
          etiqueta: c.nombre,
          valor: mxn(c.bruto),
          fundamento: `${c.fundamento} · ${c.formula}${c.exento > 0 ? ` · exento ${mxn(c.exento)}` : ""}`,
        })),
        { etiqueta: "Total bruto", valor: mxn(resultado.totalBruto) },
        { etiqueta: "Total exento de ISR", valor: mxn(resultado.totalExento), fundamento: "Art. 93 fraccs. XIII y XIV LISR" },
        { etiqueta: "Total gravado", valor: mxn(resultado.totalGravado) },
        { etiqueta: "ISR retenido", valor: `− ${mxn(resultado.isrTotal)}`, fundamento: "Art. 96 LISR (tarifa + tasa efectiva)" },
        { etiqueta: "NETO A RECIBIR", valor: mxn(resultado.netoAPagar), destacada: true },
      ],
      fundamentoLegal:
        "LFT Arts. 47, 48, 50, 76, 79, 80, 87, 162, 485 y 486; LISR Arts. 93 (fraccs. XIII y XIV) y 96; tarifa del Anexo 8 RMF 2026 (DOF 28/12/2025). Montos estimados con la UMA y el salario mínimo vigentes.",
      fuenteUrl: "https://www.diputados.gob.mx/LeyesBiblio/pdf/LFT.pdf",
      archivo: `finiquito-${fechaSalida}.pdf`,
      explicaciones: resultado.explicaciones,
    });
  }

  const inputCls =
    "mt-1.5 block w-full rounded-xl border border-line bg-surface px-4 py-3 font-mono text-base shadow-sm transition-shadow focus:border-accent focus:shadow-md focus:outline-none focus:ring-2 focus:ring-accent/20";

  return (
    <div className="max-w-3xl">
      <p className="text-xs font-bold uppercase tracking-[0.2em] text-accent">Calculadora</p>
      <h1 className="mt-2 font-display text-4xl font-semibold tracking-tight text-ink">
        Finiquito y liquidación
      </h1>
      <p className="mt-2 text-muted">
        Solo pedimos lo mínimo: con tus <strong>fechas</strong> derivamos antigüedad, vacaciones,
        aguinaldo y exenciones de ISR — y te explicamos el porqué de cada cosa.
      </p>

      {/* Tipo de salida */}
      <div className="mt-6">
        <p className="text-sm font-medium">¿Cómo terminó la relación laboral?</p>
        <p className="mt-0.5 text-xs text-muted">
          De esto depende si te toca solo finiquito o también indemnización.
        </p>
        <div className="mt-2 flex flex-wrap gap-2">
          {TIPOS.map((t) => (
            <button
              key={t.valor}
              onClick={() => setTipo(t.valor)}
              className={`rounded-full px-4 py-2 text-sm font-medium transition-colors ${
                tipo === t.valor
                  ? "bg-accent text-white dark:text-[#1a1f1c]"
                  : "border border-line text-muted hover:border-accent hover:text-accent"
              }`}
            >
              {t.etiqueta}
            </button>
          ))}
        </div>
        <p className="mt-1.5 text-xs italic text-accent">{TIPOS.find((t) => t.valor === tipo)?.ayuda}</p>
      </div>

      <div className="mt-6 grid gap-5 sm:grid-cols-2">
        <label className="block">
          <span className="text-sm font-medium">Fecha en que empezaste a trabajar</span>
          <input type="date" value={fechaIngreso} max={hoyISO} onChange={(e) => setFechaIngreso(e.target.value)} className={inputCls} />
          <span className="mt-1 block text-xs text-muted">
            Con esta fecha calculamos tu antigüedad exacta: de ella dependen vacaciones (Art. 76 LFT),
            prima de antigüedad (Art. 162) y cuánto ISR queda exento (90 UMA por año, Art. 93 LISR).
          </span>
        </label>
        <label className="block">
          <span className="text-sm font-medium">Último día de trabajo</span>
          <input type="date" value={fechaSalida} onChange={(e) => setFechaSalida(e.target.value)} className={inputCls} />
          <span className="mt-1 block text-xs text-muted">
            Define qué proporción del aguinaldo y de las vacaciones del año en curso te corresponde.
          </span>
        </label>
        <label className="block">
          <span className="text-sm font-medium">Salario diario bruto (MXN)</span>
          <input type="text" inputMode="decimal" value={salarioStr} onChange={(e) => setSalarioStr(e.target.value)} placeholder="Ej. 650" className={inputCls} />
          <span className="mt-1 block text-xs text-muted">
            Si te pagan por mes, divide entre 30.4. Es la base de todos los conceptos.
          </span>
        </label>
        <label className="block">
          <span className="text-sm font-medium">Días trabajados aún no pagados (opcional)</span>
          <input type="text" inputMode="numeric" value={diasPendStr} onChange={(e) => setDiasPendStr(e.target.value)} placeholder="0" className={inputCls} />
          <span className="mt-1 block text-xs text-muted">
            Días de la última semana/quincena que quedaron pendientes de pago.
          </span>
        </label>
      </div>

      {/* Vacaciones */}
      <div className="mt-6">
        <p className="text-sm font-medium">
          Del último año que cumpliste, ¿disfrutaste tus vacaciones?
        </p>
        <p className="mt-0.5 text-xs text-muted">
          El derecho nace al cumplir cada año de servicio. Las del año en curso las calculamos en
          proporción automáticamente con tus fechas — no necesitas saber cuántas son.
        </p>
        <div className="mt-2 flex flex-wrap items-center gap-2">
          {(
            [
              ["todas", "Sí, completas"],
              ["ninguna", "No, ninguna"],
              ["parcial", "Solo algunos días"],
            ] as [VacacionesEstado, string][]
          ).map(([v, etiqueta]) => (
            <button
              key={v}
              onClick={() => setVacaciones(v)}
              className={`rounded-full px-4 py-2 text-sm font-medium transition-colors ${
                vacaciones === v
                  ? "bg-accent text-white dark:text-[#1a1f1c]"
                  : "border border-line text-muted hover:border-accent hover:text-accent"
              }`}
            >
              {etiqueta}
            </button>
          ))}
          {vacaciones === "parcial" && (
            <input
              type="number"
              min={0}
              value={diasVacStr}
              onChange={(e) => setDiasVacStr(e.target.value)}
              placeholder="¿cuántos días?"
              className="w-36 rounded-xl border border-line bg-surface px-3 py-2 font-mono text-sm focus:border-accent focus:outline-none"
            />
          )}
        </div>
      </div>

      {/* Aguinaldo: solo se pregunta si la salida es en diciembre */}
      {esDiciembre && (
        <div className="mt-6">
          <p className="text-sm font-medium">¿Ya te pagaron el aguinaldo de este año?</p>
          <p className="mt-0.5 text-xs text-muted">
            Lo preguntamos solo porque tu salida es en diciembre: el aguinaldo se paga antes del día
            20 (Art. 87 LFT). En cualquier otro mes lo calculamos proporcional automáticamente.
          </p>
          <div className="mt-2 flex gap-2">
            {[
              [true, "Sí, ya me lo pagaron"],
              [false, "No, está pendiente"],
            ].map(([v, etiqueta]) => (
              <button
                key={String(v)}
                onClick={() => setAguinaldoPagado(v as boolean)}
                className={`rounded-full px-4 py-2 text-sm font-medium transition-colors ${
                  aguinaldoPagado === v
                    ? "bg-accent text-white dark:text-[#1a1f1c]"
                    : "border border-line text-muted hover:border-accent hover:text-accent"
                }`}
              >
                {etiqueta as string}
              </button>
            ))}
          </div>
        </div>
      )}

      {fechaIngreso !== "" && fechaSalida !== "" && !fechasValidas && (
        <p className="mt-4 text-sm text-red-600">La fecha de ingreso debe ser anterior a la de salida.</p>
      )}

      {/* Resultado */}
      {resultado && (
        <section className="mt-8 overflow-hidden rounded-2xl border border-emerald-900/20 bg-gradient-to-br from-[#1a4a3a] to-[#10302a] p-6 text-emerald-50 shadow-xl shadow-emerald-900/15">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <h2 className="text-xs font-semibold uppercase tracking-widest text-emerald-300">
                Neto a recibir
              </h2>
              <p className="mt-1 font-display text-5xl font-semibold tabular-nums">{mxn(resultado.netoAPagar)}</p>
              <BotonCopiar valor={resultado.netoAPagar.toFixed(2)} oscuro />
            </div>
            <div className="text-right text-xs text-emerald-200/80">
              <p>Antigüedad detectada: <strong>{resultado.antiguedadTexto}</strong></p>
              <p>Vacaciones por año actual: {resultado.diasVacacionesAnioActual} días (Art. 76 LFT)</p>
              <p>Años para exención ISR: {resultado.aniosParaExencion} (Art. 93 XIII)</p>
            </div>
          </div>

          <table className="mt-5 w-full text-sm">
            <thead>
              <tr className="text-left text-[10px] uppercase tracking-wider text-emerald-300/70">
                <th className="pb-1 font-semibold">Concepto</th>
                <th className="pb-1 text-right font-semibold">Bruto</th>
                <th className="pb-1 text-right font-semibold">Exento</th>
                <th className="pb-1 text-right font-semibold">Gravado</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-emerald-50/15">
              {resultado.conceptos.map((c) => (
                <tr key={c.clave}>
                  <td className="py-2 pr-3">
                    <p className="font-medium">{c.nombre}</p>
                    <p className="text-[11px] text-emerald-300/70">{c.fundamento} · {c.formula}</p>
                    <p className="mt-0.5 max-w-md text-[11px] leading-relaxed text-emerald-200/60">{c.porQue}</p>
                    {c.exentoFundamento && (
                      <p className="mt-0.5 max-w-md text-[11px] italic text-emerald-300/50">{c.exentoFundamento}</p>
                    )}
                  </td>
                  <td className="py-2 text-right align-top font-mono">{mxn(c.bruto)}</td>
                  <td className="py-2 text-right align-top font-mono text-emerald-300">{c.exento > 0 ? mxn(c.exento) : "—"}</td>
                  <td className="py-2 text-right align-top font-mono">{c.gravado > 0 ? mxn(c.gravado) : "—"}</td>
                </tr>
              ))}
              <tr className="font-semibold">
                <td className="py-2">Totales</td>
                <td className="py-2 text-right font-mono">{mxn(resultado.totalBruto)}</td>
                <td className="py-2 text-right font-mono text-emerald-300">{mxn(resultado.totalExento)}</td>
                <td className="py-2 text-right font-mono">{mxn(resultado.totalGravado)}</td>
              </tr>
              <tr className="text-amber-300">
                <td className="py-2">
                  ISR retenido (Art. 96 LISR)
                  {resultado.tasaEfectiva !== null && (
                    <span className="block text-[11px] text-amber-300/70">
                      Separación con tasa efectiva {(resultado.tasaEfectiva * 100).toFixed(2)}% (último párrafo Art. 96)
                    </span>
                  )}
                </td>
                <td className="py-2 text-right font-mono" colSpan={3}>− {mxn(resultado.isrTotal)}</td>
              </tr>
            </tbody>
          </table>

          {resultado.advertencias.length > 0 && (
            <ul className="mt-4 space-y-1 border-t border-emerald-50/15 pt-3 text-xs text-amber-200/90">
              {resultado.advertencias.map((a) => (
                <li key={a}>⚠ {a}</li>
              ))}
            </ul>
          )}

          <div className="mt-4 flex flex-wrap gap-3">
            <button onClick={generarPdf} className="rounded-full bg-emerald-50/10 px-4 py-2 text-xs font-semibold text-emerald-100 transition-colors hover:bg-emerald-50/20">
              ⬇ Descargar PDF (cálculo + explicaciones)
            </button>
            <button
              onClick={() => setVerExplicaciones((v) => !v)}
              className="rounded-full border border-emerald-50/20 px-4 py-2 text-xs font-semibold text-emerald-200 transition-colors hover:bg-emerald-50/10"
            >
              {verExplicaciones ? "Ocultar" : "Ver"} el porqué de cada cosa
            </button>
          </div>

          {verExplicaciones && (
            <div className="mt-4 space-y-4 border-t border-emerald-50/15 pt-4">
              {resultado.explicaciones.map((exp) => (
                <div key={exp.titulo}>
                  <h3 className="text-sm font-semibold text-emerald-100">{exp.titulo}</h3>
                  <p className="mt-1 text-xs leading-relaxed text-emerald-200/80">{exp.texto}</p>
                </div>
              ))}
            </div>
          )}
        </section>
      )}

      <p className="mt-6 text-xs text-muted">
        Cálculo conforme a la LFT y a la LISR vigentes, con UMA {mxn(umaDiaria)} y salario mínimo{" "}
        {mxn(salarioMinimo)} (2026). Es una estimación informativa: ante un conflicto laboral acude a
        la PROFEDET (gratuita) o a un abogado laboral. No sustituye asesoría profesional.
      </p>
    </div>
  );
}
