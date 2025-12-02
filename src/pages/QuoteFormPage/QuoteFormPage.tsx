import { z } from 'zod';
import { useNavigate } from 'react-router-dom';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  useFieldArray,
  useForm,
  type Resolver,
  type SubmitHandler,
} from 'react-hook-form';
import { useQuote } from '../../context/QuoteContext';
import type { ChangeEvent } from 'react';
import Swal from 'sweetalert2';

const itemSchema = z.object({
  code: z.string().default('NA'),
  unit: z.string().default('NA'),
  description: z.string().min(1, 'La Descripción es requerida'),
  quantity: z.coerce.number().min(1, 'La cantidad debe ser al menos 1'),
  sg: z.string().default(''),
  unitPrice: z.coerce.number().min(1, 'Campo de precio sin valor'),
});

const formSchema = z
  .object({
    work: z.string().min(1, 'Describe el tipo de Trabajo'),
    client: z.string().min(1, 'Nombre de cliente obligatorio'),
    clientRif: z.string().min(1, 'Número de razón social'),
    clientAddress: z.string().min(1, 'Ingresa una dirección'),
    clientId: z.string().optional(),
    issueDate: z
      .string()
      .min(1, 'La fecha es obligatoria')
      .regex(/^\d{4}-\d{2}-\d{2}$/, 'Formato de fecha inválido'),
    items: z.array(itemSchema).min(1, 'Debes agregar al menos un ítem'),
  })
  .refine((data) => data.items.some((i) => i.unitPrice > 0), {
    message: 'Al menos un ítem debe tener precio mayor a 0',
    path: ['items'],
  });

type FormValues = z.infer<typeof formSchema>;

export const QuoteFormPage = () => {
  const navigate = useNavigate();

  const { quote, items, setFromForm, clients } = useQuote();

  const resolver: Resolver<FormValues> = zodResolver(
    formSchema
  ) as Resolver<FormValues>;

  const {
    control,
    register,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm<FormValues>({
    resolver,
    defaultValues: {
      work: quote.work,
      client: quote.client,
      clientRif: quote.clientRif,
      clientAddress: quote.clientAddress,
      issueDate: quote.issueDate,
      clientId: quote.clientId ?? '',
      items: items,
    },
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: 'items',
  });

  const onSubmit: SubmitHandler<FormValues> = async (data) => {
    setFromForm({
      quote: {
        work: data.work,
        client: data.client,
        clientRif: data.clientRif,
        clientAddress: data.clientAddress,
        issueDate: data.issueDate,
        clientId: data.clientId,
      },
      items: data.items,
    });

    await Swal.fire({
      icon: 'success',
      title: 'Presupuesto listo',
      text: 'Los datos se guardaron correctamente. Ahora verás la vista previa del PDF.',
      timer: 1700,
      showConfirmButton: false,
    });

    navigate('/quotes/preview');
  };

  const handleClientSelect = (e: ChangeEvent<HTMLSelectElement>) => {
    const clientId = e.target.value;

    if (!clientId) {
      setValue('client', '');
      setValue('clientRif', '');
      setValue('clientAddress', '');
      setValue('clientId', '');
      return;
    }

    const selected = clients.find((c) => c.id === clientId);
    if (!selected) return;

    setValue('client', selected.name);
    setValue('clientRif', selected.rif);
    setValue('clientAddress', selected.address);
    setValue('clientId', clientId);
  };

  return (
    <div className="page">
      <h1>Nuevo presupuesto</h1>

      <form onSubmit={handleSubmit(onSubmit)}>
        <input
          type="hidden"
          {...register('clientId')}
        />
        <div className="section">
          <h2>Datos del presupuesto</h2>
          <label>
            <span>Tipo de Obra</span>
            <input
              {...register('work')}
              style={{ width: '100%' }}
            />
            {errors.work && <p className="form-error">{errors.work.message}</p>}
          </label>

          {/* Selector de cliente guardado */}
          <label>
            <span>Seleccionar cliente guardado</span>
            <select
              className="select-form"
              onChange={handleClientSelect}
              defaultValue={quote.clientId ?? ''}
            >
              <option value="">-- Selecciona un cliente --</option>
              {clients.map((client) => (
                <option
                  key={client.id}
                  value={client.id}
                >
                  {client.name}
                </option>
              ))}
            </select>
          </label>

          <label>
            <span>Cliente</span>
            <input
              {...register('client')}
              readOnly
              style={{ width: '100%' }}
            />
            {errors.client && (
              <p className="form-error">{errors.client.message}</p>
            )}
          </label>
          <label>
            <span>RIF Cliente</span>
            <input
              {...register('clientRif')}
              readOnly
              style={{ width: '100%' }}
            />
            {errors.clientRif && (
              <p className="form-error">{errors.clientRif.message}</p>
            )}
          </label>
          <label>
            <span>Dirección Cliente</span>
            <input
              {...register('clientAddress')}
              readOnly
              style={{ width: '100%' }}
            />
            {errors.clientAddress && (
              <p className="form-error">{errors.clientAddress.message}</p>
            )}
          </label>
          <label>
            <span>Fecha emisión</span>
            <input
              type="date"
              {...register('issueDate')}
              style={{ width: '100%' }}
            />
          </label>
          {errors.issueDate && (
            <p className="form-error">{errors.issueDate.message}</p>
          )}

          <p>Ítems</p>
          {errors.items && <p className="form-error">{errors.items.message}</p>}
          {fields.map((field, index) => (
            <div
              key={field.id}
              style={{
                display: 'grid',
                gridTemplateColumns: '0.6fr 0.6fr 2fr 0.6fr 0.6fr 1fr auto',
                gap: 4,
                marginBottom: 6,
              }}
            >
              <div>
                <input
                  placeholder="Código"
                  {...register(`items.${index}.code` as const)}
                />
              </div>

              <div>
                <input
                  placeholder="UND"
                  {...register(`items.${index}.unit` as const)}
                />
              </div>

              <div>
                <input
                  placeholder="Descripción"
                  {...register(`items.${index}.description` as const)}
                />
                {errors.items?.[index]?.description && (
                  <p className="form-error">
                    {errors.items[index]?.description?.message}
                  </p>
                )}
              </div>

              <div>
                <input
                  type="number"
                  placeholder="Cant."
                  {...register(`items.${index}.quantity` as const)}
                />
                {errors.items?.[index]?.quantity && (
                  <p className="form-error">
                    {errors.items[index]?.quantity?.message}
                  </p>
                )}
              </div>

              <div>
                <input
                  placeholder="SG"
                  {...register(`items.${index}.sg` as const)}
                />
              </div>

              <div>
                <input
                  type="number"
                  placeholder="P/Unit."
                  {...register(`items.${index}.unitPrice` as const)}
                />
                {errors.items?.[index]?.unitPrice && (
                  <p className="form-error">
                    {errors.items[index]?.unitPrice?.message}
                  </p>
                )}
              </div>

              <button
                type="button"
                onClick={() => remove(index)}
                disabled={fields.length === 1} // no permitir dejar 0 ítems
                style={{
                  padding: '0.2rem 0.5rem',
                  fontSize: '0.75rem',
                }}
              >
                ✕
              </button>
            </div>
          ))}
          <button
            type="button"
            onClick={() =>
              append({
                code: 'NA',
                unit: 'NA',
                description: '',
                quantity: 1,
                sg: '',
                unitPrice: 0,
              })
            }
          >
            + Agregar ítem
          </button>

          <div style={{ marginTop: 16 }}>
            <button type="submit">Guardar y ver vista previa</button>
          </div>
        </div>
      </form>
    </div>
  );
};
