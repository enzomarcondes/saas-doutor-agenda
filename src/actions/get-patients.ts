"use server";

import { eq } from "drizzle-orm";

import { db } from "@/db";
import { patientsTable } from "@/db/schema";
import { protectedWithClinicActionClient } from "@/lib/next-safe-action";

export const getPatients = protectedWithClinicActionClient.action(
  async ({ ctx }) => {
    try {
      const patients = await db.query.patientsTable.findMany({
        where: eq(patientsTable.clinicId, ctx.user.clinic.id),
        columns: {
          id: true,
          name: true,
        },
      });

      return { patients };
    } catch {
      throw new Error("Erro ao buscar pacientes");
    }
  },
);
