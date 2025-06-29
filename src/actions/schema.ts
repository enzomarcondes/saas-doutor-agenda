import { z } from "zod";

export const upsertDoctorSchema = z
  .object({
    id: z.string().uuid().optional(),
    name: z.string().trim().min(1, {
      message: "Nome é obrigatório.",
    }),
    specialty: z.string().trim().min(1, {
      message: "Especialidade é obrigatória.",
    }),
    appointmentPriceInCents: z.number().min(1, {
      message: "Preço da consulta é obrigatório.",
    }),
    availableFromWeekDay: z.number().min(0).max(6),
    availableToWeekDay: z.number().min(0).max(6),
    availableFromTime: z.string().min(1, {
      message: "Hora de início é obrigatória.",
    }),
    availableToTime: z.string().min(1, {
      message: "Hora de término é obrigatória.",
    }),
  })
  .refine(
    (data) => {
      return data.availableFromTime < data.availableToTime;
    },
    {
      message:
        "O horário de início não pode ser anterior ao horário de término.",
      path: ["availableToTime"],
    },
  )
  .refine(
    (data) => {
      if (data.availableFromWeekDay === 1 && data.availableToWeekDay === 0) {
        return true;
      }
      return data.availableToWeekDay >= data.availableFromWeekDay;
    },
    {
      message:
        "O dia final deve ser posterior ao dia inicial, exceto para segunda a domingo.",
      path: ["availableToWeekDay"],
    },
  );

export type UpsertDoctorSchema = z.infer<typeof upsertDoctorSchema>;

export const upsertServiceSchema = z.object({
  id: z.string().uuid().optional(),
  name: z.string().trim().min(1, {
    message: "Nome do serviço é obrigatório.",
  }),
  priceInCents: z.number().min(0, {
    // 🔥 MUDEI DE 1 PARA 0
    message: "Preço do serviço deve ser maior ou igual a zero.",
  }),
});

export type UpsertServiceSchema = z.infer<typeof upsertServiceSchema>;
