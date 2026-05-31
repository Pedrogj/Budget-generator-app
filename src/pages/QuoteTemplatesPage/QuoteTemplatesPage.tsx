import { Link } from "react-router-dom";
import type { CSSProperties } from "react";
import {
  getCompanyBrandColors,
  quoteTemplates,
} from "../../components/quoteTemplates";
import { useQuote } from "../../context/QuoteContext";
import type { QuoteTemplateId } from "../../types/types";

const previewRows = [
  {
    code: "MAT-01",
    description: "Suministro tablero eléctrico",
    quantity: "2",
    unitPrice: "$ 480.00",
    total: "$ 960.00",
  },
  {
    code: "SER-12",
    description: "Instalación y pruebas técnicas",
    quantity: "1",
    unitPrice: "$ 720.00",
    total: "$ 720.00",
  },
  {
    code: "LOG-03",
    description: "Traslado y puesta en marcha",
    quantity: "1",
    unitPrice: "$ 180.00",
    total: "$ 180.00",
  },
];

function getPreviewClass(templateId: QuoteTemplateId) {
  return `template-preview template-preview-${templateId}`;
}

export const QuoteTemplatesPage = () => {
  const { selectedTemplate, setQuoteTemplate, quote, items, company } =
    useQuote();
  const taxIdLabel = company.taxIdLabel ?? "RIF";
  const brandColors = getCompanyBrandColors(company);
  const previewStyle = {
    "--brand-primary": brandColors.primary,
    "--brand-accent": brandColors.accent,
    "--brand-primary-contrast": brandColors.primaryContrast,
    "--brand-accent-contrast": brandColors.accentContrast,
    "--brand-soft": brandColors.softAccent,
  } as CSSProperties;
  const hasQuoteData =
    quote.work.trim() &&
    quote.client.trim() &&
    items.some((item) => item.description.trim());

  return (
    <div className="page templates-page">
      <div className="templates-header">
        <div>
          <h1>Modelos de presupuesto</h1>
          <p className="templates-subtitle">
            Elige el diseño que se aplicará al PDF al previsualizar o exportar
            presupuestos.
          </p>
        </div>

        <div className="templates-actions">
          {hasQuoteData && (
            <Link className="quote-preview-secondary" to="/quotes/preview">
              Ver presupuesto
            </Link>
          )}
          <Link className="quote-preview-action" to="/quotes/new">
            Nuevo presupuesto
          </Link>
        </div>
      </div>

      <section className="templates-grid" aria-label="Catálogo de modelos">
        {quoteTemplates.map((template) => {
          const isSelected = template.id === selectedTemplate;

          return (
            <article
              className={`template-card ${isSelected ? "template-card-selected" : ""}`}
              key={template.id}
            >
              <div
                className={getPreviewClass(template.id)}
                style={previewStyle}
                role="img"
                aria-label={`Vista referencial del modelo ${template.name}`}
              >
                <div className="template-preview-topline" />
                <div className="template-preview-heading">
                  <span className="template-preview-logo">AC</span>
                  <div>
                    <strong>ACME Servicios Integrales</strong>
                    <span>{taxIdLabel}: J-12345678-9</span>
                    <span>Av. Principal 245, Santiago</span>
                  </div>
                  <aside>
                    <strong>PRESUPUESTO</strong>
                    <span>USD</span>
                    <em>10/05/2026</em>
                  </aside>
                </div>
                <div className="template-preview-panels">
                  <section>
                    <span>Cliente</span>
                    <strong>Constructora Norte</strong>
                    <em>{taxIdLabel}: 76.123.456-7</em>
                  </section>
                  <section>
                    <span>Obra</span>
                    <strong>Remodelación oficina central</strong>
                    <em>3 ítems presupuestados</em>
                  </section>
                </div>
                <div className="template-preview-table">
                  <div className="template-preview-table-head">
                    <span>Cód.</span>
                    <span>Descripción</span>
                    <span>Cant.</span>
                    <span>Total</span>
                  </div>
                  {previewRows.map((row) => (
                    <div className="template-preview-table-row" key={row.code}>
                      <span>{row.code}</span>
                      <strong>{row.description}</strong>
                      <span>{row.quantity}</span>
                      <span>{row.total}</span>
                    </div>
                  ))}
                </div>
                <div className="template-preview-footer">
                  <p>Notas: entrega estimada en 7 días hábiles.</p>
                  <div>
                    <span>Subtotal</span>
                    <strong>$ 1,860.00</strong>
                    <span>IVA 16%</span>
                    <strong>$ 297.60</strong>
                    <b>Total $ 2,157.60</b>
                  </div>
                </div>
              </div>

              <div className="template-card-body">
                <div>
                  <h2>{template.name}</h2>
                  <p>{template.description}</p>
                </div>
                <button
                  type="button"
                  aria-pressed={isSelected}
                  onClick={() => setQuoteTemplate(template.id)}
                >
                  {isSelected ? "Seleccionado" : "Usar modelo"}
                </button>
              </div>
            </article>
          );
        })}
      </section>
    </div>
  );
};
