# Operfoodss Admin - Panel Administrador SaaS

Panel administrativo para locales de comida rápida construido con Next.js 14+, TypeScript y Tailwind CSS.

## 🚀 Inicio Rápido

### Instalación

```bash
npm install
```

### Configuración de Variables de Entorno

Crea un archivo `.env.local` en la raíz del proyecto basándote en `.env.example`:

```bash
cp .env.example .env.local
```

Edita `.env.local` con tus valores:

```env
# URL de tu backend API
NEXT_PUBLIC_API_URL=http://localhost:3001/api

# Habilitar/deshabilitar autenticación
NEXT_PUBLIC_AUTH_ENABLED=true

# Nombre de la aplicación
NEXT_PUBLIC_APP_NAME=Operfoodss Admin

# Timeout para peticiones API (en milisegundos)
NEXT_PUBLIC_API_TIMEOUT=30000
```

**Nota:** Todas las variables deben comenzar con `NEXT_PUBLIC_` para ser accesibles en el cliente.

### Desarrollo

```bash
npm run dev
```

Abre [http://localhost:3000](http://localhost:3000) en tu navegador.

### Build de Producción

```bash
npm run build
npm start
```

## 📁 Estructura del Proyecto

```
src/
├─ app/
│  ├─ (auth)/
│  │  └─ login/
│  │     └─ page.tsx
│  ├─ (dashboard)/
│  │  ├─ layout.tsx
│  │  ├─ page.tsx                // Home dashboard
│  │  ├─ outlets/                // Manage food outlets
│  │  │  └─ page.tsx
│  │  ├─ products/               // Global product catalog
│  │  │  └─ page.tsx
│  │  ├─ orders/                 // Live orders management
│  │  │  └─ page.tsx
│  │  ├─ customers/              // Customer directory
│  │  │  └─ page.tsx
│  └─ layout.tsx
│
├─ components/
│  ├─ layout/
│  │  ├─ Sidebar.tsx
│  │  ├─ Topbar.tsx
│  │  └─ DashboardLayout.tsx
│  ├─ ui/
│  │  ├─ Button.tsx
│  │  ├─ Card.tsx
│  │  ├─ Input.tsx
│  │  └─ Badge.tsx
│
├─ lib/
│  ├─ auth.ts        // placeholder
│  ├─ api.ts         // API client con configuración de backend
│  ├─ config.ts       // Configuración de variables de entorno
│  └─ constants.ts
│
└─ styles/
   └─ globals.css
```

## 🎨 Características

- ✅ Next.js 14+ con App Router
- ✅ TypeScript
- ✅ Tailwind CSS
- ✅ Diseño responsive
- ✅ Componentes reutilizables
- ✅ UI mock con datos de ejemplo

## 🔧 Variables de Entorno

| Variable | Descripción | Valor por Defecto | Requerida |
|----------|-------------|-------------------|-----------|
| `NEXT_PUBLIC_API_URL` | URL base del backend API | `http://localhost:3001/api` | ✅ Sí |
| `NEXT_PUBLIC_AUTH_ENABLED` | Habilitar autenticación | `true` | ❌ No |
| `NEXT_PUBLIC_APP_NAME` | Nombre de la aplicación | `Operfoodss Admin` | ❌ No |
| `NEXT_PUBLIC_API_TIMEOUT` | Timeout para peticiones (ms) | `30000` | ❌ No |

### Conexión con Backend

El proyecto está configurado para conectarse a tu backend. El cliente API está en `src/lib/api.ts` y usa la variable `NEXT_PUBLIC_API_URL` para hacer las peticiones.

Ejemplo de uso:
```typescript
import { api } from '@/lib/api';

// GET request
const outlets = await api.get('/outlets');

// POST request
const newProduct = await api.post('/products', { name: 'Hamburguesa', price: 8.50 });
```

## 📝 Notas

Este es un proyecto base con UI mock. Las siguientes funcionalidades están pendientes de implementación:

- Autenticación real
- Estado global
- Persistencia de datos

**Nota:** El cliente API ya está configurado y listo para usar con tu backend.

## 🛠️ Tecnologías

- **Next.js 14+** - Framework React
- **TypeScript** - Tipado estático
- **Tailwind CSS** - Estilos utility-first

