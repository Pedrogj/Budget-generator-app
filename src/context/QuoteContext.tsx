import { createContext, useContext, useState, type ReactNode } from 'react';
import type { CompanyInfo, QuoteInfo, QuoteItem } from '../types/types';

interface QuoteContextType {
  company: CompanyInfo;
  quote: QuoteInfo;
  items: QuoteItem[];
  setFromForm: (data: {
    company: CompanyInfo;
    quote: QuoteInfo;
    items: QuoteItem[];
  }) => void;
}

const QuoteContext = createContext<QuoteContextType | undefined>(undefined);

const initialCompany: CompanyInfo = {
  name: 'José Miguelangel Zavala Henriquez',
  rif: 'V145627512',
  phone: '0414-068.30.70',
  addressLines: [
    'Av. 91 La Limpia entre Calle 79F y 79G Edif',
    'Residencias Incumosa Piso PB Apt. Pb2. La Floresta',
    'Maracaibo, Edo. Zulia',
  ],
  logoUrl: '',
};

const initialQuote: QuoteInfo = {
  work: 'SERVICIO E INSTALACIÓN',
  client: 'Palmeras de Casigua',
  clientRif: '------------',
  clientAddress: '------------',
  issueDate: '20/10/2025',
};

const initialItems: QuoteItem[] = [
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
];

export const QuoteProvider = ({ children }: { children: ReactNode }) => {
  const [company, setCompany] = useState<CompanyInfo>(initialCompany);
  const [quote, setQuote] = useState<QuoteInfo>(initialQuote);
  const [items, setItems] = useState<QuoteItem[]>(initialItems);

  const setFromForm: QuoteContextType['setFromForm'] = (data) => {
    setCompany(data.company);
    setQuote(data.quote);
    setItems(data.items);
  };

  return (
    <QuoteContext.Provider value={{ company, quote, items, setFromForm }}>
      {children}
    </QuoteContext.Provider>
  );
};

export const useQuote = () => {
  const context = useContext(QuoteContext);
  if (context) throw new Error('useQuote must be used within QuoteProvider');
  return context;
};
