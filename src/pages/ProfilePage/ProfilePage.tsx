import { useEffect, useState, type ChangeEvent } from "react";
import { useForm } from "react-hook-form";
import z from "zod";
import { useQuote } from "../../context/QuoteContext";
import { zodResolver } from "@hookform/resolvers/zod";
import Swal from "sweetalert2";

const profileSchema = z.object({
  name: z.string().min(1, "El nombre de la empresa es requerido"),
  rif: z.string().min(1, "El número de razón social es requerido"),
  phone: z.string().min(1, "El número de telefono es requerido"),
  addressLines: z.string().min(1, "La dirección es requerida"),
  defaultCurrency: z.enum(["USD", "CLP"]),
  ivaRate: z
    .number({
      error: "El IVA debe ser un número",
    })
    .min(0, "El IVA no puede ser negativo")
    .max(20, "El IVA es demasiado alto"),
});

type ProfileFormValues = z.infer<typeof profileSchema>;

export const ProfilePage = () => {
  const { company, updateCompany } = useQuote();
  const [logoError, setLogoError] = useState<string | null>(null);
  const [tempLogo, setTempLogo] = useState<string | undefined>(company.logoUrl);

  const {
    register,
    handleSubmit,
    reset,
    formState: { isDirty, errors },
  } = useForm<ProfileFormValues>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      name: company.name,
      rif: company.rif,
      phone: company.phone,
      addressLines: company.addressLines ?? "",
      defaultCurrency: company.defaultCurrency ?? "USD",
      ivaRate: company.ivaRate ?? 16,
    },
  });

  // If company changes
  useEffect(() => {
    reset({
      name: company.name,
      rif: company.rif,
      phone: company.phone,
      addressLines: company.addressLines ?? "",
      defaultCurrency: company.defaultCurrency ?? "USD",
      ivaRate: company.ivaRate ?? 16,
    });

    setTempLogo(company.logoUrl);
  }, [company, reset]);

  const onSubmit = (data: ProfileFormValues) => {
    updateCompany({
      name: data.name,
      rif: data.rif,
      phone: data.phone,
      logoUrl: tempLogo || undefined,
      addressLines: data.addressLines,
      defaultCurrency: data.defaultCurrency,
      ivaRate: data.ivaRate,
    });

    reset(data);

    Swal.fire({
      icon: "success",
      title: "Datos guardados",
      text: "La información de tu empresa se actualizo correctamente",
      timer: 1700,
      showConfirmButton: false,
    });
  };

  const handleLogoChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setLogoError(null); // we clean previous error

    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = reader.result as string; // "data:image/png;base64,..."

      const img = new Image();
      img.onload = () => {
        const { naturalWidth, naturalHeight } = img;

        if (naturalWidth > 600 || naturalHeight > 600) {
          setLogoError(
            `El logo es demasiado grande (${naturalWidth}x${naturalHeight}px). El máximo permitido es 600x600 px.`
          );
          return;
        }
        // Valid size → We've updated our company with the new logo
        setTempLogo(dataUrl);
      };
      img.onerror = () => {
        setLogoError("No se pudo leer la imagen. Intenta con otro archivo.");
      };
      img.src = dataUrl;
    };
    reader.onerror = () => {
      setLogoError("Error al leer el archivo. Intenta nuevamente.");
    };
    reader.readAsDataURL(file);
  };

  // We detect if the logo has changed compared to the one in the context
  const hasLogoChange = tempLogo !== company.logoUrl;
  const isSubmitDisabled = !isDirty && !hasLogoChange;

  return (
    <div className="page">
      <h1>Datos de Empresa</h1>
      <p>
        Aquí puedes configurar los datos de la empresa que se usarán en los
        presupuestos.
      </p>
      <form onSubmit={handleSubmit(onSubmit)}>
        <div className="section">
          {/* Name company */}
          <label style={{ display: "block", marginBottom: 8 }}>
            <span>Nombre de la Empresa</span>
            <input {...register("name")} style={{ width: "100%" }} />
            {errors.name && <p className="form-error">{errors.name.message}</p>}
          </label>
          {/* Rif company */}
          <label style={{ display: "block", marginBottom: 8 }}>
            <span>RIF/RUT</span>
            <input {...register("rif")} style={{ width: "100%" }} />
            {errors.rif && <p className="form-error">{errors.rif.message}</p>}
          </label>
          {/* Phone */}
          <label style={{ display: "block", marginBottom: 8 }}>
            <span>Teléfono</span>
            <input {...register("phone")} style={{ width: "100%" }} />
            {errors.phone && (
              <p className="form-error">{errors.phone.message}</p>
            )}
          </label>
          {/* Select Currency */}
          <label style={{ display: "block", marginBottom: 8 }}>
            <span>Moneda por defecto</span>
            <select {...register("defaultCurrency")} style={{ width: "100%" }}>
              <option value="USD">USD (Dólares)</option>
              <option value="CLP">CLP (Pesos chilenos)</option>
            </select>
            {errors.defaultCurrency && (
              <p className="form-error">{errors.defaultCurrency.message}</p>
            )}
          </label>
          {/* IvaRate */}
          <label style={{ display: "block", marginBottom: 8 }}>
            <span>IVA (%)</span>
            <input
              type="number"
              step="0.01"
              {...register("ivaRate", {
                valueAsNumber: true,
              })}
              style={{ width: "100%" }}
            />
            {errors.ivaRate && (
              <p className="form-error">{errors.ivaRate.message}</p>
            )}
          </label>
          {/* Logo company */}
          <label style={{ display: "block", marginBottom: 8 }}>
            <span>Logo de Empresa (máx. 600x600 px)</span>
            <input
              type="file"
              accept="image/png,image/jpeg"
              onChange={handleLogoChange}
            />
          </label>

          {logoError && (
            <p style={{ color: "salmon", fontSize: 12, marginBottom: 8 }}>
              {logoError}
            </p>
          )}

          {tempLogo && !logoError && (
            <div style={{ marginTop: 8 }}>
              <span style={{ display: "block", marginBottom: 4 }}>
                Vista previa:
              </span>
              <img
                src={tempLogo}
                alt="Logo de la empresa"
                style={{ height: 80, width: "auto", borderRadius: 8 }}
              />
            </div>
          )}

          <label style={{ display: "block", marginBottom: 8 }}>
            <span>Dirección</span>
            <textarea {...register("addressLines")} style={{ width: "100%" }} />
            {errors.addressLines && (
              <p className="form-error">{errors.addressLines.message}</p>
            )}
          </label>

          <button type="submit" disabled={isSubmitDisabled}>
            Guardar Cambios
          </button>
        </div>
      </form>
    </div>
  );
};
