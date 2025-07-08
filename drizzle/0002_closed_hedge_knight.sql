CREATE TYPE "public"."payment_type" AS ENUM('avista', 'parcelado');--> statement-breakpoint
ALTER TABLE "payments" ALTER COLUMN "payment_status" SET DATA TYPE text;--> statement-breakpoint
ALTER TABLE "payments" ALTER COLUMN "payment_status" SET DEFAULT 'pago'::text;--> statement-breakpoint
DROP TYPE "public"."payment_status";--> statement-breakpoint
CREATE TYPE "public"."payment_status" AS ENUM('pago', 'pendente');--> statement-breakpoint
ALTER TABLE "payments" ALTER COLUMN "payment_status" SET DEFAULT 'pago'::"public"."payment_status";--> statement-breakpoint
ALTER TABLE "payments" ALTER COLUMN "payment_status" SET DATA TYPE "public"."payment_status" USING "payment_status"::"public"."payment_status";--> statement-breakpoint
ALTER TABLE "patients" ALTER COLUMN "email" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "appointments" ADD COLUMN "observations" text;--> statement-breakpoint
ALTER TABLE "patients" ADD COLUMN "birth_date" timestamp;--> statement-breakpoint
ALTER TABLE "patients" ADD COLUMN "cpf" text;--> statement-breakpoint
ALTER TABLE "patients" ADD COLUMN "cep" text;--> statement-breakpoint
ALTER TABLE "patients" ADD COLUMN "bairro" text;--> statement-breakpoint
ALTER TABLE "patients" ADD COLUMN "rua" text;--> statement-breakpoint
ALTER TABLE "patients" ADD COLUMN "numero" text;--> statement-breakpoint
ALTER TABLE "patients" ADD COLUMN "cidade" text;--> statement-breakpoint
ALTER TABLE "patients" ADD COLUMN "uf" text;--> statement-breakpoint
ALTER TABLE "payments" ADD COLUMN "payment_type" "payment_type" DEFAULT 'avista' NOT NULL;--> statement-breakpoint
ALTER TABLE "payments" ADD COLUMN "payment_status" "payment_status" DEFAULT 'pago' NOT NULL;--> statement-breakpoint
ALTER TABLE "payments" ADD COLUMN "due_date" timestamp DEFAULT now() NOT NULL;--> statement-breakpoint
ALTER TABLE "payments" ADD COLUMN "installment_number" integer;--> statement-breakpoint
ALTER TABLE "payments" ADD COLUMN "total_installments" integer;--> statement-breakpoint
ALTER TABLE "payments" ADD COLUMN "installment_group_id" uuid;--> statement-breakpoint
ALTER TABLE "services" ADD COLUMN "parent_service_id" uuid;--> statement-breakpoint
ALTER TABLE "appointments" DROP COLUMN "status_pagamento";