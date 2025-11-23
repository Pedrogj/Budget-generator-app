import jsPDF from "jspdf";
import { useState } from "react";

type QuoteItem = {
  code: string;
  unit: string;
  description: string;
  quantity: number;
  sg: string;
  unitPrice: number;
};

const exampleItems: QuoteItem[] = [
  {
    code: "NA",
    unit: "NA",
    description: "Servicio de ajuste y calibración",
    quantity: 1,
    sg: "",
    unitPrice: 1500,
  },
  {
    code: "NA",
    unit: "NA",
    description: "Instalación y configuración de indicador de peso",
    quantity: 1,
    sg: "",
    unitPrice: 200,
  },
  {
    code: "NA",
    unit: "NA",
    description: "Revisión de celdas y tarjeta suma",
    quantity: 1,
    sg: "",
    unitPrice: 300,
  },
  {
    code: "NA",
    unit: "NA",
    description: "Flete con 6ton de peso patrón",
    quantity: 1,
    sg: "",
    unitPrice: 1500,
  },
  {
    code: "NA",
    unit: "NA",
    description: "Indicador de peso Bkg lp 7510",
    quantity: 1,
    sg: "",
    unitPrice: 550,
  },
];

const formatMoney = (value: number) =>
  new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(value);

// ⬇️ Ahora esta función devuelve la URL del PDF
function generateQuotePdf(): string {
  const doc = new jsPDF({
    unit: "mm",
    format: "letter", // o "a4", ajusta a gusto
  });

  // Márgenes base
  const marginLeft = 10;
  let y = 15;

  // Datos empresa / técnico
  doc.setFont("helvetica", "bold");
  doc.setFontSize(12);
  doc.text("José Miguelangel Zavala Henriquez", marginLeft, y);
  y += 5;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.text("RIF. : V145627512", marginLeft, y);
  y += 6;

  // Título PRESUPUESTO a la derecha
  doc.setFont("helvetica", "bold");
  doc.setFontSize(14);
  doc.text("PRESUPUESTO", 200 - marginLeft, 20, { align: "right" });

  // Subtítulo (servicio)
  doc.setFontSize(11);
  doc.text(
    "Mantenimiento - Reparación Y Calibración de Balanza",
    marginLeft,
    y
  );
  y += 6;

  // Teléfono y fecha emisión
  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.text("TELÉFONO : 0414-068.30.70", marginLeft, y);
  doc.text("FECHA EMISIÓN : 20/10/2025", 200 - marginLeft, y, {
    align: "right",
  });
  y += 6;

  // Dirección empresa (puedes dividirla en líneas)
  doc.text(
    "DIRECCIÓN : Av. 91 La Limpia entre Calle 79F y 79G Edif",
    marginLeft,
    y
  );
  y += 5;
  doc.text("Residencias Incumosa Piso PB Apt. Pb2. La Floresta", marginLeft, y);
  y += 5;
  doc.text("Maracaibo, Edo. Zulia", marginLeft, y);
  y += 10;

  // Bloque OBRA / CLIENTE / RIF / DIRECCIÓN
  doc.setFont("helvetica", "bold");
  doc.text("OBRA :", marginLeft, y);
  doc.setFont("helvetica", "normal");
  doc.text("SERVICIO E INSTALACIÓN", marginLeft + 20, y);
  y += 6;

  doc.setFont("helvetica", "bold");
  doc.text("CLIENTE :", marginLeft, y);
  doc.setFont("helvetica", "normal");
  doc.text("Palmeras de Casigua", marginLeft + 20, y);
  y += 6;

  doc.setFont("helvetica", "bold");
  doc.text("RIF :", marginLeft, y);
  doc.setFont("helvetica", "normal");
  doc.text("------------", marginLeft + 20, y);
  y += 6;

  doc.setFont("helvetica", "bold");
  doc.text("DIRECCIÓN :", marginLeft, y);
  doc.setFont("helvetica", "normal");
  doc.text("------------", marginLeft + 25, y);
  y += 10;

  // Encabezado tabla
  doc.setFont("helvetica", "bold");

  // Coordenadas x de cada columna (ajústalas a gusto)
  const xCode = marginLeft;
  const xUnit = xCode + 20;
  const xDesc = xUnit + 15;
  const xCant = xDesc + 70;
  const xSg = xCant + 15;
  const xUnitPrice = xSg + 15;
  const xTotal = xUnitPrice + 25;

  doc.text("CÓDIGO", xCode, y);
  doc.text("UND", xUnit, y);
  doc.text("DESCRIPCIÓN", xDesc, y);
  doc.text("CANT.", xCant, y);
  doc.text("SG", xSg, y);
  doc.text("P/UNITARIO", xUnitPrice, y);
  doc.text("PRECIO TOTAL", xTotal, y);

  y += 3;
  doc.line(marginLeft, y, 200 - marginLeft, y);
  y += 5;

  // Filas de la tabla
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);

  let subtotal = 0;

  exampleItems.forEach((item) => {
    const lineTotal = item.quantity * item.unitPrice;
    subtotal += lineTotal;

    doc.text(item.code, xCode, y);
    doc.text(item.unit, xUnit, y);
    // Descripción con ancho máximo
    doc.text(item.description, xDesc, y, { maxWidth: 65 });
    doc.text(String(item.quantity), xCant, y, { align: "right" });
    doc.text(item.sg, xSg, y);
    doc.text(formatMoney(item.unitPrice), xUnitPrice, y, { align: "right" });
    doc.text(formatMoney(lineTotal), xTotal, y, { align: "right" });

    y += 6;
  });

  // Nota
  y += 4;
  doc.setFontSize(9);
  doc.text(
    "Nota: El pago de los equipos electrónicos se realiza por adelantado.",
    marginLeft,
    y
  );
  y += 4;
  doc.text(
    "El precio puede variar según el tipo de cambio del dólar.",
    marginLeft,
    y
  );
  y += 10;

  // Totales (SUB-TOTAL, IVA, TOTAL)
  const ivaRate = 0.16;
  const iva = subtotal * ivaRate;
  const total = subtotal + iva;

  doc.setFontSize(10);
  const totalsX = 200 - marginLeft;

  doc.text(`SUB-TOTAL ${formatMoney(subtotal)}`, totalsX, y, {
    align: "right",
  });
  y += 5;
  doc.text(`I.V.A. 16% ${formatMoney(iva)}`, totalsX, y, {
    align: "right",
  });
  y += 5;
  doc.setFont("helvetica", "bold");
  doc.text(`TOTAL   ${formatMoney(total)}`, totalsX, y, {
    align: "right",
  });

  // 🔹 En vez de guardar, generamos un Blob y una URL
  const blob = doc.output("blob");
  const url = URL.createObjectURL(blob);
  return url;
}

export const App = () => {
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);

  const handlePreview = () => {
    // (opcional) limpiar URL previa para no llenar memoria
    if (pdfUrl) {
      URL.revokeObjectURL(pdfUrl);
    }
    const url = generateQuotePdf();
    setPdfUrl(url);
  };

  return (
    <div style={{ padding: 20, maxWidth: 1000, margin: "0 auto" }}>
      <h1>Generador de Presupuesto (Plantilla)</h1>
      <p>
        Este botón genera un PDF con la plantilla de presupuesto que me
        compartiste y lo muestra como vista previa.
      </p>

      <button onClick={handlePreview}>Previsualizar PDF</button>

      {pdfUrl && (
        <>
          <h2 style={{ marginTop: 20 }}>Vista previa</h2>
          <iframe
            src={pdfUrl}
            width="100%"
            height="600px"
            style={{ border: "1px solid #ccc", marginTop: 10 }}
          />
          <div style={{ marginTop: 10 }}>
            <a href={pdfUrl} download="presupuesto-plantilla.pdf">
              Descargar PDF
            </a>
          </div>
        </>
      )}
    </div>
  );
};
