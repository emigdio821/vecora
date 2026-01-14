ALTER TABLE "houses" DROP CONSTRAINT "houses_owner_id_owners_id_fk";
--> statement-breakpoint
ALTER TABLE "houses" ALTER COLUMN "owner_id" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "houses" ADD CONSTRAINT "houses_owner_id_owners_id_fk" FOREIGN KEY ("owner_id") REFERENCES "public"."owners"("id") ON DELETE set null ON UPDATE no action;