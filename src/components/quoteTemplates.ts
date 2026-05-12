import type { QuoteTemplateId } from "../types/types";

export interface QuoteTemplateOption {
  id: QuoteTemplateId;
  name: string;
  description: string;
  accent: string;
}

export const quoteTemplates: QuoteTemplateOption[] = [
  {
    id: "professional",
    name: "Profesional",
    description: "Formato ejecutivo con cabecera marcada, paneles y totales destacados.",
    accent: "#0284c7",
  },
  {
    id: "classic",
    name: "Clásico",
    description: "Diseño sobrio en blanco y negro, cercano al presupuesto tradicional.",
    accent: "#111827",
  },
  {
    id: "compact",
    name: "Compacto",
    description: "Más denso y directo, ideal para presupuestos con muchos ítems.",
    accent: "#0f766e",
  },
];

export function getQuoteTemplate(id: QuoteTemplateId) {
  return quoteTemplates.find((template) => template.id === id) ?? quoteTemplates[0];
}
