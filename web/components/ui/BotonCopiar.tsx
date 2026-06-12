"use client";

import { useState } from "react";

export default function BotonCopiar({ valor, oscuro = false }: { valor: string; oscuro?: boolean }) {
  const [copiado, setCopiado] = useState(false);

  async function copiar() {
    try {
      await navigator.clipboard.writeText(valor);
      setCopiado(true);
      setTimeout(() => setCopiado(false), 1500);
    } catch {
      // El navegador bloqueó el portapapeles; no hay nada que hacer.
    }
  }

  return (
    <button
      onClick={copiar}
      className={`mt-1 text-[10px] font-semibold uppercase tracking-wide transition-colors ${
        oscuro ? "text-emerald-300/70 hover:text-emerald-200" : "text-muted hover:text-accent"
      }`}
    >
      {copiado ? "✓ Copiado" : "Copiar"}
    </button>
  );
}
