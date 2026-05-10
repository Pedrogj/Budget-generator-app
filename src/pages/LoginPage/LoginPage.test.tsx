import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import Swal from "sweetalert2";
import { LoginPage } from "./LoginPage";
import { useAuth } from "../../context/AuthContext";

vi.mock("../../context/AuthContext", () => ({
  useAuth: vi.fn(),
}));

vi.mock("sweetalert2", () => ({
  default: {
    fire: vi.fn(),
  },
}));

const mockedUseAuth = vi.mocked(useAuth);
const mockedSwal = vi.mocked(Swal.fire);

function renderLoginPage(initialPath = "/login") {
  return render(
    <MemoryRouter initialEntries={[initialPath]}>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/" element={<p>Dashboard</p>} />
      </Routes>
    </MemoryRouter>
  );
}

describe("LoginPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockedUseAuth.mockReturnValue({
      user: null,
      loading: false,
      login: vi.fn(),
      register: vi.fn(),
      logout: vi.fn(),
    });
  });

  it("renders the login form", () => {
    renderLoginPage();

    expect(
      screen.getByRole("heading", { name: /iniciar sesión/i })
    ).toBeInTheDocument();
    expect(screen.getByLabelText(/correo electrónico/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/^contraseña$/i)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /entrar/i })).toBeInTheDocument();
  });

  it("validates required fields before submitting", async () => {
    const user = userEvent.setup();
    const login = vi.fn();
    mockedUseAuth.mockReturnValue({
      user: null,
      loading: false,
      login,
      register: vi.fn(),
      logout: vi.fn(),
    });

    renderLoginPage();

    await user.click(screen.getByRole("button", { name: /entrar/i }));

    expect(await screen.findByText(/el correo es obligatorio/i)).toBeVisible();
    expect(screen.getByText(/la contraseña es obligatoria/i)).toBeVisible();
    expect(login).not.toHaveBeenCalled();
  });

  it("validates email format", async () => {
    const user = userEvent.setup();

    renderLoginPage();

    await user.type(screen.getByLabelText(/correo electrónico/i), "correo");
    await user.type(screen.getByLabelText(/^contraseña$/i), "secret123");
    await user.click(screen.getByRole("button", { name: /entrar/i }));

    expect(await screen.findByText(/ingresa un correo válido/i)).toBeVisible();
  });

  it("submits credentials and navigates to the dashboard", async () => {
    const user = userEvent.setup();
    const login = vi.fn().mockResolvedValue(undefined);
    mockedUseAuth.mockReturnValue({
      user: null,
      loading: false,
      login,
      register: vi.fn(),
      logout: vi.fn(),
    });

    renderLoginPage();

    await user.type(screen.getByLabelText(/correo electrónico/i), "demo@test.com");
    await user.type(screen.getByLabelText(/^contraseña$/i), "secret123");
    await user.click(screen.getByRole("button", { name: /entrar/i }));

    expect(login).toHaveBeenCalledWith("demo@test.com", "secret123");
    expect(await screen.findByText("Dashboard")).toBeInTheDocument();
  });

  it("shows an alert when login fails", async () => {
    const user = userEvent.setup();
    const login = vi.fn().mockRejectedValue(new Error("Credenciales inválidas"));
    mockedUseAuth.mockReturnValue({
      user: null,
      loading: false,
      login,
      register: vi.fn(),
      logout: vi.fn(),
    });

    renderLoginPage();

    await user.type(screen.getByLabelText(/correo electrónico/i), "demo@test.com");
    await user.type(screen.getByLabelText(/^contraseña$/i), "secret123");
    await user.click(screen.getByRole("button", { name: /entrar/i }));

    expect(mockedSwal).toHaveBeenCalledWith(
      expect.objectContaining({
        icon: "error",
        title: "Error al iniciar sesión",
        text: "Credenciales inválidas",
      })
    );
  });

  it("redirects authenticated users away from login", async () => {
    mockedUseAuth.mockReturnValue({
      user: { id: "user-1", email: "demo@test.com" },
      loading: false,
      login: vi.fn(),
      register: vi.fn(),
      logout: vi.fn(),
    });

    renderLoginPage();

    expect(await screen.findByText("Dashboard")).toBeInTheDocument();
  });
});
