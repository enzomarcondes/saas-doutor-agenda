"use server";

import { revalidatePath } from "next/cache";

import { db } from "@/db";
import { doctorsTable } from "@/db/schema";
import { protectedWithClinicActionClient } from "@/lib/next-safe-action";

import { upsertDoctorSchema } from "./schema";

export const upsertDoctor = protectedWithClinicActionClient
  .schema(upsertDoctorSchema)
  .action(async ({ parsedInput, ctx }) => {
    // 🔥 USAR OS HORÁRIOS DIRETAMENTE, SEM CONVERSÃO UTC
    const availableFromTime = parsedInput.availableFromTime; // "08:00:00"
    const availableToTime = parsedInput.availableToTime; // "18:00:00"

    await db
      .insert(doctorsTable)
      .values({
        ...parsedInput,
        id: parsedInput.id,
        clinicId: ctx.user.clinic.id,
        availableFromTime, // 🔥 DIRETO, SEM CONVERSÃO
        availableToTime, // 🔥 DIRETO, SEM CONVERSÃO
      })
      .onConflictDoUpdate({
        target: [doctorsTable.id],
        set: {
          ...parsedInput,
          availableFromTime, // 🔥 DIRETO, SEM CONVERSÃO
          availableToTime, // 🔥 DIRETO, SEM CONVERSÃO
        },
      });

    revalidatePath("/doctors");
  });
