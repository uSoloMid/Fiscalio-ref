import { getNotasDofFiscales } from "@/lib/db";
import { fechaLarga } from "@/lib/format";
import CambiosTimeline from "@/components/cambios/CambiosTimeline";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Cambios fiscales recientes y publicaciones del DOF | Fiscalio Info",
};

export default function PaginaCambios() {
  const notas = getNotasDofFiscales(25);

  return (
    <div>
      <CambiosTimeline />

      <section className="mt-16 max-w-3xl">
        <h2 className="text-sm font-bold uppercase tracking-widest text-muted">
          Publicaciones fiscales recientes en el DOF
        </h2>
        <p className="mt-1 text-xs text-muted">
          Descargadas automáticamente del servicio oficial del DOF (SIDOF) y filtradas por relevancia
          fiscal. Se actualizan con la corrida nocturna.
        </p>
        {notas.length === 0 ? (
          <p className="mt-4 rounded-xl border border-dashed border-line bg-surface p-4 text-sm text-muted">
            Aún no hay notas descargadas. Ejecuta <code className="font-mono">python scrapers/fuentes/dof_sidof.py</code>.
          </p>
        ) : (
          <ul className="mt-4 divide-y divide-line overflow-hidden rounded-2xl border border-line bg-surface">
            {notas.map((n) => (
              <li key={n.cod_nota} className="flex flex-wrap items-baseline gap-x-4 gap-y-1 px-5 py-3">
                <time className="w-28 shrink-0 font-mono text-xs text-muted">{fechaLarga(n.fecha)}</time>
                <div className="min-w-0 flex-1">
                  <p className="text-sm leading-snug text-foreground">{n.titulo}</p>
                  {n.organismo && <p className="text-[11px] text-muted">{n.organismo}</p>}
                </div>
                <a
                  href={n.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs font-semibold text-accent hover:underline"
                >
                  DOF ↗
                </a>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
