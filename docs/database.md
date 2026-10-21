# Database

Reference for the Postgres schema behind Vecora: every table and column, who can write what, and
what gets deleted (and when). The source of truth is `supabase/migrations/`; this document follows
it as of the migrations below. When a migration changes, update the matching section here.

| Migration                                     | Contents                                                                    |
| --------------------------------------------- | --------------------------------------------------------------------------- |
| `20260921000000_profiles_and_roles.sql`       | `profiles`, `user_roles`, RLS helpers, main admin guards                    |
| `20260921000100_properties_and_residents.sql` | `properties`, `residents`, `property_residents`                             |
| `20260921000200_treasury.sql`                 | `periods`, `transaction_categories`, `transactions`, views, fee RPC, report |
| `20260921000300_amenities.sql`                | `amenities`, `amenity_reservations`, payment/cancel RPCs                    |
| `20260921000400_requests.sql`                 | `maintenance_requests`, `security_requests`, resolve RPCs                   |
| `20260921000500_settings_and_audit_log.sql`   | `settings`, `branding` bucket, `audit_log`, **nightly purge**               |
| `20261021000000_document_templates.sql`       | `document_templates` and its audit trigger                                  |

## Contents

- [Data retention: what gets deleted](#data-retention-what-gets-deleted)
- [Conventions](#conventions)
- [Access model](#access-model)
- [Enums](#enums)
- [Accounts: profiles, user_roles](#accounts)
- [Registry: properties, residents, property_residents](#registry)
- [Treasury: periods, transaction_categories, transactions](#treasury)
- [Common areas: amenities, amenity_reservations](#common-areas)
- [Payment requests: maintenance_requests, security_requests](#payment-requests)
- [Documents: document_templates](#documents)
- [Settings and logo](#settings-and-logo)
- [Audit log](#audit-log)
- [Functions (RPCs)](#functions-rpcs)
- [Error codes](#error-codes)

---

## Data retention: what gets deleted

### The nightly purge

The only automatic deletion in the database is one pg_cron job:

| Job name                      | Schedule                      | Runs                           |
| ----------------------------- | ----------------------------- | ------------------------------ |
| `purge-soft-deleted-registry` | `0 3 * * *` (03:00 UTC daily) | `private.purge_soft_deleted()` |

It hard-deletes:

- **`residents`** whose `deleted_at` is more than **6 months** old, **only if** no
  `property_residents` row points at them;
- **`properties`** whose `deleted_at` is more than **6 months** old, **only if** no
  `property_residents` row, no `transactions` row (live or soft-deleted) and no
  `amenity_reservations` row (cancelled included) points at them.

Anything still referenced stays forever, hidden behind `deleted_at`, so questions like "who owned
2B in 2024?" stay answerable. The job runs as `postgres` (the table owner), so it bypasses RLS. Its
deletes are audited with a null `identity_id`, so the activity log shows them as "Sistema".

Nothing else is purged: no other table has a retention window, and the audit log grows without
limit.

When you add a table that references `residents` or `properties` as history, add a `not exists`
for it to `purge_soft_deleted()`. The FKs on the history tables are `on delete restrict` as a
second line of defense: a purge that misses one fails as a whole instead of losing history. The
function lives in the last migration so it can see every table it checks; a table added in a
later migration means moving it (or a `create or replace` there).

> **Privacy note.** The audit log stores the full row (`old_data` / `new_data`) of every change,
> and nothing ever deletes from it. A purged resident's name, phone and email therefore stay in
> `audit_log`. If personal data ever has to be erased for real, the audit rows need scrubbing too.

### How each table deletes

| Table                          | Delete style                     | Who / when                                                                                                                                                                                                                          | Ever purged?                            |
| ------------------------------ | -------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------- |
| `profiles`                     | Hard (cascade from `auth.users`) | Only when the auth user is deleted. Removing a board member only revokes roles; the account stays. Blocked while the profile is `created_by` / `resolved_by` / `cancelled_by` anywhere (restrict). The main admin can't be deleted. | No                                      |
| `user_roles`                   | Hard                             | Revoking a role, removing a board member                                                                                                                                                                                            | n/a                                     |
| `properties`                   | **Soft** (`deleted_at`)          | President. No DELETE grant: "delete" is an UPDATE of `deleted_at`                                                                                                                                                                   | **Yes, after 6 months if unreferenced** |
| `residents`                    | **Soft** (`deleted_at`)          | President. No DELETE grant                                                                                                                                                                                                          | **Yes, after 6 months if unreferenced** |
| `property_residents`           | Hard                             | President, when unlinking a person from a house (a normal edit)                                                                                                                                                                     | n/a                                     |
| `periods`                      | Hard                             | President / treasurer, only while no transaction uses it (restrict)                                                                                                                                                                 | No                                      |
| `transaction_categories`       | Hard                             | Treasurer, only while unused (restrict). Used ones are retired with `is_active = false`; system ones (`key` set) can't be retired                                                                                                   | No                                      |
| `transactions`                 | **Soft** (`deleted_at`)          | Treasurer. No DELETE grant. Undo by clearing `deleted_at`                                                                                                                                                                           | **Never**                               |
| `amenities`                    | Hard                             | President, only while no reservation uses it (restrict). Otherwise retired with `is_active = false`                                                                                                                                 | No                                      |
| `amenity_reservations`         | Hard, or **cancelled**           | Board deletes unpaid, uncancelled ones. Paid ones can't be deleted, only cancelled (treasurer RPC), which keeps the row                                                                                                             | No; a booking keeps its house           |
| `maintenance_requests`         | Hard                             | Maintenance role, pending rows only. Paid / rejected rows are history                                                                                                                                                               | No                                      |
| `security_requests`            | Hard                             | Security role, pending rows only                                                                                                                                                                                                    | No                                      |
| `document_templates`           | Hard                             | Whoever saved it, or an admin. Documents already made from it are unaffected (nothing links them)                                                                                                                                   | n/a                                     |
| `settings`                     | Never                            | One row, created by the migration; no INSERT/DELETE grant                                                                                                                                                                           | n/a                                     |
| `audit_log`                    | Never                            | Append-only; no UPDATE/DELETE policies                                                                                                                                                                                              | **Never**                               |
| `storage.objects` (`branding`) | Hard                             | The app deletes the previous logo after the settings row points at the new one                                                                                                                                                      | n/a                                     |

### Soft delete mechanics

- `deleted_at timestamptz`: null means live.
- `deleted_by uuid`: stamped by the `private.set_deleted_by()` trigger with `auth.uid()` when
  `deleted_at` is set, and cleared when it's cleared (restore). The app never writes it.
- Unique indexes on soft-deleted tables only count live rows (`where deleted_at is null`), so a
  house number or email can be reused after a delete.
- A soft-deleted transaction frees its folio. Restoring it fails if the folio was reused meanwhile
  (`transactions_folio_one_receipt`).
- Deleting a fee transaction puts its reservation back to "pending"; restoring it marks it paid
  again. Payment status is always derived from live ledger rows.

---

## Conventions

- **IDs**: `uuid primary key default gen_random_uuid()`, except `audit_log` (`bigint identity`)
  and the composite-key link tables.
- **Timestamps**: `created_at` / `updated_at` are `timestamptz not null default now()`.
  `updated_at` is maintained by `private.set_updated_at()`, a before-update trigger on every table
  that has the column.
- **Money**: `numeric(12,2)` plus a `currency` column. A row's currency defaults to
  `settings.currency` (via `private.current_currency()`), or to the currency of the row it comes
  from (a fee takes its period's, a reservation payment takes the reservation's). After that it
  never changes: `private.keep_currency()` rejects any update. Totals are always per currency.
- **Text**: required text columns have a `*_not_blank` check (`btrim(x) <> ''`); optional ones
  are null instead of empty.
- **Uniqueness** on names is case-insensitive (`unique index ... (lower(name))`).
- **FKs to history** are `on delete restrict`: history must outlive its endpoints.
- **Dates**: `date` for business days (when money moved, when work was done), `timestamptz` for
  system events.
- Helpers live in the `private` schema, which the Data API doesn't expose.

## Access model

- No access for `anon` anywhere.
- Every signed-in board member **reads** every section (`select ... using (true)`).
- Each role **writes** only in its own section, through
  `(select private.has_role('<role>'))`. `has_role` is also true for admins, so admin writes
  everywhere.
- Some writes only happen through `security definer` RPCs that check the role themselves (paying
  and resolving requests, paying and cancelling reservations).
- `private.has_role(r)` and `private.is_admin()` are `security definer`, so they can read
  `user_roles` from inside its own policies.

| Section               | Tables                                                                   | Writers                                                                       |
| --------------------- | ------------------------------------------------------------------------ | ----------------------------------------------------------------------------- |
| Board                 | `user_roles`                                                             | Admin; president (not the admin role)                                         |
| Presidency            | `properties`, `residents`, `property_residents`, `amenities`, `settings` | President                                                                     |
| Presidency + Treasury | `periods`, `amenity_reservations`                                        | President, treasurer                                                          |
| Treasury              | `transaction_categories`, `transactions`                                 | Treasurer                                                                     |
| Maintenance           | `maintenance_requests` (pending rows)                                    | Maintenance                                                                   |
| Security              | `security_requests` (pending rows)                                       | Security                                                                      |
| Documents             | `document_templates`                                                     | Any board member saves; whoever saved one (or an admin) renames or deletes it |
| Admin                 | `audit_log` (read only), `settings.default_language` / `currency`        | Admin                                                                         |

## Enums

| Enum                     | Values                                                       |
| ------------------------ | ------------------------------------------------------------ |
| `app_role`               | `admin`, `president`, `treasurer`, `security`, `maintenance` |
| `residency_relationship` | `owner`, `tenant`, `family`                                  |
| `transaction_kind`       | `income`, `expense`                                          |
| `payment_method`         | `cash`, `transfer`                                           |
| `currency_code`          | `MXN`, `USD` (add with `alter type ... add value`)           |
| `request_status`         | `pending`, `paid`, `rejected`                                |
| `security_request_kind`  | `cameras`, `guards`, `access`, `equipment`, `other`          |
| `app_language`           | `es`, `en` (add with `alter type ... add value`)             |
| `audit_operation`        | `insert`, `update`, `delete`                                 |

---

## Accounts

A board member is a resident with an app account (`profiles`) that holds at least one role
(`user_roles`). Only board members can sign in. An account with zero roles is turned away by the
app.

### `profiles`

One row per `auth.users` row, created by the `on_auth_user_created` trigger
(`private.handle_new_user`). Personal data (phone, house) lives in `residents`; a profile is the
account only.

| Column                 | Type          | Null | Default | Notes                                                                                                                                      |
| ---------------------- | ------------- | ---- | ------- | ------------------------------------------------------------------------------------------------------------------------------------------ |
| `id`                   | `uuid`        | no   |         | PK, FK `auth.users(id)` **on delete cascade**                                                                                              |
| `full_name`            | `text`        | no   | `''`    | Taken from the signup metadata `full_name`                                                                                                 |
| `created_at`           | `timestamptz` | no   | `now()` |                                                                                                                                            |
| `updated_at`           | `timestamptz` | no   | `now()` | Trigger-maintained                                                                                                                         |
| `welcomed_at`          | `timestamptz` | yes  |         | When the user closed the welcome dialog. On the profile so it follows the user across devices. Not audited when it's the only change       |
| `is_main_admin`        | `boolean`     | no   | `false` | The app's own account (`admin@vecora.app`). Set on signup; at most one row (`profiles_one_main_admin`). The app can't write it             |
| `must_change_password` | `boolean`     | no   | `false` | Still on a default password (hosted seed). Cleared by `on_auth_user_password_changed` however the password changes. The app can't write it |

- **Column grants**: `authenticated` can only update `full_name` and `welcomed_at`. A new column
  the app should edit needs adding to that grant.
- **RLS**: everyone reads; you update your own row, admins update any.
- **Main admin**: named "Vecora Admin" and holding `admin`, enforced by triggers. It can't be
  deleted, change its email, lose the admin role or be renamed (`P0004`).

### `user_roles`

Role assignments; holding any role is board membership.

| Column       | Type          | Null | Default | Notes                                |
| ------------ | ------------- | ---- | ------- | ------------------------------------ |
| `user_id`    | `uuid`        | no   |         | FK `profiles(id)` on delete cascade  |
| `role`       | `app_role`    | no   |         |                                      |
| `granted_by` | `uuid`        | yes  |         | FK `profiles(id)` on delete set null |
| `created_at` | `timestamptz` | no   | `now()` |                                      |

- PK `(user_id, role)`. The app changes roles with delete + insert, never update.
- **RLS**: everyone reads. Admins insert and delete any role; presidents insert and delete any
  role except `admin`. Only admins update.

---

## Registry

### `properties`

Houses / units, identified by their number.

| Column       | Type          | Null | Default             | Notes                                                                 |
| ------------ | ------------- | ---- | ------------------- | --------------------------------------------------------------------- |
| `id`         | `uuid`        | no   | `gen_random_uuid()` | PK                                                                    |
| `number`     | `text`        | no   |                     | "12B", "Casa 4". Not blank. Unique case-insensitively among live rows |
| `notes`      | `text`        | yes  |                     |                                                                       |
| `created_at` | `timestamptz` | no   | `now()`             |                                                                       |
| `updated_at` | `timestamptz` | no   | `now()`             |                                                                       |
| `deleted_at` | `timestamptz` | yes  |                     | Soft delete. **Purged after 6 months if unreferenced**                |
| `deleted_by` | `uuid`        | yes  |                     | FK `profiles(id)` on delete set null. Trigger-stamped                 |

### `residents`

People in the registry, one row per person. A resident who moves out isn't deleted; deleting is
for mistakes (a duplicate, a test row).

| Column       | Type          | Null | Default             | Notes                                                                                                                                                                                                       |
| ------------ | ------------- | ---- | ------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `id`         | `uuid`        | no   | `gen_random_uuid()` | PK                                                                                                                                                                                                          |
| `profile_id` | `uuid`        | yes  |                     | FK `profiles(id)` on delete set null. Unique: one registry entry per account. Set when the resident joins the board                                                                                         |
| `first_name` | `text`        | no   |                     | Not blank                                                                                                                                                                                                   |
| `last_name`  | `text`        | no   |                     | Not blank                                                                                                                                                                                                   |
| `phone`      | `text`        | no   |                     | Not blank. Not unique (relatives share numbers)                                                                                                                                                             |
| `email`      | `text`        | yes  |                     | Not blank when present. Unique case-insensitively among live rows. Becomes the login if they join the board, so it can't be an email another auth account already uses (`residents_email_account`, `23505`) |
| `notes`      | `text`        | yes  |                     |                                                                                                                                                                                                             |
| `created_at` | `timestamptz` | no   | `now()`             |                                                                                                                                                                                                             |
| `updated_at` | `timestamptz` | no   | `now()`             |                                                                                                                                                                                                             |
| `deleted_at` | `timestamptz` | yes  |                     | Soft delete. **Purged after 6 months if unreferenced**                                                                                                                                                      |
| `deleted_by` | `uuid`        | yes  |                     | FK `profiles(id)` on delete set null. Trigger-stamped                                                                                                                                                       |

### `property_residents`

Who is attached to which house, and how. Many-to-many: a person can own several houses, and a house
can have several owners plus tenants and family.

| Column         | Type                     | Null | Default | Notes                                      |
| -------------- | ------------------------ | ---- | ------- | ------------------------------------------ |
| `property_id`  | `uuid`                   | no   |         | FK `properties(id)` **on delete restrict** |
| `resident_id`  | `uuid`                   | no   |         | FK `residents(id)` **on delete restrict**  |
| `relationship` | `residency_relationship` | no   |         | owner / tenant / family                    |
| `created_at`   | `timestamptz`            | no   | `now()` |                                            |

- PK `(property_id, resident_id)`; index on `resident_id`.
- Hard-deleted on unlink. A link row keeps both ends from being purged.

**RLS (all three tables)**: everyone reads; the president writes. `properties` and `residents`
have no DELETE grant; soft delete and restore go through UPDATE.

---

## Treasury

### `periods`

The board's fiscal year ("2026-2027") and the fee rules in force during it. Managed from
Presidency; the treasurer can write them too.

| Column        | Type            | Null | Default              | Notes                                                    |
| ------------- | --------------- | ---- | -------------------- | -------------------------------------------------------- |
| `id`          | `uuid`          | no   | `gen_random_uuid()`  | PK                                                       |
| `name`        | `text`          | no   |                      | Not blank. Unique case-insensitively                     |
| `starts_on`   | `date`          | no   |                      |                                                          |
| `ends_on`     | `date`          | no   |                      | `> starts_on`. Inclusive                                 |
| `monthly_fee` | `numeric(12,2)` | no   |                      | `> 0`. What each house pays per month                    |
| `late_fee`    | `numeric(12,2)` | no   | `100`                | `>= 0`. Fixed penalty when a fee is paid after `due_day` |
| `due_day`     | `smallint`      | no   | `10`                 | 1–28, so it exists in every month. Inclusive             |
| `currency`    | `currency_code` | no   | `current_currency()` | Fees of this period are recorded in it. Never changes    |
| `created_at`  | `timestamptz`   | no   | `now()`              |                                                          |
| `updated_at`  | `timestamptz`   | no   | `now()`              |                                                          |

- `periods_no_overlap`: an exclusion constraint, so no two periods cover the same day.
- **RLS**: everyone reads; the president or treasurer writes, deletes included.

### `transaction_categories`

Income / expense categories.

| Column       | Type               | Null | Default             | Notes                                                                                                                                   |
| ------------ | ------------------ | ---- | ------------------- | --------------------------------------------------------------------------------------------------------------------------------------- |
| `id`         | `uuid`             | no   | `gen_random_uuid()` | PK. Also unique with `kind`, for the composite FK                                                                                       |
| `kind`       | `transaction_kind` | no   |                     |                                                                                                                                         |
| `name`       | `text`             | no   |                     | Not blank. Unique per kind, case-insensitively                                                                                          |
| `key`        | `text`             | yes  |                     | Unique. Handle for the categories the app needs to find: `fee`, `late_fee`, `amenity_fee`, `amenity_refund`. Null for user-created ones |
| `is_active`  | `boolean`          | no   | `true`              | Retire instead of delete. System categories (`key` set) must stay active; they can be renamed                                           |
| `created_at` | `timestamptz`      | no   | `now()`             |                                                                                                                                         |
| `updated_at` | `timestamptz`      | no   | `now()`             |                                                                                                                                         |

The migration seeds 12 categories (Spanish names, since the HOA's data language defaults to `es`).
Income: Cuota de mantenimiento (`fee`), Recargo (`late_fee`), Multa, Tarifa de área común
(`amenity_fee`), Otro ingreso. Expense: Reembolso de área común (`amenity_refund`), Mantenimiento,
Servicios, Jardinería, Vigilancia, Administración, Otro egreso.

**RLS**: everyone reads; the treasurer writes.

### `transactions`

The ledger: one row per receipt line. Balance is always derived, never stored.

| Column                   | Type               | Null | Default              | Notes                                                                                                                        |
| ------------------------ | ------------------ | ---- | -------------------- | ---------------------------------------------------------------------------------------------------------------------------- |
| `id`                     | `uuid`             | no   | `gen_random_uuid()`  | PK                                                                                                                           |
| `kind`                   | `transaction_kind` | no   |                      | Gives the sign                                                                                                               |
| `category_id`            | `uuid`             | no   |                      | Composite FK `(category_id, kind)` → `transaction_categories(id, kind)` on delete restrict, so the category matches the kind |
| `period_id`              | `uuid`             | no   |                      | FK `periods(id)` on delete restrict                                                                                          |
| `property_id`            | `uuid`             | yes  |                      | FK `properties(id)` on delete restrict. The house, for fees and reservation payments. Keeps the house from being purged      |
| `amenity_reservation_id` | `uuid`             | yes  |                      | FK `amenity_reservations(id)` **on delete set null**. The booking a fee or refund belongs to                                 |
| `amount`                 | `numeric(12,2)`    | no   |                      | `> 0`, always positive                                                                                                       |
| `currency`               | `currency_code`    | no   | `current_currency()` | Never changes                                                                                                                |
| `occurred_on`            | `date`             | no   | `current_date`       | The day the money moved. Reports count by this                                                                               |
| `fee_month`              | `date`             | yes  |                      | Fees and late fees only: first day of the month covered. Requires `kind = income` and a `property_id`                        |
| `payment_method`         | `payment_method`   | no   | `'cash'`             |                                                                                                                              |
| `folio`                  | `text`             | yes  |                      | Number on the paper receipt. Shared by every line of one receipt, never by two receipts (see below)                          |
| `reference`              | `text`             | yes  |                      | Transfer reference / supplier invoice. Required for transfers                                                                |
| `description`            | `text`             | no   |                      | Not blank. Generated by the RPCs ("Cuota Agosto 2026", "Tarifa Terraza 3 Octubre 2026")                                      |
| `notes`                  | `text`             | yes  |                      |                                                                                                                              |
| `created_by`             | `uuid`             | no   | `auth.uid()`         | FK `profiles(id)` on delete restrict                                                                                         |
| `created_at`             | `timestamptz`      | no   | `now()`              | Also the receipt's identity for folio sharing                                                                                |
| `updated_at`             | `timestamptz`      | no   | `now()`              |                                                                                                                              |
| `deleted_at`             | `timestamptz`      | yes  |                      | Soft delete. **Never purged**                                                                                                |
| `deleted_by`             | `uuid`             | yes  |                      | FK `profiles(id)` on delete set null. Trigger-stamped                                                                        |

Constraints and indexes worth knowing:

- `transactions_folio_one_receipt`: an exclusion constraint `(folio =, created_at <>)` over live
  rows. Lines of one receipt are inserted in one database transaction and share `created_at`, so a
  folio may repeat only among those lines.
- `transactions_one_per_house_month_category`: one live fee and one live late fee per house and
  month.
- `transactions_one_per_amenity_reservation_category`: one live fee and one live refund per
  booking.
- Indexes: live rows by `occurred_on desc, created_at desc`; `period_id`; `category_id`;
  `property_id`; `folio`; `(fee_month, property_id)`; `amenity_reservation_id`.

**RLS**: everyone reads; the treasurer inserts and updates. No DELETE grant.

### Views

Both are `security_invoker`, so the caller's RLS applies.

**`treasury_period_summary`**: one row per period and currency, over live transactions. A period
without movements still gets one row in its own currency, with zeros.

| Column          | Notes            |
| --------------- | ---------------- |
| `period_id`     |                  |
| `currency`      |                  |
| `total_income`  | `numeric(12,2)`  |
| `total_expense` | `numeric(12,2)`  |
| `balance`       | income − expense |

**`house_fee_status`**: for the period that contains today, one row per live house. Empty when no
period covers today.

| Column          | Notes                                             |
| --------------- | ------------------------------------------------- |
| `property_id`   |                                                   |
| `number`        | House number                                      |
| `period_id`     |                                                   |
| `months_due`    | From the period's start through the current month |
| `months_paid`   | Months with a live `fee` row                      |
| `unpaid_months` | `date[]` of missing months; empty = up to date    |

---

## Common areas

### `amenities`

Bookable common areas (terrace, pool...), added by the president in the app.

| Column        | Type            | Null | Default             | Notes                                                                                                    |
| ------------- | --------------- | ---- | ------------------- | -------------------------------------------------------------------------------------------------------- |
| `id`          | `uuid`          | no   | `gen_random_uuid()` | PK                                                                                                       |
| `name`        | `text`          | no   |                     | Not blank. Unique case-insensitively                                                                     |
| `default_fee` | `numeric(12,2)` | no   | `0`                 | `>= 0`. Pre-fills a booking's fee, in the current `settings.currency` (no currency of its own). 0 = free |
| `is_active`   | `boolean`       | no   | `true`              | Retire an area that has bookings instead of deleting it                                                  |
| `created_at`  | `timestamptz`   | no   | `now()`             |                                                                                                          |
| `updated_at`  | `timestamptz`   | no   | `now()`             |                                                                                                          |

**RLS**: everyone reads; the president writes.

### `amenity_reservations`

Bookings by the day: one house per area per day.

| Column         | Type            | Null | Default              | Notes                                                                                               |
| -------------- | --------------- | ---- | -------------------- | --------------------------------------------------------------------------------------------------- |
| `id`           | `uuid`          | no   | `gen_random_uuid()`  | PK                                                                                                  |
| `amenity_id`   | `uuid`          | no   |                      | FK `amenities(id)` on delete restrict                                                               |
| `property_id`  | `uuid`          | no   |                      | FK `properties(id)` on delete restrict. Keeps the house from being purged                           |
| `reserved_on`  | `date`          | no   |                      | The booked day                                                                                      |
| `amount`       | `numeric(12,2)` | no   |                      | `>= 0`. Paid in full when booking. 0 = free                                                         |
| `currency`     | `currency_code` | no   | `current_currency()` | Its fee and refund are recorded in it. Never changes                                                |
| `notes`        | `text`          | yes  |                      | Not blank when present                                                                              |
| `cancelled_at` | `timestamptz`   | yes  |                      | Set only by `cancel_amenity_reservation`. A cancelled booking frees its day and never changes again |
| `cancelled_by` | `uuid`          | yes  |                      | FK `profiles(id)` on delete restrict. Set together with `cancelled_at`                              |
| `created_by`   | `uuid`          | no   | `auth.uid()`         | FK `profiles(id)` on delete restrict                                                                |
| `created_at`   | `timestamptz`   | no   | `now()`              |                                                                                                     |
| `updated_at`   | `timestamptz`   | no   | `now()`              |                                                                                                     |

- `amenity_reservations_one_per_day`: unique `(amenity_id, reserved_on)` among uncancelled rows.
- Status is derived, never stored: **paid** while a live `amenity_fee` transaction links to it;
  **cancelled** when `cancelled_at` is set; otherwise **pending** (or free when `amount = 0`).
- Once paid, its area, house and amount are fixed and it can't be deleted
  (`guard_paid_amenity_reservation`, `P0003`); the day can still move.
- **RLS**: everyone reads. The president or treasurer inserts, updates and deletes uncancelled
  rows. Payment and cancellation go through the treasurer RPCs.

---

## Payment requests

`maintenance_requests` and `security_requests` share one shape and lifecycle: the section records
what it spent or needs, and the treasurer pays or rejects it.

```
pending ──pay──▶ paid       (expense recorded and linked; final)
   ▲  └─reject─▶ rejected   (reason kept)
   └──reopen─────┘
```

| Column             | Type                    | Null | Default              | Notes                                                                                                   |
| ------------------ | ----------------------- | ---- | -------------------- | ------------------------------------------------------------------------------------------------------- |
| `id`               | `uuid`                  | no   | `gen_random_uuid()`  | PK                                                                                                      |
| `kind`             | `security_request_kind` | no   | `'other'`            | **`security_requests` only.** What the money is for; drives the default expense category and the filter |
| `title`            | `text`                  | no   |                      | Not blank. Becomes the expense's description                                                            |
| `details`          | `text`                  | yes  |                      |                                                                                                         |
| `amount`           | `numeric(12,2)`         | no   |                      | `> 0`                                                                                                   |
| `currency`         | `currency_code`         | no   | `current_currency()` | The expense is recorded in it. Never changes                                                            |
| `requested_on`     | `date`                  | no   | `current_date`       | Day the work was done or the purchase made, not when it was typed in                                    |
| `status`           | `request_status`        | no   | `'pending'`          | Only the RPCs move it off `pending`                                                                     |
| `rejection_reason` | `text`                  | yes  |                      | Required when rejected; cleared on reopen (the audit log keeps it)                                      |
| `resolved_by`      | `uuid`                  | yes  |                      | FK `profiles(id)` on delete restrict                                                                    |
| `resolved_at`      | `timestamptz`           | yes  |                      |                                                                                                         |
| `transaction_id`   | `uuid`                  | yes  |                      | FK `transactions(id)` on delete restrict. Unique. The expense, set only while paid                      |
| `created_by`       | `uuid`                  | no   | `auth.uid()`         | FK `profiles(id)` on delete restrict                                                                    |
| `created_at`       | `timestamptz`           | no   | `now()`              |                                                                                                         |
| `updated_at`       | `timestamptz`           | no   | `now()`              |                                                                                                         |

- `*_resolution_consistent`: a check that the resolution columns match the status: all null when
  pending; `resolved_*` and `transaction_id` when paid; `resolved_*` and a reason when rejected.
- Indexes: `(status, requested_on desc)`, `created_by`.
- **RLS**: everyone reads. The section's role (`maintenance` / `security`, or admin) inserts,
  updates and deletes **pending** rows only, and can't change the status.

---

## Documents

Documents themselves aren't stored: the editor keeps the draft in the browser and
`/reports/document` turns it into a PDF. Only the templates the board saves live here; the
built-in ones are in the app (`src/components/documents/templates.ts`).

### `document_templates`

| Column         | Type          | Null | Default             | Notes                                                                                                                                                               |
| -------------- | ------------- | ---- | ------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `id`           | `uuid`        | no   | `gen_random_uuid()` | PK                                                                                                                                                                  |
| `name`         | `text`        | no   |                     | Trimmed, 1-80. Unique, ignoring case (`document_templates_name_key`)                                                                                                |
| `description`  | `text`        | no   | `''`                | Trimmed, up to 200                                                                                                                                                  |
| `header_title` | `text`        | no   |                     | 1-60, like the editor's header                                                                                                                                      |
| `title`        | `text`        | no   |                     | 1-150, like the editor's title                                                                                                                                      |
| `content`      | `jsonb`       | no   |                     | The editor's (Tiptap) JSON, checked by the app against `documentContentSchema`. Up to 2.5 MB as text (the app allows 2,000,000 characters); images travel inside it |
| `created_by`   | `uuid`        | yes  | `auth.uid()`        | FK `profiles(id)` on delete set null                                                                                                                                |
| `created_at`   | `timestamptz` | no   | `now()`             |                                                                                                                                                                     |
| `updated_at`   | `timestamptz` | no   | `now()`             |                                                                                                                                                                     |

- **Fixed once saved**: `authenticated` can only update `name` and `description` (column grant).
  To change the document, save a new template and delete the old one.
- **RLS**: everyone reads; any board member (any role) inserts, always with `created_by` set to
  themselves; whoever saved it, or an admin, updates and deletes.
- **Audit**: `private.audit_document_template()`, not `private.audit()`: the same rows, labeled by
  `name`, but without `content` (megabytes with images, and the activity log loads `old_data` /
  `new_data` for every entry it lists).
- Index: `created_by`.

---

## Settings and logo

### `settings`

A single row for the whole deployment, created by the migration. The app only updates it.

| Column             | Type            | Null | Default             | Notes                                                                                                                                                       |
| ------------------ | --------------- | ---- | ------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `id`               | `uuid`          | no   | `gen_random_uuid()` | PK                                                                                                                                                          |
| `singleton`        | `boolean`       | no   | `true`              | Unique and always true, so there can be only one row                                                                                                        |
| `residential_name` | `text`          | no   | `''`                | Trimmed. Shown in the sidebar and reports; empty = generic label                                                                                            |
| `default_language` | `app_language`  | no   | `'es'`              | Language of the HOA's data (generated descriptions, seeded category names, the report), and the UI default for anyone who hasn't picked one. **Admin only** |
| `currency`         | `currency_code` | no   | `'MXN'`             | Currency of new amounts; existing rows keep theirs. **Admin only**                                                                                          |
| `updated_at`       | `timestamptz`   | no   | `now()`             |                                                                                                                                                             |
| `logo_path`        | `text`          | yes  |                     | File in the `branding` bucket; null = no logo                                                                                                               |

- **RLS**: everyone reads; the president updates. `guard_settings_admin_fields` rejects language
  or currency changes from non-admins (`42501`). Sessions with no user (SQL editor, seeds) are
  let through.
- Each person's UI language lives in their browser, not here.

### `branding` storage bucket

Private bucket: 1 MiB limit, `image/png` only. Uploads are resized and converted to PNG on the
server. Every upload gets a new file name; the app deletes the previous file once
`settings.logo_path` points at the new one. Everyone reads; the president uploads and deletes.
`db reset --linked` leaves storage alone, so the bucket (and its files) can outlive a reset.

---

## Audit log

### `audit_log`

Every insert, update and delete on the app tables, so an admin can reconstruct what happened.
Written by the `private.audit()` trigger, attached as `<table>_audit` to: `properties`,
`residents`, `property_residents`, `periods`, `transactions`, `transaction_categories`,
`amenities`, `amenity_reservations`, `maintenance_requests`, `security_requests`, `profiles`,
`user_roles`, `settings`. A new app table needs adding to that list (and to the label `case` in
`private.audit()`). `document_templates` has its own trigger, `private.audit_document_template()`,
which writes the same rows without the template's content (see
[`document_templates`](#document_templates)).

| Column           | Type              | Null | Default                | Notes                                                                                                                                         |
| ---------------- | ----------------- | ---- | ---------------------- | --------------------------------------------------------------------------------------------------------------------------------------------- |
| `id`             | `bigint`          | no   | identity               | PK                                                                                                                                            |
| `occurred_at`    | `timestamptz`     | no   | `now()`                |                                                                                                                                               |
| `identity_id`    | `uuid`            | yes  |                        | Who did it (`auth.uid()`). FK `profiles(id)` on delete set null. Null for the signup trigger, the nightly purge and seeds; shown as "Sistema" |
| `table_name`     | `text`            | no   |                        |                                                                                                                                               |
| `operation`      | `audit_operation` | no   |                        |                                                                                                                                               |
| `row_id`         | `uuid`            | yes  |                        | The row's `id`; null for composite-key tables (`property_residents`, `user_roles`)                                                            |
| `label`          | `text`            | no   |                        | Display name of the row, frozen at write time (house number, person name, description, title...)                                              |
| `old_data`       | `jsonb`           | yes  |                        | Full row before (update, delete)                                                                                                              |
| `new_data`       | `jsonb`           | yes  |                        | Full row after (insert, update)                                                                                                               |
| `changed_fields` | `text[]`          | yes  |                        | Update only: columns that changed, excluding `updated_at` and `welcomed_at`                                                                   |
| `refs`           | `jsonb`           | no   | `'{}'`                 | FK id → display name for every `*_id` / `*_by` column, frozen at write time, so entries stay readable after the target is deleted or purged   |
| `txid`           | `bigint`          | no   | `pg_current_xact_id()` | Groups rows written by one action (e.g. paying a request = one transaction insert + one request update)                                       |

- Updates where only `updated_at` and/or `welcomed_at` changed aren't recorded.
- Indexes: `(occurred_at desc, id desc)`, `(table_name, row_id)`, `identity_id`.
- **Access**: admins read. Nobody writes through the API: the trigger is `security definer`, and
  there are no insert/update/delete policies, so the log is append-only from the app.
- **Retention: none.** Rows are kept forever, including full copies of rows the purge later
  removes (see the [privacy note](#the-nightly-purge)).

---

## Functions (RPCs)

Callable by `authenticated` through `supabase.rpc(...)`. Invoker functions run under the caller's
RLS; definer functions check the role themselves.

| Function                                                                                                                                       | Security | Who       | What                                                                                                                                                                              |
| ---------------------------------------------------------------------------------------------------------------------------------------------- | -------- | --------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `create_resident(first_name, last_name, phone, email?, notes?, property_id?, relationship?)`                                                   | invoker  | President | Inserts a resident and optionally links them to a live house, atomically. Returns the id                                                                                          |
| `record_fee_payment(property_id, fee_months[], occurred_on, folio, payment_method?, reference?, notes?, period_id?, amount?, apply_late_fee?)` | invoker  | Treasurer | One receipt: a `fee` row per month, plus a `late_fee` row for each month paid after `due_day` (or forced by `apply_late_fee`). In the period's currency. Returns counts and total |
| `financial_report(from, to)`                                                                                                                   | invoker  | Everyone  | JSON for the PDF: per-currency opening/closing balance and category totals (by `occurred_on`), fee status per house (by `fee_month`), fees paid ahead                             |
| `pay_amenity_reservation(reservation_id, occurred_on, folio?, payment_method?, reference?, notes?)`                                            | definer  | Treasurer | Records the booking's fee as `amenity_fee` income linked to it                                                                                                                    |
| `cancel_amenity_reservation(reservation_id, refund_amount?, occurred_on?, payment_method?, reference?, notes?)`                                | definer  | Treasurer | Cancels, frees the day, and records an optional refund (up to what was paid) as `amenity_refund` expense                                                                          |
| `pay_maintenance_request` / `pay_security_request(request_id, category_id, occurred_on, payment_method?, reference?, notes?)`                  | definer  | Treasurer | Records the expense and marks the request paid, atomically. Returns the transaction id                                                                                            |
| `reject_maintenance_request` / `reject_security_request(request_id, reason)`                                                                   | definer  | Treasurer | Pending → rejected, with a reason                                                                                                                                                 |
| `reopen_maintenance_request` / `reopen_security_request(request_id)`                                                                           | definer  | Treasurer | Rejected → pending; clears the reason                                                                                                                                             |

Every RPC that writes to the ledger needs a period covering `occurred_on` (`P0002` otherwise), and
a reference for transfers (`22023`).

Private helpers (not callable from the API): `has_role`, `is_admin`, `set_updated_at`,
`set_deleted_by`, `keep_currency`, `current_currency`, `check_resident_email`, `handle_new_user`,
`handle_password_changed`, `protect_main_admin_*`, `guard_paid_amenity_reservation`,
`guard_settings_admin_fields`, `amenity_reservation_day` / `_label`, `audit`, `audit_refs`,
`audit_document_template`, `purge_soft_deleted`.

## Error codes

Custom errors use these SQLSTATEs, which the app maps to messages:

| Code    | Meaning                                                                                          |
| ------- | ------------------------------------------------------------------------------------------------ |
| `23505` | Unique violation; also raised by hand as `residents_email_account` (email used by another login) |
| `23P01` | Exclusion violation (`periods_no_overlap`, `transactions_folio_one_receipt`)                     |
| `22023` | Invalid parameter (transfer without reference, bad fee month, refund too big, currency change)   |
| `42501` | Missing role for an RPC, or a non-admin changing language/currency                               |
| `P0002` | Not found (row, live house, period covering the date)                                            |
| `P0003` | Wrong state (request already resolved, reservation paid/cancelled)                               |
| `P0004` | Main admin guard                                                                                 |
