ALTER TABLE "vehicles" ADD COLUMN "deleted_at" timestamp with time zone;--> statement-breakpoint
DROP INDEX "vehicles_plate_unique";--> statement-breakpoint
CREATE UNIQUE INDEX "vehicles_plate_unique" ON "vehicles" (regexp_replace(upper("plate"), '[^[:alnum:]]', '', 'g')) WHERE "deleted_at" is null;--> statement-breakpoint
DROP INDEX "vehicles_rfid_serial_unique";--> statement-breakpoint
CREATE UNIQUE INDEX "vehicles_rfid_serial_unique" ON "vehicles" (lower("rfid_serial")) WHERE "deleted_at" is null and "rfid_serial" is not null;