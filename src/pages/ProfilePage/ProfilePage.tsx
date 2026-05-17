import { useEffect, useState, type ChangeEvent } from "react";
import { useForm, type Resolver, type SubmitHandler } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import z from "zod";
import Swal from "sweetalert2";
import { useNavigate } from "react-router-dom";
import { useQuote } from "../../context/QuoteContext";
import { deleteCurrentAccount } from "../../lib/accountDeletion";
import {
  maxCompanyLogoDimension,
  maxCompanyLogoSourceBytes,
  optimizeCompanyLogo,
  removeCompanyLogo,
  uploadCompanyLogo,
} from "../../lib/companyLogoStorage";

const profileSchema = z.object({
  name: z.string().trim().min(1, "El nombre de la empresa es requerido"),
  rif: z.string().trim().min(1, "El documento fiscal es requerido"),
  taxIdLabel: z.enum(["RIF", "RUT", "DNI"]),
  phone: z.string().trim().min(1, "El teléfono es requerido"),
  addressLines: z.string().trim().min(1, "La dirección es requerida"),
  defaultCurrency: z.enum(["USD", "CLP"]),
  ivaRate: z.coerce
    .number({ error: "El IVA debe ser un número" })
    .min(0, "El IVA no puede ser negativo")
    .max(20, "El IVA no puede superar 20%"),
});

type ProfileFormValues = z.infer<typeof profileSchema>;

function getErrorMessage(error: unknown) {
  if (error instanceof Error && error.message) {
    return error.message;
  }

  return "No se pudo guardar la información de la empresa. Intenta nuevamente.";
}

export const ProfilePage = () => {
  const { company, updateCompany } = useQuote();
  const navigate = useNavigate();
  const [logoError, setLogoError] = useState<string | null>(null);
  const [isDeletingAccount, setIsDeletingAccount] = useState(false);
  const [logoDraft, setLogoDraft] = useState<{
    sourcePath?: string;
    previewUrl?: string;
    blob?: Blob;
    remove?: boolean;
  }>({
    sourcePath: company.logoPath,
    previewUrl: company.logoUrl,
  });
  const tempLogo =
    logoDraft.sourcePath === company.logoPath
      ? logoDraft.previewUrl
      : company.logoUrl;

  const resolver: Resolver<ProfileFormValues> = zodResolver(
    profileSchema,
  ) as Resolver<ProfileFormValues>;

  const {
    register,
    handleSubmit,
    reset,
    watch,
    formState: { isDirty, errors, isSubmitting },
  } = useForm<ProfileFormValues>({
    resolver,
    defaultValues: {
      name: company.name,
      rif: company.rif,
      taxIdLabel: company.taxIdLabel ?? "RIF",
      phone: company.phone,
      addressLines: company.addressLines ?? "",
      defaultCurrency: company.defaultCurrency ?? "USD",
      ivaRate: company.ivaRate ?? 16,
    },
  });

  useEffect(() => {
    reset({
      name: company.name,
      rif: company.rif,
      taxIdLabel: company.taxIdLabel ?? "RIF",
      phone: company.phone,
      addressLines: company.addressLines ?? "",
      defaultCurrency: company.defaultCurrency ?? "USD",
      ivaRate: company.ivaRate ?? 16,
    });
  }, [company, reset]);

  useEffect(() => {
    setLogoDraft((current) => {
      if (current.blob || current.remove) return current;
      if (
        current.sourcePath === company.logoPath &&
        current.previewUrl === company.logoUrl
      ) {
        return current;
      }

      return {
        sourcePath: company.logoPath,
        previewUrl: company.logoUrl,
      };
    });
  }, [company.logoPath, company.logoUrl]);

  useEffect(() => {
    return () => {
      if (logoDraft.previewUrl?.startsWith("blob:")) {
        URL.revokeObjectURL(logoDraft.previewUrl);
      }
    };
  }, [logoDraft.previewUrl]);

  const taxIdLabel = watch("taxIdLabel");

  const onSubmit: SubmitHandler<ProfileFormValues> = async (data) => {
    try {
      let logoPath = company.logoPath;
      let logoUrl = company.logoUrl;

      if (logoDraft.remove) {
        if (company.logoPath) {
          await removeCompanyLogo(company.logoPath);
        }

        logoPath = undefined;
        logoUrl = undefined;
      } else if (logoDraft.blob) {
        if (!company.id) {
          throw new Error("La empresa aún no está lista para subir el logo.");
        }

        const uploadedLogo = await uploadCompanyLogo({
          companyId: company.id,
          logoBlob: logoDraft.blob,
          previousPath: company.logoPath,
        });
        logoPath = uploadedLogo.path;
        logoUrl = uploadedLogo.signedUrl;
      }

      await updateCompany({
        name: data.name,
        rif: data.rif,
        taxIdLabel: data.taxIdLabel,
        phone: data.phone,
        logoUrl,
        logoPath,
        addressLines: data.addressLines,
        defaultCurrency: data.defaultCurrency,
        ivaRate: data.ivaRate,
      });

      reset(data);
      setLogoDraft({
        sourcePath: logoPath,
        previewUrl: logoUrl,
      });

      await Swal.fire({
        icon: "success",
        title: "Datos guardados",
        text: "La información de tu empresa se actualizó correctamente.",
        timer: 1700,
        showConfirmButton: false,
      });
    } catch (err) {
      console.error("Error al guardar empresa", err);
      await Swal.fire({
        icon: "error",
        title: "No se pudo guardar",
        text: getErrorMessage(err),
      });
    }
  };

  const handleLogoChange = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setLogoError(null);

    if (!["image/png", "image/jpeg"].includes(file.type)) {
      setLogoError("Usa una imagen PNG o JPG.");
      event.target.value = "";
      return;
    }

    if (file.size > maxCompanyLogoSourceBytes) {
      setLogoError("El logo no debe superar 1 MB.");
      event.target.value = "";
      return;
    }

    try {
      const optimizedLogo = await optimizeCompanyLogo(file);
      const previewUrl = URL.createObjectURL(optimizedLogo);

      if (logoDraft.previewUrl?.startsWith("blob:")) {
        URL.revokeObjectURL(logoDraft.previewUrl);
      }

      setLogoDraft({
        sourcePath: company.logoPath,
        previewUrl,
        blob: optimizedLogo,
      });
    } catch (err) {
      setLogoError(
        err instanceof Error
          ? err.message
          : "No se pudo optimizar el logo. Intenta con otra imagen.",
      );
    } finally {
      event.target.value = "";
    }
  };

  const handleRemoveLogo = () => {
    setLogoError(null);
    if (logoDraft.previewUrl?.startsWith("blob:")) {
      URL.revokeObjectURL(logoDraft.previewUrl);
    }
    setLogoDraft({
      sourcePath: company.logoPath,
      previewUrl: undefined,
      remove: true,
    });
  };

  const handleDeleteAccount = async () => {
    const result = await Swal.fire({
      icon: "warning",
      title: "Eliminar cuenta",
      text: "Se borrarán tu empresa, clientes, presupuestos y PDFs guardados. Esta acción no se puede deshacer.",
      input: "text",
      inputLabel: 'Escribe "ELIMINAR" para confirmar',
      inputPlaceholder: "ELIMINAR",
      showCancelButton: true,
      confirmButtonText: "Eliminar definitivamente",
      cancelButtonText: "Cancelar",
      confirmButtonColor: "#b91c1c",
      inputValidator: (value) => {
        if (value !== "ELIMINAR") {
          return 'Debes escribir "ELIMINAR" para continuar.';
        }

        return null;
      },
    });

    if (!result.isConfirmed) return;

    setIsDeletingAccount(true);

    try {
      await deleteCurrentAccount();

      await Swal.fire({
        icon: "success",
        title: "Cuenta eliminada",
        text: "Tu cuenta y sus datos asociados fueron eliminados correctamente.",
        timer: 1800,
        showConfirmButton: false,
      });

      navigate("/login", { replace: true });
    } catch (err) {
      console.error("Error al eliminar cuenta", err);
      await Swal.fire({
        icon: "error",
        title: "No se pudo eliminar la cuenta",
        text:
          err instanceof Error
            ? err.message
            : "Intenta nuevamente o revisa la configuración de Supabase.",
      });
    } finally {
      setIsDeletingAccount(false);
    }
  };

  const hasLogoChange =
    logoDraft.sourcePath === company.logoPath &&
    (logoDraft.previewUrl !== company.logoUrl || logoDraft.remove);
  const isCompanyReady = !!company.id;
  const isSubmitDisabled =
    (!isDirty && !hasLogoChange) || isSubmitting || !isCompanyReady;

  return (
    <div className="page profile-page">
      <div className="profile-header">
        <div>
          <h1>Datos de empresa</h1>
          <p className="profile-subtitle">
            Esta información aparecerá en tus presupuestos y documentos PDF.
          </p>
        </div>
      </div>

      <form
        className="profile-form"
        noValidate
        onSubmit={handleSubmit(onSubmit)}
      >
        <section className="profile-panel">
          <h2>Información fiscal</h2>
          <div className="profile-grid">
            <label>
              <span>Nombre de la empresa</span>
              <input autoComplete="organization" {...register("name")} />
              {errors.name && (
                <p className="form-error">{errors.name.message}</p>
              )}
            </label>

            <label>
              <span>Tipo de documento fiscal</span>
              <select {...register("taxIdLabel")}>
                <option value="RIF">RIF</option>
                <option value="RUT">RUT</option>
                <option value="DNI">DNI</option>
              </select>
              {errors.taxIdLabel && (
                <p className="form-error">{errors.taxIdLabel.message}</p>
              )}
            </label>

            <label>
              <span>{taxIdLabel || "RIF"}</span>
              <input autoComplete="off" {...register("rif")} />
              {errors.rif && <p className="form-error">{errors.rif.message}</p>}
            </label>

            <label>
              <span>Teléfono</span>
              <input type="tel" autoComplete="tel" {...register("phone")} />
              {errors.phone && (
                <p className="form-error">{errors.phone.message}</p>
              )}
            </label>

            <label>
              <span>Moneda por defecto</span>
              <select {...register("defaultCurrency")}>
                <option value="USD">USD (Dólares)</option>
                <option value="CLP">CLP (Pesos chilenos)</option>
              </select>
              {errors.defaultCurrency && (
                <p className="form-error">{errors.defaultCurrency.message}</p>
              )}
            </label>

            <label>
              <span>IVA (%)</span>
              <input
                type="number"
                min="0"
                max="20"
                step="0.01"
                inputMode="decimal"
                {...register("ivaRate")}
              />
              {errors.ivaRate && (
                <p className="form-error">{errors.ivaRate.message}</p>
              )}
            </label>
          </div>

          <label>
            <span>Dirección</span>
            <textarea
              className="profile-address"
              {...register("addressLines")}
            />
            {errors.addressLines && (
              <p className="form-error">{errors.addressLines.message}</p>
            )}
          </label>
        </section>

        <section className="profile-panel">
          <div className="profile-logo-layout">
            <div>
              <h2>Logo</h2>
              <p className="profile-help">
                Usa PNG o JPG de máximo 1 MB. Lo optimizaremos a{" "}
                {maxCompanyLogoDimension}x{maxCompanyLogoDimension} px y se
                guardará en Storage.
              </p>

              <label className="profile-file-field">
                <span>Subir logo</span>
                <input
                  type="file"
                  accept="image/png,image/jpeg"
                  onChange={handleLogoChange}
                />
              </label>

              {logoError && (
                <p className="form-error profile-logo-error">{logoError}</p>
              )}

              {tempLogo && (
                <button type="button" onClick={handleRemoveLogo}>
                  Quitar logo
                </button>
              )}
            </div>

            <div className="profile-logo-preview">
              {tempLogo && !logoError ? (
                <img src={tempLogo} alt="Logo de la empresa" />
              ) : (
                <span>Sin logo</span>
              )}
            </div>
          </div>
        </section>

        <div className="profile-submit-row">
          {!isCompanyReady && (
            <p className="form-error">
              Espera un momento mientras cargamos la empresa.
            </p>
          )}
          <button type="submit" disabled={isSubmitDisabled}>
            {isSubmitting ? "Guardando..." : "Guardar cambios"}
          </button>
        </div>
      </form>

      <section className="profile-panel profile-danger-panel">
        <div>
          <h2>Eliminar cuenta</h2>
          <p className="profile-help">
            Elimina permanentemente la cuenta, la empresa, clientes,
            presupuestos y PDFs asociados.
          </p>
        </div>

        <button
          type="button"
          className="profile-danger-button"
          disabled={isDeletingAccount}
          onClick={handleDeleteAccount}
        >
          {isDeletingAccount ? "Eliminando..." : "Eliminar cuenta"}
        </button>
      </section>
    </div>
  );
};
