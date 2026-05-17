import { fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import Swal from "sweetalert2";
import { MemoryRouter } from "react-router-dom";
import { ProfilePage } from "./ProfilePage";
import { useQuote } from "../../context/QuoteContext";
import { deleteCurrentAccount } from "../../lib/accountDeletion";

vi.mock("../../context/QuoteContext", () => ({
  useQuote: vi.fn(),
}));

vi.mock("../../lib/accountDeletion", () => ({
  deleteCurrentAccount: vi.fn(),
}));

vi.mock("sweetalert2", () => ({
  default: {
    fire: vi.fn(),
  },
}));

const mockedUseQuote = vi.mocked(useQuote);
const mockedSwal = vi.mocked(Swal.fire);
const mockedDeleteCurrentAccount = vi.mocked(deleteCurrentAccount);

const baseQuoteContext = {
  company: {
    id: "company-1",
    name: "ACME",
    rif: "J-1",
    taxIdLabel: "RIF" as const,
    phone: "+56 9",
    addressLines: "Calle 1",
    logoUrl: "data:image/png;base64,logo",
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
  clients: [],
  selectedTemplate: "professional" as const,
  setFromForm: vi.fn(),
  setQuoteTemplate: vi.fn(),
  updateCompany: vi.fn().mockResolvedValue(undefined),
  addClient: vi.fn(),
  removeClient: vi.fn(),
  updateClient: vi.fn(),
  saveQuote: vi.fn(),
};

function renderProfilePage(overrides = {}) {
  mockedUseQuote.mockReturnValue({
    ...baseQuoteContext,
    ...overrides,
  });

  return render(
    <MemoryRouter>
      <ProfilePage />
    </MemoryRouter>,
  );
}

describe("ProfilePage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockedSwal.mockResolvedValue({ isConfirmed: true } as Awaited<
      ReturnType<typeof Swal.fire>
    >);
    mockedDeleteCurrentAccount.mockResolvedValue(undefined);
  });

  it("renders company data", () => {
    renderProfilePage();

    expect(
      screen.getByRole("heading", { level: 1, name: /datos de empresa/i })
    ).toBeInTheDocument();
    expect(screen.getByLabelText(/nombre de la empresa/i)).toHaveValue("ACME");
    expect(screen.getByLabelText(/^rif$/i)).toHaveValue("J-1");
    expect(screen.getByLabelText(/tipo de documento fiscal/i)).toHaveValue(
      "RIF",
    );
    expect(screen.getByLabelText(/teléfono/i)).toHaveValue("+56 9");
    expect(screen.getByAltText(/logo de la empresa/i)).toBeInTheDocument();
  });

  it("keeps submit disabled when there are no changes", () => {
    renderProfilePage();

    expect(screen.getByRole("button", { name: /guardar cambios/i })).toBeDisabled();
  });

  it("validates required fields", async () => {
    const user = userEvent.setup();

    renderProfilePage();

    await user.clear(screen.getByLabelText(/nombre de la empresa/i));
    await user.clear(screen.getByLabelText(/^rif$/i));
    await user.clear(screen.getByLabelText(/teléfono/i));
    await user.click(screen.getByRole("button", { name: /quitar logo/i }));
    await user.click(screen.getByRole("button", { name: /guardar cambios/i }));

    expect(
      await screen.findByText(/el nombre de la empresa es requerido/i)
    ).toBeVisible();
    expect(screen.getByText(/el documento fiscal es requerido/i)).toBeVisible();
    expect(screen.getByText(/el teléfono es requerido/i)).toBeVisible();
  });

  it("saves updated company data", async () => {
    const user = userEvent.setup();
    const updateCompany = vi.fn().mockResolvedValue(undefined);

    renderProfilePage({ updateCompany });

    await user.clear(screen.getByLabelText(/nombre de la empresa/i));
    await user.type(screen.getByLabelText(/nombre de la empresa/i), "ACME Nueva");
    await user.click(screen.getByRole("button", { name: /guardar cambios/i }));

    expect(updateCompany).toHaveBeenCalledWith(
      expect.objectContaining({
        name: "ACME Nueva",
        rif: "J-1",
        taxIdLabel: "RIF",
        phone: "+56 9",
        addressLines: "Calle 1",
        defaultCurrency: "USD",
        ivaRate: 16,
      })
    );
    expect(mockedSwal).toHaveBeenCalledWith(
      expect.objectContaining({
        icon: "success",
        title: "Datos guardados",
      })
    );
  });

  it("shows an error when saving fails", async () => {
    const user = userEvent.setup();
    const updateCompany = vi.fn().mockRejectedValue(new Error("Fallo remoto"));

    renderProfilePage({ updateCompany });

    await user.clear(screen.getByLabelText(/nombre de la empresa/i));
    await user.type(screen.getByLabelText(/nombre de la empresa/i), "ACME Nueva");
    await user.click(screen.getByRole("button", { name: /guardar cambios/i }));

    expect(mockedSwal).toHaveBeenCalledWith(
      expect.objectContaining({
        icon: "error",
        title: "No se pudo guardar",
        text: "Fallo remoto",
      })
    );
  });

  it("saves the selected tax document label", async () => {
    const user = userEvent.setup();
    const updateCompany = vi.fn().mockResolvedValue(undefined);

    renderProfilePage({ updateCompany });

    await user.selectOptions(
      screen.getByLabelText(/tipo de documento fiscal/i),
      "DNI",
    );
    await user.click(screen.getByRole("button", { name: /guardar cambios/i }));

    expect(updateCompany).toHaveBeenCalledWith(
      expect.objectContaining({
        taxIdLabel: "DNI",
      }),
    );
  });

  it("removes the logo and enables submit", async () => {
    const user = userEvent.setup();
    const updateCompany = vi.fn().mockResolvedValue(undefined);

    renderProfilePage({ updateCompany });

    await user.click(screen.getByRole("button", { name: /quitar logo/i }));

    expect(screen.queryByAltText(/logo de la empresa/i)).not.toBeInTheDocument();
    expect(screen.getByText(/sin logo/i)).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: /guardar cambios/i }));

    expect(updateCompany).toHaveBeenCalledWith(
      expect.objectContaining({
        logoUrl: undefined,
      })
    );
  });

  it("shows an error for unsupported logo types", () => {
    renderProfilePage();

    const file = new File(["avatar"], "avatar.gif", { type: "image/gif" });
    fireEvent.change(screen.getByLabelText(/subir logo/i), {
      target: { files: [file] },
    });

    expect(screen.getByText(/usa una imagen png o jpg/i)).toBeVisible();
  });

  it("deletes the account after explicit confirmation", async () => {
    const user = userEvent.setup();
    mockedSwal
      .mockResolvedValueOnce({ isConfirmed: true } as Awaited<
        ReturnType<typeof Swal.fire>
      >)
      .mockResolvedValueOnce({ isConfirmed: true } as Awaited<
        ReturnType<typeof Swal.fire>
      >);

    renderProfilePage();

    await user.click(screen.getByRole("button", { name: /eliminar cuenta/i }));

    expect(mockedSwal).toHaveBeenCalledWith(
      expect.objectContaining({
        icon: "warning",
        title: "Eliminar cuenta",
        input: "text",
      }),
    );
    expect(mockedDeleteCurrentAccount).toHaveBeenCalledTimes(1);
    expect(mockedSwal).toHaveBeenCalledWith(
      expect.objectContaining({
        icon: "success",
        title: "Cuenta eliminada",
      }),
    );
  });

  it("does not delete the account when confirmation is cancelled", async () => {
    const user = userEvent.setup();
    mockedSwal.mockResolvedValueOnce({ isConfirmed: false } as Awaited<
      ReturnType<typeof Swal.fire>
    >);

    renderProfilePage();

    await user.click(screen.getByRole("button", { name: /eliminar cuenta/i }));

    expect(mockedDeleteCurrentAccount).not.toHaveBeenCalled();
  });

  it("shows an error when account deletion fails", async () => {
    const user = userEvent.setup();
    mockedDeleteCurrentAccount.mockRejectedValue(new Error("Storage bloqueado"));
    mockedSwal
      .mockResolvedValueOnce({ isConfirmed: true } as Awaited<
        ReturnType<typeof Swal.fire>
      >)
      .mockResolvedValueOnce({ isConfirmed: true } as Awaited<
        ReturnType<typeof Swal.fire>
      >);

    renderProfilePage();

    await user.click(screen.getByRole("button", { name: /eliminar cuenta/i }));

    expect(mockedSwal).toHaveBeenCalledWith(
      expect.objectContaining({
        icon: "error",
        title: "No se pudo eliminar la cuenta",
        text: "Storage bloqueado",
      }),
    );
  });
});
