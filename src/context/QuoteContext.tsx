import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from 'react';
import type { CompanyInfo, QuoteInfo, QuoteItem } from '../types/types';

interface QuoteContextType {
  company: CompanyInfo;
  quote: QuoteInfo;
  items: QuoteItem[];
  setFromForm: (data: { quote: QuoteInfo; items: QuoteItem[] }) => void;
  updateCompany: (company: CompanyInfo) => void;
}

const QuoteContext = createContext<QuoteContextType | undefined>(undefined);

const COMPANY_STORAGE_KEY = 'budget-app:company';

const initialCompany: CompanyInfo = {
  name: 'José Miguelangel Zavala Henriquez',
  rif: 'V145627512',
  phone: '0414-068.30.70',
  addressLines:
    'Av. 91 La Limpia entre Calle 79F y 79G Edif Residencias Incumosa Piso PB Apt. Pb2. La Floresta Maracaibo, Edo. Zulia',
  logoUrl: '',
};

const initialQuote: QuoteInfo = {
  work: 'SERVICIO E INSTALACIÓN',
  client: 'Palmeras de Casigua',
  clientRif: '------------',
  clientAddress: '------------',
  issueDate: new Date().toISOString().slice(0, 10),
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
  const [company, setCompany] = useState<CompanyInfo>(() => {
    if (typeof window === 'undefined') return initialCompany;

    try {
      const stored = window.localStorage.getItem(COMPANY_STORAGE_KEY);
      if (!stored) return initialCompany;

      const parsed = JSON.parse(stored) as CompanyInfo;

      if (!parsed.name || !parsed.rif) return initialCompany;

      return parsed;
    } catch {
      return initialCompany;
    }
  });

  const [quote, setQuote] = useState<QuoteInfo>(initialQuote);
  const [items, setItems] = useState<QuoteItem[]>(initialItems);

  // Every time the company changes, we save it to localStorage.
  useEffect(() => {
    try {
      window.localStorage.setItem(COMPANY_STORAGE_KEY, JSON.stringify(company));
    } catch (error) {
      console.error('Error saving company to localStorage', error);
    }
  }, [company]);

  const setFromForm: QuoteContextType['setFromForm'] = (data) => {
    setQuote(data.quote);
    setItems(data.items);
  };

  const updateCompany: QuoteContextType['updateCompany'] = (newCompany) => {
    setCompany(newCompany);
  };

  return (
    <QuoteContext.Provider
      value={{ company, quote, items, setFromForm, updateCompany }}
    >
      {children}
    </QuoteContext.Provider>
  );
};

export const useQuote = () => {
  const context = useContext(QuoteContext);
  if (!context) throw new Error('useQuote must be used within QuoteProvider');
  return context;
};
