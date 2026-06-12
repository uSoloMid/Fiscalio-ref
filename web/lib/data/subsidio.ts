/**
 * Subsidio para el empleo 2026.
 * Decreto DOF 31/12/2025: https://dof.gob.mx/nota_detalle.php?codigo=5777649&fecha=31/12/2025
 * - Enero 2026: 15.59% de la UMA mensual = $536.21/mes
 * - Febrero–diciembre 2026: 15.02% de la UMA mensual = $536.22/mes
 * - Aplica si el ingreso mensual gravable no excede $11,492.66
 * - El subsidio solo se acredita hasta el monto del ISR determinado
 *   (no genera saldo a favor ni pago en efectivo; decreto vigente desde 2024).
 */
export const SUBSIDIO_EMPLEO_2026 = {
  montoMensual: 536.22,
  topeIngresoMensual: 11492.66,
  fundamento: "Decreto de subsidio para el empleo, DOF 31/12/2025 (15.02% de la UMA mensual)",
  fuenteUrl: "https://dof.gob.mx/nota_detalle.php?codigo=5777649&fecha=31/12/2025",
  publicadoDof: "2025-12-31",
} as const;
