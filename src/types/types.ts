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
}

export interface QuoteInfo {
  work: string;
  client: string;
  clientRif: string;
  clientAddress: string;
  issueDate: string;
  clientId?: string;
}

export interface ClientInfo {
  id: string;
  name: string;
  rif: string;
  address: string;
}
