# Agent Context — Budget Generator App

## Descripción

Aplicación web SPA para generar presupuestos profesionales en PDF. Los usuarios se registran, configuran su empresa, gestionan clientes y crean presupuestos con ítems detallados que se exportan como documentos PDF.

## Tech Stack

- **React 19** + **TypeScript** + **Vite 7** (con SWC)
- **React Router DOM 7** — enrutamiento SPA
- **Supabase** — autenticación (email/password) + PostgreSQL como base de datos
- **React Hook Form** + **Zod** — formularios con validación de esquemas
- **@react-pdf/renderer** — generación de PDFs en el cliente
- **SweetAlert2** — alertas y confirmaciones
- **Vitest** + **React Testing Library** + **jsdom** — pruebas de componentes
- **Vanilla CSS** — sin frameworks CSS, se usa la fuente Roboto (Google Fonts)

## Estructura del Proyecto

```
src/
├── main.tsx                    # Punto de entrada, monta <App /> en #root
├── App.tsx                     # BrowserRouter > AuthProvider > QuoteProvider > AppRouter
├── AppRouter.tsx               # Definición de rutas (públicas + protegidas con RequiredAuth)
├── index.css                   # Estilos globales (reset, inputs, botones, layout)
│
├── context/
│   ├── AuthContext.tsx          # Provider de autenticación (Supabase Auth)
│   │                            Expone: user, loading, login(), register(), logout()
│   └── QuoteContext.tsx         # Provider de estado global (empresa, clientes, presupuesto)
│                                Expone: company, quote, items, clients,
│                                selectedTemplate, setQuoteTemplate(),
│                                setFromForm(), updateCompany(), addClient(),
│                                removeClient(), updateClient(), saveQuote()
│
├── components/
│   ├── index.ts                 # Barrel export (solo Navbar por ahora)
│   ├── quoteTemplates.ts        # Catálogo de modelos PDF disponibles
│   ├── Navbar/
│   │   ├── Navbar.tsx           # Sidebar desktop, topbar sticky con empresa y menú móvil
│   │   └── Navbar.css           # Estilos del navbar (dark theme, responsive)
│   ├── RequiredAuth/
│   │   └── RequiredAuth.tsx     # HOC guardia de rutas: redirige a /login si no hay sesión
│   └── QuotePdfDocument.tsx     # Componente @react-pdf con plantilla PDF profesional
│
├── pages/
│   ├── LoginPage/LoginPage.tsx          # Login con email/password
│   ├── RegisterPage/RegisterPage.tsx    # Registro + auto-login → redirige a /profile
│   ├── ForgotPasswordPage/ForgotPasswordPage.tsx  # Solicita correo de recuperación
│   ├── ResetPasswordPage/ResetPasswordPage.tsx    # Define nueva contraseña
│   ├── ProfilePage/ProfilePage.tsx      # Config empresa + logo validado/removible
│   ├── ClientsPage/ClientsPage.tsx      # CRUD de clientes + búsqueda
│   ├── QuoteFormPage/QuoteFormPage.tsx  # Presupuesto con cliente, ítems dinámicos y totales en vivo
│   ├── QuotePreviewPage/QuotePreviewPage.tsx  # Vista previa PDF (PDFViewer) + descarga (PDFDownloadLink)
│   ├── QuoteTemplatesPage/QuoteTemplatesPage.tsx  # Catálogo visual de modelos PDF
│   └── HistoryPage/HistoryPage.tsx      # Historial de presupuestos guardados + exportar/eliminar
│
├── lib/
│   ├── accountDeletion.ts      # Invoca Edge Function delete-account y cierra sesión
│   ├── passwordRecovery.ts     # resetPasswordForEmail + updateUser
│   └── supabaseClient.ts       # Instancia singleton de createClient(url, anonKey)
│
├── supabase/functions/
│   └── delete-account/index.ts # Edge Function para borrar cuenta + datos + PDFs
│
└── types/
    └── types.ts                 # Interfaces: QuoteItem, CompanyInfo, QuoteInfo, ClientInfo
```

## Arquitectura de Providers

```
BrowserRouter
  └── AuthProvider        ← Supabase Auth: sesión, login, register, logout
       └── QuoteProvider  ← Carga company + clients desde Supabase al montar
            └── AppRouter ← Rutas con Navbar global
```

- **AuthContext** escucha `onAuthStateChange` para persistir la sesión.
- Recuperación de contraseña: `/forgot-password` llama `resetPasswordForEmail()` con `redirectTo` hacia `/reset-password`; `/reset-password` llama `updateUser({ password })` cuando Supabase ya procesó el enlace de recuperación.
- **QuoteContext** depende de `useAuth()`. Cuando `user` cambia:
  - Si hay usuario → carga (o crea) la empresa + carga clientes desde Supabase.
  - Si no hay usuario → resetea todo al estado inicial.

## Rutas

| Ruta | Acceso | Componente | Descripción |
|---|---|---|---|
| `/login` | Público | LoginPage | Inicio de sesión |
| `/register` | Público | RegisterPage | Registro |
| `/forgot-password` | Público | ForgotPasswordPage | Recuperación por correo |
| `/reset-password` | Público | ResetPasswordPage | Nueva contraseña |
| `/` | Protegido | QuoteFormPage | Nuevo presupuesto (alias) |
| `/quotes/new` | Protegido | QuoteFormPage | Nuevo presupuesto |
| `/quotes/preview` | Protegido | QuotePreviewPage | Vista previa + descarga PDF |
| `/quotes/history` | Protegido | HistoryPage | Historial + reexportar/eliminar presupuestos |
| `/quotes/templates` | Protegido | QuoteTemplatesPage | Catálogo y selección de modelos PDF |
| `/profile` | Protegido | ProfilePage | Datos de empresa |
| `/clients` | Protegido | ClientsPage | Gestión de clientes |
| `*` | — | `<p>` | 404 |

## Base de Datos (Supabase PostgreSQL)

### Tablas y Relaciones

```
auth.users (Supabase Auth)
  └── companies (profile_id → user.id)     1:1
       ├── clients (company_id)            1:N
       └── quotes (company_id)             1:N
            └── quote_items (quote_id)     1:N
```

### Campos principales

**companies**: id, profile_id, name, rif, tax_id_label, phone, address_lines, logo_url, default_currency, iva_rate
**clients**: id, company_id, name, rif, address, email, phone
**quotes**: id, company_id, client_id, work, issue_date, currency, client_name, client_rif, client_address, notes, iva_rate, subtotal, iva, total, pdf_path, pdf_template_id, pdf_generated_at
**quote_items**: id, quote_id, code, unit, description, quantity, sg, unit_price
**storage bucket `quote-pdfs`**: PDFs generados, ruta `userId/companyId/quoteId/file-template-version.pdf`, bucket privado.

### Clientes

`ClientsPage` permite crear, editar, eliminar y buscar clientes. El formulario persiste `name`, `rif`, `address`, `email` y `phone`; `email` y `phone` son opcionales para la UI, pero si hay correo debe tener formato válido. Las operaciones de clientes en `QuoteContext` deben propagar errores de Supabase para que la página no muestre éxito ante fallos remotos.

### Empresa y Presupuestos

`ProfilePage` espera `updateCompany()` antes de mostrar éxito. El logo se maneja como Data URL, acepta PNG/JPG, máximo 1 MB y 600x600 px, y puede quitarse. `tax_id_label` permite elegir cómo se muestra el documento fiscal en la app y PDFs (`RIF`, `RUT` o `DNI`). `updateCompany()` debe lanzar errores de Supabase para evitar estado local optimista incorrecto. La zona de peligro invoca `deleteCurrentAccount()`, exige confirmación escribiendo `ELIMINAR`, y luego redirige a `/login`.

`delete-account` es una Supabase Edge Function que valida el JWT del usuario, usa una secret key de backend solo del lado servidor, borra primero los archivos del bucket privado `quote-pdfs` bajo la carpeta `user.id`, elimina en orden `quote_items`, `quotes`, `clients`, `companies`, `profiles`, y finalmente llama `auth.admin.deleteUser(user.id)`. La función prioriza `SUPABASE_SECRET_KEYS`, acepta `SECRET_KEYS` como secret personalizada compatible con el Dashboard, espera formato JSON (`{"default":"sb_secret_..."}`) y mantiene `SUPABASE_SERVICE_ROLE_KEY` / `SUPABASE_SERVICE_ROLE` solo como fallback legacy.

`QuoteFormPage` usa `useFieldArray` para ítems y `useWatch` para calcular subtotal, IVA y total en vivo. La nota del presupuesto es opcional; si se ingresa, se persiste en `quotes.notes` y se imprime en el PDF. `saveQuote()` también persiste `iva_rate`, `subtotal`, `iva` y `total` en `quotes` para acelerar el historial. Después de guardar datos, genera el PDF en cliente con `pdf(...).toBlob()`, lo sube a Storage mediante `uploadQuotePdf()` y actualiza `quotes.pdf_path`, `pdf_template_id` y `pdf_generated_at`. `setFromForm()` solo debe ejecutarse después de `saveQuote()` exitoso. Si falla la inserción de `quote_items`, `saveQuote()` borra la cabecera `quotes` recién creada como rollback manual.

`HistoryPage` carga inicialmente solo cabeceras desde `quotes` para pintar rápido y reducir egress de PostgREST. Si un presupuesto tiene `pdf_path`, previsualizar crea una URL firmada y manda `pdfPreviewUrl` a `QuotePreviewPage`; así se muestra el PDF histórico guardado y no se reaplica el modelo seleccionado actualmente. Los `quote_items` se consultan bajo demanda solo cuando hay que regenerar/exportar sin PDF reutilizable. Al exportar, si existe `pdf_path` con el mismo `pdf_template_id` seleccionado, usa URL firmada de Storage; si no, regenera el PDF, lo sube y descarga el blob. La eliminación intenta borrar el PDF de Storage y luego `quotes`; si la FK bloquea por ítems dependientes, borra `quote_items` y reintenta. Fallos al borrar Storage se registran como warning para no bloquear la eliminación del presupuesto.

`QuoteTemplatesPage` muestra un catálogo visual de modelos con miniaturas referenciales del presupuesto usando datos ficticios (empresa, cliente, ítems, IVA y total) y actualiza `selectedTemplate` en `QuoteContext`. La preferencia se guarda en `localStorage` con la clave `presupuesta.quoteTemplate`. No persiste en Supabase ni altera presupuestos históricos.

`QuotePdfDocument` recibe `templateId` y usa una plantilla PDF parametrizada. Modelos actuales: `professional`, `classic`, `compact`, `bold` y `corporate`. Comparten los mismos datos, pero cambian acentos, densidad, cabecera, tabla y totales. `corporate` usa un layout propio con cabecera negra, acento amarillo, tabla destacada y footer oscuro inspirado en factura corporativa.

### Migraciones aplicadas

Las migraciones viven en `supabase/migrations/`.

- `20260510120000_optimize_security_rls_indexes.sql`
  - Agrega índices en FKs/RLS: `companies.profile_id`, `clients.company_id`, `quotes.company_id`, `quotes.client_id`, `quote_items.quote_id`.
  - Endurece funciones internas con `search_path = ''`.
  - Revoca ejecución de `handle_new_user()` y `set_current_timestamp_updated_at()` para `public`, `anon` y `authenticated`.
  - Revoca permisos directos de tablas al rol `anon`.
  - Optimiza políticas RLS usando `(select auth.uid())`.
- `20260510121500_finish_quote_items_and_disable_graphql.sql`
  - Rehace las políticas restantes de `quote_items` con `(select auth.uid())`.
  - Desinstala `pg_graphql`; la app usa PostgREST vía `supabase.from(...)`, no GraphQL.
- `20260510163000_add_quote_notes.sql`
  - Agrega `quotes.notes` como `text` nullable para notas opcionales del presupuesto.
- `20260511193000_add_quote_pdf_storage.sql`
  - Crea/actualiza el bucket privado `quote-pdfs`.
  - Agrega `pdf_path`, `pdf_template_id` y `pdf_generated_at` en `quotes`.
  - Crea políticas de Storage para que cada usuario autenticado solo pueda leer/subir PDFs bajo su carpeta `auth.uid()`.
- `20260516173000_add_company_tax_id_label.sql`
  - Agrega `companies.tax_id_label` con valores permitidos `RIF`, `RUT` y `DNI`.

Estado verificado después de aplicar:

- Sin warnings de FKs sin índice.
- Sin warnings de `function_search_path_mutable`.
- Sin warnings de funciones `SECURITY DEFINER` ejecutables por `anon`/`authenticated`.
- Sin warnings de RLS initPlan.
- `unused_index` puede aparecer en Supabase Advisor hasta que haya tráfico real; no eliminar esos índices por esa señal inicial.
- Queda pendiente activar `Leaked Password Protection` desde Supabase Dashboard > Auth, porque no se resuelve con SQL de migración.

## Convenciones de Código

- **Idioma**: UI en español, código/variables en inglés.
- **Componentes**: exportados como `export const ComponentName`, no default exports.
- **Formularios**: siempre React Hook Form + Zod resolver. Errores mostrados con `<p className="form-error">`.
- **Alertas**: SweetAlert2 para feedback al usuario (éxito, error, confirmación de eliminación).
- **Estilos**: CSS vanilla en `index.css`. Inputs, textareas y selects comparten estilo base; las páginas usan clases por dominio (`auth-*`, `clients-*`, `quote-*`, `profile-*`). En desktop, `.app` usa layout de sidebar fijo de 260px más topbar sticky con nombre de empresa y cierre de sesión; en móvil vuelve a navegación superior.
- **Estado**: React Context API (no Redux/Zustand). Dos providers anidados.
- **Supabase**: llamadas directas desde los contexts, no hay service layer separado. Usar selects explícitos, no `select("*")`, para bajar egress. Mantener cargas pesadas bajo demanda y considerar paginación si el historial crece.
- **Desarrollo**: React `StrictMode` puede duplicar efectos y lecturas en logs de Supabase; confirmar tráfico real con build/producción antes de optimizar de más.

## Testing

- Script: `npm test`
- Stack: Vitest + jsdom + React Testing Library.
- Setup global: `src/test/setup.ts`.
- Tests actuales:
  - `LoginPage.test.tsx`
  - `RegisterPage.test.tsx`
  - `ClientsPage.test.tsx`
  - `QuoteFormPage.test.tsx`
  - `QuotePreviewPage.test.tsx`
  - `QuoteTemplatesPage.test.tsx`
  - `HistoryPage.test.tsx`
  - `Navbar.test.tsx`
  - `ProfilePage.test.tsx`
- Los tests de páginas mockean `useAuth`, `useQuote` y `sweetalert2` para enfocarse en comportamiento de UI sin depender de Supabase real.

## Variables de Entorno

```
VITE_SUPABASE_URL=https://xxx.supabase.co
VITE_SUPABASE_ANON_KEY=xxx
```

Accesibles con `import.meta.env.VITE_*`. El archivo `.env` está en `.gitignore`.

## Flujo Principal

1. Usuario se registra → si hay sesión redirige a `/profile`; si Supabase requiere confirmación, va a `/login`
2. Configura datos de empresa (nombre, tipo de documento fiscal, número, teléfono, dirección, logo, moneda, IVA)
3. Agrega clientes en `/clients`
4. Crea presupuesto en `/quotes/new`: selecciona cliente, agrega ítems con precios y revisa totales
5. Guarda → datos persisten en Supabase → actualiza estado local → navega a `/quotes/preview`
6. Ve el PDF renderizado en el navegador y puede descargarlo
7. Puede elegir modelo en `/quotes/templates`; el modelo se aplica al preview y a la exportación desde historial
8. Consulta `/quotes/history` para reexportar o eliminar presupuestos guardados
