# Vecora

> _Vecora_: from _vecino_ (Spanish for "neighbor") and _ágora_, the square where citizens of ancient Greece met to talk and settle the city's affairs. This is the neighbors' agora, where the HOA board runs the residential.

Residential management for the HOA board: houses and residents, treasury (fees, transactions and periods), common area bookings, maintenance and security payment requests, and an activity log for the admin.

The app itself is in Spanish (es-MX); code, comments and docs are in English and call each section by its English name (see [Sections](#sections)). Every on-screen text is also translated to English, switched off for now (see [Languages](#languages)).

TanStack Start (Vite + Nitro) · React · Neon (Postgres, object storage) · Drizzle ORM · Better Auth · Tailwind CSS · [coss ui](https://coss.com/ui) (Base UI) · TanStack Query / Table · React Hook Form + zod · [Paraglide](https://inlang.com/m/gerre34r/library-inlang-paraglideJs) (i18n).

## Run it locally

You need **Node 24**, npm, the [Neon CLI](https://neon.com/docs/reference/neon-cli) and a Neon `dev` branch of the project.

1. **Install dependencies**

   ```bash
   npm install
   ```

2. **Create `.env.local`** from the example:

   ```bash
   cp .env.example .env.local
   ```

   | Variable                | Value                                                                        |
   | ----------------------- | ---------------------------------------------------------------------------- |
   | `VITE_SITE_URL`         | `http://localhost:3000`                                                      |
   | `DATABASE_URL`          | Pooled connection string of your Neon `dev` branch, from `neon checkout dev` |
   | `DATABASE_URL_UNPOOLED` | Direct connection string of the same branch (drizzle-kit and the reset)      |
   | `NEON_BRANCH`           | `dev`, also from `neon checkout dev`; the reset refuses `production`         |
   | `BETTER_AUTH_SECRET`    | Output of `openssl rand -base64 32`                                          |
   | `AWS_*` (four of them)  | Object storage of the `dev` branch, from `neon env pull`                     |

   The app checks them on start and stops with the name of any that's missing or invalid.

3. **Load the schema and test data** into the `dev` branch. The reset empties it, applies every migration in `drizzle/` and runs the seed; run it again any time for a clean slate.

   ```bash
   npm run db:reset
   ```

4. **Start the app**

   ```bash
   npm run dev
   ```

   Open <http://localhost:3000> and sign in with one of the accounts below.

## Test accounts

All local accounts use the password **`admin`**. They come from `scripts/db/seed.ts` and only exist in development branches.

| Email                    | Role                         | Can write in                                                               |
| ------------------------ | ---------------------------- | -------------------------------------------------------------------------- |
| `admin@vecora.app`       | Admin                        | Everything, plus the HOA board and the activity log                        |
| `president@vecora.com`   | President (Ana López)        | Residential, Presidency, HOA board                                         |
| `treasurer@vecora.com`   | Treasurer (Luis Fernández)   | Treasury, periods and reservations in Presidency; pays or rejects requests |
| `security@vecora.com`    | Security (María García)      | Requests in Security                                                       |
| `maintenance@vecora.com` | Maintenance (Diego Martínez) | Requests in Maintenance                                                    |

Every role can read every section. The seed also creates 20 houses (A1–D5), 10 residents, the current year's period with a few payments, two common areas with bookings, requests in every status, and 45 days of activity in the activity log. Every step runs as the board member who would do it, through the same services as the app.

Around the current year it adds the period scenarios: the two previous years as back-to-back periods with a year of fees and expenses each, no period next year (a gap), and a future period the year after with no movements yet. For the "no periods" state, run `npm run db:reset:empty`.

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

| Command                           | What it does                                                                                               |
| --------------------------------- | ---------------------------------------------------------------------------------------------------------- |
| `npm run dev`                     | Development server                                                                                         |
| `npm run db:reset`                | Empty the Neon branch in `.env.local`, apply every migration and load the test data (refuses `production`) |
| `npm run db:reset:empty`          | Same, but only the main admin (password `admin`): a fresh install with no data                             |
| `npm run db:generate`             | Turn a change in `src/lib/db/schema/` into a new migration in `drizzle/`                                   |
| `npm run db:migrate`              | Apply the pending migrations to the branch in `.env.local`                                                 |
| `npm run typecheck`               | Compiles the messages, then `tsc --noEmit`                                                                 |
| `npm run i18n`                    | Compile `messages/` into `src/paraglide/` (the dev server also does it on its own)                         |
| `npm run lint` / `npm run format` | oxlint / oxfmt                                                                                             |

## Database

The TypeScript schema in `src/lib/db/schema/` is the source of truth. After changing it, `npm run db:generate` writes the migration; read the SQL, then `npm run db:migrate`. A migration that's been applied anywhere stays as it is: the next change is a new one.

What the schema can't declare (the exclusion constraints, the activity log's trigger) lives in a custom migration, `drizzle/*_database_rules`; add another with `npx drizzle-kit generate --custom --name <name>`. Never `drizzle-kit push`, which would drop it.

## Deploy

The app runs on Vercel against the Neon `production` branch.

1. **Apply the migrations** to the production branch with `npm run db:migrate`, with `.env.local` pointing at it (`neon checkout production`; `neon checkout dev` to go back).

2. **Set the environment variables** in Vercel:

   | Variable               | Value                                                  |
   | ---------------------- | ------------------------------------------------------ |
   | `VITE_SITE_URL`        | The app's URL, e.g. `https://vecora.vercel.app`        |
   | `DATABASE_URL`         | Pooled connection string of the Neon production branch |
   | `BETTER_AUTH_SECRET`   | Its own `openssl rand -base64 32`, never the local one |
   | `AWS_*` (four of them) | Object storage of the Neon production branch           |

   `VITE_SITE_URL` is bundled into the browser code at build time, so redeploy after changing it.

3. **Create the main admin.** Nobody can sign in until an account has a role. The script that creates `admin@vecora.app` on production, with a default password it has to change at the first sign-in, is still to do.

4. **Deploy** and sign in as the admin. Then set the residential's name, logo and currency in Ajustes → Residencial and add the board members in HOA board.

### The main admin

`admin@vecora.app` is the app's own account, not a resident's. It can't be deleted, lose the admin role, change its email or its name ("Vecora Admin"); the app refuses all four. Other admins are residents and are removed in HOA board like anyone else.

Nobody receives mail at `vecora.app`. Change the password in Ajustes → Cuenta, which only the main admin sees; board members get a new access link in HOA board instead. If the password is lost, hash a new one and set it in the Neon SQL Editor:

```bash
node -e "import('better-auth/crypto').then(async ({ hashPassword }) => console.log(await hashPassword(process.argv[1])))" 'the-new-password'
```

```sql
update accounts
set password = '<the hash>'
where provider_id = 'credential'
  and user_id = (select id from users where email = 'admin@vecora.app');
```

### Backups

Neon keeps the branch's history for instant restore. `pg_dump --data-only "$DATABASE_URL_UNPOOLED" > backup.sql` saves a copy of the data.

## Project layout

```
drizzle/               migrations, generated from the schema (plus the custom database rules)
scripts/db/            the reset and the test data
src/routes/_authed/    one route per section (TanStack Router file routes)
src/routes/_auth/      login, set-password and the auth callbacks
src/components/        UI per section (table/, drawer/, dialog/) + shared/ and ui/
src/server-actions/    server functions: reads and writes, behind the auth middleware
src/lib/services/      the business rules the writes go through (fees, reservations, requests, board)
src/lib/auth/          Better Auth, the roles and what each may do (permissions.ts)
src/lib/db/            Drizzle: the client, schema/ and relations
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
- Permissions are checked on the server: each server function names what it needs (`requirePermission`, from `src/lib/auth/permissions.ts`) and the services check the rest (authorship, the main admin). The UI hides what a role can't do, but the server is the source of truth.
- Every insert, update and delete is recorded in `audit_log` and shown to admins in the activity log.
- Every amount keeps the currency it was recorded in. Changing the HOA's currency (admin only) applies to new records; existing transactions, periods and their fees keep theirs, and totals are shown per currency.
