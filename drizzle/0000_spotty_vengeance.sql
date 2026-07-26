CREATE TYPE "public"."bill_status" AS ENUM('pending', 'paid', 'settled', 'failed');--> statement-breakpoint
CREATE TYPE "public"."biller_type" AS ENUM('electricity', 'water', 'internet', 'gas');--> statement-breakpoint
CREATE TABLE "billers" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"biller_type" "biller_type" NOT NULL,
	"logo_color" text DEFAULT '#ca8a04' NOT NULL,
	"min_amount_php" integer DEFAULT 50 NOT NULL,
	"max_amount_php" integer DEFAULT 50000 NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "bills" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_name" text DEFAULT 'Nida Reyes' NOT NULL,
	"biller_name" text NOT NULL,
	"biller_type" "biller_type" NOT NULL,
	"account_number" text NOT NULL,
	"amount_php" integer NOT NULL,
	"amount_usdc" text NOT NULL,
	"memo_ref" text NOT NULL,
	"status" "bill_status" DEFAULT 'pending' NOT NULL,
	"tx_hash" text,
	"sep38_rate" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"paid_at" timestamp,
	"settled_at" timestamp
);
--> statement-breakpoint
CREATE TABLE "horizon_events" (
	"id" serial PRIMARY KEY NOT NULL,
	"event_type" text NOT NULL,
	"tx_hash" text NOT NULL,
	"amount" text NOT NULL,
	"memo" text,
	"from_address" text,
	"to_address" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "sep38_rates" (
	"id" serial PRIMARY KEY NOT NULL,
	"pair" text NOT NULL,
	"rate" text NOT NULL,
	"valid_until" timestamp NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
