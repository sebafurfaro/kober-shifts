## Kober Shifts

Sistema de turnos (pacientes / profesionales / administración del centro) sobre **Next.js App Router**, con:

- **MySQL**: datos relacionales (usuarios, sedes, especialidades, turnos, tokens OAuth)
- **MongoDB**: configuración visual (Settings: Branding/Colores/Bordes)
- **MUI**: componentes UI
- **Google Calendar**: fuente de verdad del calendario (OAuth por profesional)

## Requisitos

- Node.js / npm
- Docker Desktop (para MySQL + MongoDB)

## Puertos (por defecto)

Este proyecto usa puertos alternativos para no chocar con servicios locales comunes:

- **MySQL**: `3307` (contenedor expone `3306`)
- **MongoDB**: `27018` (contenedor expone `27017`)
- **Next**: `3000`

## Variables de entorno

Este repo ignora `.env*`. Usá `example.env` como referencia y copiá a un `.env.local` propio si querés.

- Archivo de ejemplo: `kober-shifts/example.env`

Mínimo recomendado para desarrollo:

- `AUTH_SECRET` (si no está, en dev se usa fallback `"change_me_dev_only"`)
- `DATABASE_URL` (si no está, en dev se construye automáticamente desde `MYSQL_*`)
- `MONGODB_URI` (si no está, en dev se usa fallback apuntando a `127.0.0.1:27018`)

## Levantar bases de datos (Docker)

Desde `kober-shifts/`:

```bash
cd /Users/sebastian.furfaro/gestor/kober-shifts
docker compose up -d
```

Verificación rápida:

```bash
docker ps --format "table {{.Names}}\t{{.Ports}}" | grep "kober-shifts-"
```

## Prisma (MySQL)

Generar cliente:

```bash
npm run prisma:generate
```

Sincronizar schema en MySQL (dev):

```bash
DATABASE_URL='mysql://kober:kober@127.0.0.1:3307/kober_shifts' npx prisma db push --skip-generate
```

> Nota: `prisma migrate dev` puede fallar por permisos de “shadow database” con el usuario no-root. Por eso en dev usamos `prisma db push`.

## Crear usuario Admin (seed)

Se incluye un seed para crear/actualizar un admin (upsert):

- Script: `kober-shifts/scripts/seed-admin.mjs`
- Comando: `npm run seed:admin`

Ejemplo (apuntando al MySQL del compose):

```bash
DATABASE_URL='mysql://kober:kober@127.0.0.1:3307/kober_shifts' npm run seed:admin
```

## Iniciar la app

```bash
npm run dev
```

Abrir:

- Home: `http://localhost:3000/`
- Login: `http://localhost:3000/login`
- Panel: `http://localhost:3000/panel`

## Roles y paneles

Roles (MySQL / Prisma):

- `PATIENT`
- `PROFESSIONAL`
- `ADMIN`

Rutas:

- `/panel` redirige según rol
- `ADMIN` puede entrar a:
  - `/panel/admin`
  - `/panel/patient`
  - `/panel/professional`

## Layout del Panel

Layout horizontal MUI:

- `app/panel/layout.tsx`: envuelve todo `/panel/*`
- `app/panel/components/PanelLayoutShell.tsx`: AppBar + Drawer
  - Drawer permanente en desktop
  - Drawer “temporary” en mobile

El título del AppBar toma `branding.siteName` desde `GET /api/style-config` mediante Zustand:

- Store: `app/store/styleConfigStore.ts`
- Bootstrapper global: `app/StyleConfigBootstrapper.tsx`

## Settings (Admin) en MongoDB

Pantalla:

- `GET /panel/admin/settings`

Persistencia:

- API: `GET /api/style-config` (público)
- API: `PUT /api/style-config` (solo `ADMIN`)

Estructura guardada (resumen):

- `branding.siteName`
- `branding.logoDataUrl` (data URL; si subís png/jpg se convierte a webp en el browser)
- `branding.address.*`
- `branding.socials.*`
- `colors.*`
- `borders.borderWidth`
- `borders.borderRadius`

Comportamiento:

- Autosave con debounce al editar
- Botón **Guardar** que fuerza guardado completo

## Autenticación (session cookie)

- Endpoints:
  - `POST /api/auth/register` (crea PATIENT)
  - `POST /api/auth/login`
  - `POST /api/auth/logout`
- La sesión se guarda en cookie httpOnly `ks_session`.

## Google OAuth (Profesional) + Calendar

Endpoints:

- `GET /api/google/oauth/start` (solo `PROFESSIONAL`)
- `GET /api/google/oauth/callback`

Se guardan tokens en MySQL (`GoogleOAuthToken`).

## Turnos (API mínima)

- `POST /api/appointments/request` (solo `PATIENT`)
  - Crea evento en Google Calendar del profesional (source of truth)
  - Persiste Appointment en MySQL
  - Envía emails si SMTP está configurado

- `PATCH /api/appointments/[id]/status` (solo `PROFESSIONAL`)
  - Cambia estado: `CONFIRMED` / `CANCELLED` / `ATTENDED`
  - Refleja en Google Calendar si hay `googleEventId`

## SMTP (emails)

Opcional. Si no se configuran estas variables, el envío se omite en dev:

- `SMTP_HOST`
- `SMTP_PORT`
- `SMTP_USER`
- `SMTP_PASS`
- `SMTP_FROM`

## Troubleshooting

### “port is already allocated” en Docker

- MySQL suele ocupar `3306` y Mongo `27017` por servicios locales.
- Este proyecto usa `3307` y `27018`. Si igual choca, cambiá `MYSQL_PORT` / `MONGO_PORT` en `docker-compose.yml`.

### “Environment variable not found: DATABASE_URL”

- En dev hay fallback en `lib/prisma.ts` (si faltan `DATABASE_URL` usa `MYSQL_*`).
- Alternativamente exportá `DATABASE_URL` al correr Prisma/Next.

### “cookies().get is not a function”

- En Next 16 `cookies()` puede ser async. `getSession()` es async y debe usarse con `await`.

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
