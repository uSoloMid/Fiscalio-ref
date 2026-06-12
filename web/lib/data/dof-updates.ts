/** Últimas actualizaciones fiscales relevantes publicadas en el DOF (verificadas). */

export type CategoriaDof = "RMF" | "Reforma" | "Criterio" | "Resolución" | "Decreto";
export type Impacto = "Alto" | "Medio" | "Informativo";

export interface ActualizacionDof {
  fecha: string; // ISO
  categoria: CategoriaDof;
  titulo: string;
  resumen: string;
  antes: string;
  ahora: string;
  leyes: string[];
  impacto: Impacto;
  url: string;
}

export const ACTUALIZACIONES_DOF: ActualizacionDof[] = [
  {
    fecha: "2026-01-09",
    categoria: "Resolución",
    titulo: "Nueva UMA 2026: $117.31 diaria",
    resumen:
      "INEGI publica el valor de la Unidad de Medida y Actualización vigente a partir del 1 de febrero de 2026.",
    antes: "UMA diaria $113.14 (2025)",
    ahora: "UMA diaria $117.31, mensual $3,566.22, anual $42,794.64 (+3.69%)",
    leyes: ["CPEUM", "Ley UMA"],
    impacto: "Alto",
    url: "https://www.dof.gob.mx/nota_detalle.php?codigo=5778072&fecha=09/01/2026",
  },
  {
    fecha: "2025-12-31",
    categoria: "Decreto",
    titulo: "Subsidio para el empleo 2026 actualizado",
    resumen:
      "Sube el subsidio mensual a 15.02% de la UMA mensual ($536.22; 15.59% transitorio en enero) y el tope de ingreso a $11,492.66.",
    antes: "13.8% de la UMA mensual; tope de ingreso $10,171.00",
    ahora: "15.02% de la UMA mensual ($536.22/mes); tope de ingreso $11,492.66",
    leyes: ["LISR"],
    impacto: "Alto",
    url: "https://dof.gob.mx/nota_detalle.php?codigo=5777649&fecha=31/12/2025",
  },
  {
    fecha: "2025-12-28",
    categoria: "RMF",
    titulo: "RMF 2026 y Anexo 8 (tablas ISR) publicados",
    resumen:
      "Resolución Miscelánea Fiscal 2026. El Anexo 8 actualiza las tarifas de ISR +13.21% por inflación acumulada (Art. 152 LISR).",
    antes: "Tarifa mensual 2025: primer renglón hasta $746.04",
    ahora: "Tarifa mensual 2026: primer renglón hasta $844.59; exento de retención hasta ese monto",
    leyes: ["CFF", "LISR", "LIVA", "IEPS"],
    impacto: "Alto",
    url: "https://www.sat.gob.mx/minisitio/NormatividadRMFyRGCE/documentos2026/rmf/anexos/Anexo-8-RMF-2026_DOF-28122025.pdf",
  },
  {
    fecha: "2025-12-09",
    categoria: "Resolución",
    titulo: "Salarios mínimos 2026: $315.04 general",
    resumen:
      "CONASAMI fija los salarios mínimos vigentes desde el 1 de enero de 2026: +13% general, +5% en la Zona Libre de la Frontera Norte.",
    antes: "General $278.80 / ZLFN $419.88 (2025)",
    ahora: "General $315.04 / ZLFN $440.87",
    leyes: ["LFT"],
    impacto: "Alto",
    url: "https://www.dof.gob.mx/nota_detalle.php?codigo=5775534&fecha=09/12/2025",
  },
];
