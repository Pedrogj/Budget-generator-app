import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import type {
  CompanyInfo,
  QuoteInfo,
  QuoteItem,
  ClientInfo,
} from "../types/types";
import { supabase } from "../lib/supabaseClient";

interface QuoteContextType {
  company: CompanyInfo;
  quote: QuoteInfo;
  items: QuoteItem[];
  clients: ClientInfo[];
  setFromForm: (data: { quote: QuoteInfo; items: QuoteItem[] }) => void;

  updateCompany: (company: CompanyInfo) => Promise<void> | void;

  addClient: (data: Omit<ClientInfo, "id">) => Promise<void>;
  removeClient: (id: string) => Promise<void>;
  updateClient: (id: string, data: Omit<ClientInfo, "id">) => Promise<void>;
}

const QuoteContext = createContext<QuoteContextType | undefined>(undefined);

const initialCompany: CompanyInfo = {
  name: "",
  rif: "",
  phone: "",
  addressLines: "",
  logoUrl: "",
  defaultCurrency: "USD",
  ivaRate: 16,
};

const initialQuote: QuoteInfo = {
  work: "",
  client: "",
  clientRif: "",
  clientAddress: "",
  issueDate: new Date().toISOString().slice(0, 10),
  clientId: "",
  currency: "USD",
};

const initialItems: QuoteItem[] = [
  {
    code: "NA",
    unit: "NA",
    description: "",
    quantity: 1,
    sg: "",
    unitPrice: 0,
  },
];

const initialClients: ClientInfo[] = [];

export const QuoteProvider = ({ children }: { children: ReactNode }) => {
  const [company, setCompany] = useState<CompanyInfo>(initialCompany);
  const [quote, setQuote] = useState<QuoteInfo>(initialQuote);
  const [items, setItems] = useState<QuoteItem[]>(initialItems);
  const [clients, setClients] = useState<ClientInfo[]>(initialClients);

  useEffect(() => {
    const loadFromSupabase = async () => {
      try {
        const { data: companyRow, error: companyError } = await supabase
          .from("companies")
          .select("*")
          .limit(1)
          .maybeSingle();

        if (companyError) {
          console.error("Error loading company from Supabase", companyError);
        }

        if (companyRow) {
          setCompany({
            id: companyRow.id,
            name: companyRow.name,
            rif: companyRow.rif,
            phone: companyRow.phone,
            addressLines: companyRow.address_lines,
            logoUrl: companyRow.logo_url ?? undefined,
            defaultCurrency: companyRow.default_currency ?? "USD",
            ivaRate: companyRow.iva_rate ?? 16,
          });
        } else {
          const { data: inserted, error: insertError } = await supabase
            .from("companies")
            .insert({
              name: initialCompany.name,
              rif: initialCompany.rif,
              phone: initialCompany.phone,
              address_lines: initialCompany.addressLines,
              logo_url: initialCompany.logoUrl ?? null,
              default_currency: initialCompany.defaultCurrency ?? "USD",
              iva_rate: initialCompany.ivaRate ?? 16,
            })
            .select()
            .single();

          if (insertError) {
            console.error("Error inserting initial company", insertError);
          } else if (inserted) {
            setCompany({
              id: inserted.id,
              name: inserted.name,
              rif: inserted.rif,
              phone: inserted.phone,
              addressLines: inserted.address_lines,
              logoUrl: inserted.logo_url ?? undefined,
              defaultCurrency: inserted.default_currency ?? "USD",
              ivaRate: inserted.iva_rate ?? 16,
            });
          }
        }

        // clients
        const { data: clientsRows, error: clientsError } = await supabase
          .from("clients")
          .select("*");

        if (clientsError) {
          console.error("Error loading clients", clientsError);
        } else if (clientsRows) {
          setClients(
            clientsRows.map((client) => ({
              id: client.id,
              name: client.name,
              rif: client.rif,
              address: client.address,
              email: client.email ?? "",
              phone: client.phone ?? "",
            }))
          );
        }
      } catch (err) {
        console.error("Unexpected error loading data from Supabase", err);
      }
    };

    loadFromSupabase();
  }, []);

  const setFromForm: QuoteContextType["setFromForm"] = (data) => {
    setQuote(data.quote);
    setItems(data.items);
  };

  const updateCompany: QuoteContextType["updateCompany"] = (newCompany) => {
    setCompany((prev) => {
      const merged: CompanyInfo = {
        ...prev,
        ...newCompany,
        id: prev.id,
      };

      const isSame =
        prev.name === merged.name &&
        prev.rif === merged.rif &&
        prev.phone === merged.phone &&
        prev.addressLines === merged.addressLines &&
        prev.logoUrl === merged.logoUrl &&
        prev.defaultCurrency === merged.defaultCurrency &&
        prev.ivaRate === merged.ivaRate;

      if (isSame) return prev;

      (async () => {
        try {
          if (prev.id) {
            const { error } = await supabase
              .from("companies")
              .update({
                name: merged.name,
                rif: merged.rif,
                phone: merged.phone,
                address_lines: merged.addressLines,
                logo_url: merged.logoUrl ?? null,
                default_currency: merged.defaultCurrency ?? "USD",
                iva_rate: merged.ivaRate ?? 16,
              })
              .eq("id", prev.id);

            if (error) {
              console.error("Error updating company in Supabase", error);
            }
          } else {
            const { data: inserted, error } = await supabase
              .from("companies")
              .insert({
                name: merged.name,
                rif: merged.rif,
                phone: merged.phone,
                address_lines: merged.addressLines,
                logo_url: merged.logoUrl ?? null,
                default_currency: merged.defaultCurrency ?? "USD",
                iva_rate: merged.ivaRate ?? 16,
              })
              .select()
              .single();

            if (error) {
              console.error("Error inserting company in Supabase", error);
            } else if (inserted) {
              setCompany({
                id: inserted.id,
                name: inserted.name,
                rif: inserted.rif,
                phone: inserted.phone,
                addressLines: inserted.address_lines,
                logoUrl: inserted.logo_url ?? undefined,
                defaultCurrency: inserted.default_currency ?? "USD",
                ivaRate: inserted.iva_rate ?? 16,
              });
            }
          }
        } catch (err) {
          console.error("Unexpected error updating company in Supabase", err);
        }
      })();

      return merged;
    });
  };

  const updateClient: QuoteContextType["updateClient"] = async (id, data) => {
    try {
      const { data: updated, error } = await supabase
        .from("clients")
        .update({
          name: data.name,
          rif: data.rif,
          address: data.address,
        })
        .eq("id", id)
        .select()
        .single();

      if (error) {
        console.error("Error updating client in Supabase", error);
        return;
      }

      setClients((prev) =>
        prev.map((client) =>
          client.id === id
            ? {
                id: updated.id,
                name: updated.name,
                rif: updated.rif,
                address: updated.address,
                email: updated.email ?? "",
                phone: updated.phone ?? "",
              }
            : client
        )
      );
    } catch (err) {
      console.error("Unexpected error in updateClient", err);
    }
  };

  const addClient: QuoteContextType["addClient"] = async (data) => {
    try {
      const { data: inserted, error } = await supabase
        .from("clients")
        .insert({
          company_id: company.id,
          name: data.name,
          rif: data.rif,
          address: data.address,
        })
        .select()
        .single();

      if (error) {
        console.error("Error inserting client in Supabase", error);
        return;
      }

      // Actualizamos el estado local con el registro insertado
      setClients((prev) => [
        ...prev,
        {
          id: inserted.id,
          name: inserted.name,
          rif: inserted.rif,
          address: inserted.address,
        },
      ]);
    } catch (err) {
      console.error("Unexpected error in addClient", err);
    }
  };

  const removeClient: QuoteContextType["removeClient"] = async (id) => {
    try {
      const { error } = await supabase.from("clients").delete().eq("id", id);

      if (error) {
        console.error("Error deleting client in Supabase", error);
        return;
      }

      setClients((prev) => prev.filter((client) => client.id !== id));
    } catch (err) {
      console.error("Unexpected error in removeClient", err);
    }
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
  if (!context) throw new Error("useQuote must be used within QuoteProvider");
  return context;
};
