export interface CalculadoraInfo {
  href: string;
  label: string;
  fundamento: string;
  disponible: boolean;
}

export const CALCULADORAS: CalculadoraInfo[] = [
  { href: "/calculadoras/isr", label: "ISR asalariado", fundamento: "Art. 96 LISR", disponible: true },
  { href: "/calculadoras/resico", label: "RESICO personas físicas", fundamento: "Art. 113-E LISR", disponible: true },
  { href: "/calculadoras/liquidacion", label: "Liquidación laboral", fundamento: "Arts. 48 y 50 LFT", disponible: true },
  { href: "/calculadoras/imss", label: "Cuotas IMSS", fundamento: "Art. 25 LSS", disponible: false },
  { href: "/calculadoras/aguinaldo", label: "Aguinaldo", fundamento: "Art. 87 LFT", disponible: false },
  { href: "/calculadoras/ptu", label: "PTU", fundamento: "Arts. 120–131 LFT", disponible: false },
  { href: "/indicadores#factor", label: "Factor de integración", fundamento: "Art. 84 LFT", disponible: true },
  { href: "/calculadoras/iva", label: "IVA acreditable", fundamento: "Art. 5 LIVA", disponible: false },
];
