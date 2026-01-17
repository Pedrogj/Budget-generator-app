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
import { useAuth } from "./AuthContext";

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

  saveQuote: (data: {
    quote: QuoteInfo;
    items: QuoteItem[];
  }) => Promise<string>;
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
  const { user, loading: authLoading } = useAuth();

  const [company, setCompany] = useState<CompanyInfo>(initialCompany);
  const [quote, setQuote] = useState<QuoteInfo>(initialQuote);
  const [items, setItems] = useState<QuoteItem[]>(initialItems);
  const [clients, setClients] = useState<ClientInfo[]>(initialClients);

  useEffect(() => {
    // 1) Esperamos a saber si hay usuario
    if (authLoading) return;

    // 2) Si NO hay usuario, reseteamos estado y no llamamos a Supabase
    if (!user) {
      setCompany(initialCompany);
      setClients(initialClients);
      setQuote(initialQuote);
      setItems(initialItems);
      return;
    }

    const loadFromSupabase = async () => {
      try {
        // 3) Cargar (o crear) la company del usuario actual
        const { data: companyRow, error: companyError } = await supabase
          .from("companies")
          .select("*")
          .eq("profile_id", user.id)
          .limit(1)
          .maybeSingle();

        if (companyError) {
          console.error("Error loading company from Supabase", companyError);
        }

        let currentCompanyId: string | undefined;

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
          currentCompanyId = companyRow.id;
        } else {
          // Si el usuario no tiene empresa, creamos una vacía ligada a su profile
          const { data: inserted, error: insertError } = await supabase
            .from("companies")
            .insert({
              profile_id: user.id,
              name: "",
              rif: "",
              phone: "",
              address_lines: "",
              logo_url: null,
              default_currency: "USD",
              iva_rate: 16,
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
            currentCompanyId = inserted.id;
          }
        }

        // 4) Si no tenemos companyId, no seguimos
        if (!currentCompanyId) return;

        // 5) Cargar clientes SOLO de esa company
        const { data: clientsRows, error: clientsError } = await supabase
          .from("clients")
          .select("*")
          .eq("company_id", currentCompanyId);

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
            })),
          );
        }
      } catch (err) {
        console.error("Unexpected error loading data from Supabase", err);
      }
    };

    loadFromSupabase();
  }, [authLoading, user]);

  const setFromForm: QuoteContextType["setFromForm"] = (data) => {
    setQuote(data.quote);
    setItems(data.items);
  };

  const updateCompany: QuoteContextType["updateCompany"] = async (
    newCompany,
  ) => {
    if (!user) {
      return;
    }

    const merged: CompanyInfo = {
      ...company,
      ...newCompany,
      id: company.id,
    };

    const isSame =
      company.name === merged.name &&
      company.rif === merged.rif &&
      company.phone === merged.phone &&
      company.addressLines === merged.addressLines &&
      company.logoUrl === merged.logoUrl &&
      company.defaultCurrency === merged.defaultCurrency &&
      company.ivaRate === merged.ivaRate;

    if (isSame) return;

    try {
      if (company.id) {
        // UPDATE
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
          .eq("id", company.id)
          .eq("profile_id", user.id);

        if (error) {
          console.error("Error updating company in Supabase", error);
        }
      } else {
        const { data: inserted, error } = await supabase
          .from("companies")
          .insert({
            profile_id: user.id,
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
          merged.id = inserted.id;
        }
      }
    } catch (err) {
      console.error("Unexpected error updating company in Supabase", err);
    }

    setCompany(merged);
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
            : client,
        ),
      );
    } catch (err) {
      console.error("Unexpected error in updateClient", err);
    }
  };

  const addClient: QuoteContextType["addClient"] = async (data) => {
    if (!company.id) {
      console.warn("No hay company.id aún, no se puede agregar cliente");
      return;
    }

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

      setClients((prev) => [
        ...prev,
        {
          id: inserted.id,
          name: inserted.name,
          rif: inserted.rif,
          address: inserted.address,
          email: inserted.email ?? "",
          phone: inserted.phone ?? "",
        },
      ]);
    } catch (err) {
      console.error("Unexpected error in addClient", err);
      throw err;
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

  const saveQuote: QuoteContextType["saveQuote"] = async ({ quote, items }) => {
    if (!company.id) {
      throw new Error(
        "No hay company.id; aún no se cargó la empresa desde Supabase",
      );
    }

    const { data: insertedQuote, error: quoteError } = await supabase
      .from("quotes")
      .insert({
        company_id: company.id,
        client_id: quote.clientId || null,
        work: quote.work,
        issue_date: quote.issueDate,
        currency: quote.currency,
        client_name: quote.client,
        client_rif: quote.clientRif,
        client_address: quote.clientAddress,
      })
      .select()
      .single();

    if (quoteError || !insertedQuote) {
      console.error("Error inserting quote in Supabase", quoteError);
      throw quoteError ?? new Error("No se pudo insertar el presupuesto");
    }

    const quoteId: string = insertedQuote.id;

    const itemsToInsert = items.map((item) => ({
      quote_id: quoteId,
      code: item.code,
      unit: item.unit,
      description: item.description,
      quantity: item.quantity,
      sg: item.sg,
      unit_price: item.unitPrice,
    }));

    const { error: itemsError } = await supabase
      .from("quote_items")
      .insert(itemsToInsert);

    if (itemsError) {
      console.error("Error inserting quote items in Supabase", itemsError);
      throw itemsError;
    }

    setQuote((prev) => ({
      ...prev,
      ...quote,
      id: quoteId,
    }));

    return quoteId;
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
        saveQuote,
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
