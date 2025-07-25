"use server";

import { revalidatePath } from "next/cache";

import { db } from "@/db";
import { patientsTable } from "@/db/schema";
import { protectedWithClinicActionClient } from "@/lib/next-safe-action";

import { upsertPatientSchema } from "./schema";

export const upsertPatient = protectedWithClinicActionClient
  .schema(upsertPatientSchema)
  .action(async ({ parsedInput, ctx }) => {
    const result = await db
      .insert(patientsTable)
      .values({
        ...parsedInput,
        id: parsedInput.id,
        clinicId: ctx.user.clinic.id,
      })
      .onConflictDoUpdate({
        target: [patientsTable.id],
        set: {
          ...parsedInput,
        },
      })
      .returning(); // 🔥 RETORNAR DADOS CRIADOS

    revalidatePath("/patients");

    // 🔥 RETORNAR O PACIENTE CRIADO/ATUALIZADO
    return result[0];
  });
