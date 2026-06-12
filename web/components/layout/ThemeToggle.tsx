"use client";

import { useEffect, useState } from "react";

export default function ThemeToggle() {
  const [dark, setDark] = useState(false);

  useEffect(() => {
    const guardado = localStorage.getItem("tema");
    const inicial = guardado
      ? guardado === "dark"
      : window.matchMedia("(prefers-color-scheme: dark)").matches;
    setDark(inicial);
    document.documentElement.classList.toggle("dark", inicial);
  }, []);

  function alternar() {
    const nuevo = !dark;
    setDark(nuevo);
    document.documentElement.classList.toggle("dark", nuevo);
    localStorage.setItem("tema", nuevo ? "dark" : "light");
  }

  return (
    <button
      onClick={alternar}
      aria-label={dark ? "Cambiar a tema claro" : "Cambiar a tema oscuro"}
      className="rounded-full border border-line bg-surface p-2 text-muted transition-colors hover:text-accent"
    >
      {dark ? (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
          <circle cx="12" cy="12" r="4" />
          <path d="M12 2v2m0 16v2M4.93 4.93l1.41 1.41m11.32 11.32 1.41 1.41M2 12h2m16 0h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41" />
        </svg>
      ) : (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
        </svg>
      )}
    </button>
  );
}
