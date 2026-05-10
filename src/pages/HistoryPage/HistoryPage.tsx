import { useEffect, useMemo, useState } from "react";
import { PDFDownloadLink } from "@react-pdf/renderer";
import { Link, useNavigate } from "react-router-dom";
import Swal from "sweetalert2";
import { QuotePdfDocument } from "../../components/QuotePdfDocument";
import { useQuote } from "../../context/QuoteContext";
import { supabase } from "../../lib/supabaseClient";
import type { QuoteInfo, QuoteItem } from "../../types/types";

interface QuoteHistoryRecord {
  id: string;
  quote: QuoteInfo;
  items?: QuoteItem[];
  createdAt?: string;
  total?: number | null;
}

interface QuoteRow {
  id: string;
  work: string;
  client_name: string;
  client_rif: string;
  client_address: string;
  issue_date: string;
  currency: "USD" | "CLP";
  notes?: string | null;
  total?: number | string | null;
  created_at?: string;
}

interface QuoteItemRow {
  code: string | null;
  unit: string | null;
  description: string;
  quantity: number | string;
  sg: string | null;
  unit_price: number | string;
}

const quotesSelectWithNotes = [
  "id",
  "work",
  "client_name",
  "client_rif",
  "client_address",
  "issue_date",
  "currency",
  "notes",
  "total",
  "created_at",
].join(",");

const quotesSelectWithoutNotes = [
  "id",
  "work",
  "client_name",
  "client_rif",
  "client_address",
  "issue_date",
  "currency",
  "total",
  "created_at",
].join(",");

function formatMoney(value: number, currency: "USD" | "CLP") {
  return new Intl.NumberFormat("es-CL", {
    style: "currency",
    currency,
    maximumFractionDigits: currency === "CLP" ? 0 : 2,
  }).format(value);
}

function formatDate(value: string) {
  if (!value) return "Sin fecha";
  if (/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    const [year, month, day] = value.split("-");
    return `${day}/${month}/${year}`;
  }
  return value;
}

function toFileSlug(value: string) {
  const normalized = value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

  return normalized || "cliente";
}

function getErrorMessage(error: unknown) {
  if (error instanceof Error && error.message) return error.message;
  if (
    typeof error === "object" &&
    error !== null &&
    "message" in error &&
    typeof (error as { message?: unknown }).message === "string"
  ) {
    return (error as { message: string }).message;
  }
  return "No se pudo completar la operación. Intenta nuevamente.";
}

function mapQuoteRow(row: QuoteRow): QuoteHistoryRecord {
  return {
    id: row.id,
    createdAt: row.created_at,
    total: row.total === null || row.total === undefined ? null : Number(row.total),
      quote: {
        readOnly: false,
        id: row.id,
        work: row.work,
        client: row.client_name,
        clientRif: row.client_rif,
      clientAddress: row.client_address,
      issueDate: row.issue_date,
      currency: row.currency,
      notes: row.notes ?? "",
    },
  };
}

function mapQuoteItemRows(rows: QuoteItemRow[]): QuoteItem[] {
  return rows.map((item) => ({
    code: item.code ?? "NA",
    unit: item.unit ?? "NA",
    description: item.description,
    quantity: Number(item.quantity) || 0,
    sg: item.sg ?? "",
    unitPrice: Number(item.unit_price) || 0,
  }));
}

function isForeignKeyDeleteError(error: unknown) {
  return (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    (error as { code?: string }).code === "23503"
  );
}

async function fetchQuoteRows(companyId: string) {
  const baseQuery = (select: string) =>
    supabase
      .from("quotes")
      .select(select)
      .eq("company_id", companyId)
      .order("created_at", { ascending: false });

  const { data, error } = await baseQuery(quotesSelectWithNotes);

  if (!error) return data as unknown as QuoteRow[];

  if (error.message.toLowerCase().includes("notes")) {
    const fallback = await baseQuery(quotesSelectWithoutNotes);
    if (fallback.error) throw fallback.error;
    return fallback.data as unknown as QuoteRow[];
  }

  throw error;
}

async function fetchQuoteItems(quoteId: string) {
  const { data, error } = await supabase
    .from("quote_items")
    .select("code, unit, description, quantity, sg, unit_price")
    .eq("quote_id", quoteId);

  if (error) throw error;

  return mapQuoteItemRows((data ?? []) as unknown as QuoteItemRow[]);
}

export const HistoryPage = () => {
  const navigate = useNavigate();
  const { company, setFromForm } = useQuote();
  const [quotes, setQuotes] = useState<QuoteHistoryRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [exportingId, setExportingId] = useState<string | null>(null);
  const [loadingItemsId, setLoadingItemsId] = useState<string | null>(null);
  const [itemsByQuoteId, setItemsByQuoteId] = useState<Record<string, QuoteItem[]>>({});
  const isCompanyReady = !!company.id;

  useEffect(() => {
    if (!company.id) {
      setLoading(false);
      return;
    }

    let isMounted = true;

    const loadQuotes = async () => {
      setLoading(true);
      setErrorMessage(null);

      try {
        const rows = await fetchQuoteRows(company.id!);
        if (isMounted) {
          setQuotes(rows.map(mapQuoteRow));
        }
      } catch (error) {
        console.error("Error loading quote history", error);
        if (isMounted) {
          setErrorMessage(getErrorMessage(error));
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    void loadQuotes();

    return () => {
      isMounted = false;
    };
  }, [company.id]);

  const totalQuotes = quotes.length;
  const totalAmount = useMemo(() => {
    return quotes.reduce((sum, record) => {
      if (typeof record.total === "number" && Number.isFinite(record.total)) {
        return sum + record.total;
      }

      const items = record.items ?? itemsByQuoteId[record.id] ?? [];
      const subtotal = items.reduce(
        (itemSum, item) => itemSum + item.quantity * item.unitPrice,
        0,
      );
      const ivaRate = Number(company.ivaRate ?? 16);
      return sum + subtotal + subtotal * (ivaRate / 100);
    }, 0);
  }, [company.ivaRate, itemsByQuoteId, quotes]);

  const getQuoteItems = async (record: QuoteHistoryRecord) => {
    const cachedItems = record.items ?? itemsByQuoteId[record.id];
    if (cachedItems) return cachedItems;

    setLoadingItemsId(record.id);

    try {
      const items = await fetchQuoteItems(record.id);
      setItemsByQuoteId((prev) => ({
        ...prev,
        [record.id]: items,
      }));
      return items;
    } finally {
      setLoadingItemsId(null);
    }
  };

  const handleDelete = async (record: QuoteHistoryRecord) => {
    const result = await Swal.fire({
      title: "¿Eliminar presupuesto?",
      text: `Se eliminará el presupuesto de "${record.quote.client}". Esta acción no se puede deshacer.`,
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Sí, eliminar",
      cancelButtonText: "Cancelar",
      confirmButtonColor: "#ef4444",
      cancelButtonColor: "#6b7280",
    });

    if (!result.isConfirmed || !company.id) return;

    setDeletingId(record.id);

    try {
      const { error: quoteError } = await supabase
        .from("quotes")
        .delete()
        .eq("id", record.id)
        .eq("company_id", company.id);

      if (quoteError) {
        if (!isForeignKeyDeleteError(quoteError)) throw quoteError;

        const { error: itemsError } = await supabase
          .from("quote_items")
          .delete()
          .eq("quote_id", record.id);

        if (itemsError) throw itemsError;

        const { error: retryQuoteError } = await supabase
          .from("quotes")
          .delete()
          .eq("id", record.id)
          .eq("company_id", company.id);

        if (retryQuoteError) throw retryQuoteError;
      }

      setQuotes((prev) => prev.filter((quote) => quote.id !== record.id));

      await Swal.fire({
        icon: "success",
        title: "Presupuesto eliminado",
        timer: 1500,
        showConfirmButton: false,
      });
    } catch (error) {
      console.error("Error deleting quote", error);
      await Swal.fire({
        icon: "error",
        title: "No se pudo eliminar",
        text: getErrorMessage(error),
      });
    } finally {
      setDeletingId(null);
    }
  };

  const handlePreview = async (record: QuoteHistoryRecord) => {
    try {
      const items = await getQuoteItems(record);
      setFromForm({
        quote: {
          ...record.quote,
          readOnly: true,
        },
        items,
      });
      navigate("/quotes/preview");
    } catch (error) {
      console.error("Error loading quote items for preview", error);
      await Swal.fire({
        icon: "error",
        title: "No se pudo previsualizar",
        text: getErrorMessage(error),
      });
    }
  };

  return (
    <div className="page history-page">
      <div className="history-header">
        <div>
          <h1>Historial de presupuestos</h1>
          <p className="history-subtitle">
            Consulta presupuestos guardados, vuelve a exportarlos en PDF o
            elimina los que ya no necesites.
          </p>
        </div>
        <Link className="history-primary-action" to="/quotes/new">
          Nuevo presupuesto
        </Link>
      </div>

      <section className="history-summary" aria-label="Resumen del historial">
        <div>
          <span>Presupuestos</span>
          <strong>{totalQuotes}</strong>
        </div>
        <div>
          <span>Total estimado</span>
          <strong>{formatMoney(totalAmount, company.defaultCurrency ?? "USD")}</strong>
        </div>
      </section>

      {!isCompanyReady ? (
        <section className="history-empty">
          <strong>Cargando empresa</strong>
          <p>Espera un momento mientras preparamos tu historial.</p>
        </section>
      ) : loading ? (
        <section className="history-empty">
          <strong>Cargando historial</strong>
          <p>Estamos buscando tus presupuestos guardados.</p>
        </section>
      ) : errorMessage ? (
        <section className="history-empty">
          <strong>No se pudo cargar el historial</strong>
          <p>{errorMessage}</p>
        </section>
      ) : quotes.length === 0 ? (
        <section className="history-empty">
          <strong>No hay presupuestos guardados.</strong>
          <p>Crea tu primer presupuesto para verlo aquí.</p>
          <Link className="history-primary-action" to="/quotes/new">
            Crear presupuesto
          </Link>
        </section>
      ) : (
        <section className="history-list" aria-label="Presupuestos guardados">
          {quotes.map((record) => {
            const items = record.items ?? itemsByQuoteId[record.id] ?? [];
            const subtotal = items.reduce(
              (sum, item) => sum + item.quantity * item.unitPrice,
              0,
            );
            const ivaRate = Number(company.ivaRate ?? 16);
            const hasLoadedItems = items.length > 0;
            const total =
              typeof record.total === "number" && Number.isFinite(record.total)
                ? record.total
                : hasLoadedItems
                  ? subtotal + subtotal * (ivaRate / 100)
                  : null;
            const fileName = `presupuesto-${toFileSlug(record.quote.client)}-${
              record.quote.issueDate || "sin-fecha"
            }.pdf`;

            return (
              <article className="history-item" key={record.id}>
                <div className="history-item-main">
                  <div className="history-item-title">
                    <strong>{record.quote.client}</strong>
                    <span>{formatDate(record.quote.issueDate)}</span>
                  </div>
                  <p>{record.quote.work}</p>
                  <div className="history-item-meta">
                    <span>
                      {hasLoadedItems ? `${items.length} ítem(s)` : "Ítems bajo demanda"}
                    </span>
                    <span>{record.quote.currency}</span>
                    <span>
                      {typeof total === "number" && Number.isFinite(total)
                        ? formatMoney(total, record.quote.currency)
                        : "Total pendiente"}
                    </span>
                  </div>
                </div>

                <div className="history-item-actions">
                  <button
                    type="button"
                    onClick={() => void handlePreview(record)}
                    disabled={loadingItemsId === record.id}
                  >
                    {loadingItemsId === record.id ? "Cargando..." : "Previsualizar"}
                  </button>
                  {exportingId === record.id ? (
                    <PDFDownloadLink
                      className="history-secondary-action"
                      document={
                        <QuotePdfDocument
                          company={company}
                          quote={record.quote}
                          items={items}
                        />
                      }
                      fileName={fileName}
                    >
                      {({ loading: pdfLoading }) =>
                        pdfLoading ? "Generando..." : "Descargar PDF"
                      }
                    </PDFDownloadLink>
                  ) : (
                    <button
                      type="button"
                      onClick={() => void getQuoteItems(record).then(() => setExportingId(record.id))}
                      disabled={loadingItemsId === record.id}
                    >
                      {loadingItemsId === record.id ? "Cargando..." : "Exportar PDF"}
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => void handleDelete(record)}
                    disabled={deletingId === record.id}
                  >
                    {deletingId === record.id ? "Eliminando..." : "Eliminar"}
                  </button>
                </div>
              </article>
            );
          })}
        </section>
      )}
    </div>
  );
};
