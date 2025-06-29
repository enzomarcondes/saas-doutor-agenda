CREATE TYPE "public"."payment_method" AS ENUM('dinheiro', 'cartao_debito', 'cartao_credito', 'pix', 'transferencia');--> statement-breakpoint
CREATE TABLE "payments" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"clinic_id" uuid NOT NULL,
	"patient_id" uuid NOT NULL,
	"amount_in_cents" integer NOT NULL,
	"payment_method" "payment_method" NOT NULL,
	"payment_date" timestamp NOT NULL,
	"notes" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
ALTER TABLE "appointments" ADD COLUMN "due_date" timestamp;--> statement-breakpoint
ALTER TABLE "payments" ADD CONSTRAINT "payments_clinic_id_clinics_id_fk" FOREIGN KEY ("clinic_id") REFERENCES "public"."clinics"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "payments" ADD CONSTRAINT "payments_patient_id_patients_id_fk" FOREIGN KEY ("patient_id") REFERENCES "public"."patients"("id") ON DELETE cascade ON UPDATE no action;