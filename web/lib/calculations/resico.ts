import type { TarifaRenglon } from "@/lib/db";

export const TOPE_ANUAL_RESICO = 3_500_000; // Art. 113-E LISR, primer párrafo
export const TASA_IVA = 0.16; // Art. 1 LIVA
export const RETENCION_IVA_PM = 2 / 3; // Art. 1-A fracc. II LIVA: 2/3 del IVA trasladado
export const RETENCION_ISR_PM = 0.0125; // Art. 113-J LISR

export interface ResultadoResico {
  renglon: TarifaRenglon;
  isr: number;
  retencionIsrPm: number;
  isrAPagar: number;
  ivaTrasladado: number;
  ivaRetenido: number;
  ivaAPagar: number;
  totalSat: number;
}

export function calcularResico(
  ingresos: number,
  renglones: TarifaRenglon[],
  clienteEsPersonaMoral: boolean
): ResultadoResico | null {
  const renglon = renglones.find(
    (r) =>
      ingresos >= r.limite_inferior &&
      (r.limite_superior === null || ingresos <= r.limite_superior)
  );
  if (!renglon) return null;

  const isr = ingresos * (renglon.porcentaje / 100);
  const retencionIsrPm = clienteEsPersonaMoral ? ingresos * RETENCION_ISR_PM : 0;
  const ivaTrasladado = ingresos * TASA_IVA;
  const ivaRetenido = clienteEsPersonaMoral ? ivaTrasladado * RETENCION_IVA_PM : 0;
  const ivaAPagar = ivaTrasladado - ivaRetenido;
  const isrAPagar = Math.max(isr - retencionIsrPm, 0);

  return {
    renglon,
    isr,
    retencionIsrPm,
    isrAPagar,
    ivaTrasladado,
    ivaRetenido,
    ivaAPagar,
    totalSat: isrAPagar + ivaAPagar,
  };
}
