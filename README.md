# Vecora

> _Vecora_: from _vecino_ (Spanish for "neighbor") and _ágora_, the square where citizens of ancient Greece met to talk and settle the city's affairs. This is the neighbors' agora, where the HOA board runs the residential.

Residential management for the HOA board (the _mesa directiva_): houses and residents, treasury (fees, transactions and periods), terrace bookings, maintenance and security payment requests, and a change history for the admin.

The app itself is in Spanish (es-MX); code, comments and docs are in English.

TanStack Start (Vite + Nitro) · React · Supabase (Postgres, Auth, RLS) · Tailwind CSS · [coss ui](https://coss.com/ui) (Base UI) · TanStack Query / Table · React Hook Form + zod.

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

   | Variable              | Value from `supabase status`              |
   | --------------------- | ----------------------------------------- |
   | `VITE_SUPABASE_URL`   | `API_URL` (`http://127.0.0.1:54321`)      |
   | `VITE_SUPABASE_KEY`   | `PUBLISHABLE_KEY`                         |
   | `SUPABASE_SECRET_KEY` | `SECRET_KEY` (server-only, never `VITE_`) |

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
| `admin@vecora.com`       | Administrador                  | Everything, plus "Mesa directiva" and "Historial"                           |
| `president@vecora.com`   | Presidente (Ana López)         | "Residencial", "Presidencia", "Mesa directiva"                              |
| `treasurer@vecora.com`   | Tesorero (Luis Fernández)      | "Tesorería", periods and terraza in "Presidencia"; pays or rejects requests |
| `security@vecora.com`    | Seguridad (María García)       | Requests in "Seguridad"                                                     |
| `maintenance@vecora.com` | Mantenimiento (Diego Martínez) | Requests in "Mantenimiento"                                                 |

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

## Deploy

The app runs on Vercel against a hosted Supabase project.

1. **Push the schema** to the hosted project. Seeds are not pushed, so production starts with no accounts.

   ```bash
   npx supabase login
   npx supabase link --project-ref <project-ref>
   npx supabase db push --dry-run   # lists the migrations it would apply
   npx supabase db push
   ```

2. **Configure Auth** in the Supabase dashboard, under Authentication:
   - **Sign In / Providers**: turn off "Allow new users to sign up", and leave the **Email** provider on (turning it off also disables password login).
   - **URL Configuration**: set the Site URL to the app's URL (e.g. `https://vecora.vercel.app`) and add `https://vecora.vercel.app/**` to the redirect URLs.

3. **Set the environment variables** in Vercel, from Project Settings → API Keys in the Supabase dashboard:

   | Variable              | Value                                                   |
   | --------------------- | ------------------------------------------------------- |
   | `VITE_SUPABASE_URL`   | `https://<project-ref>.supabase.co`                     |
   | `VITE_SUPABASE_KEY`   | A publishable key                                       |
   | `SUPABASE_SECRET_KEY` | A secret key (server-only, needed to add board members) |

   The `VITE_` values are bundled into the browser code at build time, so redeploy after changing them.

4. **Create the main admin.** Nobody can sign in until an account has a role. In Authentication → Users → **Add user** → **Create new user**, enter `admin@vecora.com` and a strong password, and check **Auto Confirm User**. The database names the account "Vecora Admin" and grants it the admin role on its own.

5. **Deploy**, sign in as the admin, set the residential's name and logo in "Ajustes", and add the board members in "Mesa directiva".

### The main admin

`admin@vecora.com` is the app's own account, not a resident's. It can't be deleted, lose the admin role, change its email or its name ("Vecora Admin"); the database refuses all four, including from the dashboard. Other admins are residents and are removed in "Mesa directiva" like anyone else.

Nobody receives mail at `vecora.com`, so the dashboard's password reset email won't arrive. Change the password in the SQL Editor instead:

```sql
update auth.users
set encrypted_password = extensions.crypt('the-new-password', extensions.gen_salt('bf'))
where email = 'admin@vecora.com';
```

### Reset

To wipe the hosted database and re-apply every migration, run `npx supabase db reset --linked --no-seed`. Without `--no-seed` it would also create the local test accounts, all with the password `admin`. A reset can't be undone; `npx supabase db dump --linked --data-only -f backup.sql` saves the data first.

## Project layout

```
supabase/migrations/   schema, RLS policies and RPCs (one file per feature)
supabase/seed.sql      local admin account
supabase/seeds/dev.sql local-only test data
src/routes/_authed/    one route per section (TanStack Router file routes)
src/routes/_auth/      login, set-password and the auth callbacks
src/components/        UI per section (table/, drawer/, dialog/) + shared/ and ui/
src/server-actions/    mutations (server functions), called from the client with the user's session
src/tanstack-queries/  read queries and query keys
src/lib/validations/   zod schemas shared by forms and server actions
```

## Notes

- Access is invite-only: there is no sign-up page. The admin or president adds a board member in "Mesa directiva" and shares the access link; the same link is how someone resets a forgotten password.
- Permissions are enforced by Postgres RLS; the UI hides what a role can't do, but the database is the source of truth.
- Every insert, update and delete is recorded in `audit_log` and shown to admins in "Historial".
