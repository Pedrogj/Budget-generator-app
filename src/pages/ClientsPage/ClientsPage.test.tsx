import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import Swal from "sweetalert2";
import { ClientsPage } from "./ClientsPage";
import { useQuote } from "../../context/QuoteContext";

vi.mock("../../context/QuoteContext", () => ({
  useQuote: vi.fn(),
}));

vi.mock("sweetalert2", () => ({
  default: {
    fire: vi.fn(),
  },
}));

const mockedUseQuote = vi.mocked(useQuote);
const mockedSwal = vi.mocked(Swal.fire);

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
    currency: "USD" as const,
  },
  items: [],
  clients: [
    {
      id: "client-1",
      name: "Cliente Uno",
      rif: "RIF-1",
      address: "Calle 1",
      email: "uno@test.com",
      phone: "+56 1",
    },
    {
      id: "client-2",
      name: "Cliente Dos",
      rif: "RIF-2",
      address: "Calle 2",
      email: "dos@test.com",
      phone: "+56 2",
    },
  ],
  selectedTemplate: "professional" as const,
  setFromForm: vi.fn(),
  setQuoteTemplate: vi.fn(),
  updateCompany: vi.fn(),
  addClient: vi.fn().mockResolvedValue(undefined),
  removeClient: vi.fn().mockResolvedValue(undefined),
  updateClient: vi.fn().mockResolvedValue(undefined),
  saveQuote: vi.fn(),
};

function renderClientsPage(overrides = {}) {
  mockedUseQuote.mockReturnValue({
    ...baseQuoteContext,
    ...overrides,
  });

  return render(<ClientsPage />);
}

describe("ClientsPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockedSwal.mockResolvedValue({ isConfirmed: true } as Awaited<
      ReturnType<typeof Swal.fire>
    >);
  });

  it("renders the client form and list", () => {
    renderClientsPage();

    expect(
      screen.getByRole("heading", { level: 1, name: /clientes/i })
    ).toBeInTheDocument();
    expect(screen.getByText("2 clientes")).toBeInTheDocument();
    expect(screen.getByLabelText(/^nombre$/i)).toBeInTheDocument();
    expect(screen.getByText("Cliente Uno")).toBeInTheDocument();
    expect(screen.getByText("Cliente Dos")).toBeInTheDocument();
  });

  it("validates required fields before adding a client", async () => {
    const user = userEvent.setup();

    renderClientsPage();

    await user.click(screen.getByRole("button", { name: /agregar cliente/i }));

    expect(await screen.findByText(/ingresa al menos 2 caracteres/i)).toBeVisible();
    expect(
      screen.getByText(/ingresa el documento fiscal del cliente/i),
    ).toBeVisible();
    expect(screen.getByText(/ingresa la dirección del cliente/i)).toBeVisible();
    expect(baseQuoteContext.addClient).not.toHaveBeenCalled();
  });

  it("adds a client with optional contact fields", async () => {
    const user = userEvent.setup();
    const addClient = vi.fn().mockResolvedValue(undefined);

    renderClientsPage({ addClient });

    await user.type(screen.getByLabelText(/^nombre$/i), "Cliente Tres");
    await user.type(screen.getByLabelText(/^rif$/i), "RIF-3");
    await user.type(screen.getByLabelText(/correo/i), "tres@test.com");
    await user.type(screen.getByLabelText(/teléfono/i), "+56 3");
    await user.type(screen.getByLabelText(/dirección/i), "Calle 3");
    await user.click(screen.getByRole("button", { name: /agregar cliente/i }));

    expect(addClient).toHaveBeenCalledWith({
      name: "Cliente Tres",
      rif: "RIF-3",
      email: "tres@test.com",
      phone: "+56 3",
      address: "Calle 3",
    });
    expect(mockedSwal).toHaveBeenCalledWith(
      expect.objectContaining({
        icon: "success",
        title: "Cliente agregado",
      })
    );
  });

  it("loads a client into the form and updates it", async () => {
    const user = userEvent.setup();
    const updateClient = vi.fn().mockResolvedValue(undefined);

    renderClientsPage({ updateClient });

    const firstClient = screen.getByText("Cliente Uno").closest("article");
    expect(firstClient).not.toBeNull();

    await user.click(
      within(firstClient!).getByRole("button", { name: /editar/i })
    );

    const dialog = screen.getByRole("dialog", { name: /editar cliente/i });
    await user.clear(within(dialog).getByLabelText(/^nombre$/i));
    await user.type(
      within(dialog).getByLabelText(/^nombre$/i),
      "Cliente Uno Editado"
    );
    await user.click(
      within(dialog).getByRole("button", { name: /guardar cambios/i })
    );

    expect(updateClient).toHaveBeenCalledWith("client-1", {
      name: "Cliente Uno Editado",
      rif: "RIF-1",
      email: "uno@test.com",
      phone: "+56 1",
      address: "Calle 1",
    });
  });

  it("closes the edit popup without saving when cancelled", async () => {
    const user = userEvent.setup();
    const updateClient = vi.fn().mockResolvedValue(undefined);

    renderClientsPage({ updateClient });

    const firstClient = screen.getByText("Cliente Uno").closest("article");
    expect(firstClient).not.toBeNull();

    await user.click(
      within(firstClient!).getByRole("button", { name: /editar/i })
    );
    const dialog = screen.getByRole("dialog", { name: /editar cliente/i });

    await user.click(within(dialog).getByRole("button", { name: /^cancelar$/i }));

    expect(screen.queryByRole("dialog", { name: /editar cliente/i })).not.toBeInTheDocument();
    expect(updateClient).not.toHaveBeenCalled();
  });

  it("deletes a client after confirmation", async () => {
    const user = userEvent.setup();
    const removeClient = vi.fn().mockResolvedValue(undefined);

    renderClientsPage({ removeClient });

    const firstClient = screen.getByText("Cliente Uno").closest("article");
    expect(firstClient).not.toBeNull();

    await user.click(
      within(firstClient!).getByRole("button", { name: /eliminar/i })
    );

    expect(removeClient).toHaveBeenCalledWith("client-1");
    expect(mockedSwal).toHaveBeenCalledWith(
      expect.objectContaining({
        icon: "success",
        title: "Cliente eliminado",
      })
    );
  });

  it("filters clients by search term", async () => {
    const user = userEvent.setup();

    renderClientsPage();

    await user.type(screen.getByLabelText(/buscar cliente/i), "dos@test.com");

    expect(screen.queryByText("Cliente Uno")).not.toBeInTheDocument();
    expect(screen.getByText("Cliente Dos")).toBeInTheDocument();
  });
});
