"use server";

import { and, eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { z } from "zod";

import { db } from "@/db";
import { paymentsTable } from "@/db/schema";
import { protectedWithClinicActionClient } from "@/lib/next-safe-action";

const deletePaymentSchema = z.object({
  id: z.string().uuid(), // 🔥 MUDANÇA: paymentId → id
});

export const deletePayment = protectedWithClinicActionClient
  .schema(deletePaymentSchema)
  .action(async ({ parsedInput, ctx }) => {
    const { id } = parsedInput; // 🔥 MUDANÇA: paymentId → id

    await db.delete(paymentsTable).where(
      and(
        eq(paymentsTable.id, id), // 🔥 MUDANÇA: paymentId → id
        eq(paymentsTable.clinicId, ctx.user.clinic.id),
      ),
    );

    revalidatePath("/financeiro");

    return { success: true };
  });
