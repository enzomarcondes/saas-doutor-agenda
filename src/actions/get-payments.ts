"use server";

import { and, desc, eq } from "drizzle-orm";
import { z } from "zod";

import { db } from "@/db";
import { patientsTable, paymentsTable } from "@/db/schema";
import { protectedWithClinicActionClient } from "@/lib/next-safe-action";

export const getPayments = protectedWithClinicActionClient
  .schema(
    z.object({
      patientId: z.string().uuid().optional(),
    }),
  )
  .action(async ({ parsedInput, ctx }) => {
    const { patientId } = parsedInput;

    try {
      const payments = await db
        .select({
          id: paymentsTable.id,
          amountInCents: paymentsTable.amountInCents,
          paymentMethod: paymentsTable.paymentMethod,
          paymentDate: paymentsTable.paymentDate,
          notes: paymentsTable.notes,
          createdAt: paymentsTable.createdAt,
          patient: {
            id: patientsTable.id,
            name: patientsTable.name,
          },
        })
        .from(paymentsTable)
        .innerJoin(patientsTable, eq(paymentsTable.patientId, patientsTable.id))
        .where(
          and(
            eq(paymentsTable.clinicId, ctx.user.clinic.id),
            patientId ? eq(paymentsTable.patientId, patientId) : undefined,
          ),
        )
        .orderBy(desc(paymentsTable.paymentDate));

      return { payments };
    } catch {
      throw new Error("Erro ao buscar pagamentos");
    }
  });
