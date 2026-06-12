import type { Metadata } from "next";
import { Geist, Geist_Mono, Fraunces } from "next/font/google";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import "./globals.css";

const geistSans = Geist({ variable: "--font-geist-sans", subsets: ["latin"] });
const geistMono = Geist_Mono({ variable: "--font-geist-mono", subsets: ["latin"] });
const fraunces = Fraunces({ variable: "--font-fraunces", subsets: ["latin"], axes: ["opsz"] });

export const metadata: Metadata = {
  title: "Fiscalio Info — Referencia fiscal mexicana con fundamento legal",
  description:
    "Indicadores fiscales (UMA, salario mínimo, INPC) y calculadoras 100% legales. Cada dato con su fuente oficial: artículo, DOF y fecha de vigencia.",
};

const SCRIPT_TEMA = `(function(){try{var t=localStorage.getItem("tema");var d=t?t==="dark":matchMedia("(prefers-color-scheme: dark)").matches;if(d)document.documentElement.classList.add("dark")}catch(e){}})()`;

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html
      lang="es-MX"
      suppressHydrationWarning
      className={`${geistSans.variable} ${geistMono.variable} ${fraunces.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-paper">
        <script dangerouslySetInnerHTML={{ __html: SCRIPT_TEMA }} />
        <Header />
        <main className="mx-auto w-full max-w-6xl flex-1 px-5 py-10">{children}</main>
        <Footer />
      </body>
    </html>
  );
}
