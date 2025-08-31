CREATE TABLE "beneficiaries" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"name" varchar(255) NOT NULL,
	"account_number" varchar(255) NOT NULL,
	"country" varchar(2) NOT NULL,
	"currency" varchar(3) NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "fx_rates" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"base_currency" varchar(3) DEFAULT 'USD' NOT NULL,
	"rates" jsonb NOT NULL,
	"last_updated" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "sessions" (
	"sid" varchar PRIMARY KEY NOT NULL,
	"sess" jsonb NOT NULL,
	"expire" timestamp NOT NULL
);
--> statement-breakpoint
CREATE TABLE "transactions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"beneficiary_id" uuid NOT NULL,
	"source_amount" numeric(10, 2) NOT NULL,
	"source_currency" varchar(3) DEFAULT 'USD' NOT NULL,
	"target_amount" numeric(10, 2) NOT NULL,
	"target_currency" varchar(3) NOT NULL,
	"exchange_rate" numeric(10, 6) NOT NULL,
	"base_fee" numeric(8, 2) NOT NULL,
	"exchange_fee" numeric(8, 2) NOT NULL,
	"total_fee" numeric(8, 2) NOT NULL,
	"purpose" varchar(100) NOT NULL,
	"status" varchar(20) DEFAULT 'pending' NOT NULL,
	"is_high_risk" boolean DEFAULT false NOT NULL,
	"admin_notes" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"email" varchar(255) NOT NULL,
	"password" varchar(255) NOT NULL,
	"full_name" varchar(255) NOT NULL,
	"account_number" varchar(255) NOT NULL,
	"is_admin" boolean DEFAULT false NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "users_email_unique" UNIQUE("email"),
	CONSTRAINT "users_account_number_unique" UNIQUE("account_number")
);
--> statement-breakpoint
ALTER TABLE "beneficiaries" ADD CONSTRAINT "beneficiaries_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "transactions" ADD CONSTRAINT "transactions_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "transactions" ADD CONSTRAINT "transactions_beneficiary_id_beneficiaries_id_fk" FOREIGN KEY ("beneficiary_id") REFERENCES "public"."beneficiaries"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "IDX_session_expire" ON "sessions" USING btree ("expire");