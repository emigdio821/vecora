CREATE TYPE "vehicle_kind" AS ENUM('car', 'motorcycle');--> statement-breakpoint
CREATE TABLE "vehicles" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"property_id" uuid NOT NULL,
	"kind" "vehicle_kind" NOT NULL,
	"plate" text NOT NULL,
	"rfid_serial" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "vehicles_plate_not_blank" CHECK (btrim("plate") <> ''),
	CONSTRAINT "vehicles_rfid_serial_not_blank" CHECK (btrim("rfid_serial") <> '')
);
--> statement-breakpoint
CREATE UNIQUE INDEX "vehicles_plate_unique" ON "vehicles" (regexp_replace(upper("plate"), '[^[:alnum:]]', '', 'g'));--> statement-breakpoint
CREATE UNIQUE INDEX "vehicles_rfid_serial_unique" ON "vehicles" (lower("rfid_serial")) WHERE "rfid_serial" is not null;--> statement-breakpoint
CREATE INDEX "vehicles_property_id_idx" ON "vehicles" ("property_id");--> statement-breakpoint
ALTER TABLE "vehicles" ADD CONSTRAINT "vehicles_property_id_properties_id_fkey" FOREIGN KEY ("property_id") REFERENCES "properties"("id") ON DELETE CASCADE;