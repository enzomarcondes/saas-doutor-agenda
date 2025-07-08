"use server";

import { revalidatePath } from "next/cache";

import { db } from "@/db";
import { servicesTable } from "@/db/schema";
import { protectedWithClinicActionClient } from "@/lib/next-safe-action";

import { upsertServiceSchema } from "../db/schema"; // 🔥 IMPORTAR DO SCHEMA

export const upsertService = protectedWithClinicActionClient
  .schema(upsertServiceSchema)
  .action(async ({ parsedInput, ctx }) => {
    // 🔥 VALIDAÇÃO: SUB-SERVIÇOS TÊM PREÇO = 0
    const finalData = {
      ...parsedInput,
      // Se tem pai (é sub-serviço), força preço = 0
      priceInCents: parsedInput.parentServiceId ? 0 : parsedInput.priceInCents,
    };

    await db
      .insert(servicesTable)
      .values({
        ...finalData,
        id: parsedInput.id,
        clinicId: ctx.user.clinic.id,
      })
      .onConflictDoUpdate({
        target: [servicesTable.id],
        set: {
          name: finalData.name,
          priceInCents: finalData.priceInCents,
          parentServiceId: finalData.parentServiceId,
        },
      });

    revalidatePath("/services");
  });
