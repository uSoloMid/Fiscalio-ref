import { getHistorial } from "@/lib/db";
import { mxn, fechaLarga } from "@/lib/format";
import FactorIntegracion from "@/components/calculators/FactorIntegracion";
import BotonCopiar from "@/components/ui/BotonCopiar";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Indicadores fiscales con historial — UMA, salario mínimo, INPC | Fiscalio Info",
};

function incremento(actual: number, anterior: number | undefined): string | null {
  if (anterior === undefined) return null;
  return `+${(((actual - anterior) / anterior) * 100).toFixed(2)}%`;
}

export default function PaginaIndicadores() {
  const umaDiaria = getHistorial("uma_diaria"); // DESC por vigencia
  const umaMensual = getHistorial("uma_mensual");
  const umaAnual = getHistorial("uma_anual");
  const smGeneral = getHistorial("salario_minimo_general");
  const smFrontera = getHistorial("salario_minimo_frontera");
  const inpc = getHistorial("inpc_general");

  const umaVigente = umaDiaria[0];
  const maxUma = Math.max(...umaDiaria.map((u) => u.valor));
  const umaAsc = [...umaDiaria].reverse();

  const smPorAnio = smGeneral.map((g) => {
    const anio = g.vigencia_inicio.slice(0, 4);
    const zlfn = smFrontera.find((f) => f.vigencia_inicio.slice(0, 4) === anio);
    return { anio, general: g, zlfn };
  });

  return (
    <div className="space-y-14">
      <header className="max-w-3xl">
        <p className="text-xs font-bold uppercase tracking-[0.2em] text-accent">Indicadores</p>
        <h1 className="mt-2 font-display text-4xl font-semibold tracking-tight text-ink sm:text-5xl">
          Historial completo, fuente por fuente
        </h1>
      </header>

      {/* UMA */}
      <section id="uma" className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-2xl border border-emerald-900/20 bg-gradient-to-br from-[#1a4a3a] to-[#10302a] p-6 text-emerald-50">
          <h2 className="text-xs font-semibold uppercase tracking-widest text-emerald-300">
            UMA — Unidad de Medida y Actualización
          </h2>
          <div className="mt-4 grid grid-cols-3 gap-4">
            {[
              { etiqueta: "Diaria", ind: umaDiaria[0] },
              { etiqueta: "Mensual", ind: umaMensual[0] },
              { etiqueta: "Anual", ind: umaAnual[0] },
            ].map(({ etiqueta, ind }) => (
              <div key={etiqueta}>
                <p className="text-[10px] font-bold uppercase tracking-widest text-emerald-300/70">
                  {etiqueta}
                </p>
                <p className="mt-1 font-display text-xl font-semibold tabular-nums sm:text-2xl">
                  {mxn(ind.valor)}
                </p>
                <BotonCopiar valor={ind.valor.toFixed(2)} oscuro />
              </div>
            ))}
          </div>
          <p className="mt-4 text-xs text-emerald-200/70">
            Vigente desde {fechaLarga(umaVigente.vigencia_inicio)}
            {umaVigente.publicado_dof && <> · DOF {fechaLarga(umaVigente.publicado_dof)}</>}
          </p>
          <p className="mt-1 text-[11px] text-emerald-300/50">{umaVigente.fundamento}</p>

          {/* Mini gráfica de barras */}
          <div className="mt-6 flex h-28 items-end gap-1.5">
            {umaAsc.map((u) => (
              <div key={u.vigencia_inicio} className="group flex flex-1 flex-col items-center gap-1">
                <span className="text-[9px] tabular-nums text-emerald-200/0 transition-colors group-hover:text-emerald-200">
                  {u.valor.toFixed(2)}
                </span>
                <div
                  className="w-full rounded-t bg-emerald-400/70 transition-colors group-hover:bg-emerald-300"
                  style={{ height: `${(u.valor / maxUma) * 80}px` }}
                />
                <span className="text-[9px] text-emerald-300/60">
                  {u.vigencia_inicio.slice(2, 4)}
                </span>
              </div>
            ))}
          </div>
        </div>

        <div className="overflow-x-auto rounded-2xl border border-line bg-surface p-6">
          <h3 className="text-sm font-bold text-ink">Historial UMA diaria</h3>
          <table className="mt-3 w-full text-sm">
            <thead>
              <tr className="border-b-2 border-line text-left text-xs uppercase text-muted">
                <th className="py-2 pr-4">Año</th>
                <th className="py-2 pr-4">Valor diario</th>
                <th className="py-2 pr-4">Incremento</th>
                <th className="py-2">Fuente</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {umaDiaria.map((u, i) => (
                <tr key={u.vigencia_inicio}>
                  <td className="py-2 pr-4 font-mono">{u.vigencia_inicio.slice(0, 4)}</td>
                  <td className="py-2 pr-4 font-mono">{mxn(u.valor)}</td>
                  <td className="py-2 pr-4 font-mono text-accent">
                    {incremento(u.valor, umaDiaria[i + 1]?.valor) ?? "—"}
                  </td>
                  <td className="py-2">
                    <a
                      href={u.fuente_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs font-semibold text-accent hover:underline"
                    >
                      {u.publicado_dof ? `DOF ${fechaLarga(u.publicado_dof)}` : u.fuente} ↗
                    </a>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* Salarios mínimos */}
      <section id="salarios">
        <h2 className="mb-4 text-sm font-bold uppercase tracking-widest text-muted">
          Salarios mínimos — comparativa histórica
        </h2>
        <div className="overflow-x-auto rounded-2xl border border-line bg-surface p-6">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b-2 border-line text-left text-xs uppercase text-muted">
                <th className="py-2 pr-4">Año</th>
                <th className="py-2 pr-4">General</th>
                <th className="py-2 pr-4">Incremento</th>
                <th className="py-2 pr-4">ZLFN</th>
                <th className="py-2 pr-4">Incremento</th>
                <th className="py-2">Fundamento</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {smPorAnio.map((fila, i) => (
                <tr key={fila.anio}>
                  <td className="py-2 pr-4 font-mono">{fila.anio}</td>
                  <td className="py-2 pr-4 font-mono">{mxn(fila.general.valor)}</td>
                  <td className="py-2 pr-4 font-mono text-accent">
                    {incremento(fila.general.valor, smPorAnio[i + 1]?.general.valor) ?? "—"}
                  </td>
                  <td className="py-2 pr-4 font-mono">{fila.zlfn ? mxn(fila.zlfn.valor) : "—"}</td>
                  <td className="py-2 pr-4 font-mono text-accent">
                    {fila.zlfn
                      ? incremento(fila.zlfn.valor, smPorAnio[i + 1]?.zlfn?.valor) ?? "—"
                      : "—"}
                  </td>
                  <td className="py-2">
                    <a
                      href={fila.general.fuente_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="rounded-full bg-accent/10 px-2 py-0.5 text-[10px] font-bold text-accent hover:bg-accent/20"
                    >
                      Resolución CONASAMI ↗
                    </a>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* INPC */}
      <section id="inpc">
        <h2 className="mb-4 text-sm font-bold uppercase tracking-widest text-muted">
          INPC — Índice Nacional de Precios al Consumidor
        </h2>
        <div className="rounded-2xl border border-line bg-surface p-6">
          {inpc.length > 0 ? (
            <div className="flex flex-wrap items-end gap-x-10 gap-y-4">
              <div>
                <p className="text-xs text-muted">Último dato publicado</p>
                <p className="mt-1 font-display text-4xl font-semibold tabular-nums text-ink">
                  {inpc[0].valor.toLocaleString("es-MX", { minimumFractionDigits: 3 })}
                </p>
                <p className="mt-1 text-xs text-muted">
                  {fechaLarga(inpc[0].vigencia_inicio).replace(/^\d+ de /, "")} · base 2a quincena de
                  julio 2018 = 100
                </p>
              </div>
              <div className="max-w-md text-xs leading-relaxed text-muted">
                <p>
                  {inpc[0].fundamento}. INEGI publica el INPC alrededor del día 10 de cada mes; el
                  historial mensual completo se cargará automáticamente vía la API oficial de INEGI.
                </p>
                <a
                  href={inpc[0].fuente_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-2 inline-block font-semibold text-accent hover:underline"
                >
                  Boletín oficial INEGI ↗
                </a>
              </div>
            </div>
          ) : (
            <p className="text-sm text-muted">Sin datos de INPC cargados.</p>
          )}
        </div>
      </section>

      {/* Factor de integración */}
      <section id="factor">
        <h2 className="mb-4 text-sm font-bold uppercase tracking-widest text-muted">
          Factor de integración — calculadora
        </h2>
        <FactorIntegracion />
      </section>
    </div>
  );
}
