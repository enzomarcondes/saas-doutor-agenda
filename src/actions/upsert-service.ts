"use server";

import { revalidatePath } from "next/cache";

import { db } from "@/db";
import { servicesTable } from "@/db/schema";
import { protectedWithClinicActionClient } from "@/lib/next-safe-action";

import { upsertServiceSchema } from "./schema";

export const upsertService = protectedWithClinicActionClient
  .schema(upsertServiceSchema)
  .action(async ({ parsedInput, ctx }) => {
    await db
      .insert(servicesTable)
      .values({
        ...parsedInput,
        id: parsedInput.id,
        clinicId: ctx.user.clinic.id,
      })
      .onConflictDoUpdate({
        target: [servicesTable.id],
        set: {
          name: parsedInput.name,
          priceInCents: parsedInput.priceInCents,
        },
      });
    revalidatePath("/services");
  });
