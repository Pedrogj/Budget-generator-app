import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import Swal from "sweetalert2";
import { RegisterPage } from "./RegisterPage";
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

function renderRegisterPage() {
  return render(
    <MemoryRouter initialEntries={["/register"]}>
      <Routes>
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/login" element={<p>Login route</p>} />
        <Route path="/profile" element={<p>Profile route</p>} />
      </Routes>
    </MemoryRouter>
  );
}

describe("RegisterPage", () => {
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

  it("renders the register form", () => {
    renderRegisterPage();

    expect(
      screen.getByRole("heading", { name: /crear cuenta/i })
    ).toBeInTheDocument();
    expect(screen.getByLabelText(/correo electrónico/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/^contraseña$/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/confirmar contraseña/i)).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /registrarme/i })
    ).toBeInTheDocument();
  });

  it("validates required fields before submitting", async () => {
    const user = userEvent.setup();
    const registerUser = vi.fn();
    mockedUseAuth.mockReturnValue({
      user: null,
      loading: false,
      login: vi.fn(),
      register: registerUser,
      logout: vi.fn(),
    });

    renderRegisterPage();

    await user.click(screen.getByRole("button", { name: /registrarme/i }));

    expect(await screen.findByText(/el correo es obligatorio/i)).toBeVisible();
    expect(screen.getByText(/confirma tu contraseña/i)).toBeVisible();
    expect(registerUser).not.toHaveBeenCalled();
  });

  it("validates password confirmation", async () => {
    const user = userEvent.setup();

    renderRegisterPage();

    await user.type(screen.getByLabelText(/correo electrónico/i), "demo@test.com");
    await user.type(screen.getByLabelText(/^contraseña$/i), "secret123");
    await user.type(screen.getByLabelText(/confirmar contraseña/i), "different");
    await user.click(screen.getByRole("button", { name: /registrarme/i }));

    expect(await screen.findByText(/las contraseñas no coinciden/i)).toBeVisible();
  });

  it("registers and navigates to profile when a session is created", async () => {
    const user = userEvent.setup();
    const registerUser = vi
      .fn()
      .mockResolvedValue({ needsEmailConfirmation: false });
    mockedUseAuth.mockReturnValue({
      user: null,
      loading: false,
      login: vi.fn(),
      register: registerUser,
      logout: vi.fn(),
    });

    renderRegisterPage();

    await user.type(screen.getByLabelText(/correo electrónico/i), "demo@test.com");
    await user.type(screen.getByLabelText(/^contraseña$/i), "secret123");
    await user.type(screen.getByLabelText(/confirmar contraseña/i), "secret123");
    await user.click(screen.getByRole("button", { name: /registrarme/i }));

    expect(registerUser).toHaveBeenCalledWith("demo@test.com", "secret123");
    expect(await screen.findByText("Profile route")).toBeInTheDocument();
  });

  it("sends users to login when email confirmation is required", async () => {
    const user = userEvent.setup();
    const registerUser = vi.fn().mockResolvedValue({ needsEmailConfirmation: true });
    mockedUseAuth.mockReturnValue({
      user: null,
      loading: false,
      login: vi.fn(),
      register: registerUser,
      logout: vi.fn(),
    });

    renderRegisterPage();

    await user.type(screen.getByLabelText(/correo electrónico/i), "demo@test.com");
    await user.type(screen.getByLabelText(/^contraseña$/i), "secret123");
    await user.type(screen.getByLabelText(/confirmar contraseña/i), "secret123");
    await user.click(screen.getByRole("button", { name: /registrarme/i }));

    expect(mockedSwal).toHaveBeenCalledWith(
      expect.objectContaining({
        icon: "success",
        title: "Cuenta creada",
      })
    );
    expect(await screen.findByText("Login route")).toBeInTheDocument();
  });

  it("shows an alert when registration fails", async () => {
    const user = userEvent.setup();
    const registerUser = vi.fn().mockRejectedValue(new Error("Email duplicado"));
    mockedUseAuth.mockReturnValue({
      user: null,
      loading: false,
      login: vi.fn(),
      register: registerUser,
      logout: vi.fn(),
    });

    renderRegisterPage();

    await user.type(screen.getByLabelText(/correo electrónico/i), "demo@test.com");
    await user.type(screen.getByLabelText(/^contraseña$/i), "secret123");
    await user.type(screen.getByLabelText(/confirmar contraseña/i), "secret123");
    await user.click(screen.getByRole("button", { name: /registrarme/i }));

    expect(mockedSwal).toHaveBeenCalledWith(
      expect.objectContaining({
        icon: "error",
        title: "Error al registrarse",
        text: "Email duplicado",
      })
    );
  });

  it("redirects authenticated users away from register", async () => {
    mockedUseAuth.mockReturnValue({
      user: { id: "user-1", email: "demo@test.com" },
      loading: false,
      login: vi.fn(),
      register: vi.fn(),
      logout: vi.fn(),
    });

    renderRegisterPage();

    expect(await screen.findByText("Profile route")).toBeInTheDocument();
  });
});
