import { useState } from 'react';
import { useQuote } from '../../context/QuoteContext';
import { useForm } from 'react-hook-form';

interface ProfileFormValues {
  name: string;
  rif: string;
  phone: string;
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
      addressLines: company.addressLines ?? '',
    },
  });

  const onSubmit = (data: ProfileFormValues) => {
    updateCompany({
      name: data.name,
      rif: data.rif,
      phone: data.phone,
      logoUrl: company.logoUrl || undefined,
      addressLines: data.addressLines,
    });

    setSaved(true);
    // We refresh values ​​with what has been saved
    reset(data);
    setTimeout(() => setSaved(false), 2000);
  };

  const handleLogoChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = reader.result as string; // "data:image/png;base64,..."
      updateCompany({
        ...company,
        logoUrl: dataUrl,
      });
    };
    reader.readAsDataURL(file);
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
              type="file"
              accept="image/png,image/jpg"
              onChange={handleLogoChange}
            />
          </label>

          {company.logoUrl && (
            <div style={{ marginTop: 8 }}>
              <span style={{ display: 'block', marginBottom: 4 }}>
                Vista previa:
              </span>
              <img
                src={company.logoUrl}
                alt="Logo de la empresa"
                style={{ height: 60, width: 'auto', borderRadius: 8 }}
              />
            </div>
          )}

          <label style={{ display: 'block', marginBottom: 8 }}>
            <span>Dirección</span>
            <textarea
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
