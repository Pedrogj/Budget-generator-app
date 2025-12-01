import { useForm } from 'react-hook-form';
import z from 'zod';
import Swal from 'sweetalert2';
import { zodResolver } from '@hookform/resolvers/zod';
import { useQuote } from '../../context/QuoteContext';
import type { ClientInfo } from '../../types/types';

const clientSchema = z.object({
  name: z.string().min(2, 'El nombre es requerido'),
  rif: z.string().min(2, 'Número de razon social requerido'),
  address: z.string().min(2, 'La dirección es requerido'),
});

type ClientFormValues = z.infer<typeof clientSchema>;

export const ClientsPage = () => {
  const { clients, addClient, removeClient } = useQuote();

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<ClientFormValues>({
    resolver: zodResolver(clientSchema),
    defaultValues: {
      name: '',
      rif: '',
      address: '',
    },
  });

  const onSubmit = async (data: ClientFormValues) => {
    addClient(data);
    reset();

    await Swal.fire({
      icon: 'success',
      title: 'Cliente agregado',
      text: 'El cliente se agregó correctamente.',
      timer: 1500,
      showConfirmButton: false,
    });
  };

  const handleDelete = async (id: string, name: string) => {
    const result = await Swal.fire({
      title: `¿Eliminar cliente?`,
      text: `Se eliminará el cliente "${name}". Esta acción no se puede deshacer.`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Sí, eliminar',
      cancelButtonText: 'Cancelar',
      confirmButtonColor: '#ef4444',
      cancelButtonColor: '#6b7280',
    });
    if (!result.isConfirmed) return;
    removeClient(id);
    await Swal.fire({
      icon: 'success',
      title: 'Cliente eliminado',
      text: `El cliente "${name}" fue eliminado.`,
      timer: 1500,
      showConfirmButton: false,
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
            <input {...register('name')} />
            {errors.name && <p className="form-error">{errors.name.message}</p>}
          </label>

          <label>
            <span>RIF</span>
            <input {...register('rif')} />
            {errors.rif && <p className="form-error">{errors.rif.message}</p>}
          </label>

          <label>
            <span>Dirección</span>
            <textarea
              {...register('address')}
              style={{ width: '100%', minHeight: 60 }}
            />
            {errors.address && (
              <p className="form-error">{errors.address.message}</p>
            )}
          </label>

          <button type="submit">Agregar cliente</button>
        </div>
      </form>

      <div className="section">
        <h2>Listado de clientes</h2>
        {clients.length === 0 ? (
          <p>No hay clientes aún.</p>
        ) : (
          <ul>
            {clients.map((client: ClientInfo) => (
              <li
                key={client.id}
                style={{
                  marginBottom: 8,
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  gap: 8,
                }}
              >
                <div>
                  <strong>{client.name}</strong> — {client.rif}
                  <br />
                  <span style={{ fontSize: 12, color: '#9ca3af' }}>
                    {client.address}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => handleDelete(client.id, client.name)}
                  style={{
                    padding: '0.2rem 0.6rem',
                    fontSize: '0.75rem',
                  }}
                >
                  Eliminar
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
};
