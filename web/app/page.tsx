import Link from "next/link";
import { getIndicadoresVigentes, type Indicador } from "@/lib/db";
import { mxn, fechaLarga, NOMBRES_INDICADOR } from "@/lib/format";

export const dynamic = "force-dynamic";

const ORDEN = [
  "uma_diaria",
  "uma_mensual",
  "uma_anual",
  "salario_minimo_general",
  "salario_minimo_frontera",
  "inpc_general",
];

function TarjetaIndicador({ ind, destacada = false }: { ind: Indicador; destacada?: boolean }) {
  const nombre = NOMBRES_INDICADOR[ind.clave] ?? ind.clave;
  const valor = ind.unidad === "MXN" ? mxn(ind.valor) : ind.valor.toLocaleString("es-MX");
  return (
    <article
      className={`card-lift group relative flex flex-col overflow-hidden rounded-2xl border p-6 ${
        destacada
          ? "border-emerald-900/20 bg-gradient-to-br from-emerald-900 to-emerald-950 text-emerald-50"
          : "border-stone-200 bg-white"
      }`}
    >
      <h2
        className={`text-xs font-semibold uppercase tracking-widest ${
          destacada ? "text-emerald-300" : "text-stone-400"
        }`}
      >
        {nombre}
      </h2>
      <p
        className={`mt-2 font-display text-4xl font-semibold tracking-tight tabular-nums ${
          destacada ? "text-white" : "text-ink"
        }`}
      >
        {valor}
      </p>
      <dl className={`mt-4 space-y-1 text-xs ${destacada ? "text-emerald-200/80" : "text-stone-500"}`}>
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
          <div className={`pt-1 leading-relaxed ${destacada ? "text-emerald-300/60" : "text-stone-400"}`}>
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
              : "bg-emerald-700/10 text-emerald-800 hover:bg-emerald-700/20"
          }`}
        >
          Fuente oficial · {ind.fuente}
          <span aria-hidden>↗</span>
        </a>
      </div>
    </article>
  );
}

export default function Home() {
  const indicadores = getIndicadoresVigentes();
  const ordenados = [...indicadores].sort(
    (a, b) => ORDEN.indexOf(a.clave) - ORDEN.indexOf(b.clave)
  );

  return (
    <div>
      <section className="mb-12 max-w-3xl">
        <p className="text-xs font-bold uppercase tracking-[0.2em] text-emerald-700">
          Referencia fiscal mexicana
        </p>
        <h1 className="mt-3 font-display text-5xl font-semibold leading-[1.05] tracking-tight text-ink sm:text-6xl">
          Cada cifra, con su
          <em className="text-emerald-700"> artículo y su DOF</em>.
        </h1>
        <p className="mt-5 max-w-xl text-lg leading-relaxed text-stone-600">
          Indicadores oficiales siempre vigentes y calculadoras que muestran la fórmula exacta de la
          ley. Sin interpretaciones, sin &ldquo;yo creo que es así&rdquo;.
        </p>
        <div className="mt-6 flex flex-wrap gap-3">
          <Link
            href="/calculadoras/isr"
            className="rounded-full bg-emerald-800 px-5 py-2.5 text-sm font-semibold text-white shadow-lg shadow-emerald-900/20 transition-colors hover:bg-emerald-700"
          >
            Calcular ISR asalariado
          </Link>
          <Link
            href="/calculadoras/resico"
            className="rounded-full border border-stone-300 bg-white px-5 py-2.5 text-sm font-semibold text-stone-700 transition-colors hover:border-emerald-700 hover:text-emerald-800"
          >
            Calcular RESICO
          </Link>
        </div>
      </section>

      <section>
        <h2 className="mb-4 text-sm font-bold uppercase tracking-widest text-stone-400">
          Indicadores vigentes
        </h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {ordenados.map((ind, i) => (
            <TarjetaIndicador key={ind.clave} ind={ind} destacada={i === 0} />
          ))}
        </div>
      </section>
    </div>
  );
}
