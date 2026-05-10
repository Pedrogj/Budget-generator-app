import { render, screen, within } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { QuotePreviewPage } from "./QuotePreviewPage";
import { useQuote } from "../../context/QuoteContext";

vi.mock("../../context/QuoteContext", () => ({
  useQuote: vi.fn(),
}));

vi.mock("@react-pdf/renderer", () => ({
  PDFViewer: ({ children, className }: { children: React.ReactNode; className?: string }) => (
    <div className={className} data-testid="pdf-viewer">
      {children}
    </div>
  ),
  PDFDownloadLink: ({
    children,
    className,
    fileName,
  }: {
    children: (state: { loading: boolean }) => React.ReactNode;
    className?: string;
    fileName: string;
  }) => (
    <a className={className} data-filename={fileName} href="/mock.pdf">
      {children({ loading: false })}
    </a>
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

const mockedUseQuote = vi.mocked(useQuote);

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
  setFromForm: vi.fn(),
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
    expect(within(summary).getByText("US$232,00")).toBeInTheDocument();
    expect(screen.getByText("Nota personalizada")).toBeInTheDocument();
    expect(screen.getByText("Vigencia de 15 días")).toBeInTheDocument();
    expect(screen.getByTestId("pdf-viewer")).toBeInTheDocument();
  });

  it("uses quote data to build the download filename", () => {
    renderQuotePreviewPage();

    expect(screen.getAllByRole("link", { name: /descargar pdf/i })[0]).toHaveAttribute(
      "data-filename",
      "presupuesto-cliente-agil-2026-05-10.pdf",
    );
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
