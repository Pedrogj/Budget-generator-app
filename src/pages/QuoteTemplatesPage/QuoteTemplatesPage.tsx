import { Link } from "react-router-dom";
import { quoteTemplates } from "../../components/quoteTemplates";
import { useQuote } from "../../context/QuoteContext";
import type { QuoteTemplateId } from "../../types/types";

function getPreviewClass(templateId: QuoteTemplateId) {
  return `template-preview template-preview-${templateId}`;
}

export const QuoteTemplatesPage = () => {
  const { selectedTemplate, setQuoteTemplate, quote, items } = useQuote();
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
              <div className={getPreviewClass(template.id)} aria-hidden="true">
                <div className="template-preview-bar" />
                <div className="template-preview-header">
                  <span />
                  <div>
                    <strong />
                    <em />
                  </div>
                </div>
                <div className="template-preview-panels">
                  <span />
                  <span />
                </div>
                <div className="template-preview-table">
                  <b />
                  <span />
                  <span />
                  <span />
                </div>
                <div className="template-preview-footer">
                  <span />
                  <strong />
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
