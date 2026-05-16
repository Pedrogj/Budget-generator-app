import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import Swal from "sweetalert2";
import { ResetPasswordPage } from "./ResetPasswordPage";
import { updateRecoveredPassword } from "../../lib/passwordRecovery";

vi.mock("../../lib/passwordRecovery", () => ({
  updateRecoveredPassword: vi.fn(),
}));

vi.mock("sweetalert2", () => ({
  default: {
    fire: vi.fn(),
  },
}));

const mockedUpdateRecoveredPassword = vi.mocked(updateRecoveredPassword);
const mockedSwal = vi.mocked(Swal.fire);

function renderResetPasswordPage() {
  return render(
    <MemoryRouter initialEntries={["/reset-password"]}>
      <Routes>
        <Route path="/reset-password" element={<ResetPasswordPage />} />
        <Route path="/login" element={<p>Login route</p>} />
      </Routes>
    </MemoryRouter>,
  );
}

function getPasswordInput() {
  return document.querySelector('input[name="password"]') as HTMLInputElement;
}

function getConfirmPasswordInput() {
  return document.querySelector(
    'input[name="confirmPassword"]',
  ) as HTMLInputElement;
}

describe("ResetPasswordPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockedUpdateRecoveredPassword.mockResolvedValue(undefined);
    mockedSwal.mockResolvedValue({ isConfirmed: true } as Awaited<
      ReturnType<typeof Swal.fire>
    >);
  });

  it("renders the reset form", () => {
    renderResetPasswordPage();

    expect(
      screen.getByRole("heading", { name: /nueva contraseña/i }),
    ).toBeInTheDocument();
    expect(getPasswordInput()).toBeInTheDocument();
    expect(getConfirmPasswordInput()).toBeInTheDocument();
  });

  it("validates password length and confirmation", async () => {
    const user = userEvent.setup();

    renderResetPasswordPage();

    await user.type(getPasswordInput(), "short");
    await user.type(getConfirmPasswordInput(), "different");
    await user.click(
      screen.getByRole("button", { name: /actualizar contraseña/i }),
    );

    expect(
      await screen.findByText(/la contraseña debe tener al menos 8 caracteres/i),
    ).toBeVisible();
    expect(screen.getByText(/las contraseñas no coinciden/i)).toBeVisible();
    expect(mockedUpdateRecoveredPassword).not.toHaveBeenCalled();
  });

  it("updates the password and navigates to login", async () => {
    const user = userEvent.setup();

    renderResetPasswordPage();

    await user.type(getPasswordInput(), "secret123");
    await user.type(getConfirmPasswordInput(), "secret123");
    await user.click(
      screen.getByRole("button", { name: /actualizar contraseña/i }),
    );

    expect(mockedUpdateRecoveredPassword).toHaveBeenCalledWith("secret123");
    expect(mockedSwal).toHaveBeenCalledWith(
      expect.objectContaining({
        icon: "success",
        title: "Contraseña actualizada",
      }),
    );
    expect(await screen.findByText("Login route")).toBeInTheDocument();
  });

  it("shows an error when password update fails", async () => {
    const user = userEvent.setup();
    mockedUpdateRecoveredPassword.mockRejectedValue(new Error("Enlace vencido"));

    renderResetPasswordPage();

    await user.type(getPasswordInput(), "secret123");
    await user.type(getConfirmPasswordInput(), "secret123");
    await user.click(
      screen.getByRole("button", { name: /actualizar contraseña/i }),
    );

    expect(mockedSwal).toHaveBeenCalledWith(
      expect.objectContaining({
        icon: "error",
        title: "No se pudo actualizar",
        text: "Enlace vencido",
      }),
    );
  });
});
