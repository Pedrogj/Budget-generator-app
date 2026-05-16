import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import Swal from "sweetalert2";
import { ForgotPasswordPage } from "./ForgotPasswordPage";
import { sendPasswordResetEmail } from "../../lib/passwordRecovery";

vi.mock("../../lib/passwordRecovery", () => ({
  sendPasswordResetEmail: vi.fn(),
}));

vi.mock("sweetalert2", () => ({
  default: {
    fire: vi.fn(),
  },
}));

const mockedSendPasswordResetEmail = vi.mocked(sendPasswordResetEmail);
const mockedSwal = vi.mocked(Swal.fire);

function renderForgotPasswordPage() {
  return render(
    <MemoryRouter>
      <ForgotPasswordPage />
    </MemoryRouter>,
  );
}

describe("ForgotPasswordPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockedSendPasswordResetEmail.mockResolvedValue(undefined);
    mockedSwal.mockResolvedValue({ isConfirmed: true } as Awaited<
      ReturnType<typeof Swal.fire>
    >);
  });

  it("renders the recovery form", () => {
    renderForgotPasswordPage();

    expect(
      screen.getByRole("heading", { name: /recuperar contraseña/i }),
    ).toBeInTheDocument();
    expect(screen.getByLabelText(/correo electrónico/i)).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /enviar enlace/i }),
    ).toBeInTheDocument();
  });

  it("validates the email before submitting", async () => {
    const user = userEvent.setup();

    renderForgotPasswordPage();

    await user.click(screen.getByRole("button", { name: /enviar enlace/i }));

    expect(await screen.findByText(/el correo es obligatorio/i)).toBeVisible();
    expect(mockedSendPasswordResetEmail).not.toHaveBeenCalled();
  });

  it("sends the password reset email", async () => {
    const user = userEvent.setup();

    renderForgotPasswordPage();

    await user.type(screen.getByLabelText(/correo electrónico/i), "demo@test.com");
    await user.click(screen.getByRole("button", { name: /enviar enlace/i }));

    expect(mockedSendPasswordResetEmail).toHaveBeenCalledWith("demo@test.com");
    expect(mockedSwal).toHaveBeenCalledWith(
      expect.objectContaining({
        icon: "success",
        title: "Correo enviado",
      }),
    );
  });

  it("shows an error when Supabase rejects the request", async () => {
    const user = userEvent.setup();
    mockedSendPasswordResetEmail.mockRejectedValue(new Error("SMTP no configurado"));

    renderForgotPasswordPage();

    await user.type(screen.getByLabelText(/correo electrónico/i), "demo@test.com");
    await user.click(screen.getByRole("button", { name: /enviar enlace/i }));

    expect(mockedSwal).toHaveBeenCalledWith(
      expect.objectContaining({
        icon: "error",
        title: "No se pudo enviar",
        text: "SMTP no configurado",
      }),
    );
  });
});
