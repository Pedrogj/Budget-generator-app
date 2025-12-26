import { useForm } from "react-hook-form";
import z from "zod";
import Swal from "sweetalert2";
import { zodResolver } from "@hookform/resolvers/zod";
import { useQuote } from "../../context/QuoteContext";
import type { ClientInfo } from "../../types/types";
import { useState } from "react";

const clientSchema = z.object({
  name: z.string().min(2, "El nombre es requerido"),
  rif: z.string().min(2, "Número de razon social requerido"),
  address: z.string().min(2, "La dirección es requerido"),
});

type ClientFormValues = z.infer<typeof clientSchema>;

export const ClientsPage = () => {
  const [editingId, setEditingId] = useState<string | null>(null);
  const { clients, addClient, removeClient, updateClient } = useQuote();

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<ClientFormValues>({
    resolver: zodResolver(clientSchema),
    defaultValues: {
      name: "",
      rif: "",
      address: "",
    },
  });

  const onSubmit = async (data: ClientFormValues) => {
    if (editingId) {
      // Edit client mode
      updateClient(editingId, data);
      setEditingId(null);
      reset({
        name: "",
        rif: "",
        address: "",
      });

      await Swal.fire({
        icon: "success",
        title: "Cliente actualizado",
        text: "Los datos del cliente se actualizaron correctamente.",
        timer: 1500,
        showConfirmButton: false,
      });
    } else {
      // Add client mode
      addClient(data);
      reset({
        name: "",
        rif: "",
        address: "",
      });

      await Swal.fire({
        icon: "success",
        title: "Cliente agregado",
        text: "El cliente se agregó correctamente.",
        timer: 1500,
        showConfirmButton: false,
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

    await removeClient(id);

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
      reset({
        name: "",
        rif: "",
        address: "",
      });
    }
  };

  const handleEditClick = (client: ClientInfo) => {
    setEditingId(client.id);
    reset({
      name: client.name,
      rif: client.rif,
      address: client.address,
    });
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    reset({
      name: "",
      rif: "",
      address: "",
    });
  };

  return (
    <div className="page">
      <h1>Clientes</h1>

      <form onSubmit={handleSubmit(onSubmit)}>
        <div className="section">
          <h2>Nuevo cliente</h2>

          <label>
            <span>Nombre</span>
            <input {...register("name")} />
            {errors.name && <p className="form-error">{errors.name.message}</p>}
          </label>

          <label>
            <span>RIF</span>
            <input {...register("rif")} />
            {errors.rif && <p className="form-error">{errors.rif.message}</p>}
          </label>

          <label>
            <span>Dirección</span>
            <textarea
              {...register("address")}
              style={{ width: "100%", minHeight: 60 }}
            />
            {errors.address && (
              <p className="form-error">{errors.address.message}</p>
            )}
          </label>

          <div style={{ display: "flex", gap: 8, marginTop: 8 }}>
            <button type="submit">
              {editingId ? "Guardar cambios" : "Agregar cliente"}
            </button>

            {editingId && (
              <button
                type="button"
                onClick={handleCancelEdit}
                style={{
                  backgroundColor: "#111827",
                  border: "1px solid #374151",
                }}
              >
                Cancelar edición
              </button>
            )}
          </div>
        </div>
      </form>

      <div className="section">
        <h2>Listado de clientes</h2>
        {clients.length === 0 ? (
          <p>No hay clientes aún.</p>
        ) : (
          <>
            {clients.map((client: ClientInfo) => (
              <div
                className="list-client-page"
                key={client.id}
                style={{
                  marginBottom: 8,
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  gap: 8,
                }}
              >
                <div>
                  <strong>{client.name}</strong> — {client.rif}
                  <br />
                  <span style={{ fontSize: 12, color: "#9ca3af" }}>
                    {client.address}
                  </span>
                </div>
                <div style={{ display: "flex", gap: 6 }}>
                  <button
                    type="button"
                    onClick={() => handleEditClick(client)}
                    style={{
                      padding: "0.2rem 0.6rem",
                      fontSize: "0.75rem",
                    }}
                  >
                    Editar
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDelete(client.id, client.name)}
                    style={{
                      padding: "0.2rem 0.6rem",
                      fontSize: "0.75rem",
                    }}
                    disabled={isSubmitting}
                  >
                    Eliminar
                  </button>
                </div>
              </div>
            ))}
          </>
        )}
      </div>
    </div>
  );
};
