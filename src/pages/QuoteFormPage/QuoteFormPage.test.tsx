import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import Swal from "sweetalert2";
import { pdf } from "@react-pdf/renderer";
import { QuoteFormPage } from "./QuoteFormPage";
import { useQuote } from "../../context/QuoteContext";
import { uploadQuotePdf } from "../../lib/quotePdfStorage";

vi.mock("../../context/QuoteContext", () => ({
  useQuote: vi.fn(),
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
  uploadQuotePdf: vi.fn().mockImplementation(({ templateId }) => ({
    path: `company-1/quote-1/presupuesto-${templateId}.pdf`,
    generatedAt: "2026-05-11T12:00:00.000Z",
    templateId,
  })),
}));

vi.mock("sweetalert2", () => ({
  default: {
    fire: vi.fn(),
  },
}));

const mockedUseQuote = vi.mocked(useQuote);
const mockedSwal = vi.mocked(Swal.fire);
const mockedPdf = vi.mocked(pdf);
const mockedUploadQuotePdf = vi.mocked(uploadQuotePdf);

const baseQuoteContext = {
  company: {
    id: "company-1",
    name: "ACME",
    rif: "J-1",
    taxIdLabel: "RIF" as const,
    phone: "",
    addressLines: "",
    defaultCurrency: "USD" as const,
    ivaRate: 16,
  },
  quote: {
    work: "",
    client: "",
    clientRif: "",
    clientAddress: "",
    issueDate: "2026-05-10",
    clientId: "",
    currency: "USD" as const,
    notes: "",
  },
  items: [
    {
      code: "",
      unit: "",
      description: "",
      quantity: 1,
      sg: "",
      unitPrice: 0,
    },
  ],
  clients: [
    {
      id: "client-1",
      name: "Cliente Uno",
      rif: "RIF-1",
      address: "Calle 1",
    },
  ],
  selectedTemplate: "professional" as const,
  setFromForm: vi.fn(),
  setQuoteTemplate: vi.fn(),
  updateCompany: vi.fn(),
  addClient: vi.fn(),
  removeClient: vi.fn(),
  updateClient: vi.fn(),
  saveQuote: vi.fn().mockResolvedValue("quote-1"),
};

function renderQuoteFormPage(overrides = {}) {
  mockedUseQuote.mockReturnValue({
    ...baseQuoteContext,
    ...overrides,
  });

  return render(
    <MemoryRouter initialEntries={["/quotes/new"]}>
      <Routes>
        <Route path="/quotes/new" element={<QuoteFormPage />} />
        <Route path="/quotes/preview" element={<p>Preview route</p>} />
        <Route path="/clients" element={<p>Clients route</p>} />
      </Routes>
    </MemoryRouter>
  );
}

async function fillValidQuote(user: ReturnType<typeof userEvent.setup>) {
  await user.type(screen.getByLabelText(/tipo de obra/i), "Remodelación");
  await user.selectOptions(
    screen.getByLabelText(/seleccionar cliente guardado/i),
    "client-1"
  );
  await user.type(screen.getByLabelText(/descripción/i), "Instalación");
  await user.clear(screen.getByLabelText(/p\/unit\./i));
  await user.type(screen.getByLabelText(/p\/unit\./i), "100");
}

describe("QuoteFormPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockedSwal.mockResolvedValue({ isConfirmed: true } as Awaited<
      ReturnType<typeof Swal.fire>
    >);
  });

  it("renders the quote form and live totals", async () => {
    const user = userEvent.setup();

    renderQuoteFormPage();

    expect(
      screen.getByRole("heading", { level: 1, name: /nuevo presupuesto/i })
    ).toBeInTheDocument();
    expect(screen.getByText(/total estimado/i)).toBeInTheDocument();

    await user.clear(screen.getByLabelText(/p\/unit\./i));
    await user.type(screen.getByLabelText(/p\/unit\./i), "100");

    expect(screen.getAllByText("US$116,00").length).toBeGreaterThan(0);
  });

  it("selects a saved client and fills readonly client fields", async () => {
    const user = userEvent.setup();

    renderQuoteFormPage();

    await user.selectOptions(
      screen.getByLabelText(/seleccionar cliente guardado/i),
      "client-1"
    );

    expect(screen.getByLabelText(/^cliente$/i)).toHaveValue("Cliente Uno");
    expect(screen.getByLabelText(/rif cliente/i)).toHaveValue("RIF-1");
    expect(screen.getByLabelText(/dirección cliente/i)).toHaveValue("Calle 1");
  });

  it("validates required data before saving", async () => {
    const user = userEvent.setup();
    const saveQuote = vi.fn();

    renderQuoteFormPage({ saveQuote });

    await user.click(
      screen.getByRole("button", { name: /guardar y ver vista previa/i })
    );

    expect(await screen.findByText(/describe el tipo de trabajo/i)).toBeVisible();
    expect(screen.getAllByText(/^Selecciona un cliente$/).length).toBeGreaterThan(
      0
    );
    expect(screen.getByText(/la descripción es requerida/i)).toBeVisible();
    expect(saveQuote).not.toHaveBeenCalled();
  });

  it("adds and removes quote items", async () => {
    const user = userEvent.setup();

    renderQuoteFormPage();

    await user.click(screen.getByRole("button", { name: /\+ agregar ítem/i }));
    expect(screen.getAllByLabelText(/descripción/i)).toHaveLength(2);

    await user.click(screen.getByRole("button", { name: /eliminar ítem 2/i }));
    expect(screen.getAllByLabelText(/descripción/i)).toHaveLength(1);
  });

  it("saves a quote, updates local state after success, and navigates", async () => {
    const user = userEvent.setup();
    const saveQuote = vi.fn().mockResolvedValue("quote-1");
    const setFromForm = vi.fn();

    renderQuoteFormPage({ saveQuote, setFromForm });

    await fillValidQuote(user);
    await user.click(
      screen.getByRole("button", { name: /guardar y ver vista previa/i })
    );

    expect(saveQuote).toHaveBeenCalledWith(
      expect.objectContaining({
        quote: expect.objectContaining({
          work: "Remodelación",
          client: "Cliente Uno",
          clientRif: "RIF-1",
          clientAddress: "Calle 1",
          clientId: "client-1",
          currency: "USD",
          notes: "",
        }),
        items: [
          expect.objectContaining({
            code: "",
            unit: "",
            description: "Instalación",
            sg: "",
          }),
        ],
      })
    );
    expect(await screen.findByText("Preview route")).toBeInTheDocument();
    expect(setFromForm).toHaveBeenCalledWith(
      expect.objectContaining({
        quote: expect.objectContaining({
          id: "quote-1",
          pdfTemplateId: "professional",
        }),
      })
    );
  });

  it("generates and stores the PDF with the selected template", async () => {
    const user = userEvent.setup();
    const saveQuote = vi.fn().mockResolvedValue("quote-1");

    renderQuoteFormPage({ saveQuote, selectedTemplate: "bold" });

    await fillValidQuote(user);
    await user.click(
      screen.getByRole("button", { name: /guardar y ver vista previa/i })
    );

    expect(mockedPdf).toHaveBeenCalledWith(
      expect.objectContaining({
        props: expect.objectContaining({
          templateId: "bold",
        }),
      })
    );
    expect(mockedUploadQuotePdf).toHaveBeenCalledWith(
      expect.objectContaining({
        templateId: "bold",
      })
    );
  });

  it("saves a custom optional note when provided", async () => {
    const user = userEvent.setup();
    const saveQuote = vi.fn().mockResolvedValue("quote-1");

    renderQuoteFormPage({ saveQuote });

    await fillValidQuote(user);
    await user.type(
      screen.getByLabelText(/nota del presupuesto/i),
      "Pago 50% inicial y 50% contra entrega."
    );
    await user.click(
      screen.getByRole("button", { name: /guardar y ver vista previa/i })
    );

    expect(saveQuote).toHaveBeenCalledWith(
      expect.objectContaining({
        quote: expect.objectContaining({
          notes: "Pago 50% inicial y 50% contra entrega.",
        }),
      })
    );
  });

  it("shows an error and does not update state when saving fails", async () => {
    const user = userEvent.setup();
    const saveQuote = vi.fn().mockRejectedValue(new Error("Fallo remoto"));
    const setFromForm = vi.fn();

    renderQuoteFormPage({ saveQuote, setFromForm });

    await fillValidQuote(user);
    await user.click(
      screen.getByRole("button", { name: /guardar y ver vista previa/i })
    );

    expect(setFromForm).not.toHaveBeenCalled();
    expect(mockedSwal).toHaveBeenCalledWith(
      expect.objectContaining({
        icon: "error",
        title: "Error al guardar",
        text: "Fallo remoto",
      })
    );
  });

  it("shows a clients link when there are no saved clients", () => {
    renderQuoteFormPage({ clients: [] });

    const message = screen.getByText(/aún no tienes clientes guardados/i);
    expect(message).toBeInTheDocument();
    expect(within(message).getByRole("link", { name: /agrega uno/i })).toHaveAttribute(
      "href",
      "/clients"
    );
  });
});
