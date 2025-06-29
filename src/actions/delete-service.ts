"use server";

import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { z } from "zod";

import { db } from "@/db";
import { servicesTable } from "@/db/schema";
import { protectedWithClinicActionClient } from "@/lib/next-safe-action";

export const deleteService = protectedWithClinicActionClient
  .schema(
    z.object({
      id: z.string().uuid(),
    }),
  )
  .action(async ({ parsedInput, ctx }) => {
    const service = await db.query.servicesTable.findFirst({
      where: eq(servicesTable.id, parsedInput.id),
    });
    if (!service) {
      throw new Error("Serviço não encontrado");
    }
    if (service.clinicId !== ctx.user.clinic.id) {
      throw new Error("Serviço não encontrado");
    }
    await db.delete(servicesTable).where(eq(servicesTable.id, parsedInput.id));
    revalidatePath("/services");

    return { success: true }; // 🔥 ADICIONE ESTA LINHA
  });
