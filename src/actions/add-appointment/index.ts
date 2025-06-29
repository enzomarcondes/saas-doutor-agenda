"use server";

import dayjs from "dayjs";
import { revalidatePath } from "next/cache";
import { headers } from "next/headers";

import { db } from "@/db";
import { appointmentsTable } from "@/db/schema";
import { auth } from "@/lib/auth";
import { actionClient } from "@/lib/next-safe-action";

import { getAvailableTimes } from "../get-available-times";
import { addAppointmentSchema } from "./schema";

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

    const appointmentDateTime = dayjs(parsedInput.date)
      .set("hour", parseInt(parsedInput.time.split(":")[0]))
      .set("minute", parseInt(parsedInput.time.split(":")[1]))
      .toDate();

    // 🔥 NOVA LÓGICA DE VENCIMENTO SIMPLIFICADA
    let dueDate: Date;

    if (parsedInput.dueDate) {
      // Se usuário definiu uma data, usar ela
      dueDate = parsedInput.dueDate;
    } else {
      // 🔥 PADRÃO: +30 dias após agendamento (sem lógica de statusPagamento)
      dueDate = dayjs(appointmentDateTime).add(30, "days").toDate();
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
