/**
 * Finiquito y liquidación con ISR — pide lo mínimo y deriva todo lo demás.
 *
 * Fundamentos LFT: Arts. 47, 48, 50, 51, 76, 79, 80, 87, 162, 485, 486.
 * Fundamentos LISR: Art. 93 fraccs. XIII y XIV (exenciones), Art. 96
 * (tarifa y tasa efectiva para pagos por separación).
 */
import type { TarifaRenglon } from "@/lib/db";
import { diasVacaciones } from "@/lib/calculations/liquidacion";

export type TipoSalida = "renuncia" | "despido_injustificado" | "despido_justificado";
export type VacacionesEstado = "todas" | "ninguna" | "parcial";

export interface EntradaFiniquito {
  fechaIngreso: string; // ISO
  fechaSalida: string; // ISO
  salarioDiario: number;
  tipoSalida: TipoSalida;
  vacaciones: VacacionesEstado;
  diasVacacionesDisfrutados: number; // solo si 'parcial'
  aguinaldoYaPagado: boolean; // relevante solo si la salida es en diciembre
  diasSalarioPendientes: number;
}

export interface Concepto {
  clave: string;
  nombre: string;
  fundamento: string;
  formula: string;
  porQue: string; // explicación en lenguaje llano
  bruto: number;
  exento: number;
  exentoFundamento: string | null;
  gravado: number;
  esSeparacion: boolean; // exento 90 UMA/año y tasa efectiva
}

export interface ResultadoFiniquito {
  antiguedadAnios: number;
  antiguedadTexto: string;
  aniosParaExencion: number; // fracción >6 meses cuenta como año completo
  diasVacacionesAnioActual: number;
  conceptos: Concepto[];
  totalBruto: number;
  totalExento: number;
  totalGravado: number;
  isrOrdinario: number;
  isrSeparacion: number;
  tasaEfectiva: number | null;
  isrTotal: number;
  netoAPagar: number;
  explicaciones: { titulo: string; texto: string }[];
  advertencias: string[];
}

const DIAS_ANIO = 365;
const MS_DIA = 86_400_000;

function diasEntre(a: string, b: string): number {
  return Math.max(0, Math.round((new Date(b).getTime() - new Date(a).getTime()) / MS_DIA));
}

/** ISR mensual por tarifa Art. 96 (renglones mensuales). */
function isrArt96(base: number, renglones: TarifaRenglon[]): number {
  if (base <= 0) return 0;
  const r = renglones.find(
    (x) => base >= x.limite_inferior && (x.limite_superior === null || base <= x.limite_superior)
  );
  if (!r) return 0;
  return r.cuota_fija + (base - r.limite_inferior) * (r.porcentaje / 100);
}

export function calcularFiniquito(
  e: EntradaFiniquito,
  renglonesMensuales: TarifaRenglon[],
  umaDiaria: number,
  salarioMinimoGeneral: number
): ResultadoFiniquito {
  const advertencias: string[] = [];
  const sd = e.salarioDiario;
  const salida = new Date(e.fechaSalida);

  // ── Antigüedad derivada de las fechas ──────────────────────────────
  const diasTotales = diasEntre(e.fechaIngreso, e.fechaSalida);
  const antiguedadAnios = diasTotales / DIAS_ANIO;
  const aniosCompletos = Math.floor(antiguedadAnios);
  const mesesResto = Math.floor((diasTotales - aniosCompletos * DIAS_ANIO) / 30.4);
  const antiguedadTexto = `${aniosCompletos} ${aniosCompletos === 1 ? "año" : "años"}${
    mesesResto > 0 ? ` y ${mesesResto} ${mesesResto === 1 ? "mes" : "meses"}` : ""
  }`;
  // Art. 93 fracc. XIII LISR: toda fracción de más de 6 meses cuenta como año completo.
  const aniosParaExencion = aniosCompletos + (diasTotales - aniosCompletos * DIAS_ANIO > 182 ? 1 : 0);

  const conceptos: Concepto[] = [];

  // ── Días de salario pendientes ─────────────────────────────────────
  if (e.diasSalarioPendientes > 0) {
    conceptos.push({
      clave: "salario",
      nombre: "Salarios devengados pendientes",
      fundamento: "Arts. 82 y 88 LFT",
      formula: `${e.diasSalarioPendientes} días × $${sd.toFixed(2)}`,
      porQue: "Días ya trabajados que el patrón aún no paga al momento de la salida.",
      bruto: e.diasSalarioPendientes * sd,
      exento: 0,
      exentoFundamento: null,
      gravado: e.diasSalarioPendientes * sd,
      esSeparacion: false,
    });
  }

  // ── Vacaciones del año de servicio en curso ────────────────────────
  // El derecho a vacaciones nace al cumplir cada año de servicio (Art. 76 LFT).
  const anioServicioEnCurso = aniosCompletos + 1;
  const diasCorresponden = diasVacaciones(anioServicioEnCurso);
  const diasDesdeAniversario = diasTotales - aniosCompletos * DIAS_ANIO;
  // Proporcional del año en curso (aún no cumplido).
  const vacProporcionales = diasCorresponden * (diasDesdeAniversario / DIAS_ANIO);

  let vacPendientesAnioVencido = 0;
  if (aniosCompletos >= 1) {
    const correspondioUltimoAnio = diasVacaciones(aniosCompletos);
    if (e.vacaciones === "ninguna") vacPendientesAnioVencido = correspondioUltimoAnio;
    else if (e.vacaciones === "parcial")
      vacPendientesAnioVencido = Math.max(0, correspondioUltimoAnio - e.diasVacacionesDisfrutados);
  }

  const vacTotalDias = vacPendientesAnioVencido + vacProporcionales;
  if (vacTotalDias > 0) {
    const partes: string[] = [];
    if (vacPendientesAnioVencido > 0)
      partes.push(`${vacPendientesAnioVencido} días no disfrutados del último año cumplido`);
    if (vacProporcionales > 0)
      partes.push(
        `${vacProporcionales.toFixed(1)} días proporcionales del año en curso (${diasCorresponden} días × ${diasDesdeAniversario}/${DIAS_ANIO})`
      );
    conceptos.push({
      clave: "vacaciones",
      nombre: "Vacaciones pendientes y proporcionales",
      fundamento: "Arts. 76, 79 y 81 LFT",
      formula: `${vacTotalDias.toFixed(1)} días × $${sd.toFixed(2)}`,
      porQue: `Calculado con tus fechas: ${partes.join(" + ")}. Por tu antigüedad (${antiguedadTexto}) te corresponden ${diasCorresponden} días por año (Art. 76 LFT, reforma 2023).`,
      bruto: vacTotalDias * sd,
      exento: 0,
      exentoFundamento:
        "El pago de vacaciones no gozadas es salario: grava al 100% (la exención del Art. 93 XIV es solo para la prima vacacional).",
      gravado: vacTotalDias * sd,
      esSeparacion: false,
    });

    // Prima vacacional 25% sobre las vacaciones pagadas (Art. 80 LFT).
    const primaBruta = vacTotalDias * sd * 0.25;
    const exentoPV = Math.min(primaBruta, 15 * umaDiaria);
    conceptos.push({
      clave: "prima_vacacional",
      nombre: "Prima vacacional (25%)",
      fundamento: "Art. 80 LFT",
      formula: `25% × $${(vacTotalDias * sd).toFixed(2)}`,
      porQue:
        "La ley otorga un extra del 25% sobre el pago de vacaciones para que el descanso sea económicamente posible. Se paga sobre las vacaciones adeudadas.",
      bruto: primaBruta,
      exento: exentoPV,
      exentoFundamento: `Exenta hasta 15 UMA = $${(15 * umaDiaria).toFixed(2)} (Art. 93 fracc. XIV LISR).`,
      gravado: primaBruta - exentoPV,
      esSeparacion: false,
    });
  }

  // ── Aguinaldo proporcional ─────────────────────────────────────────
  const inicioAnio = new Date(salida.getFullYear(), 0, 1);
  const ingresoDate = new Date(e.fechaIngreso);
  const desde = ingresoDate > inicioAnio ? ingresoDate : inicioAnio;
  const diasDelAnio = Math.round((salida.getTime() - desde.getTime()) / MS_DIA);
  const esDiciembre = salida.getMonth() === 11;
  const pagarAguinaldo = !(esDiciembre && e.aguinaldoYaPagado) && diasDelAnio > 0;

  if (pagarAguinaldo) {
    const aguinaldoBruto = 15 * (diasDelAnio / DIAS_ANIO) * sd;
    const exentoAg = Math.min(aguinaldoBruto, 30 * umaDiaria);
    conceptos.push({
      clave: "aguinaldo",
      nombre: "Aguinaldo proporcional",
      fundamento: "Art. 87 LFT",
      formula: `15 días × (${diasDelAnio}/${DIAS_ANIO}) × $${sd.toFixed(2)}`,
      porQue: `Trabajaste ${diasDelAnio} días de este año; te toca la parte proporcional de los 15 días mínimos de aguinaldo, aunque no llegues a diciembre (Art. 87, segundo párrafo).`,
      bruto: aguinaldoBruto,
      exento: exentoAg,
      exentoFundamento: `Exento hasta 30 UMA = $${(30 * umaDiaria).toFixed(2)} (Art. 93 fracc. XIV LISR).`,
      gravado: aguinaldoBruto - exentoAg,
      esSeparacion: false,
    });
  } else if (esDiciembre && e.aguinaldoYaPagado) {
    advertencias.push(
      "No se incluyó aguinaldo porque indicaste que ya te lo pagaron (se paga antes del 20 de diciembre, Art. 87 LFT)."
    );
  }

  // ── Prima de antigüedad ────────────────────────────────────────────
  // Art. 162 LFT: 12 días por año. Derecho: despido (justificado o no) siempre;
  // renuncia solo con 15+ años de servicio. Salario topado al doble del mínimo
  // (Arts. 485-486 LFT).
  const tieneDerechoPrima =
    e.tipoSalida === "despido_injustificado" ||
    e.tipoSalida === "despido_justificado" ||
    (e.tipoSalida === "renuncia" && antiguedadAnios >= 15);

  if (tieneDerechoPrima) {
    const salarioTope = Math.min(sd, 2 * salarioMinimoGeneral);
    const monto = 12 * antiguedadAnios * salarioTope;
    conceptos.push({
      clave: "prima_antiguedad",
      nombre: "Prima de antigüedad",
      fundamento: "Arts. 162, 485 y 486 LFT",
      formula: `12 días × ${antiguedadAnios.toFixed(2)} años × $${salarioTope.toFixed(2)}${
        salarioTope < sd ? " (topado a 2× salario mínimo)" : ""
      }`,
      porQue:
        e.tipoSalida === "renuncia"
          ? "Renunciaste con 15 o más años de servicio: la ley premia la permanencia (Art. 162 fracc. III LFT)."
          : "En cualquier despido —justificado o no— la prima de antigüedad siempre se paga (Art. 162 fracc. III LFT).",
      bruto: monto,
      exento: 0, // se calcula en bloque de separación
      exentoFundamento: "Comparte la bolsa exenta de 90 UMA por año con la indemnización (Art. 93 fracc. XIII LISR).",
      gravado: 0,
      esSeparacion: true,
    });
  } else {
    advertencias.push(
      `Sin prima de antigüedad: en renuncia solo se paga con 15+ años de servicio (tienes ${antiguedadTexto}), Art. 162 fracc. III LFT.`
    );
  }

  // ── Indemnización por despido injustificado ────────────────────────
  if (e.tipoSalida === "despido_injustificado") {
    conceptos.push({
      clave: "indemnizacion_3m",
      nombre: "Indemnización constitucional (3 meses)",
      fundamento: "Art. 48 LFT; Art. 123 apartado A fracc. XXII CPEUM",
      formula: `90 días × $${sd.toFixed(2)}`,
      porQue:
        "Si el patrón te despide sin causa justificada, la Constitución y la LFT fijan una indemnización mínima de 3 meses de salario.",
      bruto: 90 * sd,
      exento: 0,
      exentoFundamento: "Comparte la bolsa exenta de 90 UMA por año (Art. 93 fracc. XIII LISR).",
      gravado: 0,
      esSeparacion: true,
    });
    conceptos.push({
      clave: "veinte_dias",
      nombre: "20 días de salario por año de servicio",
      fundamento: "Art. 50 fracc. II LFT",
      porQue:
        "Procede cuando el trabajador demanda reinstalación y el patrón se niega, o en rescisión imputable al patrón (Art. 51). En la práctica se negocia en despidos injustificados; inclúyelo en tu negociación.",
      formula: `20 días × ${antiguedadAnios.toFixed(2)} años × $${sd.toFixed(2)}`,
      bruto: 20 * antiguedadAnios * sd,
      exento: 0,
      exentoFundamento: "Comparte la bolsa exenta de 90 UMA por año (Art. 93 fracc. XIII LISR).",
      gravado: 0,
      esSeparacion: true,
    });
  } else if (e.tipoSalida === "despido_justificado") {
    advertencias.push(
      "Despido justificado (Art. 47 LFT): no hay indemnización de 3 meses ni 20 días por año; solo finiquito (partes proporcionales) y prima de antigüedad."
    );
  } else {
    advertencias.push(
      "Renuncia voluntaria: no hay indemnización; el finiquito incluye solo partes proporcionales" +
        (antiguedadAnios >= 15 ? " y prima de antigüedad (15+ años)." : ".")
    );
  }

  // ── Exención del bloque de separación (Art. 93 fracc. XIII LISR) ───
  const separacionBruto = conceptos.filter((c) => c.esSeparacion).reduce((s, c) => s + c.bruto, 0);
  const exencionSeparacion = 90 * umaDiaria * Math.max(aniosParaExencion, 1);
  const exentoSeparacion = Math.min(separacionBruto, exencionSeparacion);
  const gravadoSeparacion = separacionBruto - exentoSeparacion;

  // Prorratea el exento entre los conceptos de separación (informativo).
  if (separacionBruto > 0) {
    for (const c of conceptos) {
      if (!c.esSeparacion) continue;
      const prop = c.bruto / separacionBruto;
      c.exento = exentoSeparacion * prop;
      c.gravado = c.bruto - c.exento;
    }
  }

  // ── ISR ────────────────────────────────────────────────────────────
  const sueldoMensualOrdinario = sd * 30.4;
  const gravadoOrdinario = conceptos
    .filter((c) => !c.esSeparacion)
    .reduce((s, c) => s + c.gravado, 0);

  // Ordinario: los gravados se suman al ingreso del mes (Art. 96 LISR).
  const isrConExtras = isrArt96(sueldoMensualOrdinario + gravadoOrdinario, renglonesMensuales);
  const isrSoloSueldo = isrArt96(sueldoMensualOrdinario, renglonesMensuales);
  const isrOrdinario = Math.max(0, isrConExtras - isrSoloSueldo);

  // Separación: tasa efectiva del último sueldo mensual ordinario
  // (Art. 96, párrafos penúltimo y último, LISR).
  let isrSeparacion = 0;
  let tasaEfectiva: number | null = null;
  if (gravadoSeparacion > 0) {
    if (gravadoSeparacion <= sueldoMensualOrdinario) {
      // Si lo gravado no excede un mes de sueldo, se suma como ingreso normal.
      isrSeparacion = Math.max(
        0,
        isrArt96(sueldoMensualOrdinario + gravadoOrdinario + gravadoSeparacion, renglonesMensuales) -
          isrConExtras
      );
    } else {
      tasaEfectiva = isrSoloSueldo / sueldoMensualOrdinario;
      isrSeparacion = gravadoSeparacion * tasaEfectiva;
    }
  }

  const totalBruto = conceptos.reduce((s, c) => s + c.bruto, 0);
  const totalExento = conceptos.reduce((s, c) => s + c.exento, 0);
  const totalGravado = totalBruto - totalExento;
  const isrTotal = isrOrdinario + isrSeparacion;

  // ── Explicaciones (página 2 del PDF y sección "por qué") ──────────
  const explicaciones = [
    {
      titulo: "Antigüedad y derechos derivados",
      texto: `Del ${e.fechaIngreso} al ${e.fechaSalida} hay ${diasTotales} días = ${antiguedadTexto}. De la antigüedad se derivan: los días de vacaciones por año (Art. 76 LFT), la prima de antigüedad (12 días por año, Art. 162) y los topes de exención de ISR (90 UMA por cada año de servicio; una fracción mayor a 6 meses cuenta como año completo, Art. 93 fracc. XIII LISR). Para exención cuentan ${aniosParaExencion} ${aniosParaExencion === 1 ? "año" : "años"}.`,
    },
    {
      titulo: "Finiquito vs. liquidación",
      texto:
        "El finiquito son las partes proporcionales que SIEMPRE se pagan al terminar la relación laboral, sin importar el motivo: salarios pendientes, vacaciones + prima vacacional y aguinaldo proporcional. La liquidación (indemnización de 3 meses y, en su caso, 20 días por año) solo procede cuando el patrón termina la relación sin causa justificada (Arts. 48 y 50 LFT).",
    },
    {
      titulo: "Por qué hay una parte exenta de ISR",
      texto: `La ley protege ingresos de previsión social y por separación: aguinaldo exento hasta 30 UMA ($${(30 * umaDiaria).toFixed(2)}), prima vacacional hasta 15 UMA ($${(15 * umaDiaria).toFixed(2)}) — Art. 93 fracc. XIV LISR — y los pagos por separación (indemnizaciones y prima de antigüedad) hasta 90 UMA por año de servicio ($${(90 * umaDiaria).toFixed(2)} × ${aniosParaExencion} = $${exencionSeparacion.toFixed(2)}) — Art. 93 fracc. XIII LISR. La UMA vigente es $${umaDiaria.toFixed(2)} diaria (INEGI).`,
    },
    {
      titulo: "Cómo se calculó el ISR",
      texto: `Conceptos ordinarios gravados ($${gravadoOrdinario.toFixed(2)}): se suman al sueldo mensual y se aplica la tarifa del Art. 96 LISR (Anexo 8 RMF 2026); el ISR del finiquito es la diferencia contra el ISR del sueldo solo. Pagos por separación gravados ($${gravadoSeparacion.toFixed(2)}): ${
        tasaEfectiva !== null
          ? `como exceden un mes de sueldo, se aplica la tasa efectiva del último sueldo mensual ordinario (ISR del sueldo ÷ sueldo = ${(tasaEfectiva * 100).toFixed(2)}%), Art. 96 último párrafo LISR.`
          : gravadoSeparacion > 0
            ? "como no exceden un mes de sueldo, se suman al ingreso del mes y se aplica la tarifa normal (Art. 96 LISR)."
            : "no hubo excedente gravado, todo quedó dentro de la exención."
      }`,
    },
    {
      titulo: "Prima de antigüedad: el tope de 2 salarios mínimos",
      texto: `Para la prima de antigüedad la LFT (Arts. 485 y 486) topa el salario base al doble del mínimo general ($${(2 * salarioMinimoGeneral).toFixed(2)} = 2 × $${salarioMinimoGeneral.toFixed(2)}). Es una regla de 1970 pensada para contener pasivos laborales; sigue vigente aunque el salario real sea mayor.`,
    },
  ];

  return {
    antiguedadAnios,
    antiguedadTexto,
    aniosParaExencion,
    diasVacacionesAnioActual: diasCorresponden,
    conceptos,
    totalBruto,
    totalExento,
    totalGravado,
    isrOrdinario,
    isrSeparacion,
    tasaEfectiva,
    isrTotal,
    netoAPagar: totalBruto - isrTotal,
    explicaciones,
    advertencias,
  };
}
