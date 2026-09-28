# Stoa

> _Stoa_ (στοά): en la antigua Grecia, el pórtico techado junto al ágora donde los ciudadanos se reunían a conversar y resolver los asuntos de la ciudad. Aquí es lo mismo, pero para la mesa directiva del residencial.

Administración de un residencial para la mesa directiva: casas y residentes, tesorería (cuotas, movimientos y periodos), reservas de la terraza, solicitudes de pago de mantenimiento y seguridad, y un historial de cambios para el administrador.

Next.js 16 · React · Supabase (Postgres, Auth, RLS) · Tailwind CSS · [coss ui](https://coss.com/ui) (Base UI) · TanStack Query / Table · React Hook Form + zod.

## Run it locally

You need **Node 24**, **Docker** (for the local Supabase stack) and npm.

1. **Install dependencies**

   ```bash
   npm install
   ```

2. **Start Supabase** (Postgres, Auth, Studio). The first run downloads the Docker images.

   ```bash
   npx supabase start
   ```

3. **Create `.env.local`** from the example and paste the local keys printed by `npx supabase status`:

   ```bash
   cp .env.example .env.local
   npx supabase status
   ```

   | Variable                               | Value from `supabase status`                     |
   | -------------------------------------- | ------------------------------------------------ |
   | `NEXT_PUBLIC_SUPABASE_URL`             | `API_URL` (`http://127.0.0.1:54321`)             |
   | `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | `PUBLISHABLE_KEY`                                |
   | `SUPABASE_SECRET_KEY`                  | `SECRET_KEY` (server-only, never `NEXT_PUBLIC_`) |

4. **Load the schema and test data**. Applies every migration and both seeds; it also wipes any local data, so run it whenever you want a clean slate.

   ```bash
   npm run db:reset
   ```

5. **Start the app**

   ```bash
   npm run dev
   ```

   Open <http://localhost:3000> and sign in with one of the accounts below.

## Test accounts

All local accounts use the password **`admin`**. They come from `supabase/seed.sql` (admin) and `supabase/seeds/dev.sql` (everyone else) and only exist in the local database.

| Email                    | Role                           | Can write in                                                                |
| ------------------------ | ------------------------------ | --------------------------------------------------------------------------- |
| `admin@resido.com`       | Administrador                  | Everything, plus "Mesa directiva" and "Historial"                           |
| `president@resido.com`   | Presidente (Ana López)         | "Residencial", "Presidencia", "Mesa directiva"                              |
| `treasurer@resido.com`   | Tesorero (Luis Fernández)      | "Tesorería", periods and terraza in "Presidencia"; pays or rejects requests |
| `security@resido.com`    | Seguridad (María García)       | Requests in "Seguridad"                                                     |
| `maintenance@resido.com` | Mantenimiento (Diego Martínez) | Requests in "Mantenimiento"                                                 |

Every role can read every section. The seed also creates 20 houses (A1–D5), 10 residents, the current year's period with a few payments, requests in every status, and 45 days of activity in "Historial".

## Useful commands

| Command                           | What it does                                                                                           |
| --------------------------------- | ------------------------------------------------------------------------------------------------------ |
| `npm run dev`                     | Development server                                                                                     |
| `npm run db:reset`                | Recreate the local database from migrations + seeds (destroys local data)                              |
| `npm run db:types`                | Regenerate `src/lib/supabase/database.types.ts` from the local schema — run after changing a migration |
| `npm run typecheck`               | `tsc --noEmit`                                                                                         |
| `npm run lint` / `npm run format` | oxlint / oxfmt                                                                                         |
| `npx supabase status`             | Local URLs and keys; Studio is at <http://127.0.0.1:54323>                                             |
| `npx supabase stop`               | Stop the local stack (data is kept)                                                                    |

## Project layout

```
supabase/migrations/   schema, RLS policies and RPCs (one file per feature)
supabase/seed.sql      admin account (runs everywhere)
supabase/seeds/dev.sql local-only test data
src/app/(authed)/      one route per section
src/components/        UI per section (table/, drawer/, dialog/) + shared/ and ui/
src/server-actions/    mutations, called from the client with the user's session
src/tanstack-queries/  read queries and query keys
src/lib/validations/   zod schemas shared by forms and server actions
```

## Notes

- Access is invite-only: there is no sign-up page. The admin or president adds a board member in "Mesa directiva" and shares the access link; the same link is how someone resets a forgotten password.
- Permissions are enforced by Postgres RLS; the UI hides what a role can't do, but the database is the source of truth.
- Every insert, update and delete is recorded in `audit_log` and shown to admins in "Historial".
