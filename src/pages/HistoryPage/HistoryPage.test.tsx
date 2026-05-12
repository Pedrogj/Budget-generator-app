import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import Swal from "sweetalert2";
import { HistoryPage } from "./HistoryPage";
import { useQuote } from "../../context/QuoteContext";
import { supabase } from "../../lib/supabaseClient";
import {
  createQuotePdfPreviewUrl,
  createQuotePdfSignedUrl,
  removeQuotePdf,
} from "../../lib/quotePdfStorage";

vi.mock("../../context/QuoteContext", () => ({
  useQuote: vi.fn(),
}));

vi.mock("../../lib/supabaseClient", () => ({
  supabase: {
    from: vi.fn(),
  },
}));

vi.mock("sweetalert2", () => ({
  default: {
    fire: vi.fn(),
  },
}));

vi.mock("@react-pdf/renderer", () => ({
  pdf: vi.fn(() => ({
    toBlob: vi.fn().mockResolvedValue(new Blob(["pdf"], { type: "application/pdf" })),
  })),
  Document: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  Page: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  Text: ({ children }: { children: React.ReactNode }) => <span>{children}</span>,
  View: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  Image: () => <img alt="" />,
  StyleSheet: {
    create: (styles: unknown) => styles,
  },
}));

vi.mock("../../lib/quotePdfStorage", () => ({
  createQuotePdfPreviewUrl: vi.fn().mockResolvedValue("https://signed.test/preview"),
  createQuotePdfSignedUrl: vi.fn().mockResolvedValue("https://signed.test/pdf"),
  removeQuotePdf: vi.fn().mockResolvedValue(undefined),
  uploadQuotePdf: vi.fn().mockResolvedValue({
    path: "company-1/quote-1/presupuesto.pdf",
    generatedAt: "2026-05-11T12:00:00.000Z",
    templateId: "professional",
  }),
}));

const mockedUseQuote = vi.mocked(useQuote);
const mockedSupabaseFrom = vi.mocked(supabase.from);
const mockedSwal = vi.mocked(Swal.fire);
const mockedCreateQuotePdfPreviewUrl = vi.mocked(createQuotePdfPreviewUrl);
const mockedCreateQuotePdfSignedUrl = vi.mocked(createQuotePdfSignedUrl);
const mockedRemoveQuotePdf = vi.mocked(removeQuotePdf);

const quoteRows = [
  {
    id: "quote-1",
    work: "Instalación eléctrica",
    client_name: "Cliente Uno",
    client_rif: "RIF-1",
    client_address: "Calle 1",
    issue_date: "2026-05-10",
    currency: "USD",
    notes: "Nota guardada",
    total: 232,
    pdf_path: "user-1/company-1/quote-1/presupuesto-professional.pdf",
    pdf_template_id: "professional",
    pdf_generated_at: "2026-05-11T12:00:00Z",
    created_at: "2026-05-10T12:00:00Z",
  },
];

function mockQuotesQuery(data = quoteRows, error = null) {
  const order = vi.fn().mockResolvedValue({ data, error });
  const eq = vi.fn(() => ({ order }));
  const select = vi.fn(() => ({ eq }));

  return { select, eq, order };
}

function mockDeleteQuery(error: unknown = null) {
  const eqSecond = vi.fn().mockResolvedValue({ error });
  const eqFirst = vi.fn(() => ({ eq: eqSecond }));
  const deleteFn = vi.fn(() => ({ eq: eqFirst }));

  return { delete: deleteFn, eqFirst, eqSecond };
}

function renderHistoryPage(overrides = {}) {
  const setFromForm = vi.fn();

  mockedUseQuote.mockReturnValue({
    company: {
      id: "company-1",
      name: "ACME",
      rif: "J-1",
      phone: "+56 9",
      addressLines: "Calle 1",
      defaultCurrency: "USD",
      ivaRate: 16,
    },
    quote: {
      work: "",
      client: "",
      clientRif: "",
      clientAddress: "",
      issueDate: "2026-05-10",
      currency: "USD",
    },
    items: [],
    clients: [],
    selectedTemplate: "professional",
    setFromForm,
    setQuoteTemplate: vi.fn(),
    updateCompany: vi.fn(),
    addClient: vi.fn(),
    removeClient: vi.fn(),
    updateClient: vi.fn(),
    saveQuote: vi.fn(),
    ...overrides,
  });

  const view = render(
    <MemoryRouter>
      <Routes>
        <Route path="/" element={<HistoryPage />} />
        <Route path="/quotes/preview" element={<p>Preview route</p>} />
        <Route path="/quotes/new" element={<p>New quote route</p>} />
      </Routes>
    </MemoryRouter>,
  );

  return { ...view, setFromForm };
}

describe("HistoryPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockedSupabaseFrom.mockReset();
    mockedCreateQuotePdfPreviewUrl.mockResolvedValue("https://signed.test/preview");
    mockedCreateQuotePdfSignedUrl.mockResolvedValue("https://signed.test/pdf");
    mockedRemoveQuotePdf.mockResolvedValue(undefined);
    mockedSwal.mockResolvedValue({ isConfirmed: true } as Awaited<
      ReturnType<typeof Swal.fire>
    >);
  });

  it("loads saved quotes and exposes a PDF export", async () => {
    const user = userEvent.setup();
    mockedSupabaseFrom.mockReturnValueOnce(mockQuotesQuery() as never);

    renderHistoryPage();

    expect(await screen.findByText("Cliente Uno")).toBeInTheDocument();
    expect(screen.getByText("Instalación eléctrica")).toBeInTheDocument();
    expect(screen.getAllByText("US$232,00").length).toBeGreaterThan(0);
    await user.click(screen.getByRole("button", { name: /exportar pdf/i }));

    await waitFor(() => {
      expect(mockedCreateQuotePdfSignedUrl).toHaveBeenCalledWith(
        "user-1/company-1/quote-1/presupuesto-professional.pdf",
        "presupuesto-cliente-uno-2026-05-10.pdf",
      );
    });
    expect(mockedSupabaseFrom).toHaveBeenCalledWith("quotes");
  });

  it("uses a compact quotes select without trailing commas", async () => {
    const quotesQuery = mockQuotesQuery();
    mockedSupabaseFrom.mockReturnValue(quotesQuery as never);

    renderHistoryPage();

    await screen.findByText("Cliente Uno");

    expect(quotesQuery.select).toHaveBeenCalledWith(
      "id,work,client_name,client_rif,client_address,issue_date,currency,notes,total,pdf_path,pdf_template_id,pdf_generated_at,created_at",
    );
  });

  it("loads a saved quote into preview state and navigates to preview", async () => {
    const user = userEvent.setup();
    const setFromForm = vi.fn();
    mockedSupabaseFrom.mockReturnValueOnce(mockQuotesQuery() as never);

    renderHistoryPage({ setFromForm });

    await screen.findByText("Cliente Uno");
    await user.click(screen.getByRole("button", { name: /previsualizar/i }));

    expect(setFromForm).toHaveBeenCalledWith({
      quote: expect.objectContaining({
        id: "quote-1",
        client: "Cliente Uno",
        notes: "Nota guardada",
        readOnly: true,
        pdfPreviewUrl: "https://signed.test/preview",
      }),
      items: [],
    });
    expect(await screen.findByText("Preview route")).toBeInTheDocument();
  });

  it("falls back to deleting quote items when the quote has dependent rows", async () => {
    const user = userEvent.setup();
    const quotesQuery = mockQuotesQuery();
    const quoteDeleteWithForeignKeyError = mockDeleteQuery({
      code: "23503",
      message: "foreign key violation",
    });
    const itemsDelete = mockDeleteQuery();
    const quoteDeleteRetry = mockDeleteQuery();

    mockedSupabaseFrom
      .mockReturnValueOnce(quotesQuery as never)
      .mockReturnValueOnce(quoteDeleteWithForeignKeyError as never)
      .mockReturnValueOnce(itemsDelete as never)
      .mockReturnValueOnce(quoteDeleteRetry as never);

    renderHistoryPage();

    await screen.findByText("Cliente Uno");
    await user.click(screen.getByRole("button", { name: /eliminar/i }));

    await waitFor(() => {
      expect(mockedRemoveQuotePdf).toHaveBeenCalledWith(
        "user-1/company-1/quote-1/presupuesto-professional.pdf",
      );
      expect(itemsDelete.delete).toHaveBeenCalled();
      expect(quoteDeleteRetry.delete).toHaveBeenCalled();
    });

    expect(screen.queryByText("Cliente Uno")).not.toBeInTheDocument();
  });

  it("shows an empty state when there are no saved quotes", async () => {
    mockedSupabaseFrom.mockReturnValue(mockQuotesQuery([]) as never);

    renderHistoryPage();

    expect(await screen.findByText(/no hay presupuestos guardados/i)).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /crear presupuesto/i })).toHaveAttribute(
      "href",
      "/quotes/new",
    );
  });
});
