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

function TarjetaIndicador({ ind }: { ind: Indicador }) {
  const nombre = NOMBRES_INDICADOR[ind.clave] ?? ind.clave;
  const valor = ind.unidad === "MXN" ? mxn(ind.valor) : ind.valor.toLocaleString("es-MX");
  return (
    <article className="rounded-lg border border-stone-200 bg-white p-5 shadow-sm">
      <h2 className="text-sm font-medium text-stone-500">{nombre}</h2>
      <p className="mt-1 text-3xl font-bold tracking-tight">{valor}</p>
      <dl className="mt-3 space-y-1 text-xs text-stone-500">
        <div>
          <dt className="inline font-medium">Vigente desde: </dt>
          <dd className="inline">{fechaLarga(ind.vigencia_inicio)}</dd>
        </div>
        {ind.publicado_dof && (
          <div>
            <dt className="inline font-medium">Publicado en DOF: </dt>
            <dd className="inline">{fechaLarga(ind.publicado_dof)}</dd>
          </div>
        )}
        {ind.fundamento && <div className="text-stone-400">{ind.fundamento}</div>}
      </dl>
      <a
        href={ind.fuente_url}
        target="_blank"
        rel="noopener noreferrer"
        className="mt-3 inline-block rounded border border-emerald-700 px-3 py-1 text-xs font-medium text-emerald-700 hover:bg-emerald-50"
      >
        Ver fuente oficial ({ind.fuente}) ↗
      </a>
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
      <section className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight">Indicadores fiscales vigentes</h1>
        <p className="mt-2 max-w-2xl text-stone-600">
          Valores oficiales con su fundamento legal, fecha de publicación en el DOF y liga directa a la
          fuente. Sin interpretaciones: solo lo que dice la ley.
        </p>
      </section>
      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {ordenados.map((ind) => (
          <TarjetaIndicador key={ind.clave} ind={ind} />
        ))}
      </section>
    </div>
  );
}
