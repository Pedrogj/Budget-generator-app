import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import { Navbar } from "./Navbar";
import { useAuth } from "../../context/AuthContext";
import { useQuote } from "../../context/QuoteContext";

vi.mock("../../context/AuthContext", () => ({
  useAuth: vi.fn(),
}));

vi.mock("../../context/QuoteContext", () => ({
  useQuote: vi.fn(),
}));

const mockedUseAuth = vi.mocked(useAuth);
const mockedUseQuote = vi.mocked(useQuote);

function renderNavbar(authOverrides = {}) {
  const logout = vi.fn().mockResolvedValue(undefined);

  mockedUseAuth.mockReturnValue({
    user: { id: "user-1", email: "user@test.com" },
    loading: false,
    login: vi.fn(),
    register: vi.fn(),
    logout,
    ...authOverrides,
  });

  mockedUseQuote.mockReturnValue({
    company: {
      id: "company-1",
      name: "ACME Servicios",
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
      issueDate: "2026-05-11",
      currency: "USD",
    },
    items: [],
    clients: [],
    selectedTemplate: "professional",
    loading: false,
    setFromForm: vi.fn(),
    setQuoteTemplate: vi.fn(),
    updateCompany: vi.fn(),
    addClient: vi.fn(),
    removeClient: vi.fn(),
    updateClient: vi.fn(),
    saveQuote: vi.fn(),
  });

  const view = render(
    <MemoryRouter>
      <Navbar />
    </MemoryRouter>,
  );

  return { ...view, logout };
}

describe("Navbar", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders authenticated navigation in the main workflow order", () => {
    renderNavbar();

    expect(screen.getByRole("link", { name: /ir al inicio de presupuesta/i })).toHaveAttribute(
      "href",
      "/quotes/new",
    );

    const nav = screen.getByRole("navigation", { name: /navegación principal/i });
    const links = screen.getAllByRole("link").filter((link) => nav.contains(link));

    expect(links.map((link) => link.textContent)).toEqual([
      "Nuevo presupuesto",
      "Historial",
      "Modelos",
      "Clientes",
      "Empresa",
    ]);
    expect(screen.getByText("ACME Servicios")).toBeInTheDocument();
  });

  it("renders public navigation for anonymous users", () => {
    renderNavbar({ user: null });

    expect(screen.getByRole("link", { name: /ir al inicio de presupuesta/i })).toHaveAttribute(
      "href",
      "/login",
    );
    expect(screen.getByRole("link", { name: /^login$/i })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /registro/i })).toBeInTheDocument();
  });

  it("toggles the mobile navigation state", async () => {
    const user = userEvent.setup();

    renderNavbar();

    const button = screen.getByRole("button", { name: /abrir navegación/i });
    expect(button).toHaveAttribute("aria-expanded", "false");

    await user.click(button);

    expect(screen.getByRole("button", { name: /cerrar navegación/i })).toHaveAttribute(
      "aria-expanded",
      "true",
    );
  });

  it("calls logout from the session action", async () => {
    const user = userEvent.setup();
    const { logout } = renderNavbar();

    await user.click(screen.getByRole("button", { name: /cerrar sesión/i }));

    expect(logout).toHaveBeenCalledTimes(1);
  });
});
