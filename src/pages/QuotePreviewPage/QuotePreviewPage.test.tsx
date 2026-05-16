import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import { QuotePreviewPage } from "./QuotePreviewPage";
import { useQuote } from "../../context/QuoteContext";
import { createQuotePdfSignedUrl } from "../../lib/quotePdfStorage";

vi.mock("../../context/QuoteContext", () => ({
  useQuote: vi.fn(),
}));

vi.mock("@react-pdf/renderer", () => ({
  pdf: vi.fn(() => ({
    toBlob: vi.fn().mockResolvedValue(new Blob(["pdf"], { type: "application/pdf" })),
  })),
  PDFViewer: ({ children, className }: { children: React.ReactNode; className?: string }) => (
    <div className={className} data-testid="pdf-viewer">
      {children}
    </div>
  ),
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
  uploadQuotePdf: vi.fn().mockResolvedValue({
    path: "company-1/quote-1/presupuesto.pdf",
    generatedAt: "2026-05-11T12:00:00.000Z",
    templateId: "professional",
  }),
}));

const mockedUseQuote = vi.mocked(useQuote);
const mockedCreateQuotePdfSignedUrl = vi.mocked(createQuotePdfSignedUrl);

const baseQuoteContext = {
  company: {
    id: "company-1",
    name: "ACME",
    rif: "J-1",
    phone: "+56 9",
    addressLines: "Calle 1",
    defaultCurrency: "USD" as const,
    ivaRate: 16,
  },
  quote: {
    id: "quote-1",
    work: "Instalación eléctrica",
    client: "Cliente Ágil",
    clientRif: "RIF-1",
    clientAddress: "Calle 1",
    issueDate: "2026-05-10",
    clientId: "client-1",
    currency: "USD" as const,
    notes: "Nota personalizada\nVigencia de 15 días",
  },
  items: [
    {
      code: "MAT-1",
      unit: "UND",
      description: "Tablero eléctrico",
      quantity: 2,
      sg: "",
      unitPrice: 100,
    },
  ],
  clients: [],
  selectedTemplate: "professional" as const,
  setFromForm: vi.fn(),
  setQuoteTemplate: vi.fn(),
  updateCompany: vi.fn(),
  addClient: vi.fn(),
  removeClient: vi.fn(),
  updateClient: vi.fn(),
  saveQuote: vi.fn(),
};

function renderQuotePreviewPage(overrides = {}) {
  mockedUseQuote.mockReturnValue({
    ...baseQuoteContext,
    ...overrides,
  });

  return render(
    <MemoryRouter>
      <QuotePreviewPage />
    </MemoryRouter>,
  );
}

describe("QuotePreviewPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders a preview summary and the PDF viewer", () => {
    renderQuotePreviewPage();

    expect(
      screen.getByRole("heading", { level: 1, name: /vista previa del presupuesto/i }),
    ).toBeInTheDocument();
    const summary = screen.getByLabelText(/resumen del presupuesto/i);

    expect(within(summary).getByText("Cliente Ágil")).toBeInTheDocument();
    expect(within(summary).getByText("Instalación eléctrica")).toBeInTheDocument();
    expect(within(summary).getByText("Modelo aplicado")).toBeInTheDocument();
    expect(within(summary).getByText("Profesional")).toBeInTheDocument();
    expect(within(summary).getByText("US$232,00")).toBeInTheDocument();
    expect(screen.getByText("Nota personalizada")).toBeInTheDocument();
    expect(screen.getByText("Vigencia de 15 días")).toBeInTheDocument();
    expect(screen.getByTestId("pdf-viewer")).toBeInTheDocument();
  });

  it("uses quote data to build the download filename", () => {
    renderQuotePreviewPage();

    expect(screen.getAllByRole("button", { name: /descargar pdf/i })[0]).toBeInTheDocument();
  });

  it("does not allow editing when the preview comes from history", () => {
    renderQuotePreviewPage({
      quote: {
        ...baseQuoteContext.quote,
        readOnly: true,
      },
    });

    expect(screen.queryByRole("link", { name: /editar/i })).not.toBeInTheDocument();
    expect(screen.getByText(/pertenece al historial/i)).toBeInTheDocument();
  });

  it("renders a stored PDF preview without applying the current template", () => {
    renderQuotePreviewPage({
      quote: {
        ...baseQuoteContext.quote,
        readOnly: true,
        pdfTemplateId: "corporate",
        pdfPreviewUrl: "https://signed.test/preserved.pdf",
      },
      items: [],
      selectedTemplate: "compact",
    });

    const summary = screen.getByLabelText(/resumen del presupuesto/i);

    expect(screen.queryByTestId("pdf-viewer")).not.toBeInTheDocument();
    expect(within(summary).getByText("Modelo guardado")).toBeInTheDocument();
    expect(within(summary).getByText("Corporativo")).toBeInTheDocument();
    expect(screen.getByTitle(/pdf guardado del presupuesto/i)).toHaveAttribute(
      "src",
      "https://signed.test/preserved.pdf",
    );
    expect(screen.queryByRole("link", { name: /modelos/i })).not.toBeInTheDocument();
  });

  it("downloads stored history PDFs with a download signed URL", async () => {
    const user = userEvent.setup();

    renderQuotePreviewPage({
      quote: {
        ...baseQuoteContext.quote,
        readOnly: true,
        pdfPath: "user-1/company-1/quote-1/presupuesto-professional.pdf",
        pdfTemplateId: "professional",
        pdfPreviewUrl: "https://signed.test/preserved.pdf",
      },
      items: [],
    });

    await user.click(screen.getAllByRole("button", { name: /descargar pdf/i })[0]);

    expect(mockedCreateQuotePdfSignedUrl).toHaveBeenCalledWith(
      "user-1/company-1/quote-1/presupuesto-professional.pdf",
      "presupuesto-cliente-agil-2026-05-10.pdf",
    );
  });

  it("shows an empty state when no quote has been prepared", () => {
    renderQuotePreviewPage({
      quote: {
        ...baseQuoteContext.quote,
        work: "",
        client: "",
        clientRif: "",
        clientAddress: "",
      },
      items: [
        {
          ...baseQuoteContext.items[0],
          description: "",
          unitPrice: 0,
        },
      ],
    });

    expect(screen.getByText(/aún no hay un presupuesto listo/i)).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /crear presupuesto/i })).toHaveAttribute(
      "href",
      "/quotes/new",
    );
    expect(screen.queryByTestId("pdf-viewer")).not.toBeInTheDocument();
  });
});
