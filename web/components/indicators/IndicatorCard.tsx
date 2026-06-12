import type { Indicador } from "@/lib/db";
import { mxn, fechaLarga, NOMBRES_INDICADOR } from "@/lib/format";

export default function IndicatorCard({
  ind,
  destacada = false,
}: {
  ind: Indicador;
  destacada?: boolean;
}) {
  const nombre = NOMBRES_INDICADOR[ind.clave] ?? ind.clave;
  const valor = ind.unidad === "MXN" ? mxn(ind.valor) : ind.valor.toLocaleString("es-MX", { minimumFractionDigits: 3 });
  return (
    <article
      className={`card-lift group relative flex flex-col overflow-hidden rounded-2xl border p-6 ${
        destacada
          ? "border-emerald-900/20 bg-gradient-to-br from-[#1a4a3a] to-[#10302a] text-emerald-50"
          : "border-line bg-surface"
      }`}
    >
      <h3
        className={`text-xs font-semibold uppercase tracking-widest ${
          destacada ? "text-emerald-300" : "text-muted"
        }`}
      >
        {nombre}
      </h3>
      <p
        className={`mt-2 font-display text-4xl font-semibold tracking-tight tabular-nums ${
          destacada ? "text-white" : "text-ink"
        }`}
      >
        {valor}
      </p>
      <dl className={`mt-4 space-y-1 text-xs ${destacada ? "text-emerald-200/80" : "text-muted"}`}>
        <div>
          <dt className="inline font-medium">Vigente desde </dt>
          <dd className="inline">{fechaLarga(ind.vigencia_inicio)}</dd>
        </div>
        {ind.publicado_dof && (
          <div>
            <dt className="inline font-medium">DOF </dt>
            <dd className="inline">{fechaLarga(ind.publicado_dof)}</dd>
          </div>
        )}
        {ind.fundamento && (
          <div className={`pt-1 leading-relaxed ${destacada ? "text-emerald-300/60" : "opacity-70"}`}>
            {ind.fundamento}
          </div>
        )}
      </dl>
      <div className="mt-auto pt-4">
        <a
          href={ind.fuente_url}
          target="_blank"
          rel="noopener noreferrer"
          className={`inline-flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-xs font-semibold transition-colors ${
            destacada
              ? "bg-emerald-50/10 text-emerald-100 hover:bg-emerald-50/20"
              : "bg-accent/10 text-accent hover:bg-accent/20"
          }`}
        >
          Fuente oficial · {ind.fuente}
          <span aria-hidden>↗</span>
        </a>
      </div>
    </article>
  );
}
