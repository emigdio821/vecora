ALTER TABLE "vehicles" ADD COLUMN "deleted_by" uuid;--> statement-breakpoint
ALTER TABLE "vehicles" ALTER COLUMN "property_id" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "vehicles" ADD CONSTRAINT "vehicles_deleted_by_users_id_fkey" FOREIGN KEY ("deleted_by") REFERENCES "users"("id") ON DELETE SET NULL;--> statement-breakpoint
ALTER TABLE "vehicles" DROP CONSTRAINT "vehicles_property_id_properties_id_fkey", ADD CONSTRAINT "vehicles_property_id_properties_id_fkey" FOREIGN KEY ("property_id") REFERENCES "properties"("id") ON DELETE SET NULL;