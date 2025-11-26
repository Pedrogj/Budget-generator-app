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

const itemSchema = z.object({
  code: z.string().default('NA'),
  unit: z.string().default('NA'),
  description: z.string().min(1, 'Descripción requerida'),
  quantity: z.coerce.number().min(1),
  sg: z.string().default(''),
  unitPrice: z.coerce.number().min(0),
});

const formSchema = z.object({
  work: z.string().min(1),
  client: z.string().min(1),
  clientRif: z.string().min(1),
  clientAddress: z.string().min(1),
  issueDate: z.string().min(1),
  items: z.array(itemSchema).min(1),
});

type FormValues = z.infer<typeof formSchema>;

export const QuoteFormPage = () => {
  const navigate = useNavigate();

  const { quote, items, setFromForm } = useQuote();

  const resolver: Resolver<FormValues> = zodResolver(
    formSchema
  ) as Resolver<FormValues>;

  const { control, register, handleSubmit } = useForm<FormValues>({
    resolver,
    defaultValues: {
      work: quote.work,
      client: quote.client,
      clientRif: quote.clientRif,
      clientAddress: quote.clientAddress,
      issueDate: quote.issueDate,
      items: items,
    },
  });

  const { fields, append } = useFieldArray({
    control,
    name: 'items',
  });

  const onSubmit: SubmitHandler<FormValues> = (data) => {
    setFromForm({
      quote: {
        work: data.work,
        client: data.client,
        clientRif: data.clientRif,
        clientAddress: data.clientAddress,
        issueDate: data.issueDate,
      },
      items: data.items,
    });

    navigate('/quotes/preview');
  };

  return (
    <div>
      <h1>Nuevo presupuesto</h1>

      <form onSubmit={handleSubmit(onSubmit)}>
        <h2>Datos del presupuesto</h2>
        <label>
          Obra
          <input
            {...register('work')}
            style={{ width: '100%' }}
          />
        </label>
        <label>
          Cliente
          <input
            {...register('client')}
            style={{ width: '100%' }}
          />
        </label>
        <label>
          RIF Cliente
          <input
            {...register('clientRif')}
            style={{ width: '100%' }}
          />
        </label>
        <label>
          Dirección Cliente
          <input
            {...register('clientAddress')}
            style={{ width: '100%' }}
          />
        </label>
        <label>
          Fecha emisión
          <input
            {...register('issueDate')}
            style={{ width: '100%' }}
          />
        </label>

        <h2>Ítems</h2>
        {fields.map((field, index) => (
          <div
            key={field.id}
            style={{
              display: 'grid',
              gridTemplateColumns: '0.6fr 0.6fr 2fr 0.6fr 0.6fr 1fr',
              gap: 4,
              marginBottom: 6,
            }}
          >
            <input
              placeholder="Código"
              {...register(`items.${index}.code` as const)}
            />
            <input
              placeholder="UND"
              {...register(`items.${index}.unit` as const)}
            />
            <input
              placeholder="Descripción"
              {...register(`items.${index}.description` as const)}
            />
            <input
              type="number"
              placeholder="Cant."
              {...register(`items.${index}.quantity` as const, {
                valueAsNumber: true,
              })}
            />
            <input
              placeholder="SG"
              {...register(`items.${index}.sg` as const)}
            />
            <input
              type="number"
              placeholder="P/Unit."
              {...register(`items.${index}.unitPrice` as const, {
                valueAsNumber: true,
              })}
            />
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
      </form>
    </div>
  );
};
