CREATE TABLE "pricing_surcharges" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"dimension" text NOT NULL,
	"value_key" text NOT NULL,
	"surcharge_percent" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "service_price_matrix" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"service_id" uuid NOT NULL,
	"coat_type" text NOT NULL,
	"size_type" text NOT NULL,
	"price" integer NOT NULL,
	"tenant_id" uuid NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
DROP TABLE "service_breed_prices" CASCADE;--> statement-breakpoint
ALTER TABLE "dogs" ADD COLUMN "coat_type" text;--> statement-breakpoint
ALTER TABLE "dogs" ADD COLUMN "size_type" text;--> statement-breakpoint
ALTER TABLE "services" ADD COLUMN "duration_surcharge_per_30min" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "service_price_matrix" ADD CONSTRAINT "service_price_matrix_service_id_services_id_fk" FOREIGN KEY ("service_id") REFERENCES "public"."services"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "unique_surcharge_key" ON "pricing_surcharges" USING btree ("tenant_id","dimension","value_key");--> statement-breakpoint
CREATE UNIQUE INDEX "unique_service_matrix_cell" ON "service_price_matrix" USING btree ("service_id","coat_type","size_type","tenant_id");