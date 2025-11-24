import { useState } from 'react';
import { PDFDownloadLink, PDFViewer } from '@react-pdf/renderer';
import { QuotePdfDocument } from '../../components/QuotePdfDocument';

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
    code: 'NA',
    unit: 'NA',
    description: 'Servicio de ajuste y calibración',
    quantity: 1,
    sg: '',
    unitPrice: 1500,
  },
  {
    code: 'NA',
    unit: 'NA',
    description: 'Instalación y configuración de indicador de peso',
    quantity: 1,
    sg: '',
    unitPrice: 200,
  },
  {
    code: 'NA',
    unit: 'NA',
    description: 'Revisión de celdas y tarjeta suma',
    quantity: 1,
    sg: '',
    unitPrice: 300,
  },
  {
    code: 'NA',
    unit: 'NA',
    description: 'Flete con 6ton de peso patrón',
    quantity: 1,
    sg: '',
    unitPrice: 1500,
  },
  {
    code: 'NA',
    unit: 'NA',
    description: 'Indicador de peso Bkg lp 7510',
    quantity: 1,
    sg: '',
    unitPrice: 550,
  },
];

export const QuotePreviewPage = () => {
  const [items] = useState<QuoteItem[]>(exampleItems);

  return (
    <div style={{ padding: 20 }}>
      <h1>Presupuesto con React PDF</h1>

      {/* Vista previa */}
      <PDFViewer
        style={{ width: '100%', height: '600px', border: '1px solid #ccc' }}
      >
        <QuotePdfDocument items={items} />
      </PDFViewer>

      {/* Botón de descarga */}
      <div style={{ marginTop: 10 }}>
        <PDFDownloadLink
          document={<QuotePdfDocument items={items} />}
          fileName="presupuesto.pdf"
        >
          {({ loading }) => (loading ? 'Generando PDF...' : 'Descargar PDF')}
        </PDFDownloadLink>
      </div>
    </div>
  );
};
