import { PDFDownloadLink, PDFViewer } from '@react-pdf/renderer';
import { useQuote } from '../../context/QuoteContext';
import { QuotePdfDocument } from '../../components/QuotePdfDocument';

export const QuotePreviewPage = () => {
  const { company, quote, items } = useQuote();

  return (
    <div className="page">
      <h1>Vista previa del presupuesto</h1>

      <PDFViewer
        style={{ width: '100%', height: '700px', border: '1px solid #ccc' }}
      >
        <QuotePdfDocument
          company={company}
          quote={quote}
          items={items}
        />
      </PDFViewer>

      <div style={{ marginTop: 10 }}>
        <PDFDownloadLink
          document={
            <QuotePdfDocument
              company={company}
              quote={quote}
              items={items}
            />
          }
          fileName="presupuesto.pdf"
        >
          {({ loading }) => (loading ? 'Generando PDF...' : 'Descargar PDF')}
        </PDFDownloadLink>
      </div>
    </div>
  );
};
