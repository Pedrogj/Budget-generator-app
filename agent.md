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
│                                setFromForm(), updateCompany(), addClient(),
│                                removeClient(), updateClient(), saveQuote()
│
├── components/
│   ├── index.ts                 # Barrel export (solo Navbar por ahora)
│   ├── Navbar/
│   │   ├── Navbar.tsx           # Barra sticky responsive, marca clickeable y menú móvil
│   │   └── Navbar.css           # Estilos del navbar (dark theme, responsive)
│   ├── RequiredAuth/
│   │   └── RequiredAuth.tsx     # HOC guardia de rutas: redirige a /login si no hay sesión
│   └── QuotePdfDocument.tsx     # Componente @react-pdf con plantilla PDF profesional
│
├── pages/
│   ├── LoginPage/LoginPage.tsx          # Login con email/password
│   ├── RegisterPage/RegisterPage.tsx    # Registro + auto-login → redirige a /profile
│   ├── ProfilePage/ProfilePage.tsx      # Config empresa + logo validado/removible
│   ├── ClientsPage/ClientsPage.tsx      # CRUD de clientes + búsqueda
│   ├── QuoteFormPage/QuoteFormPage.tsx  # Presupuesto con cliente, ítems dinámicos y totales en vivo
│   ├── QuotePreviewPage/QuotePreviewPage.tsx  # Vista previa PDF (PDFViewer) + descarga (PDFDownloadLink)
│   └── HistoryPage/HistoryPage.tsx      # Historial de presupuestos guardados + exportar/eliminar
│
├── lib/
│   └── supabaseClient.ts       # Instancia singleton de createClient(url, anonKey)
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
- **QuoteContext** depende de `useAuth()`. Cuando `user` cambia:
  - Si hay usuario → carga (o crea) la empresa + carga clientes desde Supabase.
  - Si no hay usuario → resetea todo al estado inicial.

## Rutas

| Ruta | Acceso | Componente | Descripción |
|---|---|---|---|
| `/login` | Público | LoginPage | Inicio de sesión |
| `/register` | Público | RegisterPage | Registro |
| `/` | Protegido | QuoteFormPage | Nuevo presupuesto (alias) |
| `/quotes/new` | Protegido | QuoteFormPage | Nuevo presupuesto |
| `/quotes/preview` | Protegido | QuotePreviewPage | Vista previa + descarga PDF |
| `/quotes/history` | Protegido | HistoryPage | Historial + reexportar/eliminar presupuestos |
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

**companies**: id, profile_id, name, rif, phone, address_lines, logo_url, default_currency, iva_rate
**clients**: id, company_id, name, rif, address, email, phone
**quotes**: id, company_id, client_id, work, issue_date, currency, client_name, client_rif, client_address, notes, iva_rate, subtotal, iva, total
**quote_items**: id, quote_id, code, unit, description, quantity, sg, unit_price

### Clientes

`ClientsPage` permite crear, editar, eliminar y buscar clientes. El formulario persiste `name`, `rif`, `address`, `email` y `phone`; `email` y `phone` son opcionales para la UI, pero si hay correo debe tener formato válido. Las operaciones de clientes en `QuoteContext` deben propagar errores de Supabase para que la página no muestre éxito ante fallos remotos.

### Empresa y Presupuestos

`ProfilePage` espera `updateCompany()` antes de mostrar éxito. El logo se maneja como Data URL, acepta PNG/JPG, máximo 1 MB y 600x600 px, y puede quitarse. `updateCompany()` debe lanzar errores de Supabase para evitar estado local optimista incorrecto.

`QuoteFormPage` usa `useFieldArray` para ítems y `useWatch` para calcular subtotal, IVA y total en vivo. La nota del presupuesto es opcional; si se ingresa, se persiste en `quotes.notes` y se imprime en el PDF. `saveQuote()` también persiste `iva_rate`, `subtotal`, `iva` y `total` en `quotes` para acelerar el historial. `setFromForm()` solo debe ejecutarse después de `saveQuote()` exitoso. Si falla la inserción de `quote_items`, `saveQuote()` borra la cabecera `quotes` recién creada como rollback manual.

`HistoryPage` carga inicialmente solo cabeceras desde `quotes` para pintar rápido. Los `quote_items` se consultan bajo demanda al previsualizar o exportar. Al previsualizar desde historial, el presupuesto se marca `readOnly` para ocultar edición y evitar reutilizar esos datos en `/quotes/new`. La generación de PDF también se monta bajo demanda, después de pedir exportar. La eliminación intenta borrar `quotes`; si la FK bloquea por ítems dependientes, borra `quote_items` y reintenta.

`QuotePdfDocument` usa una plantilla PDF rediseñada: cabecera con banda superior, logo/datos de empresa, paneles para cliente y trabajo, tabla liviana, notas opcionales y totales destacados.

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
- **Estilos**: CSS vanilla en `index.css`. Inputs, textareas y selects comparten estilo base; las páginas usan clases por dominio (`auth-*`, `clients-*`, `quote-*`, `profile-*`).
- **Estado**: React Context API (no Redux/Zustand). Dos providers anidados.
- **Supabase**: llamadas directas desde los contexts, no hay service layer separado.

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
2. Configura datos de empresa (nombre, RIF/RUT, teléfono, dirección, logo, moneda, IVA)
3. Agrega clientes en `/clients`
4. Crea presupuesto en `/quotes/new`: selecciona cliente, agrega ítems con precios y revisa totales
5. Guarda → datos persisten en Supabase → actualiza estado local → navega a `/quotes/preview`
6. Ve el PDF renderizado en el navegador y puede descargarlo
7. Consulta `/quotes/history` para reexportar o eliminar presupuestos guardados
