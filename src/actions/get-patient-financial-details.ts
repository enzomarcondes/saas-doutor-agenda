"use server";

import { and, eq, sum } from "drizzle-orm";
import { z } from "zod";

import { db } from "@/db";
import {
  appointmentsTable,
  doctorsTable,
  patientsTable,
  paymentsTable,
  servicesTable,
} from "@/db/schema";
import { protectedWithClinicActionClient } from "@/lib/next-safe-action";

const getPatientFinancialDetailsSchema = z.object({
  patientId: z.string().uuid(),
});

export const getPatientFinancialDetails = protectedWithClinicActionClient
  .schema(getPatientFinancialDetailsSchema)
  .action(async ({ parsedInput, ctx }) => {
    const { patientId } = parsedInput;
    const clinicId = ctx.user.clinic.id;

    // Buscar dados em paralelo
    // ✅ CORRIJA A ORDEM DO Promise.all
    const [
      patient, // ✅ PRIMEIRO: objeto do paciente
      appointments, // ✅ SEGUNDO: array de agendamentos
      payments, // ✅ TERCEIRO: array de pagamentos
      [totalAppointmentsResult],
      [totalPaymentsResult],
    ] = await Promise.all([
      // ✅ 1. DADOS DO PACIENTE (OBJETO)
      db.query.patientsTable.findFirst({
        where: and(
          eq(patientsTable.id, patientId),
          eq(patientsTable.clinicId, clinicId),
        ),
      }),

      // ✅ 2. AGENDAMENTOS (ARRAY)
      db
        .select({
          id: appointmentsTable.id,
          date: appointmentsTable.date,
          appointmentPriceInCents: appointmentsTable.appointmentPriceInCents,
          status: appointmentsTable.status,
          dueDate: appointmentsTable.dueDate,
          doctor: {
            id: doctorsTable.id,
            name: doctorsTable.name,
          },
          service: {
            id: servicesTable.id,
            name: servicesTable.name,
          },
        })
        .from(appointmentsTable)
        .innerJoin(
          doctorsTable,
          eq(appointmentsTable.doctorId, doctorsTable.id),
        )
        .leftJoin(
          servicesTable,
          eq(appointmentsTable.serviceId, servicesTable.id),
        )
        .where(
          and(
            eq(appointmentsTable.patientId, patientId),
            eq(appointmentsTable.clinicId, clinicId),
          ),
        )
        .orderBy(appointmentsTable.date),

      // ✅ 3. PAGAMENTOS (ARRAY) - COM PATIENT INCLUÍDO
      db.query.paymentsTable.findMany({
        where: and(
          eq(paymentsTable.patientId, patientId),
          eq(paymentsTable.clinicId, clinicId),
        ),
        with: {
          patient: true,
        },
        orderBy: (payments, { desc }) => [desc(payments.paymentDate)],
      }),

      // ✅ 4. TOTAL AGENDAMENTOS
      db
        .select({
          total: sum(appointmentsTable.appointmentPriceInCents),
        })
        .from(appointmentsTable)
        .where(
          and(
            eq(appointmentsTable.patientId, patientId),
            eq(appointmentsTable.clinicId, clinicId),
          ),
        ),

      // ✅ 5. TOTAL PAGAMENTOS
      db
        .select({
          total: sum(paymentsTable.amountInCents),
        })
        .from(paymentsTable)
        .where(
          and(
            eq(paymentsTable.patientId, patientId),
            eq(paymentsTable.clinicId, clinicId),
            eq(paymentsTable.paymentStatus, "pago"),
          ),
        ),
    ]);

    if (!patient) {
      throw new Error("Paciente não encontrado");
    }

    const totalAppointments = totalAppointmentsResult?.total
      ? parseInt(totalAppointmentsResult.total)
      : 0;
    const totalPayments = totalPaymentsResult?.total
      ? parseInt(totalPaymentsResult.total)
      : 0;
    const balance = totalAppointments - totalPayments;

    return {
      patient, // ✅ OBJETO DO PACIENTE
      appointments, // ✅ ARRAY DE AGENDAMENTOS
      payments, // ✅ ARRAY DE PAGAMENTOS (com patient incluído)
      totalAppointments,
      totalPayments,
      balance,
      isFullyPaid: balance <= 0,
    };
  });
