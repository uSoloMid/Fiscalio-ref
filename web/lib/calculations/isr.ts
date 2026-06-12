import type { TarifaRenglon } from "@/lib/db";
import { SUBSIDIO_EMPLEO_2026 } from "@/lib/data/subsidio";

export type Periodicidad = "mensual" | "quincenal" | "semanal" | "diario";

/** Días del periodo conforme al Anexo 8 RMF (mes fiscal = 30.4 días). */
export const DIAS_PERIODO: Record<Periodicidad, number> = {
  mensual: 30.4,
  quincenal: 15.2,
  semanal: 7,
  diario: 1,
};

export interface ResultadoIsr {
  renglon: TarifaRenglon;
  limiteInferior: number;
  excedente: number;
  impuestoMarginal: number;
  isrDeterminado: number;
  subsidioAplicado: number;
  isrARetener: number;
  neto: number;
  aplicaSubsidio: boolean;
}

/** Escala un renglón de la tarifa mensual al periodo (proporción de días, Anexo 8 RMF). */
function escalar(r: TarifaRenglon, factor: number): TarifaRenglon {
  return {
    ...r,
    limite_inferior: r.limite_inferior * factor,
    limite_superior: r.limite_superior === null ? null : r.limite_superior * factor,
    cuota_fija: r.cuota_fija * factor,
  };
}

/**
 * ISR del periodo conforme al Art. 96 LISR con subsidio al empleo
 * (decreto DOF 31/12/2025). El subsidio solo se acredita hasta el monto
 * del ISR determinado: no genera saldo a favor.
 */
export function calcularIsr(
  ingreso: number,
  renglonesMensuales: TarifaRenglon[],
  periodicidad: Periodicidad,
  conSubsidio: boolean
): ResultadoIsr | null {
  const factor = DIAS_PERIODO[periodicidad] / DIAS_PERIODO.mensual;
  const renglones = renglonesMensuales.map((r) => escalar(r, factor));
  const renglon = renglones.find(
    (r) =>
      ingreso >= r.limite_inferior &&
      (r.limite_superior === null || ingreso <= r.limite_superior)
  );
  if (!renglon) return null;

  const excedente = ingreso - renglon.limite_inferior;
  const impuestoMarginal = excedente * (renglon.porcentaje / 100);
  const isrDeterminado = renglon.cuota_fija + impuestoMarginal;

  const ingresoMensualEquivalente = ingreso / factor;
  const aplicaSubsidio =
    conSubsidio && ingresoMensualEquivalente <= SUBSIDIO_EMPLEO_2026.topeIngresoMensual;
  const subsidioDelPeriodo = SUBSIDIO_EMPLEO_2026.montoMensual * factor;
  const subsidioAplicado = aplicaSubsidio ? Math.min(subsidioDelPeriodo, isrDeterminado) : 0;

  const isrARetener = isrDeterminado - subsidioAplicado;
  return {
    renglon,
    limiteInferior: renglon.limite_inferior,
    excedente,
    impuestoMarginal,
    isrDeterminado,
    subsidioAplicado,
    isrARetener,
    neto: ingreso - isrARetener,
    aplicaSubsidio,
  };
}
