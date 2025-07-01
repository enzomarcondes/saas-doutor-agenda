"use server";

import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { z } from "zod";

import { db } from "@/db";
import { appointmentsTable } from "@/db/schema";
import { protectedWithClinicActionClient } from "@/lib/next-safe-action";

export const updateAppointment = protectedWithClinicActionClient
  .schema(
    z.object({
      id: z.string().uuid(),
      // 🔥 CAMPOS OPCIONAIS - ATUALIZA APENAS O QUE FOR ENVIADO
      status: z
        .enum([
          "agendado",
          "confirmado",
          "cancelado",
          "nao_compareceu",
          "finalizado",
        ])
        .optional(),
      patientId: z.string().uuid().optional(),
      doctorId: z.string().uuid().optional(),
      serviceId: z.string().uuid().nullable().optional(),
      date: z.date().optional(),
      appointmentPriceInCents: z.number().int().positive().optional(),
      // 🔥 CAMPO: DATA DE VENCIMENTO
      dueDate: z.date().optional(),
      // 🔥 ADICIONADO: OBSERVAÇÕES
      observations: z.string().optional(),
    }),
  )
  .action(async ({ parsedInput, ctx }) => {
    const { id, ...updateData } = parsedInput;

    // 🔥 VERIFICAR SE AGENDAMENTO EXISTE E PERTENCE À CLÍNICA
    const appointment = await db.query.appointmentsTable.findFirst({
      where: eq(appointmentsTable.id, id),
    });

    if (!appointment) {
      throw new Error("Agendamento não encontrado");
    }

    if (appointment.clinicId !== ctx.user.clinic.id) {
      throw new Error("Agendamento não encontrado");
    }

    const finalUpdateData = { ...updateData };

    // 🔥 REMOVER CAMPOS UNDEFINED PARA NÃO ATUALIZAR
    const cleanUpdateData = Object.fromEntries(
      Object.entries(finalUpdateData).filter(
        ([, value]) => value !== undefined,
      ),
    );

    // 🔥 SE NÃO HÁ NADA PARA ATUALIZAR
    if (Object.keys(cleanUpdateData).length === 0) {
      throw new Error("Nenhum campo para atualizar");
    }

    // 🔥 ATUALIZAR NO BANCO
    await db
      .update(appointmentsTable)
      .set({
        ...cleanUpdateData,
        updatedAt: new Date(),
      })
      .where(eq(appointmentsTable.id, id));

    revalidatePath("/appointments");

    return { success: true, updated: Object.keys(cleanUpdateData) };
  });
