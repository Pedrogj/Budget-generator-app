import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import { QuoteTemplatesPage } from "./QuoteTemplatesPage";
import { useQuote } from "../../context/QuoteContext";

vi.mock("../../context/QuoteContext", () => ({
  useQuote: vi.fn(),
}));

const mockedUseQuote = vi.mocked(useQuote);

function renderQuoteTemplatesPage(overrides = {}) {
  const setQuoteTemplate = vi.fn();

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
      work: "Instalación",
      client: "Cliente Uno",
      clientRif: "RIF-1",
      clientAddress: "Calle 1",
      issueDate: "2026-05-10",
      currency: "USD",
    },
    items: [
      {
        code: "MAT-1",
        unit: "UND",
        description: "Tablero",
        quantity: 1,
        sg: "",
        unitPrice: 100,
      },
    ],
    clients: [],
    selectedTemplate: "professional",
    setQuoteTemplate,
    setFromForm: vi.fn(),
    updateCompany: vi.fn(),
    addClient: vi.fn(),
    removeClient: vi.fn(),
    updateClient: vi.fn(),
    saveQuote: vi.fn(),
    ...overrides,
  });

  const view = render(
    <MemoryRouter>
      <QuoteTemplatesPage />
    </MemoryRouter>,
  );

  return { ...view, setQuoteTemplate };
}

describe("QuoteTemplatesPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders the quote template catalog", () => {
    renderQuoteTemplatesPage();

    expect(screen.getByRole("heading", { name: /modelos de presupuesto/i })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: /profesional/i })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: /clásico/i })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: /compacto/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /seleccionado/i })).toHaveAttribute(
      "aria-pressed",
      "true",
    );
  });

  it("selects a template from the catalog", async () => {
    const user = userEvent.setup();
    const { setQuoteTemplate } = renderQuoteTemplatesPage();

    await user.click(screen.getAllByRole("button", { name: /usar modelo/i })[0]);

    expect(setQuoteTemplate).toHaveBeenCalledWith("classic");
  });

  it("hides the preview shortcut when there is no prepared quote", () => {
    renderQuoteTemplatesPage({
      quote: {
        work: "",
        client: "",
        clientRif: "",
        clientAddress: "",
        issueDate: "2026-05-10",
        currency: "USD",
      },
      items: [],
    });

    expect(screen.queryByRole("link", { name: /ver presupuesto/i })).not.toBeInTheDocument();
    expect(screen.getByRole("link", { name: /nuevo presupuesto/i })).toHaveAttribute(
      "href",
      "/quotes/new",
    );
  });
});
