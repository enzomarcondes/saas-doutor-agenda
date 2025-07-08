import { relations } from "drizzle-orm";
import { sql } from "drizzle-orm";
import {
  boolean,
  integer,
  pgEnum,
  pgTable,
  text,
  time,
  timestamp,
  uuid,
} from "drizzle-orm/pg-core";
import z from "zod";

export const usersTable = pgTable("users", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  emailVerified: boolean("email_verified").notNull(),
  image: text("image"),
  stripeCustomerId: text("stripe_customer_id"),
  stripeSubscriptionId: text("stripe_subscription_id"),
  plan: text("plan"),
  createdAt: timestamp("created_at").notNull(),
  updatedAt: timestamp("updated_at").notNull(),
});

export const usersTableRelations = relations(usersTable, ({ many }) => ({
  usersToClinics: many(usersToClinicsTable),
}));

export const sessionsTable = pgTable("sessions", {
  id: text("id").primaryKey(),
  expiresAt: timestamp("expires_at").notNull(),
  token: text("token").notNull().unique(),
  createdAt: timestamp("created_at").notNull(),
  updatedAt: timestamp("updated_at").notNull(),
  ipAddress: text("ip_address"),
  userAgent: text("user_agent"),
  userId: text("user_id")
    .notNull()
    .references(() => usersTable.id, { onDelete: "cascade" }),
});

export const accountsTable = pgTable("accounts", {
  id: text("id").primaryKey(),
  accountId: text("account_id").notNull(),
  providerId: text("provider_id").notNull(),
  userId: text("user_id")
    .notNull()
    .references(() => usersTable.id, { onDelete: "cascade" }),
  accessToken: text("access_token"),
  refreshToken: text("refresh_token"),
  idToken: text("id_token"),
  accessTokenExpiresAt: timestamp("access_token_expires_at"),
  refreshTokenExpiresAt: timestamp("refresh_token_expires_at"),
  scope: text("scope"),
  password: text("password"),
  createdAt: timestamp("created_at").notNull(),
  updatedAt: timestamp("updated_at").notNull(),
});

export const verificationsTable = pgTable("verifications", {
  id: text("id").primaryKey(),
  identifier: text("identifier").notNull(),
  value: text("value").notNull(),
  expiresAt: timestamp("expires_at").notNull(),
  createdAt: timestamp("created_at"),
  updatedAt: timestamp("updated_at"),
});

export const clinicsTable = pgTable("clinics", {
  id: uuid("id").defaultRandom().primaryKey(),
  name: text("name").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at")
    .defaultNow()
    .$onUpdate(() => new Date()),
});

export const usersToClinicsTable = pgTable("users_to_clinics", {
  userId: text("user_id")
    .notNull()
    .references(() => usersTable.id, { onDelete: "cascade" }),
  clinicId: uuid("clinic_id")
    .notNull()
    .references(() => clinicsTable.id, { onDelete: "cascade" }),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at")
    .defaultNow()
    .$onUpdate(() => new Date()),
});

export const usersToClinicsTableRelations = relations(
  usersToClinicsTable,
  ({ one }) => ({
    user: one(usersTable, {
      fields: [usersToClinicsTable.userId],
      references: [usersTable.id],
    }),
    clinic: one(clinicsTable, {
      fields: [usersToClinicsTable.clinicId],
      references: [clinicsTable.id],
    }),
  }),
);

// 🔥 ENUM PARA MÉTODOS DE PAGAMENTO
export const paymentMethodEnum = pgEnum("payment_method", [
  "dinheiro",
  "cartao_debito",
  "cartao_credito",
  "pix",
  "transferencia",
]);

// 🔥 NOVOS ENUMS PARA PARCELAMENTO
export const paymentTypeEnum = pgEnum("payment_type", ["avista", "parcelado"]);

export const paymentStatusEnum = pgEnum("payment_status", ["pago", "pendente"]);

// 🔥 TABELA DE PAGAMENTOS ATUALIZADA
export const paymentsTable = pgTable("payments", {
  id: uuid("id").defaultRandom().primaryKey(),
  clinicId: uuid("clinic_id")
    .notNull()
    .references(() => clinicsTable.id, { onDelete: "cascade" }),
  patientId: uuid("patient_id")
    .notNull()
    .references(() => patientsTable.id, { onDelete: "cascade" }),
  amountInCents: integer("amount_in_cents").notNull(),
  paymentMethod: paymentMethodEnum("payment_method").notNull(),
  paymentDate: timestamp("payment_date").notNull(),
  notes: text("notes"),

  // 🔥 NOVOS CAMPOS PARA PARCELAMENTO
  paymentType: paymentTypeEnum("payment_type").notNull().default("avista"),
  paymentStatus: paymentStatusEnum("payment_status").notNull().default("pago"),
  dueDate: timestamp("due_date")
    .notNull()
    .default(sql`now()`),
  installmentNumber: integer("installment_number"), // Ex: 1, 2, 3
  totalInstallments: integer("total_installments"), // Ex: 3 (total)
  installmentGroupId: uuid("installment_group_id"), // Agrupa parcelas

  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at")
    .defaultNow()
    .$onUpdate(() => new Date()),
});

// 🔥 RELAÇÕES DA TABELA DE PAGAMENTOS
export const paymentsTableRelations = relations(paymentsTable, ({ one }) => ({
  clinic: one(clinicsTable, {
    fields: [paymentsTable.clinicId],
    references: [clinicsTable.id],
  }),
  patient: one(patientsTable, {
    fields: [paymentsTable.patientId],
    references: [patientsTable.id],
  }),
}));

// 🔥 RELAÇÕES DA CLÍNICA ATUALIZADA
export const clinicsTableRelations = relations(clinicsTable, ({ many }) => ({
  doctors: many(doctorsTable),
  patients: many(patientsTable),
  appointments: many(appointmentsTable),
  services: many(servicesTable),
  usersToClinics: many(usersToClinicsTable),
  payments: many(paymentsTable), // 🔥 RELAÇÃO COM PAGAMENTOS
}));

export const doctorsTable = pgTable("doctors", {
  id: uuid("id").defaultRandom().primaryKey(),
  clinicId: uuid("clinic_id")
    .notNull()
    .references(() => clinicsTable.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  avatarImageUrl: text("avatar_image_url"),
  // 1 - Monday, 2 - Tuesday, 3 - Wednesday, 4 - Thursday, 5 - Friday, 6 - Saturday, 0 - Sunday
  availableFromWeekDay: integer("available_from_week_day").notNull(),
  availableToWeekDay: integer("available_to_week_day").notNull(),
  availableFromTime: time("available_from_time").notNull(),
  availableToTime: time("available_to_time").notNull(),
  appointmentPriceInCents: integer("appointment_price_in_cents").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at")
    .defaultNow()
    .$onUpdate(() => new Date()),
});

export const upsertServiceSchema = z.object({
  id: z.string().uuid().optional(),
  name: z.string().trim().min(1, {
    message: "Nome do serviço é obrigatório.",
  }),
  priceInCents: z.number().min(1, {
    message: "Preço do serviço é obrigatório.",
  }),
});

export type UpsertServiceSchema = z.infer<typeof upsertServiceSchema>;

export const doctorsTableRelations = relations(
  doctorsTable,
  ({ many, one }) => ({
    clinic: one(clinicsTable, {
      fields: [doctorsTable.clinicId],
      references: [clinicsTable.id],
    }),
    appointments: many(appointmentsTable),
  }),
);

export const patientSexEnum = pgEnum("patient_sex", ["male", "female"]);

export const patientsTable = pgTable("patients", {
  id: uuid("id").defaultRandom().primaryKey(),
  clinicId: uuid("clinic_id")
    .notNull()
    .references(() => clinicsTable.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  email: text("email"), // 🔥 REMOVIDO .notNull() - AGORA OPCIONAL
  phoneNumber: text("phone_number").notNull(),
  sex: patientSexEnum("sex").notNull(),

  // 🔥 NOVO CAMPO: DATA DE NASCIMENTO OPCIONAL
  birthDate: timestamp("birth_date"), // 🔥 ADICIONAR ESTA LINHA (SEM .notNull())

  // 🔥 CAMPOS DE ENDEREÇO E DOCUMENTO EXISTENTES
  cpf: text("cpf"), // CPF opcional
  cep: text("cep"), // CEP opcional
  bairro: text("bairro"), // Bairro opcional
  rua: text("rua"), // Rua opcional
  numero: text("numero"), // Número opcional
  cidade: text("cidade"), // Cidade opcional
  uf: text("uf"), // UF opcional

  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at")
    .defaultNow()
    .$onUpdate(() => new Date()),
});

// 🔥 RELAÇÕES DOS PACIENTES ATUALIZADA
export const patientsTableRelations = relations(
  patientsTable,
  ({ one, many }) => ({
    clinic: one(clinicsTable, {
      fields: [patientsTable.clinicId],
      references: [clinicsTable.id],
    }),
    appointments: many(appointmentsTable),
    payments: many(paymentsTable), // 🔥 RELAÇÃO COM PAGAMENTOS
  }),
);

// 🔥 ENUMS DE STATUS
export const appointmentStatusEnum = pgEnum("appointment_status", [
  "agendado",
  "confirmado",
  "cancelado",
  "nao_compareceu",
  "finalizado",
]);

export const appointmentsTable = pgTable("appointments", {
  id: uuid("id").defaultRandom().primaryKey(),
  date: timestamp("date").notNull(),
  appointmentPriceInCents: integer("appointment_price_in_cents").notNull(),
  clinicId: uuid("clinic_id")
    .notNull()
    .references(() => clinicsTable.id, { onDelete: "cascade" }),
  patientId: uuid("patient_id")
    .notNull()
    .references(() => patientsTable.id, { onDelete: "cascade" }),
  doctorId: uuid("doctor_id")
    .notNull()
    .references(() => doctorsTable.id, { onDelete: "cascade" }),
  serviceId: uuid("service_id").references(() => servicesTable.id, {
    onDelete: "set null",
  }),
  status: appointmentStatusEnum("status").default("agendado").notNull(),

  // 🔥 CAMPO DE DATA DE VENCIMENTO
  dueDate: timestamp("due_date"),

  // 🔥 NOVO CAMPO: OBSERVAÇÕES
  observations: text("observations"),

  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at")
    .defaultNow()
    .$onUpdate(() => new Date()),
});

export const appointmentsTableRelations = relations(
  appointmentsTable,
  ({ one }) => ({
    clinic: one(clinicsTable, {
      fields: [appointmentsTable.clinicId],
      references: [clinicsTable.id],
    }),
    patient: one(patientsTable, {
      fields: [appointmentsTable.patientId],
      references: [patientsTable.id],
    }),
    doctor: one(doctorsTable, {
      fields: [appointmentsTable.doctorId],
      references: [doctorsTable.id],
    }),
    service: one(servicesTable, {
      fields: [appointmentsTable.serviceId],
      references: [servicesTable.id],
    }),
  }),
);

export const servicesTable = pgTable("services", {
  id: uuid("id").defaultRandom().primaryKey(),
  clinicId: uuid("clinic_id")
    .notNull()
    .references(() => clinicsTable.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  priceInCents: integer("price_in_cents").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at")
    .defaultNow()
    .$onUpdate(() => new Date()),
});

export const servicesTableRelations = relations(
  servicesTable,
  ({ one, many }) => ({
    clinic: one(clinicsTable, {
      fields: [servicesTable.clinicId],
      references: [clinicsTable.id],
    }),
    appointments: many(appointmentsTable),
  }),
);
