import type { Metadata } from "next";
import { Geist, Geist_Mono, Fraunces } from "next/font/google";
import Link from "next/link";
import "./globals.css";

const geistSans = Geist({ variable: "--font-geist-sans", subsets: ["latin"] });
const geistMono = Geist_Mono({ variable: "--font-geist-mono", subsets: ["latin"] });
const fraunces = Fraunces({
  variable: "--font-fraunces",
  subsets: ["latin"],
  axes: ["opsz"],
});

export const metadata: Metadata = {
  title: "Fiscalio Info — Referencia fiscal mexicana con fundamento legal",
  description:
    "Indicadores fiscales (UMA, salario mínimo, INPC) y calculadoras 100% legales. Cada dato con su fuente oficial: artículo, DOF y fecha de vigencia.",
};

const NAV = [
  { href: "/", label: "Indicadores" },
  { href: "/calculadoras/isr", label: "ISR asalariado" },
  { href: "/calculadoras/resico", label: "RESICO" },
];

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html
      lang="es-MX"
      className={`${geistSans.variable} ${geistMono.variable} ${fraunces.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-paper">
        <header className="sticky top-0 z-50 border-b border-stone-200/80 bg-[#faf9f7]/85 backdrop-blur-md">
          <nav className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-x-8 gap-y-2 px-5 py-3.5">
            <Link href="/" className="group flex items-baseline gap-1.5">
              <span className="font-display text-xl font-semibold tracking-tight text-ink">
                Fiscalio
              </span>
              <span className="rounded bg-emerald-700 px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-widest text-emerald-50 transition-colors group-hover:bg-emerald-600">
                Info
              </span>
            </Link>
            <div className="flex gap-1 text-sm">
              {NAV.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className="rounded-full px-3.5 py-1.5 font-medium text-stone-600 transition-colors hover:bg-emerald-700/10 hover:text-emerald-900"
                >
                  {item.label}
                </Link>
              ))}
            </div>
          </nav>
        </header>

        <main className="mx-auto w-full max-w-6xl flex-1 px-5 py-10">{children}</main>

        <footer className="mt-16 border-t border-stone-200 bg-white">
          <div className="mx-auto max-w-6xl px-5 py-8">
            <p className="font-display text-lg text-ink">
              Información fiscal pública, con fundamento.
            </p>
            <p className="mt-2 max-w-2xl text-xs leading-relaxed text-stone-500">
              Proyecto público y gratuito. Todos los datos provienen de fuentes oficiales (DOF, INEGI,
              SAT, CONASAMI) con fundamento legal citado. Esta información es de referencia y no
              constituye asesoría fiscal.
            </p>
          </div>
        </footer>
      </body>
    </html>
  );
}
