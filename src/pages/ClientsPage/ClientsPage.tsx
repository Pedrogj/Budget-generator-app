import { useForm } from 'react-hook-form';
import { useQuote } from '../../context/QuoteContext';
import type { ClientInfo } from '../../types/types';

interface ClientFormValues {
  name: string;
  rif: string;
  address: string;
}

export const ClientsPage = () => {
  const { clients, addClient } = useQuote();

  const { register, handleSubmit, reset } = useForm<ClientFormValues>({
    defaultValues: {
      name: '',
      rif: '',
      address: '',
    },
  });

  const onSubmit = (data: ClientFormValues) => {
    addClient(data);
    reset();
  };

  return (
    <div className="page">
      <h1>Clientes</h1>
      <form onSubmit={handleSubmit(onSubmit)}>
        <div className="section">
          <label>
            <span>Nombre</span>
            <input {...register('name', { required: true })} />
          </label>
          <label>
            <span>RIF</span>
            <input {...register('rif', { required: true })} />
          </label>
          <label>
            <span>Dirección</span>
            <input {...register('address', { required: true })} />
          </label>
          <button type="submit">Agregar cliente</button>
        </div>
      </form>

      <div className="section">
        <h2>Listado de clientes</h2>
        {clients.length === 0 ? (
          <p>No hay clientes, empieza creando</p>
        ) : (
          <>
            {clients.map((client: ClientInfo) => (
              <div key={client.id}>
                <strong>{client.name}</strong> - <p>{client.rif}</p>
                <p>{client.address}</p>
              </div>
            ))}
          </>
        )}
      </div>
    </div>
  );
};
