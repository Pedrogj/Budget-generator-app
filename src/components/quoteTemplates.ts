import type { CompanyInfo, QuoteTemplateId } from "../types/types";

export interface QuoteTemplateOption {
  id: QuoteTemplateId;
  name: string;
  description: string;
  accent: string;
}

export interface QuoteTemplateTheme {
  primary: string;
  accent: string;
  primaryContrast: string;
  accentContrast: string;
  softAccent: string;
}

export const defaultBrandPrimaryColor = "#0f172a";
export const defaultBrandAccentColor = "#0284c7";

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
  {
    id: "bold",
    name: "Impacto",
    description: "Diseño rojo y negro con presencia fuerte, pensado para propuestas comerciales.",
    accent: "#dc2626",
  },
  {
    id: "corporate",
    name: "Corporativo",
    description: "Formato moderno con cabecera negra, acento amarillo, tabla destacada y footer comercial.",
    accent: "#fbbf24",
  },
];

export function getQuoteTemplate(id: QuoteTemplateId) {
  return quoteTemplates.find((template) => template.id === id) ?? quoteTemplates[0];
}

export function isHexColor(value: string | undefined): value is string {
  return /^#[0-9a-f]{6}$/i.test(value ?? "");
}

function getRgb(hex: string) {
  const normalized = hex.replace("#", "");
  return {
    r: parseInt(normalized.slice(0, 2), 16),
    g: parseInt(normalized.slice(2, 4), 16),
    b: parseInt(normalized.slice(4, 6), 16),
  };
}

function getReadableTextColor(hex: string) {
  const { r, g, b } = getRgb(hex);
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  return luminance > 0.62 ? "#111827" : "#ffffff";
}

function mixWithWhite(hex: string, amount = 0.88) {
  const { r, g, b } = getRgb(hex);
  const mix = (channel: number) =>
    Math.round(channel + (255 - channel) * amount)
      .toString(16)
      .padStart(2, "0");

  return `#${mix(r)}${mix(g)}${mix(b)}`;
}

export function getCompanyBrandColors(company: CompanyInfo): QuoteTemplateTheme {
  const primary = isHexColor(company.brandPrimaryColor)
    ? company.brandPrimaryColor
    : defaultBrandPrimaryColor;
  const accent = isHexColor(company.brandAccentColor)
    ? company.brandAccentColor
    : defaultBrandAccentColor;

  return {
    primary,
    accent,
    primaryContrast: getReadableTextColor(primary),
    accentContrast: getReadableTextColor(accent),
    softAccent: mixWithWhite(accent),
  };
}
