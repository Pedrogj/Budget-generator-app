import { useForm } from "react-hook-form";
import z from "zod";
import Swal from "sweetalert2";
import { zodResolver } from "@hookform/resolvers/zod";
import { useQuote } from "../../context/QuoteContext";
import type { ClientInfo } from "../../types/types";
import { useMemo, useState } from "react";

const clientSchema = z.object({
  name: z.string().trim().min(2, "Ingresa al menos 2 caracteres"),
  rif: z.string().trim().min(2, "Ingresa el documento fiscal del cliente"),
  address: z.string().trim().min(2, "Ingresa la dirección del cliente"),
  email: z
    .string()
    .trim()
    .email("Ingresa un correo válido")
    .or(z.literal(""))
    .optional(),
  phone: z.string().trim().optional(),
});

type ClientFormValues = z.infer<typeof clientSchema>;

const emptyClientForm: ClientFormValues = {
  name: "",
  rif: "",
  address: "",
  email: "",
  phone: "",
};

function getErrorMessage(error: unknown) {
  if (error instanceof Error && error.message) {
    return error.message;
  }

  return "Ocurrió un problema al guardar el cliente. Intenta nuevamente.";
}

export const ClientsPage = () => {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const { clients, addClient, removeClient, updateClient, company } =
    useQuote();
  const taxIdLabel = company.taxIdLabel ?? "RIF";

  const isCompanyReady = !!company.id;
  const editingClient = clients.find((client) => client.id === editingId);
  const trimmedSearch = searchTerm.trim().toLowerCase();
  const filteredClients = useMemo(() => {
    if (!trimmedSearch) return clients;

    return clients.filter((client) =>
      [client.name, client.rif, client.address, client.email, client.phone]
        .filter(Boolean)
        .some((value) => value!.toLowerCase().includes(trimmedSearch)),
    );
  }, [clients, trimmedSearch]);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<ClientFormValues>({
    resolver: zodResolver(clientSchema),
    defaultValues: {
      ...emptyClientForm,
    },
  });
  const {
    register: registerEdit,
    handleSubmit: handleEditSubmit,
    reset: resetEdit,
    formState: {
      errors: editErrors,
      isSubmitting: isEditSubmitting,
    },
  } = useForm<ClientFormValues>({
    resolver: zodResolver(clientSchema),
    defaultValues: {
      ...emptyClientForm,
    },
  });

  const onSubmit = async (data: ClientFormValues) => {
    try {
      await addClient(data);
      reset(emptyClientForm);

      await Swal.fire({
        icon: "success",
        title: "Cliente agregado",
        text: "El cliente se agregó correctamente.",
        timer: 1500,
        showConfirmButton: false,
      });
    } catch (err) {
      console.error("Error al guardar cliente", err);
      await Swal.fire({
        icon: "error",
        title: "No se pudo guardar el cliente",
        text: getErrorMessage(err),
      });
    }
  };

  const onEditSubmit = async (data: ClientFormValues) => {
    if (!editingId) return;

    try {
      await updateClient(editingId, data);
      setEditingId(null);
      resetEdit(emptyClientForm);

      await Swal.fire({
        icon: "success",
        title: "Cliente actualizado",
        text: "Los datos del cliente se actualizaron correctamente.",
        timer: 1500,
        showConfirmButton: false,
      });
    } catch (err) {
      console.error("Error al guardar cliente", err);
      await Swal.fire({
        icon: "error",
        title: "No se pudo guardar el cliente",
        text: getErrorMessage(err),
      });
    }
  };

  const handleDelete = async (id: string, name: string) => {
    const result = await Swal.fire({
      title: `¿Eliminar cliente?`,
      text: `Se eliminará el cliente "${name}". Esta acción no se puede deshacer.`,
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Sí, eliminar",
      cancelButtonText: "Cancelar",
      confirmButtonColor: "#ef4444",
      cancelButtonColor: "#6b7280",
    });

    if (!result.isConfirmed) return;

    try {
      await removeClient(id);
    } catch (err) {
      console.error("Error al eliminar cliente", err);
      await Swal.fire({
        icon: "error",
        title: "No se pudo eliminar el cliente",
        text: getErrorMessage(err),
      });
      return;
    }

    await Swal.fire({
      icon: "success",
      title: "Cliente eliminado",
      text: `El cliente "${name}" fue eliminado.`,
      timer: 1500,
      showConfirmButton: false,
    });

    // If you were editing that client, we reset
    if (editingId === id) {
      setEditingId(null);
      resetEdit(emptyClientForm);
    }
  };

  const handleEditClick = (client: ClientInfo) => {
    setEditingId(client.id);
    resetEdit({
      name: client.name,
      rif: client.rif,
      address: client.address,
      email: client.email ?? "",
      phone: client.phone ?? "",
    });
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    resetEdit(emptyClientForm);
  };

  return (
    <div className="page clients-page">
      <div className="clients-header">
        <div>
          <h1>Clientes</h1>
          <p className="clients-subtitle">
            Mantén a mano los datos que se reutilizan al crear presupuestos.
          </p>
        </div>
        <span className="clients-count">
          {clients.length} {clients.length === 1 ? "cliente" : "clientes"}
        </span>
      </div>

      <section className="clients-panel">
        <form className="client-form" noValidate onSubmit={handleSubmit(onSubmit)}>
          <div className="client-form-heading">
            <h2>Nuevo cliente</h2>
          </div>

          <label>
            <span>Nombre</span>
            <input autoComplete="organization" {...register("name")} />
            {errors.name && <p className="form-error">{errors.name.message}</p>}
          </label>

          <label>
            <span>{taxIdLabel}</span>
            <input autoComplete="off" {...register("rif")} />
            {errors.rif && <p className="form-error">{errors.rif.message}</p>}
          </label>

          <div className="client-form-grid">
            <label>
              <span>Correo</span>
              <input
                type="email"
                autoComplete="email"
                inputMode="email"
                {...register("email")}
              />
              {errors.email && (
                <p className="form-error">{errors.email.message}</p>
              )}
            </label>

            <label>
              <span>Teléfono</span>
              <input type="tel" autoComplete="tel" {...register("phone")} />
              {errors.phone && (
                <p className="form-error">{errors.phone.message}</p>
              )}
            </label>
          </div>

          <label>
            <span>Dirección</span>
            <textarea className="client-address" {...register("address")} />
            {errors.address && (
              <p className="form-error">{errors.address.message}</p>
            )}
          </label>

          <div className="client-form-actions">
            <button type="submit" disabled={isSubmitting || !isCompanyReady}>
              Agregar cliente
            </button>

            {!isCompanyReady && (
              <p className="form-error client-form-status">
                Espera un momento mientras cargamos la empresa
              </p>
            )}

          </div>
        </form>
      </section>

      <section className="clients-panel">
        <div className="clients-list-header">
          <h2>Listado de clientes</h2>
          <label className="client-search">
            <span>Buscar cliente</span>
            <input
              type="search"
              placeholder={`Nombre, ${taxIdLabel}, correo o teléfono`}
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
            />
          </label>
        </div>

        {clients.length === 0 ? (
          <div className="clients-empty">
            <strong>No hay clientes aún.</strong>
            <p>Agrega tu primer cliente para reutilizarlo en presupuestos.</p>
          </div>
        ) : filteredClients.length === 0 ? (
          <div className="clients-empty">
            <strong>No encontramos coincidencias.</strong>
            <p>Prueba con otro nombre, {taxIdLabel}, correo o teléfono.</p>
          </div>
        ) : (
          <div className="clients-list">
            {filteredClients.map((client: ClientInfo) => (
              <article className="client-list-item" key={client.id}>
                <div className="client-summary">
                  <div className="client-title-row">
                    <strong>{client.name}</strong>
                    <span>
                      {taxIdLabel} {client.rif}
                    </span>
                  </div>
                  <div className="client-detail-grid">
                    <div>
                      <span>Dirección</span>
                      <strong>{client.address}</strong>
                    </div>
                    <div>
                      <span>Contacto</span>
                      <strong>
                        {client.email || client.phone
                          ? [client.email, client.phone].filter(Boolean).join(" · ")
                          : "Sin contacto"}
                      </strong>
                    </div>
                  </div>
                </div>
                <div className="client-actions">
                  <button
                    type="button"
                    onClick={() => handleEditClick(client)}
                  >
                    Editar
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDelete(client.id, client.name)}
                    disabled={isSubmitting}
                  >
                    Eliminar
                  </button>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>

      {editingClient && (
        <div
          className="client-modal-backdrop"
          role="presentation"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) {
              handleCancelEdit();
            }
          }}
        >
          <section
            className="client-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="client-edit-title"
          >
            <div className="client-modal-header">
              <div>
                <h2 id="client-edit-title">Editar cliente</h2>
                <p>{editingClient.name}</p>
              </div>
              <button
                type="button"
                className="client-modal-close"
                onClick={handleCancelEdit}
                aria-label="Cerrar edición"
              >
                ×
              </button>
            </div>

            <form
              className="client-form"
              noValidate
              onSubmit={handleEditSubmit(onEditSubmit)}
            >
              <label>
                <span>Nombre</span>
                <input autoComplete="organization" {...registerEdit("name")} />
                {editErrors.name && (
                  <p className="form-error">{editErrors.name.message}</p>
                )}
              </label>

              <label>
                <span>{taxIdLabel}</span>
                <input autoComplete="off" {...registerEdit("rif")} />
                {editErrors.rif && (
                  <p className="form-error">{editErrors.rif.message}</p>
                )}
              </label>

              <div className="client-form-grid">
                <label>
                  <span>Correo</span>
                  <input
                    type="email"
                    autoComplete="email"
                    inputMode="email"
                    {...registerEdit("email")}
                  />
                  {editErrors.email && (
                    <p className="form-error">{editErrors.email.message}</p>
                  )}
                </label>

                <label>
                  <span>Teléfono</span>
                  <input type="tel" autoComplete="tel" {...registerEdit("phone")} />
                  {editErrors.phone && (
                    <p className="form-error">{editErrors.phone.message}</p>
                  )}
                </label>
              </div>

              <label>
                <span>Dirección</span>
                <textarea className="client-address" {...registerEdit("address")} />
                {editErrors.address && (
                  <p className="form-error">{editErrors.address.message}</p>
                )}
              </label>

              <div className="client-modal-actions">
                <button type="button" onClick={handleCancelEdit}>
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isEditSubmitting || !isCompanyReady}
                >
                  {isEditSubmitting ? "Guardando..." : "Guardar cambios"}
                </button>
              </div>
            </form>
          </section>
        </div>
      )}
    </div>
  );
};
