import { getHistorial, getTarifaVigente } from "@/lib/db";
import FiniquitoCalculator from "@/components/calculators/FiniquitoCalculator";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Calculadora de finiquito y liquidación con ISR — LFT y Art. 93 LISR | Fiscalio Info",
  description:
    "Calcula tu finiquito o liquidación con las exenciones de ISR exactas (Art. 93 LISR) y la explicación legal de cada concepto.",
};

export default function PaginaFiniquito() {
  const tarifa = getTarifaVigente("isr_mensual_art96");
  const uma = getHistorial("uma_diaria")[0];
  const sm = getHistorial("salario_minimo_general")[0];
  if (!tarifa || !uma || !sm) {
    return <p>Faltan datos base (tarifa ISR, UMA o salario mínimo). Ejecuta el seed.</p>;
  }
  return (
    <FiniquitoCalculator tarifa={tarifa} umaDiaria={uma.valor} salarioMinimo={sm.valor} />
  );
}
