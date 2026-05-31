export interface QuoteItem {
  code: string;
  unit: string;
  description: string;
  quantity: number;
  sg: string;
  unitPrice: number;
}

export type QuoteTemplateId =
  | "professional"
  | "classic"
  | "compact"
  | "bold"
  | "corporate";

export type TaxIdLabel = "RIF" | "RUT" | "DNI";

export interface CompanyInfo {
  id?: string;
  name: string;
  rif: string;
  taxIdLabel?: TaxIdLabel;
  phone: string;
  addressLines: string;
  logoUrl?: string;
  logoPath?: string;
  defaultCurrency?: "USD" | "CLP";
  ivaRate?: number;
  brandPrimaryColor?: string;
  brandAccentColor?: string;
}

export interface QuoteInfo {
  id?: string;
  work: string;
  client: string;
  clientRif: string;
  clientAddress: string;
  issueDate: string;
  clientId?: string;
  currency: "USD" | "CLP";
  notes?: string;
  readOnly?: boolean;
  pdfPath?: string;
  pdfTemplateId?: QuoteTemplateId;
  pdfGeneratedAt?: string;
  pdfPreviewUrl?: string;
}

export interface ClientInfo {
  id: string;
  name: string;
  rif: string;
  address: string;
  email?: string;
  phone?: string;
}
