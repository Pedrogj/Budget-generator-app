import {
  createContext,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import type {
  CompanyInfo,
  QuoteInfo,
  QuoteItem,
  ClientInfo,
  QuoteTemplateId,
  TaxIdLabel,
} from "../types/types";
import { supabase } from "../lib/supabaseClient";
import { useAuth } from "./AuthContext";
import { createCompanyLogoSignedUrl } from "../lib/companyLogoStorage";

const baseCompanySelect =
  "id,name,rif,tax_id_label,phone,address_lines,logo_url,logo_path,default_currency,iva_rate";
const companySelect = `${baseCompanySelect},brand_primary_color,brand_accent_color`;
const clientSelect = "id,name,rif,address,email,phone";
const quoteTemplateStorageKey = "presupuesta.quoteTemplate";
const defaultBrandPrimaryColor = "#0f172a";
const defaultBrandAccentColor = "#0284c7";

interface QuoteContextType {
  company: CompanyInfo;
  quote: QuoteInfo;
  items: QuoteItem[];
  clients: ClientInfo[];
  selectedTemplate: QuoteTemplateId;
  loading: boolean;

  setFromForm: (data: { quote: QuoteInfo; items: QuoteItem[] }) => void;
  setQuoteTemplate: (templateId: QuoteTemplateId) => void;
  updateCompany: (company: CompanyInfo) => Promise<void>;
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
  taxIdLabel: "RIF",
  phone: "",
  addressLines: "",
  logoUrl: "",
  logoPath: "",
  defaultCurrency: "USD",
  ivaRate: 16,
  brandPrimaryColor: defaultBrandPrimaryColor,
  brandAccentColor: defaultBrandAccentColor,
};

const initialQuote: QuoteInfo = {
  work: "",
  client: "",
  clientRif: "",
  clientAddress: "",
  issueDate: new Date().toISOString().slice(0, 10),
  clientId: "",
  currency: "USD",
  notes: "",
  readOnly: false,
};

const initialItems: QuoteItem[] = [
  {
    code: "",
    unit: "",
    description: "",
    quantity: 1,
    sg: "",
    unitPrice: 0,
  },
];

const initialClients: ClientInfo[] = [];

function getInitialQuoteTemplate(): QuoteTemplateId {
  if (typeof window === "undefined") return "professional";

  const stored = window.localStorage.getItem(quoteTemplateStorageKey);
  if (
    stored === "professional" ||
    stored === "classic" ||
    stored === "compact" ||
    stored === "bold" ||
    stored === "corporate"
  ) {
    return stored;
  }

  return "professional";
}

function isMissingBrandColorColumnsError(error: unknown) {
  if (!error || typeof error !== "object") return false;

  const values = Object.values(error as Record<string, unknown>)
    .filter((value): value is string => typeof value === "string")
    .join(" ");

  return (
    values.includes("brand_primary_color") ||
    values.includes("brand_accent_color")
  );
}

function getTaxIdLabel(value: string | null | undefined): TaxIdLabel {
  if (value === "RUT" || value === "DNI") return value;
  return "RIF";
}

type CompanyRow = {
  id: string;
  name: string;
  rif: string;
  tax_id_label?: string | null;
  phone: string;
  address_lines: string;
  logo_url?: string | null;
  logo_path?: string | null;
  default_currency?: "USD" | "CLP" | null;
  iva_rate?: number | null;
  brand_primary_color?: string | null;
  brand_accent_color?: string | null;
};

function mapCompanyRowToCompany(companyRow: CompanyRow): CompanyInfo {
  return {
    id: companyRow.id,
    name: companyRow.name,
    rif: companyRow.rif,
    taxIdLabel: getTaxIdLabel(companyRow.tax_id_label),
    phone: companyRow.phone,
    addressLines: companyRow.address_lines,
    logoUrl: companyRow.logo_url ?? undefined,
    logoPath: companyRow.logo_path ?? undefined,
    defaultCurrency: companyRow.default_currency ?? "USD",
    ivaRate: companyRow.iva_rate ?? 16,
    brandPrimaryColor:
      companyRow.brand_primary_color ?? defaultBrandPrimaryColor,
    brandAccentColor: companyRow.brand_accent_color ?? defaultBrandAccentColor,
  };
}

function getCompanyPayload(company: CompanyInfo) {
  return {
    name: company.name,
    rif: company.rif,
    tax_id_label: company.taxIdLabel ?? "RIF",
    phone: company.phone,
    address_lines: company.addressLines,
    logo_url: company.logoPath ? null : company.logoUrl ?? null,
    logo_path: company.logoPath ?? null,
    default_currency: company.defaultCurrency ?? "USD",
    iva_rate: company.ivaRate ?? 16,
    brand_primary_color: company.brandPrimaryColor ?? defaultBrandPrimaryColor,
    brand_accent_color: company.brandAccentColor ?? defaultBrandAccentColor,
  };
}

function withoutBrandColorColumns<T extends Record<string, unknown>>(
  payload: T,
) {
  const nextPayload = { ...payload };
  delete nextPayload.brand_primary_color;
  delete nextPayload.brand_accent_color;
  return nextPayload;
}

export const QuoteProvider = ({ children }: { children: ReactNode }) => {
  const { user, loading: authLoading } = useAuth();

  const [company, setCompany] = useState<CompanyInfo>(initialCompany);
  const [quote, setQuote] = useState<QuoteInfo>(initialQuote);
  const [items, setItems] = useState<QuoteItem[]>(initialItems);
  const [clients, setClients] = useState<ClientInfo[]>(initialClients);
  const [selectedTemplate, setSelectedTemplate] =
    useState<QuoteTemplateId>(getInitialQuoteTemplate);
  const [loading, setLoading] = useState(true);
  const loadedUserIdRef = useRef<string | null>(null);

  useEffect(() => {
    // 1) Esperamos a saber si hay usuario
    if (authLoading) {
      if (!loadedUserIdRef.current) {
        setLoading(true);
      }
      return;
    }

    // 2) Si NO hay usuario, reseteamos estado y no llamamos a Supabase
    if (!user) {
      loadedUserIdRef.current = null;
      setCompany(initialCompany);
      setClients(initialClients);
      setQuote(initialQuote);
      setItems(initialItems);
      setLoading(false);
      return;
    }

    if (loadedUserIdRef.current === user.id) {
      setLoading(false);
      return;
    }

    let isCurrentLoad = true;

    const loadFromSupabase = async () => {
      setLoading(true);

      try {
        // 3) Cargar (o crear) la company del usuario actual
        let companyResult = await supabase
          .from("companies")
          .select(companySelect)
          .eq("profile_id", user.id)
          .limit(1)
          .maybeSingle();

        if (
          companyResult.error &&
          isMissingBrandColorColumnsError(companyResult.error)
        ) {
          companyResult = await supabase
            .from("companies")
            .select(baseCompanySelect)
            .eq("profile_id", user.id)
            .limit(1)
            .maybeSingle();
        }

        const { data: companyRow, error: companyError } = companyResult;

        if (companyError) {
          console.error("Error loading company from Supabase", companyError);
        }

        let currentCompanyId: string | undefined;

        if (companyRow) {
          const mappedCompany = mapCompanyRowToCompany(companyRow);

          if (mappedCompany.logoPath) {
            try {
              mappedCompany.logoUrl = await createCompanyLogoSignedUrl(
                mappedCompany.logoPath,
              );
            } catch (logoError) {
              console.warn("Error creating company logo signed URL", logoError);
            }
          }

          if (isCurrentLoad) {
            setCompany(mappedCompany);
          }
          currentCompanyId = companyRow.id;
        } else {
          // Si el usuario no tiene empresa, creamos una vacía ligada a su profile
          const initialCompanyPayload = {
            profile_id: user.id,
            ...getCompanyPayload({
              ...initialCompany,
              logoUrl: undefined,
              logoPath: undefined,
            }),
          };
          let insertResult = await supabase
            .from("companies")
            .insert(initialCompanyPayload)
            .select(companySelect)
            .single();

          if (
            insertResult.error &&
            isMissingBrandColorColumnsError(insertResult.error)
          ) {
            insertResult = await supabase
              .from("companies")
              .insert(withoutBrandColorColumns(initialCompanyPayload))
              .select(baseCompanySelect)
              .single();
          }

          const { data: inserted, error: insertError } = insertResult;

          if (insertError) {
            console.error("Error inserting initial company", insertError);
          } else if (inserted) {
            if (isCurrentLoad) {
              setCompany(mapCompanyRowToCompany(inserted));
            }
            currentCompanyId = inserted.id;
          }
        }

        // 4) Si no tenemos companyId, no seguimos
        if (!currentCompanyId) return;

        // 5) Cargar clientes SOLO de esa company
        const { data: clientsRows, error: clientsError } = await supabase
          .from("clients")
          .select(clientSelect)
          .eq("company_id", currentCompanyId);

        if (clientsError) {
          console.error("Error loading clients", clientsError);
        } else if (clientsRows) {
          if (isCurrentLoad) {
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
        }
      } catch (err) {
        console.error("Unexpected error loading data from Supabase", err);
      } finally {
        if (isCurrentLoad) {
          loadedUserIdRef.current = user.id;
          setLoading(false);
        }
      }
    };

    loadFromSupabase();

    return () => {
      isCurrentLoad = false;
    };
  }, [authLoading, user?.id]);

  const setFromForm: QuoteContextType["setFromForm"] = (data) => {
    setQuote(data.quote);
    setItems(data.items);
  };

  const setQuoteTemplate: QuoteContextType["setQuoteTemplate"] = (
    templateId,
  ) => {
    setSelectedTemplate(templateId);
    window.localStorage.setItem(quoteTemplateStorageKey, templateId);
  };

  const updateCompany: QuoteContextType["updateCompany"] = async (
    newCompany,
  ) => {
    if (!user) {
      throw new Error("Debes iniciar sesión para actualizar la empresa");
    }

    const merged: CompanyInfo = {
      ...company,
      ...newCompany,
      id: company.id,
    };

    const isSame =
      company.name === merged.name &&
      company.rif === merged.rif &&
      company.taxIdLabel === merged.taxIdLabel &&
      company.phone === merged.phone &&
      company.addressLines === merged.addressLines &&
      company.logoUrl === merged.logoUrl &&
      company.logoPath === merged.logoPath &&
      company.defaultCurrency === merged.defaultCurrency &&
      company.ivaRate === merged.ivaRate &&
      company.brandPrimaryColor === merged.brandPrimaryColor &&
      company.brandAccentColor === merged.brandAccentColor;

    if (isSame) return;

    try {
      const companyPayload = getCompanyPayload(merged);

      if (company.id) {
        // UPDATE
        let updateResult = await supabase
          .from("companies")
          .update(companyPayload)
          .eq("id", company.id)
          .eq("profile_id", user.id);

        if (
          updateResult.error &&
          isMissingBrandColorColumnsError(updateResult.error)
        ) {
          updateResult = await supabase
            .from("companies")
            .update(withoutBrandColorColumns(companyPayload))
            .eq("id", company.id)
            .eq("profile_id", user.id);
        }

        const { error } = updateResult;

        if (error) {
          console.error("Error updating company in Supabase", error);
          throw error;
        }
      } else {
        let insertResult = await supabase
          .from("companies")
          .insert({
            profile_id: user.id,
            ...companyPayload,
          })
          .select(companySelect)
          .single();

        if (
          insertResult.error &&
          isMissingBrandColorColumnsError(insertResult.error)
        ) {
          insertResult = await supabase
            .from("companies")
            .insert({
              profile_id: user.id,
              ...withoutBrandColorColumns(companyPayload),
            })
            .select(baseCompanySelect)
            .single();
        }

        const { data: inserted, error } = insertResult;

        if (error) {
          console.error("Error inserting company in Supabase", error);
          throw error;
        } else if (inserted) {
          merged.id = inserted.id;
        }
      }
    } catch (err) {
      console.error("Unexpected error updating company in Supabase", err);
      throw err;
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
          email: data.email || null,
          phone: data.phone || null,
        })
        .eq("id", id)
        .select(clientSelect)
        .single();

      if (error) {
        console.error("Error updating client in Supabase", error);
        throw error;
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
      throw new Error("La empresa aún no está lista para agregar clientes");
    }

    try {
      const { data: inserted, error } = await supabase
        .from("clients")
        .insert({
          company_id: company.id,
          name: data.name,
          rif: data.rif,
          address: data.address,
          email: data.email || null,
          phone: data.phone || null,
        })
        .select(clientSelect)
        .single();

      if (error) {
        console.error("Error inserting client in Supabase", error);
        throw error;
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
        throw error;
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

    const subtotal = items.reduce(
      (sum, item) => sum + Number(item.quantity || 0) * Number(item.unitPrice || 0),
      0,
    );
    const ivaRate = Number(company.ivaRate ?? 16);
    const iva = subtotal * (ivaRate / 100);
    const total = subtotal + iva;

    const { data: insertedQuote, error: quoteError } = await supabase
      .from("quotes")
      .insert({
        company_id: company.id,
        client_id: quote.clientId || null,
        work: quote.work,
        issue_date: quote.issueDate,
        currency: quote.currency,
        notes: quote.notes?.trim() || null,
        iva_rate: ivaRate,
        subtotal,
        iva,
        total,
        client_name: quote.client,
        client_rif: quote.clientRif,
        client_address: quote.clientAddress,
      })
      .select("id")
      .single();

    if (quoteError || !insertedQuote) {
      console.error("Error inserting quote in Supabase", quoteError);
      throw quoteError ?? new Error("No se pudo insertar el presupuesto");
    }

    const quoteId: string = insertedQuote.id;

    const itemsToInsert = items.map((item) => ({
      quote_id: quoteId,
      code: item.code.trim(),
      unit: item.unit.trim(),
      description: item.description.trim(),
      quantity: item.quantity,
      sg: item.sg.trim(),
      unit_price: item.unitPrice,
    }));

    const { error: itemsError } = await supabase
      .from("quote_items")
      .insert(itemsToInsert);

    if (itemsError) {
      console.error("Error inserting quote items in Supabase", itemsError);
      await supabase.from("quotes").delete().eq("id", quoteId);
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
        selectedTemplate,
        loading,
        setFromForm,
        setQuoteTemplate,
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
