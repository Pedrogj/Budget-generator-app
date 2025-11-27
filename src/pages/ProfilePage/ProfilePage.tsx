import { useState } from 'react';
import { useQuote } from '../../context/QuoteContext';
import { useForm } from 'react-hook-form';

interface ProfileFormValues {
  name: string;
  rif: string;
  phone: string;
  logoUrl: string;
  addressLines: string;
}

export const ProfilePage = () => {
  const { company, updateCompany } = useQuote();
  const [saved, setSaved] = useState(false);

  const { register, handleSubmit, reset } = useForm<ProfileFormValues>({
    defaultValues: {
      name: company.name,
      rif: company.rif,
      phone: company.phone,
      logoUrl: company.logoUrl ?? '',
      addressLines: company.addressLines ?? '',
    },
  });

  const onSubmit = (data: ProfileFormValues) => {
    updateCompany({
      name: data.name,
      rif: data.rif,
      phone: data.phone,
      logoUrl: data.logoUrl || undefined,
      addressLines: data.addressLines,
    });

    setSaved(true);
    // We refresh values ​​with what has been saved
    reset(data);
    setTimeout(() => setSaved(false), 2000);
  };

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
          <label style={{ display: 'block', marginBottom: 8 }}>
            <span>Nombre de la Empresa</span>
            <input
              {...register('name', { required: true })}
              style={{ width: '100%' }}
            />
          </label>
          {/* Rif company */}
          <label style={{ display: 'block', marginBottom: 8 }}>
            <span>RIF</span>
            <input
              {...register('rif', { required: true })}
              style={{ width: '100%' }}
            />
          </label>
          {/* Phone */}
          <label style={{ display: 'block', marginBottom: 8 }}>
            <span>Teléfono</span>
            <input
              {...register('phone', { required: true })}
              style={{ width: '100%' }}
            />
          </label>
          {/* Logo company */}
          <label style={{ display: 'block', marginBottom: 8 }}>
            <span>Logo de Empresa</span>
            <input
              {...register('logoUrl')}
              style={{ width: '100%' }}
            />
          </label>

          <label style={{ display: 'block', marginBottom: 8 }}>
            <span>Dirección</span>
            <input
              {...register('addressLines', { required: true })}
              style={{ width: '100%' }}
            />
          </label>

          <button type="submit">Guardar cambios</button>
          {saved && (
            <p style={{ color: 'green', marginTop: 8 }}>
              Datos guardados correctamente ✅
            </p>
          )}
        </div>
      </form>
    </div>
  );
};
