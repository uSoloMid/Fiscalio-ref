import { getHistorial } from "@/lib/db";
import LiquidacionCalculator from "@/components/calculators/LiquidacionCalculator";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Calculadora de liquidación laboral — LFT Arts. 48 y 50 | Fiscalio Info",
};

export default function PaginaLiquidacion() {
  const sm = getHistorial("salario_minimo_general")[0];
  if (!sm) {
    return <p>No hay salario mínimo cargado. Ejecuta el seed de la base de datos.</p>;
  }
  return <LiquidacionCalculator salarioMinimo={sm.valor} />;
}
