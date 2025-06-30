"use server";

"use server";
import dayjs from "dayjs";
import timezone from "dayjs/plugin/timezone";
import utc from "dayjs/plugin/utc";
import { revalidatePath } from "next/cache";
import { headers } from "next/headers";

import { db } from "@/db";
import { appointmentsTable } from "@/db/schema";
import { auth } from "@/lib/auth";
import { actionClient } from "@/lib/next-safe-action";

import { getAvailableTimes } from "../get-available-times";
import { addAppointmentSchema } from "./schema";

dayjs.extend(utc);
dayjs.extend(timezone);

export const addAppointment = actionClient
  .schema(addAppointmentSchema)
  .action(async ({ parsedInput }) => {
    const session = await auth.api.getSession({
      headers: await headers(),
    });
    if (!session?.user) {
      throw new Error("Unauthorized");
    }
    if (!session?.user.clinic?.id) {
      throw new Error("Clinic not found");
    }

    const availableTimes = await getAvailableTimes({
      doctorId: parsedInput.doctorId,
      date: dayjs(parsedInput.date).format("YYYY-MM-DD"),
    });

    if (!availableTimes?.data) {
      throw new Error("Nenhum horário disponível para este médico");
    }

    const isTimeAvailable = availableTimes.data?.some(
      (time) => time.value === parsedInput.time + ":00" && time.available,
    );

    if (!isTimeAvailable) {
      throw new Error("Horário não disponível ou ocupado");
    }

    // 🔥 CORRIGIR ESTA PARTE:
    const appointmentDateTime = dayjs(parsedInput.date)
      .tz("America/Sao_Paulo") // ← FORÇA TIMEZONE BRASILEIRO
      .set("hour", parseInt(parsedInput.time.split(":")[0]))
      .set("minute", parseInt(parsedInput.time.split(":")[1]))
      .utc() // ← CONVERTE PARA UTC ANTES DE SALVAR
      .toDate();

    // 🔥 CORRIGIR VENCIMENTO TAMBÉM:
    let dueDate: Date;
    if (parsedInput.dueDate) {
      dueDate = dayjs(parsedInput.dueDate)
        .tz("America/Sao_Paulo")
        .utc()
        .toDate();
    } else {
      dueDate = dayjs(appointmentDateTime)
        .tz("America/Sao_Paulo")
        .add(30, "days")
        .utc()
        .toDate();
    }

    await db.insert(appointmentsTable).values({
      ...parsedInput,
      clinicId: session?.user.clinic?.id,
      date: appointmentDateTime,
      dueDate: dueDate, // 🔥 LÓGICA SIMPLIFICADA
    });

    revalidatePath("/appointments");
    revalidatePath("/dashboard");
  });
