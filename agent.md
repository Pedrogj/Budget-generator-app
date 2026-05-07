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
│   │   ├── Navbar.tsx           # Barra de navegación sticky, links condicionales según auth
│   │   └── Navbar.css           # Estilos del navbar (dark theme, responsive)
│   ├── RequiredAuth/
│   │   └── RequiredAuth.tsx     # HOC guardia de rutas: redirige a /login si no hay sesión
│   └── QuotePdfDocument.tsx     # Componente @react-pdf con la plantilla del presupuesto PDF
│
├── pages/
│   ├── LoginPage/LoginPage.tsx          # Login con email/password
│   ├── RegisterPage/RegisterPage.tsx    # Registro + auto-login → redirige a /profile
│   ├── ProfilePage/ProfilePage.tsx      # Config empresa: nombre, RIF, teléfono, dirección, logo, moneda, IVA
│   ├── ClientsPage/ClientsPage.tsx      # CRUD de clientes (agregar, editar, eliminar)
│   ├── QuoteFormPage/QuoteFormPage.tsx  # Formulario de presupuesto con ítems dinámicos (useFieldArray)
│   └── QuotePreviewPage/QuotePreviewPage.tsx  # Vista previa PDF (PDFViewer) + descarga (PDFDownloadLink)
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
**quotes**: id, company_id, client_id, work, issue_date, currency, client_name, client_rif, client_address
**quote_items**: id, quote_id, code, unit, description, quantity, sg, unit_price

## Convenciones de Código

- **Idioma**: UI en español, código/variables en inglés.
- **Componentes**: exportados como `export const ComponentName`, no default exports.
- **Formularios**: siempre React Hook Form + Zod resolver. Errores mostrados con `<p className="form-error">`.
- **Alertas**: SweetAlert2 para feedback al usuario (éxito, error, confirmación de eliminación).
- **Estilos**: CSS vanilla. Clases globales en `index.css` (`.page`, `.section`, `.form-error`, `.select-form`). Estilos específicos en archivos `.css` junto al componente.
- **Estado**: React Context API (no Redux/Zustand). Dos providers anidados.
- **Supabase**: llamadas directas desde los contexts, no hay service layer separado.

## Variables de Entorno

```
VITE_SUPABASE_URL=https://xxx.supabase.co
VITE_SUPABASE_ANON_KEY=xxx
```

Accesibles con `import.meta.env.VITE_*`. El archivo `.env` está en `.gitignore`.

## Flujo Principal

1. Usuario se registra → auto-login → redirige a `/profile`
2. Configura datos de empresa (nombre, RIF, logo, moneda, IVA)
3. Agrega clientes en `/clients`
4. Crea presupuesto en `/quotes/new`: selecciona cliente, agrega ítems con precios
5. Guarda → datos persisten en Supabase → navega a `/quotes/preview`
6. Ve el PDF renderizado en el navegador y puede descargarlo
