import { useState, type ChangeEvent } from 'react';
import { useQuote } from '../../context/QuoteContext';
import { useForm } from 'react-hook-form';

interface ProfileFormValues {
  name: string;
  rif: string;
  phone: string;
  addressLines: string;
  defaultCurrency: 'USD' | 'CLP';
}

export const ProfilePage = () => {
  const { company, updateCompany } = useQuote();

  const [saved, setSaved] = useState(false);
  const [logoError, setLogoError] = useState<string | null>(null);
  const [tempLogo, setTempLogo] = useState<string | undefined>(company.logoUrl);

  const {
    register,
    handleSubmit,
    reset,
    formState: { isDirty },
  } = useForm<ProfileFormValues>({
    defaultValues: {
      name: company.name,
      rif: company.rif,
      phone: company.phone,
      addressLines: company.addressLines ?? '',
      defaultCurrency: company.defaultCurrency ?? 'USD',
    },
  });

  const onSubmit = (data: ProfileFormValues) => {
    updateCompany({
      name: data.name,
      rif: data.rif,
      phone: data.phone,
      logoUrl: tempLogo || undefined,
      addressLines: data.addressLines,
      defaultCurrency: data.defaultCurrency,
    });

    setSaved(true);
    // We refresh values ​​with what has been saved
    reset(data);
    setTimeout(() => setSaved(false), 2000);
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
        setLogoError('No se pudo leer la imagen. Intenta con otro archivo.');
      };
      img.src = dataUrl;
    };
    reader.onerror = () => {
      setLogoError('Error al leer el archivo. Intenta nuevamente.');
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
          {/* Select Currency */}
          <label style={{ display: 'block', marginBottom: 8 }}>
            <span>Moneda por defecto</span>
            <select
              {...register('defaultCurrency')}
              style={{ width: '100%' }}
            >
              <option value="USD">USD (Dólares)</option>
              <option value="CLP">CLP (Pesos chilenos)</option>
            </select>
          </label>
          {/* Logo company */}
          <label style={{ display: 'block', marginBottom: 8 }}>
            <span>Logo de Empresa (máx. 600x600 px)</span>
            <input
              type="file"
              accept="image/png,image/jpeg"
              onChange={handleLogoChange}
            />
          </label>

          {logoError && (
            <p style={{ color: 'salmon', fontSize: 12, marginBottom: 8 }}>
              {logoError}
            </p>
          )}

          {tempLogo && !logoError && (
            <div style={{ marginTop: 8 }}>
              <span style={{ display: 'block', marginBottom: 4 }}>
                Vista previa:
              </span>
              <img
                src={tempLogo}
                alt="Logo de la empresa"
                style={{ height: 80, width: 'auto', borderRadius: 8 }}
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

          <button
            type="submit"
            disabled={isSubmitDisabled}
          >
            Guardar cambios
          </button>
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
