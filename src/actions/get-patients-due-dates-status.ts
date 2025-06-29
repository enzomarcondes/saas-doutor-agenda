"use server";

import { and, asc, eq, isNotNull, sum } from "drizzle-orm";
import { z } from "zod";

import { db } from "@/db";
import { appointmentsTable, paymentsTable } from "@/db/schema";
import { protectedWithClinicActionClient } from "@/lib/next-safe-action";

const getPatientsUnderPageSchema = z.object({
  patientIds: z.array(z.string().uuid()),
});

export const getPatientsDueDatesStatus = protectedWithClinicActionClient
  .schema(getPatientsUnderPageSchema)
  .action(async ({ parsedInput, ctx }) => {
    const { patientIds } = parsedInput;
    const clinicId = ctx.user.clinic.id;

    if (patientIds.length === 0) {
      return [];
    }

    // Buscar dados financeiros de todos os pacientes em paralelo
    const patientsData = await Promise.all(
      patientIds.map(async (patientId) => {
        const [
          appointments,
          parcelas,
          pagamentosAVista,
          [totalAppointmentsResult],
          [totalPaymentsResult],
        ] = await Promise.all([
          // Agendamentos do paciente com dueDate
          db
            .select({
              id: appointmentsTable.id,
              dueDate: appointmentsTable.dueDate,
            })
            .from(appointmentsTable)
            .where(
              and(
                eq(appointmentsTable.patientId, patientId),
                eq(appointmentsTable.clinicId, clinicId),
              ),
            ),

          // Parcelas pendentes (PRIORIDADE 1)
          db
            .select({
              id: paymentsTable.id,
              dueDate: paymentsTable.dueDate,
              amountInCents: paymentsTable.amountInCents,
              installmentNumber: paymentsTable.installmentNumber,
              totalInstallments: paymentsTable.totalInstallments,
            })
            .from(paymentsTable)
            .where(
              and(
                eq(paymentsTable.patientId, patientId),
                eq(paymentsTable.clinicId, clinicId),
                eq(paymentsTable.paymentType, "parcelado"),
                eq(paymentsTable.paymentStatus, "pendente"),
                isNotNull(paymentsTable.installmentNumber),
              ),
            )
            .orderBy(asc(paymentsTable.dueDate)),

          // Pagamentos à vista pendentes (PRIORIDADE 2)
          db
            .select({
              id: paymentsTable.id,
              dueDate: paymentsTable.dueDate,
              amountInCents: paymentsTable.amountInCents,
            })
            .from(paymentsTable)
            .where(
              and(
                eq(paymentsTable.patientId, patientId),
                eq(paymentsTable.clinicId, clinicId),
                eq(paymentsTable.paymentType, "avista"),
                eq(paymentsTable.paymentStatus, "pendente"),
              ),
            )
            .orderBy(asc(paymentsTable.dueDate)),

          // Total dos agendamentos
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

          // Total dos pagamentos (apenas os PAGOS)
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

        const totalAppointments = totalAppointmentsResult?.total
          ? parseInt(totalAppointmentsResult.total)
          : 0;
        const totalPayments = totalPaymentsResult?.total
          ? parseInt(totalPaymentsResult.total)
          : 0;

        // Verificar se está pendente
        const isFinancialPending = totalAppointments > totalPayments;

        // 🔥 APLICAR HIERARQUIA DE PRIORIDADE

        // PRIORIDADE 1: Parcelas pendentes
        if (parcelas.length > 0) {
          const proximaParcela = parcelas[0]; // Já ordenada por data

          return {
            patientId,
            hasYellowDueDate: true,
            yellowDueDate: proximaParcela.dueDate,
            alertType: "parcela",
            isFinancialPending: true,
            totalAppointments,
            totalPayments,
            // Dados específicos da parcela
            installmentNumber: proximaParcela.installmentNumber,
            totalInstallments: proximaParcela.totalInstallments,
            parcelaValue: proximaParcela.amountInCents,
          };
        }

        // PRIORIDADE 2: Pagamentos à vista pendentes
        if (pagamentosAVista.length > 0) {
          const proximoPagamento = pagamentosAVista[0]; // Já ordenado por data

          return {
            patientId,
            hasYellowDueDate: true,
            yellowDueDate: proximoPagamento.dueDate,
            alertType: "pagamento_avista_pendente",
            isFinancialPending: true,
            totalAppointments,
            totalPayments,
            // Dados específicos do pagamento
            pagamentoValue: proximoPagamento.amountInCents,
          };
        }

        // PRIORIDADE 3: Agendamentos sem nenhum pagamento
        if (isFinancialPending) {
          const appointmentsWithDueDate = appointments.filter(
            (apt) => apt.dueDate,
          );

          if (appointmentsWithDueDate.length === 0) {
            return {
              patientId,
              hasYellowDueDate: false,
              yellowDueDate: null,
              alertType: null,
              isFinancialPending: true,
              totalAppointments,
              totalPayments,
            };
          }

          // Se só tem 1 agendamento com dueDate, fica amarelo
          if (appointmentsWithDueDate.length === 1) {
            return {
              patientId,
              hasYellowDueDate: true,
              yellowDueDate: appointmentsWithDueDate[0].dueDate,
              alertType: "agendamento",
              isFinancialPending: true,
              totalAppointments,
              totalPayments,
            };
          }

          // Se tem múltiplos, encontrar a data mais recente
          const allDueDates = appointmentsWithDueDate.map(
            (apt) => new Date(apt.dueDate!),
          );
          const maxDueDate = new Date(
            Math.max(...allDueDates.map((date) => date.getTime())),
          );

          return {
            patientId,
            hasYellowDueDate: true,
            yellowDueDate: maxDueDate,
            alertType: "agendamento",
            isFinancialPending: true,
            totalAppointments,
            totalPayments,
          };
        }

        // Paciente em dia
        return {
          patientId,
          hasYellowDueDate: false,
          yellowDueDate: null,
          alertType: null,
          isFinancialPending: false,
          totalAppointments,
          totalPayments,
        };
      }),
    );

    return patientsData;
  });
