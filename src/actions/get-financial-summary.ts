"use server";

import { and, eq, gte, lte, sum } from "drizzle-orm";
import { z } from "zod";

import { db } from "@/db";
import { appointmentsTable, paymentsTable } from "@/db/schema";
import { protectedWithClinicActionClient } from "@/lib/next-safe-action";

const getFinancialSummarySchema = z.object({
  month: z.number().optional(),
  year: z.number().optional(),
  showAll: z.boolean().default(false),
});

export const getFinancialSummary = protectedWithClinicActionClient
  .schema(getFinancialSummarySchema)
  .action(async ({ parsedInput, ctx }) => {
    const { month, year, showAll } = parsedInput;
    const clinicId = ctx.user.clinic.id;

    const appointmentsWhere = [eq(appointmentsTable.clinicId, clinicId)];
    const paymentsWhere = [
      eq(paymentsTable.clinicId, clinicId),
      eq(paymentsTable.paymentStatus, "pago"),
    ];

    if (!showAll && month && year) {
      const startDate = new Date(year, month - 1, 1);
      const endDate = new Date(year, month, 0, 23, 59, 59, 999);

      appointmentsWhere.push(
        gte(appointmentsTable.date, startDate),
        lte(appointmentsTable.date, endDate),
      );

      paymentsWhere.push(
        gte(paymentsTable.paymentDate, startDate),
        lte(paymentsTable.paymentDate, endDate),
      );
    }

    const [totalAppointmentsResult] = await db
      .select({
        total: sum(appointmentsTable.appointmentPriceInCents),
      })
      .from(appointmentsTable)
      .where(and(...appointmentsWhere));

    const [totalPaymentsResult] = await db
      .select({
        total: sum(paymentsTable.amountInCents),
      })
      .from(paymentsTable)
      .where(and(...paymentsWhere));

    const totalAppointments = totalAppointmentsResult?.total
      ? parseInt(totalAppointmentsResult.total)
      : 0;
    const totalPayments = totalPaymentsResult?.total
      ? parseInt(totalPaymentsResult.total)
      : 0;
    const pending = Math.max(0, totalAppointments - totalPayments);

    return {
      totalAppointments,
      totalPayments,
      pending,
    };
  });
