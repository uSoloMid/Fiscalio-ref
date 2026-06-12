import { getTarifaVigente } from "@/lib/db";
import ISRCalculator from "@/components/calculators/ISRCalculator";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Calculadora ISR asalariado 2026 — Art. 96 LISR | Fiscalio Info",
};

export default function PaginaIsr() {
  const tarifa = getTarifaVigente("isr_mensual_art96");
  if (!tarifa) {
    return <p>No hay tarifa ISR cargada. Ejecuta el seed de la base de datos.</p>;
  }
  return <ISRCalculator tarifa={tarifa} />;
}
