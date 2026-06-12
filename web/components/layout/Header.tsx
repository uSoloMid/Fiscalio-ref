"use client";

import { useState } from "react";
import Link from "next/link";
import ThemeToggle from "./ThemeToggle";
import { CALCULADORAS } from "@/lib/data/calculadoras";

const NAV = [
  { href: "/indicadores", label: "Indicadores" },
  { href: "/cambios", label: "Cambios recientes" },
];

export default function Header() {
  const [menuAbierto, setMenuAbierto] = useState(false);
  const [dropAbierto, setDropAbierto] = useState(false);

  return (
    <header className="sticky top-0 z-50 border-b border-line bg-background/85 backdrop-blur-md">
      <nav className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-5 py-3.5">
        <Link href="/" className="group flex items-baseline gap-1.5" onClick={() => setMenuAbierto(false)}>
          <span className="font-display text-xl font-semibold tracking-tight text-ink">Fiscalio</span>
          <span className="rounded bg-accent px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-widest text-white transition-colors group-hover:bg-accent-bright dark:text-[#1a1f1c]">
            Info
          </span>
          <span className="rounded border border-amber-500/50 px-1 py-0.5 text-[9px] font-bold uppercase tracking-widest text-amber-600">
            Beta
          </span>
        </Link>

        {/* Nav escritorio */}
        <div className="hidden items-center gap-1 text-sm md:flex">
          {NAV.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="rounded-full px-3.5 py-1.5 font-medium text-muted transition-colors hover:bg-accent/10 hover:text-accent"
            >
              {item.label}
            </Link>
          ))}
          <div
            className="relative"
            onMouseEnter={() => setDropAbierto(true)}
            onMouseLeave={() => setDropAbierto(false)}
          >
            <button
              className="flex items-center gap-1 rounded-full px-3.5 py-1.5 font-medium text-muted transition-colors hover:bg-accent/10 hover:text-accent"
              aria-expanded={dropAbierto}
              onClick={() => setDropAbierto((v) => !v)}
            >
              Calculadoras
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                <path d="m6 9 6 6 6-6" />
              </svg>
            </button>
            {dropAbierto && (
              <div className="absolute right-0 top-full w-72 rounded-xl border border-line bg-surface p-2 shadow-xl">
                {CALCULADORAS.map((c) =>
                  c.disponible ? (
                    <Link
                      key={c.label}
                      href={c.href}
                      onClick={() => setDropAbierto(false)}
                      className="flex items-baseline justify-between gap-2 rounded-lg px-3 py-2 text-sm transition-colors hover:bg-accent/10"
                    >
                      <span className="font-medium text-foreground">{c.label}</span>
                      <span className="text-[10px] text-muted">{c.fundamento}</span>
                    </Link>
                  ) : (
                    <div
                      key={c.label}
                      className="flex items-baseline justify-between gap-2 rounded-lg px-3 py-2 text-sm opacity-50"
                    >
                      <span className="text-foreground">{c.label}</span>
                      <span className="text-[10px] text-muted">próximamente</span>
                    </div>
                  )
                )}
              </div>
            )}
          </div>
          <div className="ml-2">
            <ThemeToggle />
          </div>
        </div>

        {/* Móvil: toggle + hamburger */}
        <div className="flex items-center gap-2 md:hidden">
          <ThemeToggle />
          <button
            aria-label="Abrir menú"
            aria-expanded={menuAbierto}
            onClick={() => setMenuAbierto((v) => !v)}
            className="rounded-full border border-line bg-surface p-2 text-muted"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              {menuAbierto ? <path d="M18 6 6 18M6 6l12 12" /> : <path d="M3 6h18M3 12h18M3 18h18" />}
            </svg>
          </button>
        </div>
      </nav>

      {/* Menú móvil */}
      {menuAbierto && (
        <div className="border-t border-line bg-surface px-5 py-3 md:hidden">
          {NAV.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => setMenuAbierto(false)}
              className="block rounded-lg px-3 py-2.5 text-sm font-medium text-foreground hover:bg-accent/10"
            >
              {item.label}
            </Link>
          ))}
          <p className="mt-2 px-3 text-[10px] font-bold uppercase tracking-widest text-muted">Calculadoras</p>
          {CALCULADORAS.filter((c) => c.disponible).map((c) => (
            <Link
              key={c.label}
              href={c.href}
              onClick={() => setMenuAbierto(false)}
              className="block rounded-lg px-3 py-2.5 text-sm text-foreground hover:bg-accent/10"
            >
              {c.label} <span className="text-[10px] text-muted">· {c.fundamento}</span>
            </Link>
          ))}
        </div>
      )}
    </header>
  );
}
