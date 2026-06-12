import { jsPDF } from "jspdf";

export interface LineaRecibo {
  etiqueta: string;
  valor: string;
  destacada?: boolean;
  fundamento?: string;
}

export interface DatosRecibo {
  titulo: string;
  subtitulo: string;
  lineas: LineaRecibo[];
  fundamentoLegal: string;
  fuenteUrl: string;
  archivo: string;
}

const VERDE_OSCURO = "#1a4a3a";
const VERDE = "#2d9b6f";
const TINTA = "#1c1917";
const GRIS = "#78716c";

/** Genera un recibo PDF estilo nómina y lo descarga en el navegador. */
export function descargarRecibo(datos: DatosRecibo): void {
  const doc = new jsPDF({ unit: "mm", format: "a4" });
  const ancho = doc.internal.pageSize.getWidth();
  const margen = 18;
  let y = 0;

  // Encabezado de marca
  doc.setFillColor(VERDE_OSCURO);
  doc.rect(0, 0, ancho, 30, "F");
  doc.setTextColor("#ffffff");
  doc.setFont("times", "bold");
  doc.setFontSize(20);
  doc.text("Fiscalio", margen, 14);
  doc.setFillColor(VERDE);
  doc.roundedRect(margen + 26, 8, 13, 7, 1.5, 1.5, "F");
  doc.setFont("helvetica", "bold");
  doc.setFontSize(8);
  doc.text("INFO", margen + 28, 12.8);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.text("Referencia fiscal mexicana con fundamento legal", margen, 22);
  doc.setFontSize(8);
  const fecha = new Date().toLocaleDateString("es-MX", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });
  doc.text(`Generado el ${fecha}`, ancho - margen, 22, { align: "right" });

  // Título del cálculo
  y = 44;
  doc.setTextColor(TINTA);
  doc.setFont("times", "bold");
  doc.setFontSize(16);
  doc.text(datos.titulo, margen, y);
  y += 6;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9.5);
  doc.setTextColor(GRIS);
  doc.text(doc.splitTextToSize(datos.subtitulo, ancho - margen * 2), margen, y);
  y += 12;

  // Tabla de conceptos
  const altoFila = 9;
  doc.setFontSize(10);
  for (const linea of datos.lineas) {
    if (linea.destacada) {
      doc.setFillColor("#e8f5ef");
      doc.rect(margen - 2, y - 5.5, ancho - margen * 2 + 4, altoFila, "F");
    }
    doc.setTextColor(linea.destacada ? VERDE_OSCURO : TINTA);
    doc.setFont("helvetica", linea.destacada ? "bold" : "normal");
    doc.text(linea.etiqueta, margen, y);
    doc.setFont("courier", linea.destacada ? "bold" : "normal");
    doc.text(linea.valor, ancho - margen, y, { align: "right" });
    if (linea.fundamento) {
      y += 4;
      doc.setFont("helvetica", "italic");
      doc.setFontSize(7.5);
      doc.setTextColor(GRIS);
      doc.text(linea.fundamento, margen + 2, y);
      doc.setFontSize(10);
    }
    y += altoFila - 2;
    doc.setDrawColor("#e7e5e4");
    doc.line(margen, y - 4, ancho - margen, y - 4);
  }

  // Fundamento y disclaimer
  y += 8;
  doc.setFillColor("#f5f5f0");
  const fundamentoLineas = doc.splitTextToSize(datos.fundamentoLegal, ancho - margen * 2 - 8);
  const altoCaja = fundamentoLineas.length * 4 + 14;
  doc.roundedRect(margen, y, ancho - margen * 2, altoCaja, 2, 2, "F");
  doc.setFont("helvetica", "bold");
  doc.setFontSize(8.5);
  doc.setTextColor(VERDE_OSCURO);
  doc.text("FUNDAMENTO LEGAL", margen + 4, y + 6);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(TINTA);
  doc.text(fundamentoLineas, margen + 4, y + 11);
  y += altoCaja + 8;

  doc.setFontSize(7.5);
  doc.setTextColor(GRIS);
  doc.text(
    doc.splitTextToSize(
      `Fuente oficial: ${datos.fuenteUrl}\n` +
        "Documento informativo generado por Fiscalio Info, proyecto público y gratuito. " +
        "No constituye comprobante fiscal (CFDI) ni sustituye asesoría fiscal profesional.",
      ancho - margen * 2
    ),
    margen,
    y
  );

  doc.save(datos.archivo);
}
