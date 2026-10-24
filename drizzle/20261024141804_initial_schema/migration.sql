CREATE TYPE "audit_operation" AS ENUM('insert', 'update', 'delete');--> statement-breakpoint
CREATE TYPE "app_language" AS ENUM('es', 'en');--> statement-breakpoint
CREATE TYPE "currency_code" AS ENUM('MXN', 'USD');--> statement-breakpoint
CREATE TYPE "payment_method" AS ENUM('cash', 'transfer');--> statement-breakpoint
CREATE TYPE "transaction_kind" AS ENUM('income', 'expense');--> statement-breakpoint
CREATE TYPE "residency_relationship" AS ENUM('owner', 'tenant', 'family', 'unconfirmed');--> statement-breakpoint
CREATE TYPE "request_status" AS ENUM('pending', 'paid', 'rejected');--> statement-breakpoint
CREATE TYPE "security_request_kind" AS ENUM('cameras', 'guards', 'access', 'equipment', 'supplies', 'other');--> statement-breakpoint
CREATE TABLE "audit_log" (
	"id" bigint PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "audit_log_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 9223372036854775807 START WITH 1 CACHE 1),
	"occurred_at" timestamp with time zone DEFAULT now() NOT NULL,
	"actor_id" uuid,
	"table_name" text NOT NULL,
	"operation" "audit_operation" NOT NULL,
	"row_id" uuid,
	"label" text NOT NULL,
	"old_data" jsonb,
	"new_data" jsonb,
	"changed_fields" text[],
	"refs" jsonb DEFAULT '{}' NOT NULL,
	"txid" bigint NOT NULL
);
--> statement-breakpoint
CREATE TABLE "accounts" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"account_id" text NOT NULL,
	"provider_id" text NOT NULL,
	"user_id" uuid NOT NULL,
	"access_token" text,
	"refresh_token" text,
	"id_token" text,
	"access_token_expires_at" timestamp with time zone,
	"refresh_token_expires_at" timestamp with time zone,
	"scope" text,
	"password" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone NOT NULL
);
--> statement-breakpoint
CREATE TABLE "rate_limits" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"key" text NOT NULL UNIQUE,
	"count" integer NOT NULL,
	"last_request" bigint NOT NULL
);
--> statement-breakpoint
CREATE TABLE "sessions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"expires_at" timestamp with time zone NOT NULL,
	"token" text NOT NULL UNIQUE,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone NOT NULL,
	"ip_address" text,
	"user_agent" text,
	"user_id" uuid NOT NULL,
	"impersonated_by" text,
	"from_access_link" boolean DEFAULT false NOT NULL
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"name" text NOT NULL,
	"email" text NOT NULL UNIQUE,
	"email_verified" boolean DEFAULT false NOT NULL,
	"image" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"role" text,
	"banned" boolean DEFAULT false,
	"ban_reason" text,
	"ban_expires" timestamp with time zone,
	"is_main_admin" boolean DEFAULT false NOT NULL,
	"must_change_password" boolean DEFAULT false NOT NULL,
	"welcomed_at" timestamp with time zone,
	CONSTRAINT "users_email_lowercase" CHECK ("email" = lower("email")),
	CONSTRAINT "users_role_valid" CHECK ("role" is null or "role" = '' or string_to_array("role", ',') <@ array['admin', 'president', 'treasurer', 'security', 'maintenance'])
);
--> statement-breakpoint
CREATE TABLE "verifications" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"identifier" text NOT NULL,
	"value" text NOT NULL,
	"expires_at" timestamp with time zone NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "document_templates" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"name" text NOT NULL,
	"description" text DEFAULT '' NOT NULL,
	"header_title" text NOT NULL,
	"title" text NOT NULL,
	"content" jsonb NOT NULL,
	"created_by" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "document_templates_name_length" CHECK (char_length("name") between 1 and 80),
	CONSTRAINT "document_templates_name_trimmed" CHECK ("name" = btrim("name")),
	CONSTRAINT "document_templates_description_length" CHECK (char_length("description") <= 200),
	CONSTRAINT "document_templates_description_trimmed" CHECK ("description" = btrim("description")),
	CONSTRAINT "document_templates_header_title_length" CHECK (char_length("header_title") between 1 and 60),
	CONSTRAINT "document_templates_title_length" CHECK (char_length("title") between 1 and 150),
	CONSTRAINT "document_templates_content_is_document" CHECK (jsonb_typeof("content") = 'object'),
	CONSTRAINT "document_templates_content_size" CHECK (octet_length("content"::text) <= 2500000)
);
--> statement-breakpoint
CREATE TABLE "amenities" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"name" text NOT NULL,
	"default_fee" numeric(12,2) DEFAULT '0' NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "amenities_name_not_blank" CHECK (btrim("name") <> ''),
	CONSTRAINT "amenities_default_fee_not_negative" CHECK ("default_fee" >= 0)
);
--> statement-breakpoint
CREATE TABLE "amenity_reservations" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"amenity_id" uuid NOT NULL,
	"property_id" uuid NOT NULL,
	"reserved_on" date NOT NULL,
	"amount" numeric(12,2) NOT NULL,
	"currency" "currency_code" NOT NULL,
	"notes" text,
	"cancelled_at" timestamp with time zone,
	"cancelled_by" uuid,
	"created_by" uuid NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "amenity_reservations_notes_not_blank" CHECK ("notes" is null or btrim("notes") <> ''),
	CONSTRAINT "amenity_reservations_amount_not_negative" CHECK ("amount" >= 0),
	CONSTRAINT "amenity_reservations_cancellation_consistent" CHECK (("cancelled_at" is null) = ("cancelled_by" is null))
);
--> statement-breakpoint
CREATE TABLE "properties" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"number" text NOT NULL,
	"notes" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone,
	"deleted_by" uuid,
	CONSTRAINT "properties_number_not_blank" CHECK (btrim("number") <> '')
);
--> statement-breakpoint
CREATE TABLE "property_residents" (
	"property_id" uuid,
	"resident_id" uuid,
	"relationship" "residency_relationship" NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "property_residents_pkey" PRIMARY KEY("property_id","resident_id")
);
--> statement-breakpoint
CREATE TABLE "residents" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"user_id" uuid UNIQUE,
	"first_name" text NOT NULL,
	"last_name" text NOT NULL,
	"phone" text NOT NULL,
	"email" text,
	"notes" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone,
	"deleted_by" uuid,
	CONSTRAINT "residents_first_name_not_blank" CHECK (btrim("first_name") <> ''),
	CONSTRAINT "residents_last_name_not_blank" CHECK (btrim("last_name") <> ''),
	CONSTRAINT "residents_phone_not_blank" CHECK (btrim("phone") <> ''),
	CONSTRAINT "residents_email_not_blank" CHECK (btrim("email") <> '')
);
--> statement-breakpoint
CREATE TABLE "maintenance_requests" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"title" text NOT NULL,
	"details" text,
	"amount" numeric(12,2) NOT NULL,
	"currency" "currency_code" NOT NULL,
	"requested_on" date NOT NULL,
	"status" "request_status" DEFAULT 'pending'::"request_status" NOT NULL,
	"rejection_reason" text,
	"resolved_by" uuid,
	"resolved_at" timestamp with time zone,
	"transaction_id" uuid UNIQUE,
	"created_by" uuid NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "maintenance_requests_title_not_blank" CHECK (btrim("title") <> ''),
	CONSTRAINT "maintenance_requests_amount_positive" CHECK ("amount" > 0),
	CONSTRAINT "maintenance_requests_resolution_consistent" CHECK (("status" = 'pending'
          and "resolved_by" is null and "resolved_at" is null
          and "transaction_id" is null and "rejection_reason" is null)
        or ("status" = 'paid'
          and "resolved_by" is not null and "resolved_at" is not null
          and "transaction_id" is not null and "rejection_reason" is null)
        or ("status" = 'rejected'
          and "resolved_by" is not null and "resolved_at" is not null
          and "transaction_id" is null and btrim(coalesce("rejection_reason", '')) <> ''))
);
--> statement-breakpoint
CREATE TABLE "security_requests" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"title" text NOT NULL,
	"details" text,
	"amount" numeric(12,2) NOT NULL,
	"currency" "currency_code" NOT NULL,
	"requested_on" date NOT NULL,
	"status" "request_status" DEFAULT 'pending'::"request_status" NOT NULL,
	"rejection_reason" text,
	"resolved_by" uuid,
	"resolved_at" timestamp with time zone,
	"transaction_id" uuid UNIQUE,
	"created_by" uuid NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"kind" "security_request_kind" DEFAULT 'other'::"security_request_kind" NOT NULL,
	CONSTRAINT "security_requests_title_not_blank" CHECK (btrim("title") <> ''),
	CONSTRAINT "security_requests_amount_positive" CHECK ("amount" > 0),
	CONSTRAINT "security_requests_resolution_consistent" CHECK (("status" = 'pending'
          and "resolved_by" is null and "resolved_at" is null
          and "transaction_id" is null and "rejection_reason" is null)
        or ("status" = 'paid'
          and "resolved_by" is not null and "resolved_at" is not null
          and "transaction_id" is not null and "rejection_reason" is null)
        or ("status" = 'rejected'
          and "resolved_by" is not null and "resolved_at" is not null
          and "transaction_id" is null and btrim(coalesce("rejection_reason", '')) <> ''))
);
--> statement-breakpoint
CREATE TABLE "settings" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"singleton" boolean DEFAULT true NOT NULL UNIQUE,
	"residential_name" text DEFAULT '' NOT NULL,
	"default_language" "app_language" DEFAULT 'es'::"app_language" NOT NULL,
	"currency" "currency_code" DEFAULT 'MXN'::"currency_code" NOT NULL,
	"logo_path" text,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "settings_singleton" CHECK ("singleton"),
	CONSTRAINT "settings_residential_name_trimmed" CHECK ("residential_name" = btrim("residential_name"))
);
--> statement-breakpoint
CREATE TABLE "periods" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"name" text NOT NULL,
	"starts_on" date NOT NULL,
	"ends_on" date NOT NULL,
	"monthly_fee" numeric(12,2) NOT NULL,
	"late_fee" numeric(12,2) DEFAULT '100' NOT NULL,
	"due_day" smallint DEFAULT 10 NOT NULL,
	"currency" "currency_code" NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "periods_name_not_blank" CHECK (btrim("name") <> ''),
	CONSTRAINT "periods_dates_ordered" CHECK ("ends_on" > "starts_on"),
	CONSTRAINT "periods_monthly_fee_positive" CHECK ("monthly_fee" > 0),
	CONSTRAINT "periods_late_fee_not_negative" CHECK ("late_fee" >= 0),
	CONSTRAINT "periods_due_day_valid" CHECK ("due_day" between 1 and 28)
);
--> statement-breakpoint
CREATE TABLE "transaction_categories" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"kind" "transaction_kind" NOT NULL,
	"name" text NOT NULL,
	"key" text UNIQUE,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "transaction_categories_id_kind_unique" UNIQUE("id","kind"),
	CONSTRAINT "transaction_categories_name_not_blank" CHECK (btrim("name") <> ''),
	CONSTRAINT "transaction_categories_system_active" CHECK ("key" is null or "is_active")
);
--> statement-breakpoint
CREATE TABLE "transactions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"kind" "transaction_kind" NOT NULL,
	"category_id" uuid NOT NULL,
	"period_id" uuid NOT NULL,
	"property_id" uuid,
	"amenity_reservation_id" uuid,
	"amount" numeric(12,2) NOT NULL,
	"currency" "currency_code" NOT NULL,
	"occurred_on" date NOT NULL,
	"fee_month" date,
	"payment_method" "payment_method" DEFAULT 'cash'::"payment_method" NOT NULL,
	"folio" text,
	"reference" text,
	"description" text NOT NULL,
	"notes" text,
	"created_by" uuid NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone,
	"deleted_by" uuid,
	CONSTRAINT "transactions_amount_positive" CHECK ("amount" > 0),
	CONSTRAINT "transactions_description_not_blank" CHECK (btrim("description") <> ''),
	CONSTRAINT "transactions_folio_not_blank" CHECK ("folio" is null or btrim("folio") <> ''),
	CONSTRAINT "transactions_reference_not_blank" CHECK ("reference" is null or btrim("reference") <> ''),
	CONSTRAINT "transactions_fee_month_first_day" CHECK ("fee_month" is null or extract(day from "fee_month") = 1),
	CONSTRAINT "transactions_transfer_has_reference" CHECK ("payment_method" <> 'transfer' or "reference" is not null),
	CONSTRAINT "transactions_fee_month_needs_property" CHECK ("fee_month" is null or ("kind" = 'income' and "property_id" is not null))
);
--> statement-breakpoint
CREATE INDEX "audit_log_occurred_at_idx" ON "audit_log" ("occurred_at" DESC NULLS LAST,"id" DESC NULLS LAST);--> statement-breakpoint
CREATE INDEX "audit_log_table_row_idx" ON "audit_log" ("table_name","row_id");--> statement-breakpoint
CREATE INDEX "audit_log_actor_id_idx" ON "audit_log" ("actor_id");--> statement-breakpoint
CREATE INDEX "accounts_user_id_idx" ON "accounts" ("user_id");--> statement-breakpoint
CREATE INDEX "sessions_user_id_idx" ON "sessions" ("user_id");--> statement-breakpoint
CREATE UNIQUE INDEX "users_one_main_admin" ON "users" ("is_main_admin") WHERE "is_main_admin";--> statement-breakpoint
CREATE INDEX "verifications_identifier_idx" ON "verifications" ("identifier");--> statement-breakpoint
CREATE UNIQUE INDEX "document_templates_name_key" ON "document_templates" (lower("name"));--> statement-breakpoint
CREATE INDEX "document_templates_created_by_idx" ON "document_templates" ("created_by");--> statement-breakpoint
CREATE UNIQUE INDEX "amenities_name_unique" ON "amenities" (lower("name"));--> statement-breakpoint
CREATE UNIQUE INDEX "amenity_reservations_one_per_day" ON "amenity_reservations" ("amenity_id","reserved_on") WHERE "cancelled_at" is null;--> statement-breakpoint
CREATE INDEX "amenity_reservations_property_id_idx" ON "amenity_reservations" ("property_id");--> statement-breakpoint
CREATE UNIQUE INDEX "properties_number_unique" ON "properties" (lower("number")) WHERE "deleted_at" is null;--> statement-breakpoint
CREATE INDEX "property_residents_resident_id_idx" ON "property_residents" ("resident_id");--> statement-breakpoint
CREATE UNIQUE INDEX "residents_email_unique" ON "residents" (lower("email")) WHERE "deleted_at" is null and "email" is not null;--> statement-breakpoint
CREATE INDEX "maintenance_requests_status_requested_on_idx" ON "maintenance_requests" ("status","requested_on" DESC NULLS LAST);--> statement-breakpoint
CREATE INDEX "maintenance_requests_created_by_idx" ON "maintenance_requests" ("created_by");--> statement-breakpoint
CREATE INDEX "security_requests_status_requested_on_idx" ON "security_requests" ("status","requested_on" DESC NULLS LAST);--> statement-breakpoint
CREATE INDEX "security_requests_created_by_idx" ON "security_requests" ("created_by");--> statement-breakpoint
CREATE UNIQUE INDEX "periods_name_unique" ON "periods" (lower("name"));--> statement-breakpoint
CREATE UNIQUE INDEX "transaction_categories_name_unique" ON "transaction_categories" ("kind",lower("name"));--> statement-breakpoint
CREATE INDEX "transactions_live_occurred_on_idx" ON "transactions" ("occurred_on" DESC NULLS LAST,"created_at" DESC NULLS LAST) WHERE "deleted_at" is null;--> statement-breakpoint
CREATE INDEX "transactions_period_id_idx" ON "transactions" ("period_id");--> statement-breakpoint
CREATE INDEX "transactions_category_id_idx" ON "transactions" ("category_id");--> statement-breakpoint
CREATE INDEX "transactions_property_id_idx" ON "transactions" ("property_id") WHERE "property_id" is not null;--> statement-breakpoint
CREATE INDEX "transactions_amenity_reservation_id_idx" ON "transactions" ("amenity_reservation_id") WHERE "amenity_reservation_id" is not null;--> statement-breakpoint
CREATE INDEX "transactions_folio_idx" ON "transactions" ("folio") WHERE "folio" is not null;--> statement-breakpoint
CREATE INDEX "transactions_fee_month_property_idx" ON "transactions" ("fee_month","property_id") WHERE "fee_month" is not null and "deleted_at" is null;--> statement-breakpoint
CREATE UNIQUE INDEX "transactions_one_per_house_month_category" ON "transactions" ("property_id","fee_month","category_id") WHERE "fee_month" is not null and "deleted_at" is null;--> statement-breakpoint
CREATE UNIQUE INDEX "transactions_one_per_amenity_reservation_category" ON "transactions" ("amenity_reservation_id","category_id") WHERE "amenity_reservation_id" is not null and "deleted_at" is null;--> statement-breakpoint
ALTER TABLE "audit_log" ADD CONSTRAINT "audit_log_actor_id_users_id_fkey" FOREIGN KEY ("actor_id") REFERENCES "users"("id") ON DELETE SET NULL;--> statement-breakpoint
ALTER TABLE "accounts" ADD CONSTRAINT "accounts_user_id_users_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "sessions" ADD CONSTRAINT "sessions_user_id_users_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "document_templates" ADD CONSTRAINT "document_templates_created_by_users_id_fkey" FOREIGN KEY ("created_by") REFERENCES "users"("id") ON DELETE SET NULL;--> statement-breakpoint
ALTER TABLE "amenity_reservations" ADD CONSTRAINT "amenity_reservations_amenity_id_amenities_id_fkey" FOREIGN KEY ("amenity_id") REFERENCES "amenities"("id") ON DELETE RESTRICT;--> statement-breakpoint
ALTER TABLE "amenity_reservations" ADD CONSTRAINT "amenity_reservations_property_id_properties_id_fkey" FOREIGN KEY ("property_id") REFERENCES "properties"("id") ON DELETE RESTRICT;--> statement-breakpoint
ALTER TABLE "amenity_reservations" ADD CONSTRAINT "amenity_reservations_cancelled_by_users_id_fkey" FOREIGN KEY ("cancelled_by") REFERENCES "users"("id") ON DELETE RESTRICT;--> statement-breakpoint
ALTER TABLE "amenity_reservations" ADD CONSTRAINT "amenity_reservations_created_by_users_id_fkey" FOREIGN KEY ("created_by") REFERENCES "users"("id") ON DELETE RESTRICT;--> statement-breakpoint
ALTER TABLE "properties" ADD CONSTRAINT "properties_deleted_by_users_id_fkey" FOREIGN KEY ("deleted_by") REFERENCES "users"("id") ON DELETE SET NULL;--> statement-breakpoint
ALTER TABLE "property_residents" ADD CONSTRAINT "property_residents_property_id_properties_id_fkey" FOREIGN KEY ("property_id") REFERENCES "properties"("id") ON DELETE RESTRICT;--> statement-breakpoint
ALTER TABLE "property_residents" ADD CONSTRAINT "property_residents_resident_id_residents_id_fkey" FOREIGN KEY ("resident_id") REFERENCES "residents"("id") ON DELETE RESTRICT;--> statement-breakpoint
ALTER TABLE "residents" ADD CONSTRAINT "residents_user_id_users_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE SET NULL;--> statement-breakpoint
ALTER TABLE "residents" ADD CONSTRAINT "residents_deleted_by_users_id_fkey" FOREIGN KEY ("deleted_by") REFERENCES "users"("id") ON DELETE SET NULL;--> statement-breakpoint
ALTER TABLE "maintenance_requests" ADD CONSTRAINT "maintenance_requests_resolved_by_users_id_fkey" FOREIGN KEY ("resolved_by") REFERENCES "users"("id") ON DELETE RESTRICT;--> statement-breakpoint
ALTER TABLE "maintenance_requests" ADD CONSTRAINT "maintenance_requests_transaction_id_transactions_id_fkey" FOREIGN KEY ("transaction_id") REFERENCES "transactions"("id") ON DELETE RESTRICT;--> statement-breakpoint
ALTER TABLE "maintenance_requests" ADD CONSTRAINT "maintenance_requests_created_by_users_id_fkey" FOREIGN KEY ("created_by") REFERENCES "users"("id") ON DELETE RESTRICT;--> statement-breakpoint
ALTER TABLE "security_requests" ADD CONSTRAINT "security_requests_resolved_by_users_id_fkey" FOREIGN KEY ("resolved_by") REFERENCES "users"("id") ON DELETE RESTRICT;--> statement-breakpoint
ALTER TABLE "security_requests" ADD CONSTRAINT "security_requests_transaction_id_transactions_id_fkey" FOREIGN KEY ("transaction_id") REFERENCES "transactions"("id") ON DELETE RESTRICT;--> statement-breakpoint
ALTER TABLE "security_requests" ADD CONSTRAINT "security_requests_created_by_users_id_fkey" FOREIGN KEY ("created_by") REFERENCES "users"("id") ON DELETE RESTRICT;--> statement-breakpoint
ALTER TABLE "transactions" ADD CONSTRAINT "transactions_period_id_periods_id_fkey" FOREIGN KEY ("period_id") REFERENCES "periods"("id") ON DELETE RESTRICT;--> statement-breakpoint
ALTER TABLE "transactions" ADD CONSTRAINT "transactions_property_id_properties_id_fkey" FOREIGN KEY ("property_id") REFERENCES "properties"("id") ON DELETE RESTRICT;--> statement-breakpoint
ALTER TABLE "transactions" ADD CONSTRAINT "transactions_created_by_users_id_fkey" FOREIGN KEY ("created_by") REFERENCES "users"("id") ON DELETE RESTRICT;--> statement-breakpoint
ALTER TABLE "transactions" ADD CONSTRAINT "transactions_deleted_by_users_id_fkey" FOREIGN KEY ("deleted_by") REFERENCES "users"("id") ON DELETE SET NULL;--> statement-breakpoint
ALTER TABLE "transactions" ADD CONSTRAINT "transactions_category_fkey" FOREIGN KEY ("category_id","kind") REFERENCES "transaction_categories"("id","kind") ON DELETE RESTRICT;--> statement-breakpoint
ALTER TABLE "transactions" ADD CONSTRAINT "transactions_amenity_reservation_id_fkey" FOREIGN KEY ("amenity_reservation_id") REFERENCES "amenity_reservations"("id") ON DELETE SET NULL;--> statement-breakpoint
CREATE VIEW "house_fee_status" AS (
  with current_period as (
    select id, starts_on, ends_on from periods
    where current_date between starts_on and ends_on
  ),
  due_months as (
    select
      cp.id as period_id,
      generate_series(
        date_trunc('month', cp.starts_on)::date,
        date_trunc('month', least(current_date, cp.ends_on))::date,
        interval '1 month'
      )::date as fee_month
    from current_period cp
  ),
  fee_category as (
    select id from transaction_categories where key = 'fee'
  )
  select
    pr.id as property_id,
    pr.number,
    dm.period_id,
    count(dm.fee_month)::int as months_due,
    count(t.id)::int as months_paid,
    coalesce(array_agg(dm.fee_month order by dm.fee_month) filter (where t.id is null), '{}'::date[]) as unpaid_months
  from properties pr
  cross join due_months dm
  left join transactions t
    on t.property_id = pr.id
    and t.fee_month = dm.fee_month
    and t.category_id = (select id from fee_category)
    and t.deleted_at is null
  where pr.deleted_at is null
  group by pr.id, pr.number, dm.period_id
);--> statement-breakpoint
CREATE VIEW "treasury_period_summary" AS (
  select
    p.id as period_id,
    coalesce(t.currency, p.currency) as currency,
    coalesce(sum(t.amount) filter (where t.kind = 'income'), 0)::numeric(12,2) as total_income,
    coalesce(sum(t.amount) filter (where t.kind = 'expense'), 0)::numeric(12,2) as total_expense,
    coalesce(sum(case t.kind when 'income' then t.amount else -t.amount end), 0)::numeric(12,2) as balance
  from periods p
  left join transactions t on t.period_id = p.id and t.deleted_at is null
  group by p.id, coalesce(t.currency, p.currency)
);