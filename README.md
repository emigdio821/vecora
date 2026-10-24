# Vecora

> _Vecora_: from _vecino_ (Spanish for "neighbor") and _ágora_, the square where citizens of ancient Greece met to talk and settle the city's affairs. This is the neighbors' agora, where the HOA board runs the residential.

Residential management for the HOA board: houses and residents, treasury (fees, transactions and periods), common area bookings, maintenance and security payment requests, and an activity log for the admin.

The app itself is in Spanish (es-MX); code, comments and docs are in English and call each section by its English name (see [Sections](#sections)). Every on-screen text is also translated to English, switched off for now (see [Languages](#languages)).

TanStack Start (Vite + Nitro) · React · Supabase (Postgres, Auth, RLS) · Tailwind CSS · [coss ui](https://coss.com/ui) (Base UI) · TanStack Query / Table · React Hook Form + zod · [Paraglide](https://inlang.com/m/gerre34r/library-inlang-paraglideJs) (i18n).

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

   | Variable              | Value                                                            |
   | --------------------- | ---------------------------------------------------------------- |
   | `VITE_SUPABASE_URL`   | `API_URL` from `supabase status` (`http://127.0.0.1:54321`)      |
   | `VITE_SUPABASE_KEY`   | `PUBLISHABLE_KEY` from `supabase status`                         |
   | `VITE_SITE_URL`       | `http://localhost:3000`                                          |
   | `SUPABASE_SECRET_KEY` | `SECRET_KEY` from `supabase status` (server-only, never `VITE_`) |

   The app checks them on start and stops with the name of any that's missing or invalid.

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

| Email                    | Role                         | Can write in                                                               |
| ------------------------ | ---------------------------- | -------------------------------------------------------------------------- |
| `admin@vecora.app`       | Admin                        | Everything, plus the HOA board and the activity log                        |
| `president@vecora.com`   | President (Ana López)        | Residential, Presidency, HOA board                                         |
| `treasurer@vecora.com`   | Treasurer (Luis Fernández)   | Treasury, periods and reservations in Presidency; pays or rejects requests |
| `security@vecora.com`    | Security (María García)      | Requests in Security                                                       |
| `maintenance@vecora.com` | Maintenance (Diego Martínez) | Requests in Maintenance                                                    |

Every role can read every section. The seed also creates 20 houses (A1–D5), 10 residents, the current year's period with a few payments, two common areas with bookings, requests in every status, and 45 days of activity in the activity log.

`supabase/seeds/periods.sql` adds the period scenarios around the current year: the two previous years as back-to-back periods with a year of fees and expenses each, no period next year (a gap), and a future period the year after with no movements yet. For the "no periods" state, run `npm run db:reset:empty`.

## Sections

What each section is called on screen. Docs and comments use the English name.

| Name             | On screen            | Route / tab                                           |
| ---------------- | -------------------- | ----------------------------------------------------- |
| Home             | "Inicio"             | `/`                                                   |
| Treasury         | "Tesorería"          | `/treasury`                                           |
| - Transactions   | "Movimientos"        | `?tab=transactions`                                   |
| - Categories     | "Categorías"         | `?tab=categories`                                     |
| Presidency       | "Presidencia"        | `/presidency`                                         |
| - Periods        | "Periodos"           | `?tab=periods`                                        |
| - Reservations   | "Reservaciones"      | `?tab=reservations`                                   |
| - Common areas   | "Áreas comunes"      | `?tab=amenities`                                      |
| Maintenance      | "Mantenimiento"      | `/maintenance`                                        |
| Security         | "Seguridad"          | `/security`                                           |
| HOA board        | "Mesa directiva"     | `/hoa-board`                                          |
| Residential      | "Residencial"        | `/residential`                                        |
| - Houses         | "Casas"              | `?tab=houses`                                         |
| - Residents      | "Residentes"         | `?tab=residents`                                      |
| Activity log     | "Historial"          | `/logs` (admin only)                                  |
| Financial report | "Reporte financiero" | `/financial-report`; the PDF is `/reports/pdf`        |
| Notices          | "Avisos y minutas"   | `/documents`; the PDF is `/reports/document`          |
| Settings         | "Ajustes"            | `/settings`                                           |
| - App            | "Aplicación"         | `?tab=app`: theme (and language), per device          |
| - HOA            | "Residencial"        | `?tab=hoa`: name, logo, currency (president or admin) |
| - Account        | "Cuenta"             | `?tab=account`: password (main admin only)            |

## Useful commands

| Command                           | What it does                                                                                           |
| --------------------------------- | ------------------------------------------------------------------------------------------------------ |
| `npm run dev`                     | Development server                                                                                     |
| `npm run db:reset`                | Recreate the local database from migrations + seeds (destroys local data)                              |
| `npm run db:reset:empty`          | Same, but only the admin account from `seed.sql`: a fresh install with no data                         |
| `npm run db:types`                | Regenerate `src/lib/supabase/database.types.ts` from the local schema — run after changing a migration |
| `npm run typecheck`               | Compiles the messages, then `tsc --noEmit`                                                             |
| `npm run i18n`                    | Compile `messages/` into `src/paraglide/` (the dev server also does it on its own)                     |
| `npm run lint` / `npm run format` | oxlint / oxfmt                                                                                         |
| `npx supabase status`             | Local URLs and keys; Studio is at <http://127.0.0.1:54323>                                             |
| `npx supabase stop`               | Stop the local stack (data is kept)                                                                    |

## Deploy

The app runs on Vercel against a hosted Supabase project.

1. **Push the schema** to the hosted project. Seeds are not pushed, so production starts with no accounts until step 4.

   ```bash
   npx supabase login
   npx supabase link --project-ref <project-ref>
   npx supabase db push --dry-run   # lists the migrations it would apply
   npx supabase db push
   ```

2. **Configure Auth** in the Supabase dashboard, under Authentication:
   - **Sign In / Providers**: turn off "Allow new users to sign up", and leave the **Email** provider on (turning it off also disables password login).
   - **URL Configuration**: set the Site URL to the app's URL (e.g. `https://example.com`) and add `https://example.com/**` to the redirect URLs.

3. **Set the environment variables** in Vercel, from Project Settings → API Keys in the Supabase dashboard:

   | Variable              | Value                                                   |
   | --------------------- | ------------------------------------------------------- |
   | `VITE_SUPABASE_URL`   | `https://<project-ref>.supabase.co`                     |
   | `VITE_SUPABASE_KEY`   | A publishable key                                       |
   | `VITE_SITE_URL`       | The app's URL, e.g. `https://example.com`               |
   | `SUPABASE_SECRET_KEY` | A secret key (server-only, needed to add board members) |
   | `MAINTENANCE_MODE`    | Unset; `true` only during maintenance (below)           |

   The `VITE_` values are bundled into the browser code at build time, so redeploy after changing them.

4. **Create the main admin** with `npm run db:seed`. Nobody can sign in until an account has a role; this runs `supabase/seed.sql`, which creates `admin@vecora.app` with the default password `admin123`. The test data in `supabase/seeds/` skips itself on hosted.

5. **Deploy** and sign in as the admin. The app first asks for a new password: everyone can read the default one in the repo, so it's only good for that. Then set the residential's name, logo and currency in Ajustes → Residencial and add the board members in HOA board.

### Maintenance mode

`MAINTENANCE_MODE=true` in Vercel, then a redeploy (Deployments → ⋯ → Redeploy), closes the app while the data moves: every page sends the visitor to `/unavailable` (laid out like the 404), and server functions and the API answer 503, so a tab left open can't write either. Remove it and redeploy to open the app again; anyone still on `/unavailable` goes back to the app.

### The main admin

`admin@vecora.app` is the app's own account, not a resident's. It can't be deleted, lose the admin role, change its email or its name ("Vecora Admin"); the database refuses all four, including from the dashboard. Other admins are residents and are removed in HOA board like anyone else.

Nobody receives mail at `vecora.app`, so the dashboard's password reset email won't arrive. Change the password in Ajustes → Cuenta, which only the main admin sees; board members get a new access link in HOA board instead. If the password is lost, set one in the SQL Editor:

```sql
update auth.users
set encrypted_password = extensions.crypt('the-new-password', extensions.gen_salt('bf'))
where email = 'admin@vecora.app';
```

### Reset

To wipe the hosted database and re-apply every migration, run `npx supabase db reset --linked`. The seed creates the main admin again with the default password `admin123`, which it has to change at the first sign-in. A reset can't be undone; `npx supabase db dump --linked --data-only -f backup.sql` saves the data first.

## Project layout

```
supabase/migrations/   schema, RLS policies and RPCs (one file per area)
supabase/seed.sql      main admin account (local and hosted)
supabase/seeds/        local-only test data: dev.sql, then periods.sql
src/routes/_authed/    one route per section (TanStack Router file routes)
src/routes/_auth/      login, set-password and the auth callbacks
src/components/        UI per section (table/, drawer/, dialog/) + shared/ and ui/
src/server-actions/    mutations (server functions), called from the client with the user's session
src/tanstack-queries/  read queries and query keys
src/lib/validations/   zod schemas shared by forms and server actions
messages/              on-screen text, one folder per section with es.json and en.json
project.inlang/        Paraglide project: languages, message files, detection strategy
src/paraglide/         compiled messages (generated, gitignored)
```

## Languages

On-screen text lives in `messages/<section>/{es,en}.json` and is used as `m.key()` from `@/paraglide/messages`, so a missing key or variable fails the typecheck. Add a key to both files.

Multi-language is off: `MULTI_LANGUAGE` in `src/lib/config/i18n.ts` is `false`, so everyone gets Spanish and the language pickers are hidden. Setting it to `true` (then restarting the dev server) brings back:

- a language picker on the sign-in pages and in Ajustes → Aplicación, per device;
- the HOA's default language in setup and in Ajustes → Residencial (admin only). Reports are written in it, and so is the screen of anyone who hasn't picked a language.

Records keep the language they were written in: category names and generated descriptions (e.g. "Cuota Septiembre 2026") are data, not translated text.

## Notes

- Access is invite-only: there is no sign-up page. The admin or president adds a board member in HOA board and shares the access link; the same link is how someone resets a forgotten password.
- Permissions are enforced by Postgres RLS; the UI hides what a role can't do, but the database is the source of truth.
- Every insert, update and delete is recorded in `audit_log` and shown to admins in the activity log.
- Every amount keeps the currency it was recorded in. Changing the HOA's currency (admin only) applies to new records; existing transactions, periods and their fees keep theirs, and totals are shown per currency.
