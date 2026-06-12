import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import Link from "next/link";
import "./globals.css";

const geistSans = Geist({ variable: "--font-geist-sans", subsets: ["latin"] });
const geistMono = Geist_Mono({ variable: "--font-geist-mono", subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Fiscalio Info — Referencia fiscal mexicana con fundamento legal",
  description:
    "Indicadores fiscales (UMA, salario mínimo, INPC) y calculadoras 100% legales. Cada dato con su fuente oficial: artículo, DOF y fecha de vigencia.",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="es-MX" className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col bg-stone-50 text-stone-900">
        <header className="border-b border-stone-200 bg-white">
          <nav className="mx-auto flex max-w-5xl flex-wrap items-center gap-x-6 gap-y-2 px-4 py-4">
            <Link href="/" className="text-lg font-bold tracking-tight">
              Fiscalio<span className="text-emerald-700"> Info</span>
            </Link>
            <div className="flex gap-4 text-sm text-stone-600">
              <Link href="/" className="hover:text-emerald-700">Indicadores</Link>
              <Link href="/calculadoras/isr" className="hover:text-emerald-700">ISR asalariado</Link>
              <Link href="/calculadoras/resico" className="hover:text-emerald-700">RESICO</Link>
            </div>
          </nav>
        </header>
        <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-8">{children}</main>
        <footer className="mt-12 border-t border-stone-200 bg-white py-6 text-center text-xs text-stone-500">
          Proyecto público y gratuito. Todos los datos provienen de fuentes oficiales (DOF, INEGI, SAT, CONASAMI) con
          fundamento legal citado. Esta información es de referencia y no constituye asesoría fiscal.
        </footer>
      </body>
    </html>
  );
}
