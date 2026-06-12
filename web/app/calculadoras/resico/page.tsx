import { getTarifaVigente } from "@/lib/db";
import CalculadoraResico from "./CalculadoraResico";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Calculadora RESICO personas físicas — Art. 113-E LISR | Fiscalio Info",
};

export default function PaginaResico() {
  const tarifa = getTarifaVigente("resico_pf_mensual_art113e");
  if (!tarifa) {
    return <p>No hay tarifa RESICO cargada. Ejecuta el seed de la base de datos.</p>;
  }
  return <CalculadoraResico tarifa={tarifa} />;
}
