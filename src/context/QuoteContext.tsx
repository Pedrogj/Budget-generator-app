import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from 'react';
import type {
  CompanyInfo,
  QuoteInfo,
  QuoteItem,
  ClientInfo,
} from '../types/types';

interface QuoteContextType {
  company: CompanyInfo;
  quote: QuoteInfo;
  items: QuoteItem[];
  clients: ClientInfo[];
  setFromForm: (data: { quote: QuoteInfo; items: QuoteItem[] }) => void;
  updateCompany: (company: CompanyInfo) => void;
  addClient: (data: Omit<ClientInfo, 'id'>) => void;
  removeClient: (id: string) => void;
  updateClient: (id: string, data: Omit<ClientInfo, 'id'>) => void;
}

const QuoteContext = createContext<QuoteContextType | undefined>(undefined);

const COMPANY_STORAGE_KEY = 'budget-app:company';
const CLIENTS_STORAGE_KEY = 'budget-app:clients';

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
  clientId: '',
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

const initialClients: ClientInfo[] = [
  {
    id: 'client-1',
    name: 'Palmeras de Casigua',
    rif: '--------------------',
    address: '-----------------',
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

  const [clients, setClients] = useState<ClientInfo[]>(() => {
    if (typeof window === 'undefined') return initialClients;

    try {
      const stored = window.localStorage.getItem(CLIENTS_STORAGE_KEY);
      if (!stored) return initialClients;

      const parsed = JSON.parse(stored) as ClientInfo[];
      return parsed.length ? parsed : initialClients;
    } catch {
      return initialClients;
    }
  });

  // Every time the company changes, we save it to localStorage.
  useEffect(() => {
    try {
      window.localStorage.setItem(COMPANY_STORAGE_KEY, JSON.stringify(company));
    } catch (error) {
      console.error('Error saving company to localStorage', error);
    }
  }, [company]);
  // Save clients to localStorage
  useEffect(() => {
    try {
      window.localStorage.setItem(CLIENTS_STORAGE_KEY, JSON.stringify(clients));
    } catch (error) {
      console.error('Error saving clients to localStorage', error);
    }
  }, [clients]);

  const setFromForm: QuoteContextType['setFromForm'] = (data) => {
    setQuote(data.quote);
    setItems(data.items);
  };

  const updateCompany: QuoteContextType['updateCompany'] = (newCompany) => {
    setCompany((prev) => {
      const isSame =
        prev.name === newCompany.name &&
        prev.rif === newCompany.rif &&
        prev.phone === newCompany.phone &&
        prev.addressLines === newCompany.addressLines &&
        prev.logoUrl === newCompany.logoUrl;

      if (isSame) {
        // If it's the same, we return the same object → React does NOT re-render
        return prev;
      }

      return newCompany;
    });
  };

  const addClient: QuoteContextType['addClient'] = (data) => {
    const id =
      typeof crypto !== 'undefined' && 'randomUUID' in crypto
        ? crypto.randomUUID()
        : String(Date.now());

    const newClient: ClientInfo = { id, ...data };

    setClients((prev) => [...prev, newClient]);
  };

  const removeClient: QuoteContextType['removeClient'] = (id) => {
    setClients((prev) => prev.filter((client) => client.id !== id));
  };

  const updateClient: QuoteContextType['updateClient'] = (id, data) => {
    setClients((prev) =>
      prev.map((client) => (client.id === id ? { ...client, ...data } : client))
    );
  };

  return (
    <QuoteContext.Provider
      value={{
        company,
        quote,
        items,
        clients,
        setFromForm,
        updateCompany,
        addClient,
        removeClient,
        updateClient,
      }}
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
