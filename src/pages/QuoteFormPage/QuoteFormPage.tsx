import { z } from "zod";
import { Link, useNavigate } from "react-router-dom";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  useFieldArray,
  useForm,
  useWatch,
  type Resolver,
  type SubmitHandler,
} from "react-hook-form";
import { useQuote } from "../../context/QuoteContext";
import type { ChangeEvent } from "react";
import Swal from "sweetalert2";

const itemSchema = z.object({
  code: z.string().trim().default("NA"),
  unit: z.string().trim().default("NA"),
  description: z.string().trim().min(1, "La descripción es requerida"),
  quantity: z.coerce
    .number({ error: "La cantidad debe ser un número" })
    .min(1, "La cantidad debe ser al menos 1"),
  sg: z.string().trim().default(""),
  unitPrice: z.coerce
    .number({ error: "El precio debe ser un número" })
    .positive("El precio debe ser mayor a 0"),
});

const formSchema = z.object({
  work: z.string().trim().min(1, "Describe el tipo de trabajo"),
  client: z.string().trim().min(1, "Selecciona un cliente"),
  clientRif: z.string().trim().min(1, "Selecciona un cliente con RIF/RUT"),
  clientAddress: z
    .string()
    .trim()
    .min(1, "Selecciona un cliente con dirección"),
  clientId: z.string().optional(),
  issueDate: z
    .string()
    .min(1, "La fecha es obligatoria")
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Formato de fecha inválido"),
  notes: z.string().trim().max(500, "La nota no puede superar 500 caracteres"),
  items: z.array(itemSchema).min(1, "Debes agregar al menos un ítem"),
});

type FormValues = z.infer<typeof formSchema>;

const emptyItem = {
  code: "NA",
  unit: "NA",
  description: "",
  quantity: 1,
  sg: "",
  unitPrice: 0,
};

function formatMoney(value: number, currency: "USD" | "CLP") {
  return new Intl.NumberFormat("es-CL", {
    style: "currency",
    currency,
    maximumFractionDigits: currency === "CLP" ? 0 : 2,
  }).format(value);
}

function getErrorMessage(error: unknown) {
  if (error instanceof Error && error.message) {
    return error.message;
  }

  return "No se pudo guardar el presupuesto en la base de datos. Intenta nuevamente.";
}

export const QuoteFormPage = () => {
  const navigate = useNavigate();

  const { quote, items, setFromForm, clients, company, saveQuote } = useQuote();
  const shouldIgnoreCurrentQuote = quote.readOnly === true;

  const resolver: Resolver<FormValues> = zodResolver(
    formSchema
  ) as Resolver<FormValues>;

  const {
    control,
    register,
    handleSubmit,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver,
    defaultValues: {
      work: shouldIgnoreCurrentQuote ? "" : quote.work,
      client: shouldIgnoreCurrentQuote ? "" : quote.client,
      clientRif: shouldIgnoreCurrentQuote ? "" : quote.clientRif,
      clientAddress: shouldIgnoreCurrentQuote ? "" : quote.clientAddress,
      issueDate: shouldIgnoreCurrentQuote
        ? new Date().toISOString().slice(0, 10)
        : quote.issueDate,
      clientId: shouldIgnoreCurrentQuote ? "" : quote.clientId ?? "",
      notes: shouldIgnoreCurrentQuote ? "" : quote.notes ?? "",
      items: shouldIgnoreCurrentQuote ? [emptyItem] : items,
    },
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: "items",
  });

  const watchedItems = useWatch({
    control,
    name: "items",
  });
  const currency = company.defaultCurrency ?? "USD";
  const currencyLabel =
    company.defaultCurrency === "CLP" ? "CLP - Pesos chilenos" : "USD - Dólar";
  const subtotal = watchedItems.reduce((sum, item) => {
    const quantity = Number(item.quantity) || 0;
    const unitPrice = Number(item.unitPrice) || 0;
    return sum + quantity * unitPrice;
  }, 0);
  const ivaRate = Number(company.ivaRate ?? 16);
  const iva = subtotal * (ivaRate / 100);
  const total = subtotal + iva;
  const isCompanyReady = !!company.id;

  const onSubmit: SubmitHandler<FormValues> = async (data) => {
    const payload = {
      quote: {
        work: data.work,
        client: data.client,
        clientRif: data.clientRif,
        clientAddress: data.clientAddress,
        issueDate: data.issueDate,
        clientId: data.clientId,
        currency,
        notes: data.notes,
        readOnly: false,
      },
      items: data.items,
    };

    try {
      await saveQuote(payload);
      setFromForm(payload);

      await Swal.fire({
        icon: "success",
        title: "Presupuesto listo",
        text: "Los datos se guardaron correctamente. Ahora verás la vista previa del PDF.",
        timer: 1700,
        showConfirmButton: false,
      });

      navigate("/quotes/preview");
    } catch (err) {
      console.error(err);
      await Swal.fire({
        icon: "error",
        title: "Error al guardar",
        text: getErrorMessage(err),
      });
    }
  };

  const handleClientSelect = (e: ChangeEvent<HTMLSelectElement>) => {
    const clientId = e.target.value;

    if (!clientId) {
      setValue("client", "", { shouldValidate: true });
      setValue("clientRif", "", { shouldValidate: true });
      setValue("clientAddress", "", { shouldValidate: true });
      setValue("clientId", "", { shouldValidate: true });
      return;
    }

    const selected = clients.find((c) => c.id === clientId);
    if (!selected) return;

    setValue("client", selected.name, { shouldValidate: true });
    setValue("clientRif", selected.rif, { shouldValidate: true });
    setValue("clientAddress", selected.address, { shouldValidate: true });
    setValue("clientId", clientId, { shouldValidate: true });
  };

  return (
    <div className="page quote-form-page">
      <div className="quote-form-header">
        <div>
          <h1>Nuevo presupuesto</h1>
          <p className="quote-form-subtitle">
            Selecciona un cliente, agrega ítems y revisa los totales antes de guardar.
          </p>
        </div>
        <div className="quote-total-badge">
          <span>Total estimado</span>
          <strong>{formatMoney(total, currency)}</strong>
        </div>
      </div>

      <form className="quote-form" noValidate onSubmit={handleSubmit(onSubmit)}>
        <input type="hidden" {...register("clientId")} />
        <section className="quote-panel">
          <h2>Datos del presupuesto</h2>
          <label>
            <span>Tipo de obra</span>
            <input {...register("work")} />
            {errors.work && <p className="form-error">{errors.work.message}</p>}
          </label>

          <label>
            <span>Seleccionar cliente guardado</span>
            <select
              className="select-form"
              onChange={handleClientSelect}
              defaultValue={quote.clientId ?? ""}
            >
              <option value="">Selecciona un cliente</option>
              {clients.map((client) => (
                <option key={client.id} value={client.id}>
                  {client.name}
                </option>
              ))}
            </select>
          </label>
          {clients.length === 0 && (
            <p className="quote-client-empty">
              Aún no tienes clientes guardados.{" "}
              <Link to="/clients">Agrega uno para continuar</Link>.
            </p>
          )}

          <div className="quote-client-grid">
            <label>
              <span>Cliente</span>
              <input {...register("client")} readOnly />
              {errors.client && (
                <p className="form-error">{errors.client.message}</p>
              )}
            </label>

            <label>
              <span>RIF/RUT cliente</span>
              <input {...register("clientRif")} readOnly />
              {errors.clientRif && (
                <p className="form-error">{errors.clientRif.message}</p>
              )}
            </label>
          </div>

          <label>
            <span>Dirección cliente</span>
            <input {...register("clientAddress")} readOnly />
            {errors.clientAddress && (
              <p className="form-error">{errors.clientAddress.message}</p>
            )}
          </label>

          <div className="quote-client-grid">
            <label>
              <span>Fecha emisión</span>
              <input type="date" {...register("issueDate")} />
              {errors.issueDate && (
                <p className="form-error">{errors.issueDate.message}</p>
              )}
            </label>

            <label>
              <span>Tipo de moneda</span>
              <input type="text" readOnly value={currencyLabel} />
            </label>
          </div>

          <label className="quote-notes-field">
            <span>Nota del presupuesto</span>
            <textarea
              rows={3}
              placeholder="Agrega condiciones de pago, vigencia o cualquier aclaración para el PDF"
              {...register("notes")}
            />
            {errors.notes && (
              <p className="form-error">{errors.notes.message}</p>
            )}
          </label>
        </section>

        <section className="quote-panel">
          <div className="quote-items-heading">
            <h2>Ítems</h2>
            <button
              type="button"
              onClick={() =>
                append({
                  code: "NA",
                  unit: "NA",
                  description: "",
                  quantity: 1,
                  sg: "",
                  unitPrice: 0,
                })
              }
            >
              + Agregar ítem
            </button>
          </div>
          {errors.items && <p className="form-error">{errors.items.message}</p>}

          <div className="quote-items-list">
            {fields.map((field, index) => (
              <div className="quote-item-row" key={field.id}>
                <label>
                  <span>Código</span>
                <input
                  {...register(`items.${index}.code` as const)}
                />
                </label>

                <label>
                  <span>UND</span>
                  <input {...register(`items.${index}.unit` as const)} />
                </label>

                <label className="quote-description-field">
                  <span>Descripción</span>
                <input
                  {...register(`items.${index}.description` as const)}
                />
                {errors.items?.[index]?.description && (
                  <p className="form-error">
                    {errors.items[index]?.description?.message}
                  </p>
                )}
                </label>

                <label>
                  <span>Cant.</span>
                <input
                  type="number"
                    min="1"
                    step="1"
                    inputMode="numeric"
                  {...register(`items.${index}.quantity` as const)}
                />
                {errors.items?.[index]?.quantity && (
                  <p className="form-error">
                    {errors.items[index]?.quantity?.message}
                  </p>
                )}
                </label>

                <label>
                  <span>SG</span>
                  <input {...register(`items.${index}.sg` as const)} />
                </label>

                <label>
                  <span>P/unit.</span>
                <input
                  type="number"
                    min="0"
                    step="0.01"
                    inputMode="decimal"
                  {...register(`items.${index}.unitPrice` as const)}
                />
                {errors.items?.[index]?.unitPrice && (
                  <p className="form-error">
                    {errors.items[index]?.unitPrice?.message}
                  </p>
                )}
                </label>

              <button
                  className="quote-remove-item"
                type="button"
                onClick={() => remove(index)}
                  disabled={fields.length === 1}
                  aria-label={`Eliminar ítem ${index + 1}`}
              >
                ✕
              </button>
              </div>
            ))}
          </div>

          <div className="quote-totals">
            <div>
              <span>Subtotal</span>
              <strong>{formatMoney(subtotal, currency)}</strong>
            </div>
            <div>
              <span>IVA ({ivaRate}%)</span>
              <strong>{formatMoney(iva, currency)}</strong>
            </div>
            <div className="quote-total-row">
              <span>Total</span>
              <strong>{formatMoney(total, currency)}</strong>
            </div>
          </div>
        </section>

        <div className="quote-submit-row">
          {!isCompanyReady && (
            <p className="form-error">
              Espera un momento mientras cargamos la empresa.
            </p>
          )}
          <button type="submit" disabled={isSubmitting || !isCompanyReady}>
            {isSubmitting ? "Guardando..." : "Guardar y ver vista previa"}
          </button>
        </div>
      </form>
    </div>
  );
};
