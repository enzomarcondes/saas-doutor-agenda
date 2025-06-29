import { z } from "zod";

export const upsertDoctorSchema = z
  .object({
    id: z.string().uuid().optional(),
    name: z.string().trim().min(1, {
      message: "Nome é obrigatório.",
    }),
    appointmentPriceInCents: z.number().min(0).optional().default(0),
    availableFromWeekDay: z.number().min(0).max(6), // No banco ainda é 0-6
    availableToWeekDay: z.number().min(0).max(6), // No banco ainda é 0-6
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
      const fromDay = data.availableFromWeekDay;
      const toDay = data.availableToWeekDay;

      // Se for o mesmo dia, sempre válido
      if (fromDay === toDay) {
        return true;
      }

      // Se domingo (0) for o dia final, sempre válido
      if (toDay === 0) {
        return true;
      }

      // Para outros casos, dia final deve ser >= dia inicial
      return toDay >= fromDay;
    },
    {
      message: "O dia final deve ser posterior ao dia inicial.",
      path: ["availableToWeekDay"],
    },
  );

export type UpsertDoctorSchema = z.infer<typeof upsertDoctorSchema>;
