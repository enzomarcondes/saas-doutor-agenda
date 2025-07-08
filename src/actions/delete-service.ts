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
      with: {
        subServices: true, // 🔥 VERIFICAR SE TEM SUB-SERVIÇOS
      },
    });

    if (!service) {
      throw new Error("Serviço não encontrado");
    }

    if (service.clinicId !== ctx.user.clinic.id) {
      throw new Error("Serviço não encontrado");
    }

    // 🔥 VALIDAÇÃO: NÃO PODE EXCLUIR SE TEM SUB-SERVIÇOS
    if (service.subServices && service.subServices.length > 0) {
      throw new Error(
        `Não é possível excluir este serviço pois ele possui ${service.subServices.length} sub-serviço(s) vinculado(s). Exclua os sub-serviços primeiro.`,
      );
    }

    await db.delete(servicesTable).where(eq(servicesTable.id, parsedInput.id));
    revalidatePath("/services");

    return { success: true };
  });
