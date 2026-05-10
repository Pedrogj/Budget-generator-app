# Budget Generator App (Presupuesta)

Aplicación web para generar presupuestos profesionales en PDF. Permite a usuarios registrados configurar su empresa, gestionar clientes, crear presupuestos detallados con múltiples ítems y descargar el resultado como un documento PDF listo para enviar.

---

## Tabla de Contenidos

- [Tech Stack](#tech-stack)
- [Arquitectura General](#arquitectura-general)
- [Flujo de la Aplicación](#flujo-de-la-aplicación)
  - [1. Registro e Inicio de Sesión](#1-registro-e-inicio-de-sesión)
  - [2. Configuración de la Empresa (Perfil)](#2-configuración-de-la-empresa-perfil)
  - [3. Gestión de Clientes](#3-gestión-de-clientes)
  - [4. Creación de Presupuesto](#4-creación-de-presupuesto)
  - [5. Vista Previa y Descarga de PDF](#5-vista-previa-y-descarga-de-pdf)
- [Estructura del Proyecto](#estructura-del-proyecto)
- [Base de Datos (Supabase)](#base-de-datos-supabase)
- [Rutas de la Aplicación](#rutas-de-la-aplicación)
- [Instalación y Uso](#instalación-y-uso)
- [Variables de Entorno](#variables-de-entorno)

---

## Tech Stack

| Tecnología | Uso |
|---|---|
| **React 19** | Librería de UI |
| **TypeScript** | Tipado estático |
| **Vite 7** | Bundler y dev server |
| **React Router DOM 7** | Enrutamiento SPA |
| **Supabase** | Auth + Base de datos PostgreSQL |
| **React Hook Form** | Manejo de formularios |
| **Zod** | Validación de esquemas |
| **@react-pdf/renderer** | Generación de documentos PDF |
| **SweetAlert2** | Alertas y notificaciones al usuario |
| **Google Fonts (Roboto)** | Tipografía |

---

## Arquitectura General

```
BrowserRouter
  └─ AuthProvider          ← Manejo de sesión (Supabase Auth)
       └─ QuoteProvider    ← Estado global: empresa, clientes, presupuesto
            └─ AppRouter   ← Rutas públicas y protegidas
                 ├─ Navbar
                 └─ <Página activa>
```

La app utiliza dos Context Providers anidados:

- **AuthContext** — Gestiona autenticación con Supabase (login, registro, logout, sesión persistente). Expone `user`, `loading`, `login()`, `register()`, `logout()`.
- **QuoteContext** — Carga y sincroniza datos de la empresa y clientes del usuario autenticado con Supabase. Gestiona el estado del presupuesto en curso. Expone `company`, `quote`, `items`, `clients`, y métodos CRUD.

El componente **RequiredAuth** actúa como guardia de rutas: redirige a `/login` si no hay sesión activa.

---

## Flujo de la Aplicación

### 1. Registro e Inicio de Sesión

```
Usuario no autenticado
│
├─ /register  → Crear cuenta (email + contraseña)
│                 └─ Auto-login tras registro exitoso
│                 └─ Redirige a /profile para configurar la empresa
│
└─ /login     → Iniciar sesión con credenciales
                  └─ Redirige a la ruta protegida original (o "/" por defecto)
```

- Se usa **Supabase Auth** (`signUp`, `signInWithPassword`).
- Al registrarse, el sistema automáticamente inicia sesión y redirige a la página de perfil.
- El `AuthContext` escucha cambios de estado de autenticación (`onAuthStateChange`) para mantener la sesión sincronizada.
- Los formularios usan **React Hook Form** con validación inline.
- Errores se muestran con **SweetAlert2**.

### 2. Configuración de la Empresa (Perfil)

```
/profile
│
├─ Si es la primera vez → Se crea un registro de empresa vacío en Supabase
│                          (automático al cargar QuoteContext)
│
└─ Formulario editable:
     ├─ Nombre de la empresa
     ├─ RIF / RUT
     ├─ Teléfono
     ├─ Dirección
     ├─ Moneda por defecto (USD / CLP)
     ├─ Tasa de IVA (%)
     └─ Logo de empresa (imagen, máx. 600x600px)
         └─ Se almacena como Data URL (base64) en la DB
         └─ Puede reemplazarse o quitarse desde la página
```

- El formulario valida con **Zod**: todos los campos son obligatorios, el IVA debe ser entre 0–20%.
- El logo se valida en el cliente (PNG/JPG, máximo 1 MB y dimensiones máximas) y se convierte a base64 con `FileReader`.
- Solo se guarda si hay cambios reales (comparación campo a campo).
- El guardado espera la respuesta de Supabase antes de mostrar éxito; si falla, se muestra error con SweetAlert2.
- La moneda configurada aquí se usa automáticamente en los presupuestos.

### 3. Gestión de Clientes

```
/clients
│
├─ Formulario para agregar / editar cliente:
│    ├─ Nombre
│    ├─ RIF / RUT
│    ├─ Correo
│    ├─ Teléfono
│    └─ Dirección
│
└─ Lista de clientes guardados:
     ├─ Buscar por nombre, RIF, correo o teléfono
     ├─ Editar → Carga datos en el formulario
     └─ Eliminar → Confirmación con SweetAlert2
```

- Los clientes están vinculados a la **empresa** del usuario (`company_id`).
- CRUD completo contra Supabase (`insert`, `update`, `delete`).
- Los clientes guardados aparecen como opciones seleccionables en el formulario de presupuesto.
- Validación con **Zod** (campos principales requeridos y correo opcional con formato válido).

### 4. Creación de Presupuesto

```
/ o /quotes/new
│
├─ Datos del presupuesto:
│    ├─ Tipo de Obra (texto libre)
│    ├─ Seleccionar cliente guardado (dropdown)
│    │    └─ Autocompleta: nombre, RIF y dirección del cliente
│    ├─ Cliente (solo lectura, viene del selector)
│    ├─ RIF del cliente (solo lectura)
│    ├─ Dirección del cliente (solo lectura)
│    ├─ Fecha de emisión (date picker)
│    └─ Moneda (solo lectura, viene del perfil de empresa)
│
├─ Ítems del presupuesto (tabla dinámica):
│    │  Cada ítem tiene:
│    │  ├─ Código
│    │  ├─ Unidad (UND)
│    │  ├─ Descripción (obligatorio)
│    │  ├─ Cantidad (mínimo 1)
│    │  ├─ SG
│    │  └─ Precio Unitario (obligatorio, > 0)
│    │
│    ├─ [+ Agregar ítem]  → Agrega una fila nueva
│    └─ [✕]               → Elimina una fila (mínimo 1 ítem)
│
└─ [Guardar y ver vista previa]
     ├─ Validación completa con Zod
     ├─ Guarda en Supabase (tabla quotes + quote_items)
     ├─ Si falla quote_items, revierte la cabecera creada
     ├─ Muestra alerta de éxito
     └─ Navega a /quotes/preview
```

- Se usa **`useFieldArray`** de React Hook Form para manejar la lista dinámica de ítems.
- Validación: cada ítem requiere descripción, cantidad válida y precio mayor a 0.
- Al guardar, se persisten los datos en dos tablas: `quotes` (cabecera) y `quote_items` (líneas).
- El formulario permite seleccionar un cliente guardado, lo que auto-completa los campos de cliente.
- Muestra subtotal, IVA y total estimado en vivo antes de guardar.

### 5. Vista Previa y Descarga de PDF

```
/quotes/preview
│
├─ PDFViewer (iframe embebido)
│    └─ Renderiza el presupuesto en tiempo real:
│         ├─ Cabecera: Logo + datos de empresa + título "PRESUPUESTO"
│         ├─ Fecha de emisión + moneda
│         ├─ Datos del cliente (nombre, RIF, dirección)
│         ├─ Tabla de ítems con columnas:
│         │    CÓDIGO | UND | DESCRIPCIÓN | CANT. | SG | P/UNITARIO | PRECIO TOTAL
│         ├─ Notas predefinidas sobre pagos
│         └─ Totales:
│              ├─ SUB-TOTAL
│              ├─ I.V.A. (según tasa configurada)
│              └─ TOTAL
│
└─ [Descargar PDF] → Descarga el archivo como "presupuesto.pdf"
```

- Se usa **@react-pdf/renderer** (`Document`, `Page`, `View`, `Text`, `Image`, `StyleSheet`).
- El PDF se genera completamente en el cliente (no requiere servidor).
- Los montos se formatean según la moneda seleccionada (`Intl.NumberFormat`).
- La fecha se reformatea de `YYYY-MM-DD` a `DD/MM/YYYY` para el documento.
- El componente `PDFViewer` muestra una vista previa embebida; `PDFDownloadLink` permite la descarga.

---

## Estructura del Proyecto

```
src/
├── main.tsx                          # Punto de entrada
├── App.tsx                           # Providers + Router
├── AppRouter.tsx                     # Definición de rutas
├── index.css                         # Estilos globales
│
├── context/
│   ├── AuthContext.tsx                # Autenticación (Supabase Auth)
│   └── QuoteContext.tsx               # Estado global: empresa, clientes, presupuesto
│
├── components/
│   ├── index.ts                       # Barrel export
│   ├── Navbar/
│   │   ├── Navbar.tsx                 # Barra de navegación
│   │   └── Navbar.css                 # Estilos del navbar
│   ├── RequiredAuth/
│   │   └── RequiredAuth.tsx           # Guardia de rutas protegidas
│   └── QuotePdfDocument.tsx           # Plantilla del documento PDF
│
├── pages/
│   ├── LoginPage/
│   │   └── LoginPage.tsx              # Inicio de sesión
│   ├── RegisterPage/
│   │   └── RegisterPage.tsx           # Registro de usuario
│   ├── ProfilePage/
│   │   └── ProfilePage.tsx            # Configuración de empresa
│   ├── ClientsPage/
│   │   └── ClientsPage.tsx            # CRUD de clientes
│   ├── QuoteFormPage/
│   │   └── QuoteFormPage.tsx          # Formulario de presupuesto
│   └── QuotePreviewPage/
│       └── QuotePreviewPage.tsx       # Vista previa + descarga PDF
│
├── lib/
│   └── supabaseClient.ts             # Instancia del cliente Supabase
│
└── types/
    └── types.ts                       # Interfaces TypeScript

supabase/
└── migrations/
    ├── 20260510120000_optimize_security_rls_indexes.sql
    └── 20260510121500_finish_quote_items_and_disable_graphql.sql
```

---

## Base de Datos (Supabase)

La aplicación utiliza las siguientes tablas en PostgreSQL (vía Supabase):

### Tablas

| Tabla | Descripción |
|---|---|
| `companies` | Datos de la empresa del usuario (nombre, RIF, teléfono, dirección, logo, moneda, IVA) |
| `clients` | Clientes vinculados a una empresa |
| `quotes` | Cabecera de cada presupuesto generado |
| `quote_items` | Ítems/líneas de cada presupuesto |

### Migraciones y Seguridad

El esquema de Supabase se versiona en `supabase/migrations/`.

- Todas las tablas públicas usan RLS y las políticas limitan el acceso al usuario autenticado dueño de la empresa.
- Las políticas usan `(select auth.uid())` para mejorar el rendimiento de RLS.
- Existen índices para las claves foráneas y predicados usados por RLS:
  `companies.profile_id`, `clients.company_id`, `quotes.company_id`,
  `quotes.client_id` y `quote_items.quote_id`.
- Las funciones internas `handle_new_user()` y `set_current_timestamp_updated_at()` tienen `search_path` fijo y no son ejecutables por `anon` ni `authenticated`.
- `pg_graphql` está desinstalado porque la app usa Supabase REST (`.from(...)`) y no el endpoint GraphQL.

Nota: Supabase puede marcar los índices recién creados como `unused_index` hasta que haya tráfico suficiente. No deben eliminarse solo por esa advertencia inicial.

### Relaciones

```
auth.users (Supabase Auth)
  │
  └─ companies (profile_id → user.id)  ── 1:1
       │
       ├─ clients (company_id)          ── 1:N
       │
       └─ quotes (company_id)           ── 1:N
            │
            └─ quote_items (quote_id)   ── 1:N
```

### Interfaces TypeScript

```typescript
interface CompanyInfo {
  id?: string;
  name: string;
  rif: string;
  phone: string;
  addressLines: string;
  logoUrl?: string;
  defaultCurrency?: "USD" | "CLP";
  ivaRate?: number;
}

interface ClientInfo {
  id: string;
  name: string;
  rif: string;
  address: string;
  email?: string;
  phone?: string;
}

interface QuoteInfo {
  id?: string;
  work: string;
  client: string;
  clientRif: string;
  clientAddress: string;
  issueDate: string;
  clientId?: string;
  currency: "USD" | "CLP";
}

interface QuoteItem {
  code: string;
  unit: string;
  description: string;
  quantity: number;
  sg: string;
  unitPrice: number;
}
```

---

## Rutas de la Aplicación

| Ruta | Acceso | Página | Descripción |
|---|---|---|---|
| `/login` | Público | LoginPage | Inicio de sesión |
| `/register` | Público | RegisterPage | Registro de nueva cuenta |
| `/` | Protegido | QuoteFormPage | Formulario de nuevo presupuesto |
| `/quotes/new` | Protegido | QuoteFormPage | Formulario de nuevo presupuesto |
| `/quotes/preview` | Protegido | QuotePreviewPage | Vista previa y descarga de PDF |
| `/profile` | Protegido | ProfilePage | Configuración de datos de empresa |
| `/clients` | Protegido | ClientsPage | Gestión de clientes (CRUD) |
| `*` | — | 404 | Página no encontrada |

Las rutas protegidas usan el componente `RequiredAuth` que redirige a `/login` si no hay sesión activa, preservando la ruta original para redirigir después del login.

---

## Instalación y Uso

### Prerrequisitos

- Node.js >= 18
- npm

### Pasos

```bash
# 1. Clonar el repositorio
git clone https://github.com/Pedrogj/Budget-generator-app.git
cd budget-generator-app

# 2. Instalar dependencias
npm install

# 3. Configurar variables de entorno
#    Crear archivo .env en la raíz con las credenciales de Supabase
#    (ver sección Variables de Entorno)

# 4. Iniciar servidor de desarrollo
npm run dev
```

### Scripts disponibles

| Comando | Descripción |
|---|---|
| `npm run dev` | Inicia el servidor de desarrollo (Vite) |
| `npm run build` | Compila TypeScript y genera build de producción |
| `npm run preview` | Sirve el build de producción localmente |
| `npm run lint` | Ejecuta ESLint sobre el proyecto |
| `npm test` | Ejecuta la suite de Vitest + Testing Library |

### Testing

El proyecto usa **Vitest**, **jsdom** y **React Testing Library** para pruebas de componentes.

Cobertura actual:

- `LoginPage`: render, validación, submit, error de login y redirección con sesión activa.
- `RegisterPage`: render, validación, confirmación de contraseña, registro con/sin confirmación de email y redirección con sesión activa.
- `ClientsPage`: render, validación, agregar, editar, eliminar con confirmación y búsqueda.
- `QuoteFormPage`: render, totales en vivo, selección de cliente, validación, agregar/eliminar ítems, guardado exitoso/error y link a clientes.
- `ProfilePage`: render, validación, guardado exitoso/error, quitar logo y validación de tipo de logo.

---

## Variables de Entorno

Crear un archivo `.env` en la raíz del proyecto con las siguientes variables:

```env
VITE_SUPABASE_URL=https://tu-proyecto.supabase.co
VITE_SUPABASE_ANON_KEY=tu-anon-key-publica
```

> ⚠️ El archivo `.env` está incluido en `.gitignore` y **no** debe subirse al repositorio.
