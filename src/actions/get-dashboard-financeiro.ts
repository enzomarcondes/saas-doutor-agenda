"use server";

import { and, eq, sum } from "drizzle-orm"; // ✅ ADICIONAR 'and'

import { db } from "@/db";
import { appointmentsTable, patientsTable, paymentsTable } from "@/db/schema";
import { protectedWithClinicActionClient } from "@/lib/next-safe-action";

export const getDashboardFinanceiro = protectedWithClinicActionClient.action(
  async ({ ctx }) => {
    const clinicId = ctx.user.clinic.id;

    const [
      patients,
      recentPayments,
      [totalRevenueResult],
      [totalPaymentsResult],
    ] = await Promise.all([
      db.query.patientsTable.findMany({
        where: eq(patientsTable.clinicId, clinicId),
        orderBy: (patients, { desc }) => [desc(patients.createdAt)],
      }),

      db.query.paymentsTable.findMany({
        where: eq(paymentsTable.clinicId, clinicId),
        orderBy: (payments, { desc }) => [desc(payments.paymentDate)],
        limit: 10,
        with: {
          patient: true,
        },
      }),

      db
        .select({
          total: sum(appointmentsTable.appointmentPriceInCents),
        })
        .from(appointmentsTable)
        .where(eq(appointmentsTable.clinicId, clinicId)),

      // ✅ CORREÇÃO AQUI:
      db
        .select({
          total: sum(paymentsTable.amountInCents),
        })
        .from(paymentsTable)
        .where(
          and(
            eq(paymentsTable.clinicId, clinicId),
            eq(paymentsTable.paymentStatus, "pago"),
          ),
        ),
    ]);

    const totalRevenue = totalRevenueResult?.total
      ? parseInt(totalRevenueResult.total)
      : 0;
    const totalPayments = totalPaymentsResult?.total
      ? parseInt(totalPaymentsResult.total)
      : 0;
    const totalPending = Math.max(0, totalRevenue - totalPayments);

    return {
      patients,
      recentPayments,
      totalRevenue,
      totalPayments,
      totalPending,
    };
  },
);
