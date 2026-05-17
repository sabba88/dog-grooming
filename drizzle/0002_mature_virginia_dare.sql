CREATE TABLE "user_recurring_schedules" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"location_id" uuid NOT NULL,
	"day_of_week" integer NOT NULL,
	"start_time" text NOT NULL,
	"end_time" text NOT NULL,
	"tenant_id" uuid NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "breeds" ADD COLUMN "coat_type" text;--> statement-breakpoint
ALTER TABLE "breeds" ADD COLUMN "size_type" text;--> statement-breakpoint
ALTER TABLE "user_recurring_schedules" ADD CONSTRAINT "user_recurring_schedules_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_recurring_schedules" ADD CONSTRAINT "user_recurring_schedules_location_id_locations_id_fk" FOREIGN KEY ("location_id") REFERENCES "public"."locations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "urs_user_dow_start_tenant_idx" ON "user_recurring_schedules" USING btree ("user_id","day_of_week","start_time","tenant_id");