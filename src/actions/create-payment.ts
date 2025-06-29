"use server";

import { randomUUID } from "crypto";
import { revalidatePath } from "next/cache";
import { z } from "zod";

import { db } from "@/db";
import { paymentsTable } from "@/db/schema";
import { protectedWithClinicActionClient } from "@/lib/next-safe-action";

const createPaymentSchema = z.object({
  patientId: z.string().uuid({
    message: "ID do paciente é obrigatório",
  }),
  amountInCents: z.number().int().positive({
    message: "Valor deve ser maior que zero",
  }),
  paymentMethod: z.enum(
    ["dinheiro", "cartao_debito", "cartao_credito", "pix", "transferencia"],
    {
      message: "Método de pagamento inválido",
    },
  ),
  paymentDate: z.date({
    message: "Data do pagamento é obrigatória",
  }),
  notes: z.string().optional(),
  paymentType: z
    .enum(["avista", "parcelado"], {
      message: "Tipo de pagamento inválido",
    })
    .default("avista"),
  installments: z.number().int().min(2).max(12).optional(),
  // ✅ ADICIONAR CAMPO DE STATUS
  paymentStatus: z
    .enum(["pago", "pendente"], {
      message: "Status de pagamento inválido",
    })
    .default("pendente"),
});

export const createPayment = protectedWithClinicActionClient
  .schema(createPaymentSchema)
  .action(async ({ parsedInput, ctx }) => {
    const {
      patientId,
      amountInCents,
      paymentMethod,
      paymentDate,
      notes,
      paymentType,
      installments,
      paymentStatus, // ✅ ADICIONAR AQUI
    } = parsedInput;

    // 🔥 VALIDAÇÃO MANUAL DENTRO DA ACTION
    if (paymentType === "parcelado") {
      if (!installments || installments < 2) {
        throw new Error(
          "Número de parcelas é obrigatório para pagamento parcelado (mínimo 2)",
        );
      }
    }

    try {
      if (paymentType === "avista") {
        // 🔥 PAGAMENTO À VISTA
        const [payment] = await db
          .insert(paymentsTable)
          .values({
            clinicId: ctx.user.clinic.id,
            patientId,
            amountInCents,
            paymentMethod,
            paymentDate,
            notes: notes || null,
            paymentType: "avista",
            paymentStatus, // ✅ USAR O STATUS ESCOLHIDO PELO USUÁRIO
            dueDate: paymentDate,
          })
          .returning({ id: paymentsTable.id });

        revalidatePath("/financeiro");
        revalidatePath("/pacientes");

        return {
          success: true,
          paymentId: payment.id,
          patientId: patientId,
          message: `Pagamento à vista registrado como ${paymentStatus === "pago" ? "pago" : "pendente"}`,
          paymentType: "avista",
        };
      } else {
        // 🔥 PAGAMENTO PARCELADO (sempre pendente)
        const installmentGroupId = randomUUID();
        const installmentValue = Math.round(amountInCents / installments!);

        // Ajustar última parcela para garantir que a soma seja exata
        const lastInstallmentValue =
          amountInCents - installmentValue * (installments! - 1);

        const paymentsToCreate = [];

        for (let i = 0; i < installments!; i++) {
          // 🔥 APENAS ESTA LINHA DE DATA:
          const dueDateCorrect = new Date(
            paymentDate.getFullYear(),
            paymentDate.getMonth() + i,
            paymentDate.getDate(),
          );
          paymentsToCreate.push({
            clinicId: ctx.user.clinic.id,
            patientId,
            amountInCents:
              i === installments! - 1 ? lastInstallmentValue : installmentValue,
            paymentMethod,
            paymentDate: new Date(), // Data de registro
            notes: notes
              ? `${notes} (Parcela ${i + 1}/${installments})`
              : `Parcela ${i + 1}/${installments}`,
            paymentType: "parcelado" as const,
            paymentStatus: "pendente" as const, // ✅ PARCELAS SEMPRE PENDENTES
            dueDate: dueDateCorrect,
            installmentNumber: i + 1,
            totalInstallments: installments!,
            installmentGroupId,
          });
        }

        // Inserir todas as parcelas
        const createdPayments = await db
          .insert(paymentsTable)
          .values(paymentsToCreate)
          .returning({
            id: paymentsTable.id,
            installmentNumber: paymentsTable.installmentNumber,
          });

        revalidatePath("/financeiro");
        revalidatePath("/pacientes");

        return {
          success: true,
          paymentIds: createdPayments.map((p) => p.id),
          patientId: patientId,
          installmentGroupId,
          message: `Parcelamento criado com sucesso! ${installments} parcelas registradas.`,
          paymentType: "parcelado",
          installmentsCreated: installments,
        };
      }
    } catch (error) {
      console.error("Erro ao registrar pagamento:", error);
      throw new Error(
        paymentType === "parcelado"
          ? "Erro ao criar parcelamento"
          : "Erro ao registrar pagamento",
      );
    }
  });
