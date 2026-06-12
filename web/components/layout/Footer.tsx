export default function Footer() {
  return (
    <footer className="mt-16 border-t border-line bg-surface">
      <div className="mx-auto max-w-6xl px-5 py-8">
        <p className="font-display text-lg text-ink">Información fiscal pública, con fundamento.</p>
        <p className="mt-2 max-w-2xl text-xs leading-relaxed text-muted">
          Proyecto público y gratuito. Todos los datos provienen de fuentes oficiales (DOF, INEGI, SAT,
          CONASAMI) con fundamento legal citado. Esta información es de referencia y no constituye
          asesoría fiscal.
        </p>
      </div>
    </footer>
  );
}
