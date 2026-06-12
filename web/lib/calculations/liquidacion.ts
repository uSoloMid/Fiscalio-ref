/**
 * Liquidación e indemnización laboral conforme a la LFT.
 * Fundamentos: Arts. 48, 50, 76, 80, 87, 162, 485 y 486 LFT.
 */

export type MotivoLiquidacion = "rescision" | "muerte" | "incapacidad";

/** Días de vacaciones por años de servicio (Art. 76 LFT, reforma DOF 27/12/2022). */
export function diasVacaciones(aniosTrabajados: number): number {
  const completos = Math.max(1, Math.floor(aniosTrabajados));
  if (completos <= 5) return 12 + (completos - 1) * 2; // 12,14,16,18,20
  return 22 + Math.floor((completos - 6) / 5) * 2; // 6-10: 22, 11-15: 24...
}

/** Factor de integración del salario (Art. 84 LFT): aguinaldo 15 días + prima vacacional 25%. */
export function factorIntegracion(aniosTrabajados: number, primaVacacional = 0.25): number {
  const vac = diasVacaciones(aniosTrabajados);
  return 1 + (15 + vac * primaVacacional) / 365;
}

export interface ConceptoLiquidacion {
  concepto: string;
  fundamento: string;
  formula: string;
  monto: number;
}

export interface ResultadoLiquidacion {
  conceptos: ConceptoLiquidacion[];
  total: number;
  salarioPrimaAntiguedadTopado: boolean;
}

export function calcularLiquidacion(params: {
  salarioDiario: number;
  aniosTrabajados: number;
  motivo: MotivoLiquidacion;
  diasVacacionesPendientes: number;
  mesesDesdeUltimoAguinaldo: number;
  salarioMinimoGeneral: number;
  primaVacacional?: number;
}): ResultadoLiquidacion {
  const {
    salarioDiario,
    aniosTrabajados,
    motivo,
    diasVacacionesPendientes,
    mesesDesdeUltimoAguinaldo,
    salarioMinimoGeneral,
    primaVacacional = 0.25,
  } = params;

  const conceptos: ConceptoLiquidacion[] = [];

  if (motivo === "rescision") {
    conceptos.push({
      concepto: "Indemnización constitucional (3 meses)",
      fundamento: "Art. 48 LFT",
      formula: `90 días × ${salarioDiario.toFixed(2)}`,
      monto: 90 * salarioDiario,
    });
    conceptos.push({
      concepto: "20 días por año de servicio",
      fundamento: "Art. 50 fracc. II LFT",
      formula: `20 × ${aniosTrabajados} años × ${salarioDiario.toFixed(2)}`,
      monto: 20 * aniosTrabajados * salarioDiario,
    });
  }

  // Prima de antigüedad: 12 días por año, con salario topado a 2x el mínimo
  // (Arts. 162, 485 y 486 LFT). Procede en rescisión, muerte e incapacidad.
  const topeSalario = 2 * salarioMinimoGeneral;
  const salarioPrima = Math.min(salarioDiario, topeSalario);
  conceptos.push({
    concepto: "Prima de antigüedad (12 días por año)",
    fundamento: "Arts. 162, 485 y 486 LFT",
    formula: `12 × ${aniosTrabajados} años × ${salarioPrima.toFixed(2)}${
      salarioPrima < salarioDiario ? " (salario topado a 2× SMG)" : ""
    }`,
    monto: 12 * aniosTrabajados * salarioPrima,
  });

  if (diasVacacionesPendientes > 0) {
    const vac = diasVacacionesPendientes * salarioDiario;
    conceptos.push({
      concepto: "Vacaciones no gozadas",
      fundamento: "Arts. 76 y 79 LFT",
      formula: `${diasVacacionesPendientes} días × ${salarioDiario.toFixed(2)}`,
      monto: vac,
    });
    conceptos.push({
      concepto: "Prima vacacional pendiente",
      fundamento: "Art. 80 LFT",
      formula: `${(primaVacacional * 100).toFixed(0)}% × vacaciones pendientes`,
      monto: vac * primaVacacional,
    });
  }

  if (mesesDesdeUltimoAguinaldo > 0) {
    conceptos.push({
      concepto: "Aguinaldo proporcional",
      fundamento: "Art. 87 LFT",
      formula: `15 días × (${mesesDesdeUltimoAguinaldo}/12) × ${salarioDiario.toFixed(2)}`,
      monto: 15 * (mesesDesdeUltimoAguinaldo / 12) * salarioDiario,
    });
  }

  return {
    conceptos,
    total: conceptos.reduce((s, c) => s + c.monto, 0),
    salarioPrimaAntiguedadTopado: salarioPrima < salarioDiario,
  };
}
