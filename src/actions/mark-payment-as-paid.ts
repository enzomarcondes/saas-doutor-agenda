"use server";

import { and, eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { z } from "zod";

import { db } from "@/db";
import { paymentsTable } from "@/db/schema";
import { protectedWithClinicActionClient } from "@/lib/next-safe-action";

const markPaymentAsPaidSchema = z.object({
  paymentId: z.string().uuid({
    message: "ID do pagamento é obrigatório",
  }),
});

export const markPaymentAsPaid = protectedWithClinicActionClient
  .schema(markPaymentAsPaidSchema)
  .action(async ({ parsedInput, ctx }) => {
    const { paymentId } = parsedInput;

    try {
      // Atualizar apenas pagamentos da clínica do usuário
      const [updatedPayment] = await db
        .update(paymentsTable)
        .set({
          paymentStatus: "pago",
          paymentDate: new Date(), // Data real do pagamento
          updatedAt: new Date(),
        })
        .where(
          and(
            eq(paymentsTable.id, paymentId),
            eq(paymentsTable.clinicId, ctx.user.clinic.id),
          ),
        )
        .returning({
          id: paymentsTable.id,
          installmentNumber: paymentsTable.installmentNumber,
          totalInstallments: paymentsTable.totalInstallments,
        });

      if (!updatedPayment) {
        throw new Error("Pagamento não encontrado");
      }

      revalidatePath("/financeiro");
      revalidatePath("/pacientes");

      return {
        success: true,
        message: updatedPayment.installmentNumber
          ? `Parcela ${updatedPayment.installmentNumber}/${updatedPayment.totalInstallments} marcada como paga!`
          : "Pagamento marcado como pago!",
        paymentId: updatedPayment.id,
      };
    } catch (error) {
      console.error("Erro ao marcar pagamento como pago:", error);
      throw new Error("Erro ao atualizar status do pagamento");
    }
  });
