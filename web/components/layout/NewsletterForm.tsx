"use client";

import { useState } from "react";

type Estado = "inicial" | "enviando" | "ok" | "error";

export default function NewsletterForm() {
  const [email, setEmail] = useState("");
  const [estado, setEstado] = useState<Estado>("inicial");
  const [mensaje, setMensaje] = useState("");

  async function suscribir(e: React.FormEvent) {
    e.preventDefault();
    setEstado("enviando");
    try {
      const resp = await fetch("/api/boletin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const data = await resp.json();
      if (data.ok) {
        setEstado("ok");
        setMensaje("¡Listo! Te avisaremos de cada cambio fiscal relevante.");
        setEmail("");
      } else {
        setEstado("error");
        setMensaje(data.error ?? "No se pudo suscribir.");
      }
    } catch {
      setEstado("error");
      setMensaje("Sin conexión; intenta de nuevo.");
    }
  }

  return (
    <div>
      <p className="text-sm font-semibold text-ink">Boletín de cambios fiscales</p>
      <p className="mt-1 max-w-sm text-xs text-muted">
        Nueva UMA, salarios mínimos, RMF, subsidio al empleo: te avisamos cuando se publique en el
        DOF, con la fuente original.
      </p>
      <form onSubmit={suscribir} className="mt-3 flex max-w-sm gap-2">
        <input
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="tu@correo.com"
          className="min-w-0 flex-1 rounded-full border border-line bg-background px-4 py-2 text-sm focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
        />
        <button
          type="submit"
          disabled={estado === "enviando"}
          className="rounded-full bg-accent px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-accent-bright disabled:opacity-60 dark:text-[#1a1f1c]"
        >
          {estado === "enviando" ? "..." : "Suscribirme"}
        </button>
      </form>
      {mensaje && (
        <p className={`mt-2 text-xs ${estado === "ok" ? "text-accent" : "text-red-600"}`}>{mensaje}</p>
      )}
    </div>
  );
}
