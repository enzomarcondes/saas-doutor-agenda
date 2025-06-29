import { z } from "zod";

export const addAppointmentSchema = z.object({
  patientId: z.string().uuid({
    message: "Paciente é obrigatório.",
  }),
  doctorId: z.string().uuid({
    message: "Médico é obrigatório.",
  }),
  date: z.date({
    message: "Data é obrigatória.",
  }),
  time: z.string().min(1, {
    message: "Horário é obrigatório.",
  }),
  appointmentPriceInCents: z.number().min(1, {
    message: "Valor da consulta é obrigatório.",
  }),
  // 🔥 CAMPOS EXISTENTES
  serviceId: z.string().uuid().optional(),
  status: z
    .enum([
      "agendado",
      "confirmado",
      "cancelado",
      "nao_compareceu",
      "finalizado",
    ])
    .default("agendado"),
  // 🔥 REMOVIDO: statusPagamento: z.enum(["pago", "a_receber"]).default("a_receber"),
  // 🔥 CAMPO: DATA DE VENCIMENTO
  dueDate: z.date().optional(),
});
