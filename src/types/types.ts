export interface QuoteItem {
  code: string;
  unit: string;
  description: string;
  quantity: number;
  sg: string;
  unitPrice: number;
}

export interface CompanyInfo {
  name: string;
  rif: string;
  phone: string;
  addressLines: string;
  logoUrl?: string;
  defaultCurrency?: 'USD' | 'CLP';
}

export interface QuoteInfo {
  work: string;
  client: string;
  clientRif: string;
  clientAddress: string;
  issueDate: string;
  clientId?: string;
  currency: 'USD' | 'CLP';
}

export interface ClientInfo {
  id: string;
  name: string;
  rif: string;
  address: string;
}
