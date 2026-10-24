# Database

How Vecora's data is laid out and guarded, for the parts that span more than one file. The source
of truth is the Drizzle schema in `src/lib/db/schema/`: each file opens with the rules of its
tables, and the columns are documented where they're declared. `drizzle/` holds the migrations
generated from it, plus one custom migration, `*_database_rules`, with what the schema can't
declare (see [Database rules](#database-rules)).

## Contents

- [Tables](#tables)
- [Access](#access)
- [Writes go through the services](#writes-go-through-the-services)
- [Conventions](#conventions)
- [What gets deleted](#what-gets-deleted)
- [Activity log](#activity-log)
- [Database rules](#database-rules)

---

## Tables

| File            | Tables                                                                                                   |
| --------------- | -------------------------------------------------------------------------------------------------------- |
| `auth.ts`       | `users`, `sessions`, `accounts`, `verifications`, `rate_limits` (Better Auth and its admin plugin)       |
| `registry.ts`   | `properties`, `residents`, `property_residents`                                                          |
| `treasury.ts`   | `periods`, `transaction_categories`, `transactions`; views `treasury_period_summary`, `house_fee_status` |
| `presidency.ts` | `amenities`, `amenity_reservations`                                                                      |
| `requests.ts`   | `maintenance_requests`, `security_requests`                                                              |
| `documents.ts`  | `document_templates`                                                                                     |
| `settings.ts`   | `settings` (one row)                                                                                     |
| `audit.ts`      | `audit_log`                                                                                              |
| `enums.ts`      | the shared enums                                                                                         |

The relations the queries use (`with: { … }`) are in `src/lib/db/relations.ts`.

A board member is a resident (`residents.user_id`) with an account in `users` that holds at least
one role. The roles are the admin plugin's `users.role`, comma-separated ("president,treasurer").
Only board members sign in; an account with no role is turned away.

## Access

There is no row-level security: the app connects with one `DATABASE_URL`, and every check happens
on the server before a query runs.

- **Reads**: any board member reads every section. Every server function that reads goes through
  `boardMiddleware` (`src/lib/auth/middleware.ts`), which also sends an access link's session, or
  the main admin on its default password, to `/set-password`.
- **Writes**: each server function that writes names what it needs with
  `requirePermission({ transaction: ['write'] })`. The roles' permissions are Better Auth access
  control statements in `src/lib/auth/permissions.ts`; the screens ask the same `can()` to show or
  hide a button.
- **Rules that depend on the data** (only an admin hands out the admin role, a template's author
  or an admin renames it, the main admin keeps its role) are checked by the section's service,
  which has the rows.

| Permission                   | Admin | President | Treasurer | Security | Maintenance |
| ---------------------------- | :---: | :-------: | :-------: | :------: | :---------: |
| `registry.write`             |   ✓   |     ✓     |           |          |             |
| `board.manage`               |   ✓   |     ✓     |           |          |             |
| `period.write`               |   ✓   |     ✓     |     ✓     |          |             |
| `amenity.write`              |   ✓   |     ✓     |           |          |             |
| `reservation.write`          |   ✓   |     ✓     |     ✓     |          |             |
| `reservation.collect`        |   ✓   |           |     ✓     |          |             |
| `transaction.write`          |   ✓   |           |     ✓     |          |             |
| `category.write`             |   ✓   |           |     ✓     |          |             |
| `maintenanceRequest.write`   |   ✓   |           |           |          |      ✓      |
| `maintenanceRequest.resolve` |   ✓   |           |     ✓     |          |             |
| `securityRequest.write`      |   ✓   |           |           |    ✓     |             |
| `securityRequest.resolve`    |   ✓   |           |     ✓     |          |             |
| `settings.write`             |   ✓   |     ✓     |           |          |             |
| `settings.configure`         |   ✓   |           |           |          |             |
| `document.write`             |   ✓   |     ✓     |     ✓     |    ✓     |      ✓      |
| `document.manage`            |   ✓   |           |           |          |             |
| `log.read`                   |   ✓   |           |           |          |             |

`collect` is recording a booking's fee and cancelling a paid one; `resolve` is paying, rejecting or
reopening a request; `configure` is the HOA's language and currency; `document.manage` is renaming
or deleting anyone's template.

## Writes go through the services

`src/lib/services/` holds the rules of each section: what a fee payment writes, when a booking
can still change, how a request is paid. Server functions call them inside
`transactionAs(user.id, (tx) => …)` (`src/lib/db/index.ts`), which runs one database transaction
with `app.actor_id` set, so the activity log knows who acted. The seed calls the same services, so
it can't skip a rule either.

| Service               | Owns                                                                                       |
| --------------------- | ------------------------------------------------------------------------------------------ |
| `registry.ts`         | Creating and editing residents (a board member's account takes the new name), house links  |
| `board.ts`            | Seating and removing board members, their roles, access links, the main admin's protection |
| `treasury.ts`         | Fee payments (late fees, waived months), movements, the period a day falls in              |
| `presidency.ts`       | Bookings: paying, cancelling with a refund, what a paid one can still change               |
| `requests.ts`         | Paying, rejecting and reopening maintenance and security requests                          |
| `documents.ts`        | Renaming and deleting templates (author or `document.manage`)                              |
| `settings.ts`         | The HOA's currency and language (`settings.configure`)                                     |
| `financial-report.ts` | The financial report's totals                                                              |
| `purge.ts`            | The nightly purge (see below)                                                              |

A broken rule throws a `ServiceError` with one of the codes in `src/lib/services/errors.ts`.
`errorMessage()` (`src/lib/action-result.ts`) turns it, or a constraint violation by name, into
the message on screen.

## Conventions

- **IDs**: `uuid` with a random default, except `audit_log` (`bigint` identity) and the
  composite key of `property_residents`.
- **Timestamps**: `timestamptz`. `updated_at` is set by Drizzle (`$onUpdate`) on the app's updates.
- **Who**: `created_by`, `deleted_by`, `resolved_by` and `cancelled_by` are set by the services and
  server functions from the signed-in user; the database has no default for them.
- **Money**: `numeric(12,2)`, read as numbers, next to a `currency` column. A new row takes the
  HOA's current currency, a fee its period's, a booking's fee and refund the booking's. Nothing
  changes a row's currency afterwards; totals are always per currency.
- **Names** are unique ignoring case (`unique index … (lower(name))`).
- **Dates**: `date` for business days (when money moved, when work was done), `timestamptz` for
  system events.
- **Foreign keys to history** are `on delete restrict`: history must outlive what it points at.

## What gets deleted

| Table                     | Delete style            | Who / when                                                                                                      | Purged?                             |
| ------------------------- | ----------------------- | --------------------------------------------------------------------------------------------------------------- | ----------------------------------- |
| `users`                   | Never                   | Taking someone off the board empties their roles and ends their sessions; the account stays for the history     | No                                  |
| `properties`              | **Soft** (`deleted_at`) | `registry.write`                                                                                                | **After 6 months, if unreferenced** |
| `residents`               | **Soft** (`deleted_at`) | `registry.write`                                                                                                | **After 6 months, if unreferenced** |
| `property_residents`      | Hard                    | Unlinking a person from a house                                                                                 | n/a                                 |
| `periods`                 | Hard                    | `period.write`, only while no movement uses it (restrict)                                                       | No                                  |
| `transaction_categories`  | Hard                    | `category.write`, only while unused; a used one is retired (`is_active`). The app's own (`key` set) stay active | No                                  |
| `transactions`            | **Soft** (`deleted_at`) | `transaction.write`; undo clears `deleted_at`                                                                   | **Never**                           |
| `amenities`               | Hard                    | `amenity.write`, only while no booking uses it; otherwise retired (`is_active`)                                 | No                                  |
| `amenity_reservations`    | Hard, or **cancelled**  | Unpaid, uncancelled ones are deleted; a paid one is only cancelled (`reservation.collect`), which keeps the row | No                                  |
| `maintenance_requests`    | Hard                    | The section's role, pending ones only                                                                           | No                                  |
| `security_requests`       | Hard                    | The section's role, pending ones only                                                                           | No                                  |
| `document_templates`      | Hard                    | Its author, or `document.manage`                                                                                | n/a                                 |
| `settings`                | Never                   | One row, inserted by the database rules migration                                                               | n/a                                 |
| `audit_log`               | Never                   | Append-only                                                                                                     | **Never**                           |
| The logo (object storage) | Hard                    | The previous file, once `settings.logo_path` points at the new one                                              | n/a                                 |

Soft deletes:

- `deleted_at` null means live; `deleted_by` is who deleted it, cleared again on restore.
- Unique indexes on these tables only count live rows, so a house number or an email can be used
  again after a delete. Restoring a row whose number or email was taken meanwhile fails.
- A deleted transaction frees its folio; restoring it fails if the folio was used again.
- A booking's payment status is derived from its live ledger rows, so deleting its fee puts it
  back to pending, and restoring the fee marks it paid again.

### The purge

`purgeSoftDeleted()` (`src/lib/services/purge.ts`) hard-deletes residents and houses deleted more
than 6 months ago, only if nothing refers to them: no house link, and for a house no movement
(deleted ones included) and no booking (cancelled ones included). Anything still referenced stays
forever, hidden, so "who owned 2B in 2024?" stays answerable. It runs with no actor, so the
activity log shows its deletes as "Sistema". Scheduling it nightly is still to do.

A new table that keeps residents or houses as history needs its own `not exists` there. Its
foreign key restricts deletes as a second line of defense: a purge that misses one fails as a
whole instead of losing history.

> **Privacy note.** The activity log keeps the full row of every change, and nothing deletes from
> it. A purged resident's name, phone and email stay in `audit_log`. If personal data ever has to
> be erased for real, those rows need scrubbing too.

## Activity log

`audit_log` is written by one trigger, `private.audit()`, on every app table: `properties`,
`residents`, `property_residents`, `periods`, `transactions`, `transaction_categories`,
`amenities`, `amenity_reservations`, `maintenance_requests`, `security_requests`, `users`,
`settings` and `document_templates`. Nothing that writes can skip it, scripts included.

- **Who**: `actor_id`, from the `app.actor_id` that `transactionAs()` sets. Null for the app's own
  jobs (the purge, migrations); the screen shows those as "Sistema".
- **What**: `old_data` / `new_data` are the whole row, under the database's column names;
  `changed_fields` lists what an update changed. `label` names the row (house number, person,
  concept) and `refs` freezes the names behind its foreign keys, so an entry stays readable after
  what it points at is gone. `txid` groups the rows one action wrote (paying a request is the
  expense plus the request's update).
- **Left out**: updates that only touch `updated_at`, `welcomed_at` or `must_change_password`; a
  template's `content` (megabytes with images); the main admin's own account, created with no
  actor when the app is set up.
- **Passwords**: they live in `accounts`, which isn't audited (its rows hold the hash). A second
  trigger writes a password change as an update of the account's `users` row, with
  `changed_fields` `{password}`, or `{password_set}` for an invited member's first one ("account
  activated"). The main admin's change away from its default password isn't written.
- Only `log.read` (the admin) reads it, from `/logs`. `src/components/logs/entry.ts` turns table
  names, columns and values into what the screen shows.

A new app table needs adding to the trigger's table list and to its label `case`, in a new custom
migration, and a section label in `entry.ts`.

## Database rules

What lives in `drizzle/*_database_rules/migration.sql`, since the schema can't declare it:

- `periods_no_overlap`: an exclusion constraint, so no two periods cover the same day.
- `transactions_folio_one_receipt`: an exclusion constraint, so a folio repeats only among the
  lines of one receipt (they're written in one transaction and share `created_at`).
- The single `settings` row and the starting categories, in Spanish (the HOA's data language):
  the app's own ones (`fee`, `late_fee`, `amenity_fee`, `amenity_refund`) and a few common ones.
- The activity log's triggers and their helpers, in the `private` schema.

A change to any of these is a new custom migration (`npx drizzle-kit generate --custom --name
<name>`), never an edit of one that's been applied.
