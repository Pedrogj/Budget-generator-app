import { Link } from "react-router-dom";
import { lazy, Suspense, useState } from "react";
import { useQuote } from "../../context/QuoteContext";
import { getQuoteTemplate } from "../../components/quoteTemplates";
import { LoadingState } from "../../components";
import {
  createQuotePdfSignedUrl,
  uploadQuotePdf,
} from "../../lib/quotePdfStorage";
import { prepareCompanyLogoForPdf } from "../../lib/companyLogoStorage";

const QuotePdfViewer = lazy(() =>
  import("../../components/QuotePdfViewer").then((module) => ({
    default: module.QuotePdfViewer,
  })),
);

function formatMoney(value: number, currency: "USD" | "CLP") {
  return new Intl.NumberFormat("es-CL", {
    style: "currency",
    currency,
    maximumFractionDigits: currency === "CLP" ? 0 : 2,
  }).format(value);
}

function toFileSlug(value: string) {
  const normalized = value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

  return normalized || "cliente";
}

export const QuotePreviewPage = () => {
  const { company, quote, items, selectedTemplate, setFromForm } = useQuote();
  const [isDownloading, setIsDownloading] = useState(false);
  const currency = quote.currency ?? company.defaultCurrency ?? "USD";
  const isReadOnly = quote.readOnly === true;
  const hasStoredPreview = isReadOnly && !!quote.pdfPreviewUrl;
  const previewTemplateId =
    hasStoredPreview && quote.pdfTemplateId ? quote.pdfTemplateId : selectedTemplate;
  const previewTemplate = getQuoteTemplate(previewTemplateId);
  const subtotal = items.reduce((sum, item) => {
    return sum + Number(item.quantity || 0) * Number(item.unitPrice || 0);
  }, 0);
  const ivaRate = Number(company.ivaRate ?? 16);
  const iva = subtotal * (ivaRate / 100);
  const total = subtotal + iva;
  const hasQuoteData =
    quote.work.trim() &&
    quote.client.trim() &&
    (hasStoredPreview || items.some((item) => item.description.trim()));
  const fileName = `presupuesto-${toFileSlug(quote.client)}-${quote.issueDate || "sin-fecha"}.pdf`;

  const downloadBlob = (blob: Blob) => {
    const url = window.URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = fileName;
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
    window.URL.revokeObjectURL(url);
  };

  const downloadUrl = (url: string) => {
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = fileName;
    anchor.rel = "noopener";
    anchor.target = "_blank";
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
  };

  const handleDownload = async () => {
    setIsDownloading(true);

    try {
      if (
        quote.pdfPath &&
        (hasStoredPreview || quote.pdfTemplateId === selectedTemplate)
      ) {
        const signedUrl = await createQuotePdfSignedUrl(quote.pdfPath, fileName);
        downloadUrl(signedUrl);
        return;
      }

      if (quote.pdfPreviewUrl) {
        downloadUrl(quote.pdfPreviewUrl);
        return;
      }

      const [{ pdf }, { QuotePdfDocument }] = await Promise.all([
        import("@react-pdf/renderer"),
        import("../../components/QuotePdfDocument"),
      ]);
      const pdfCompany = await prepareCompanyLogoForPdf(company);
      const pdfBlob = await pdf(
        <QuotePdfDocument
          company={pdfCompany}
          quote={quote}
          items={items}
          templateId={selectedTemplate}
        />,
      ).toBlob();

      if (company.id && quote.id) {
        const storedPdf = await uploadQuotePdf({
          companyId: company.id,
          quoteId: quote.id,
          fileName,
          pdfBlob,
          templateId: selectedTemplate,
        });

        setFromForm({
          quote: {
            ...quote,
            pdfPath: storedPdf.path,
            pdfTemplateId: storedPdf.templateId,
            pdfGeneratedAt: storedPdf.generatedAt,
          },
          items,
        });
      }

      downloadBlob(pdfBlob);
    } finally {
      setIsDownloading(false);
    }
  };

  if (!hasQuoteData) {
    return (
      <div className="page quote-preview-page">
        <section className="quote-preview-empty">
          <h1>Vista previa del presupuesto</h1>
          <p>
            Aún no hay un presupuesto listo para previsualizar. Completa los
            datos del presupuesto y guárdalo para generar el PDF.
          </p>
          <Link className="quote-preview-action" to="/quotes/new">
            Crear presupuesto
          </Link>
        </section>
      </div>
    );
  }

  return (
    <div className="page quote-preview-page">
      <div className="quote-preview-header">
        <div>
          <h1>Vista previa del presupuesto</h1>
          <p className="quote-preview-subtitle">
            {isReadOnly
              ? "Este presupuesto pertenece al historial y solo está disponible para consulta o descarga."
              : "Revisa el documento antes de descargarlo o vuelve al formulario para ajustar datos."}
          </p>
        </div>

        <div className="quote-preview-actions">
          <button
            type="button"
            className="quote-preview-action"
            onClick={() => void handleDownload()}
            disabled={isDownloading}
          >
            {isDownloading ? "Generando PDF..." : "Descargar PDF"}
          </button>
        </div>
      </div>

      <section
        className={`quote-preview-summary ${
          hasStoredPreview ? "quote-preview-summary-stored" : ""
        }`}
        aria-label="Resumen del presupuesto"
      >
        <div>
          <span>Cliente</span>
          <strong>{quote.client}</strong>
        </div>
        <div>
          <span>Descripción</span>
          <strong>{quote.work}</strong>
        </div>
        {!hasStoredPreview && (
          <div>
            <span>Ítems</span>
            <strong>{items.length}</strong>
          </div>
        )}
        <div>
          <span>{hasStoredPreview ? "Modelo guardado" : "Modelo aplicado"}</span>
          <strong>{previewTemplate.name}</strong>
        </div>
        <div>
          <span>Total</span>
          <strong>
            {hasStoredPreview ? "PDF guardado" : formatMoney(total, currency)}
          </strong>
        </div>
      </section>

      <section className="quote-preview-panel">
        {hasStoredPreview ? (
          <iframe
            className="quote-preview-viewer"
            src={quote.pdfPreviewUrl}
            title="PDF guardado del presupuesto"
          />
        ) : (
          <Suspense
            fallback={
              <div className="quote-preview-viewer quote-preview-loading">
                <LoadingState
                  title="Preparando vista previa"
                  message="Estamos generando el visor del PDF."
                  variant="inline"
                />
              </div>
            }
          >
            <QuotePdfViewer
              className="quote-preview-viewer"
              company={company}
              quote={quote}
              items={items}
              templateId={selectedTemplate}
            />
          </Suspense>
        )}
      </section>

      <div className="quote-preview-mobile-actions">
        <button
          type="button"
          className="quote-preview-action"
          onClick={() => void handleDownload()}
          disabled={isDownloading}
        >
          {isDownloading ? "Generando PDF..." : "Descargar PDF"}
        </button>
      </div>
    </div>
  );
};
