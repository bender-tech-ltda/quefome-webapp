CREATE TABLE "categories" (
	"id" text PRIMARY KEY NOT NULL,
	"store_id" text NOT NULL,
	"name" text NOT NULL,
	"icon" text,
	"sequence" integer DEFAULT 0 NOT NULL
);
--> statement-breakpoint
CREATE TABLE "cuisine_types" (
	"id" text PRIMARY KEY NOT NULL,
	"slug" text NOT NULL,
	"name" text NOT NULL,
	"icon" text,
	"sequence" integer DEFAULT 0 NOT NULL,
	"featured" boolean DEFAULT false NOT NULL,
	CONSTRAINT "cuisine_types_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "memberships" (
	"user_id" text NOT NULL,
	"store_id" text NOT NULL,
	"role" text NOT NULL,
	CONSTRAINT "memberships_user_id_store_id_pk" PRIMARY KEY("user_id","store_id")
);
--> statement-breakpoint
CREATE TABLE "messages" (
	"id" text PRIMARY KEY NOT NULL,
	"store_id" text NOT NULL,
	"order_id" text,
	"dedupe_key" text NOT NULL,
	"recipient" text NOT NULL,
	"to" text NOT NULL,
	"event" text NOT NULL,
	"text" text NOT NULL,
	"template_name" text,
	"template_params" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"status" text DEFAULT 'PENDING' NOT NULL,
	"attempts" integer DEFAULT 0 NOT NULL,
	"next_attempt_at" timestamp with time zone NOT NULL,
	"last_error" text,
	"provider_message_id" text,
	"created_at" timestamp with time zone NOT NULL,
	"sent_at" timestamp with time zone,
	CONSTRAINT "messages_dedupe_key_unique" UNIQUE("dedupe_key")
);
--> statement-breakpoint
CREATE TABLE "order_events" (
	"id" serial PRIMARY KEY NOT NULL,
	"order_id" text NOT NULL,
	"store_id" text NOT NULL,
	"type" text NOT NULL,
	"from_status" text,
	"to_status" text,
	"actor_user_id" text,
	"at" timestamp with time zone NOT NULL
);
--> statement-breakpoint
CREATE TABLE "orders" (
	"id" text PRIMARY KEY NOT NULL,
	"store_id" text NOT NULL,
	"number" integer NOT NULL,
	"tracking_token" text NOT NULL,
	"idempotency_key" text,
	"status" text NOT NULL,
	"version" integer DEFAULT 0 NOT NULL,
	"customer_name" text NOT NULL,
	"customer_whatsapp" text NOT NULL,
	"fulfillment" text NOT NULL,
	"address" jsonb,
	"payment_kind" text NOT NULL,
	"change_for_cents" integer,
	"notes" text DEFAULT '' NOT NULL,
	"items" jsonb NOT NULL,
	"subtotal_cents" integer NOT NULL,
	"delivery_fee_cents" integer NOT NULL,
	"total_cents" integer NOT NULL,
	"cancel_reason" text,
	"estimated_delivery_at" timestamp with time zone,
	"created_at" timestamp with time zone NOT NULL,
	"status_changed_at" timestamp with time zone NOT NULL,
	CONSTRAINT "orders_tracking_token_unique" UNIQUE("tracking_token")
);
--> statement-breakpoint
CREATE TABLE "products" (
	"id" text PRIMARY KEY NOT NULL,
	"store_id" text NOT NULL,
	"category_id" text NOT NULL,
	"name" text NOT NULL,
	"description" text DEFAULT '' NOT NULL,
	"image_url" text,
	"price_cents" integer NOT NULL,
	"flavor_billing" text DEFAULT 'SUM' NOT NULL,
	"max_flavors" integer,
	"flavors" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"components" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"available" boolean DEFAULT true NOT NULL,
	"sequence" integer DEFAULT 0 NOT NULL,
	"archived_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "schedules" (
	"id" serial PRIMARY KEY NOT NULL,
	"store_id" text NOT NULL,
	"week_day" integer NOT NULL,
	"opens_at" text NOT NULL,
	"closes_at" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "sessions" (
	"token_hash" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"expires_at" timestamp with time zone NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "store_cuisine_types" (
	"store_id" text NOT NULL,
	"cuisine_type_id" text NOT NULL,
	CONSTRAINT "store_cuisine_types_store_id_cuisine_type_id_pk" PRIMARY KEY("store_id","cuisine_type_id")
);
--> statement-breakpoint
CREATE TABLE "stores" (
	"id" text PRIMARY KEY NOT NULL,
	"slug" text NOT NULL,
	"name" text NOT NULL,
	"description" text DEFAULT '' NOT NULL,
	"image_url" text,
	"whatsapp" text,
	"time_zone" text DEFAULT 'America/Sao_Paulo' NOT NULL,
	"address" jsonb NOT NULL,
	"published" boolean DEFAULT false NOT NULL,
	"status_override" text,
	"delivery_enabled" boolean DEFAULT true NOT NULL,
	"delivery_fee_cents" integer DEFAULT 0 NOT NULL,
	"minimum_order_cents" integer,
	"delivery_area" jsonb DEFAULT '{"mode":"CITY","neighborhoods":[]}'::jsonb NOT NULL,
	"delivery_min_minutes" integer,
	"delivery_max_minutes" integer,
	"pickup_enabled" boolean DEFAULT false NOT NULL,
	"payment" jsonb DEFAULT '{"cash":true,"card":true,"pix":null}'::jsonb NOT NULL,
	"popularity" integer DEFAULT 0 NOT NULL,
	"order_seq" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "stores_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" text PRIMARY KEY NOT NULL,
	"email" text NOT NULL,
	"password_hash" text NOT NULL,
	"name" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "users_email_unique" UNIQUE("email")
);
--> statement-breakpoint
ALTER TABLE "categories" ADD CONSTRAINT "categories_store_id_stores_id_fk" FOREIGN KEY ("store_id") REFERENCES "public"."stores"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "memberships" ADD CONSTRAINT "memberships_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "memberships" ADD CONSTRAINT "memberships_store_id_stores_id_fk" FOREIGN KEY ("store_id") REFERENCES "public"."stores"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "messages" ADD CONSTRAINT "messages_order_id_orders_id_fk" FOREIGN KEY ("order_id") REFERENCES "public"."orders"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "order_events" ADD CONSTRAINT "order_events_order_id_orders_id_fk" FOREIGN KEY ("order_id") REFERENCES "public"."orders"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "orders" ADD CONSTRAINT "orders_store_id_stores_id_fk" FOREIGN KEY ("store_id") REFERENCES "public"."stores"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "products" ADD CONSTRAINT "products_store_id_stores_id_fk" FOREIGN KEY ("store_id") REFERENCES "public"."stores"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "products" ADD CONSTRAINT "products_category_id_categories_id_fk" FOREIGN KEY ("category_id") REFERENCES "public"."categories"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "schedules" ADD CONSTRAINT "schedules_store_id_stores_id_fk" FOREIGN KEY ("store_id") REFERENCES "public"."stores"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sessions" ADD CONSTRAINT "sessions_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "store_cuisine_types" ADD CONSTRAINT "store_cuisine_types_store_id_stores_id_fk" FOREIGN KEY ("store_id") REFERENCES "public"."stores"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "store_cuisine_types" ADD CONSTRAINT "store_cuisine_types_cuisine_type_id_cuisine_types_id_fk" FOREIGN KEY ("cuisine_type_id") REFERENCES "public"."cuisine_types"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "categories_store_idx" ON "categories" USING btree ("store_id");--> statement-breakpoint
CREATE INDEX "messages_due_idx" ON "messages" USING btree ("status","next_attempt_at");--> statement-breakpoint
CREATE INDEX "messages_order_idx" ON "messages" USING btree ("order_id");--> statement-breakpoint
CREATE INDEX "order_events_store_idx" ON "order_events" USING btree ("store_id","id");--> statement-breakpoint
CREATE INDEX "order_events_order_idx" ON "order_events" USING btree ("order_id");--> statement-breakpoint
CREATE UNIQUE INDEX "orders_store_number_idx" ON "orders" USING btree ("store_id","number");--> statement-breakpoint
CREATE UNIQUE INDEX "orders_idempotency_idx" ON "orders" USING btree ("store_id","idempotency_key");--> statement-breakpoint
CREATE INDEX "orders_store_created_idx" ON "orders" USING btree ("store_id","created_at");--> statement-breakpoint
CREATE INDEX "orders_customer_idx" ON "orders" USING btree ("customer_whatsapp","created_at");--> statement-breakpoint
CREATE INDEX "products_store_idx" ON "products" USING btree ("store_id");--> statement-breakpoint
CREATE INDEX "schedules_store_idx" ON "schedules" USING btree ("store_id");--> statement-breakpoint
CREATE INDEX "sessions_user_idx" ON "sessions" USING btree ("user_id");