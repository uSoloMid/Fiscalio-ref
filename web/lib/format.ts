export function mxn(valor: number): string {
  return valor.toLocaleString("es-MX", {
    style: "currency",
    currency: "MXN",
    minimumFractionDigits: 2,
  });
}

export function fechaLarga(iso: string): string {
  return new Date(iso + "T00:00:00").toLocaleDateString("es-MX", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

export const NOMBRES_INDICADOR: Record<string, string> = {
  uma_diaria: "UMA diaria",
  uma_mensual: "UMA mensual",
  uma_anual: "UMA anual",
  salario_minimo_general: "Salario mínimo general",
  salario_minimo_frontera: "Salario mínimo ZLFN",
  inpc_general: "INPC general",
};
