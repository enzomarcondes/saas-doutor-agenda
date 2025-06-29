"use server";

import dayjs from "dayjs";
import { eq } from "drizzle-orm";
import { headers } from "next/headers";
import { z } from "zod";

import { db } from "@/db";
import { appointmentsTable, doctorsTable } from "@/db/schema";
import { generateTimeSlots } from "@/helpers/time";
import { auth } from "@/lib/auth";
import { actionClient } from "@/lib/next-safe-action";

export const getAvailableTimes = actionClient
  .schema(
    z.object({
      doctorId: z.string(),
      date: z.string().date(),
    }),
  )
  .action(async ({ parsedInput }) => {
    const session = await auth.api.getSession({
      headers: await headers(),
    });
    if (!session) {
      throw new Error("Unauthorized");
    }
    if (!session.user.clinic) {
      throw new Error("Clínica não encontrada");
    }

    const doctor = await db.query.doctorsTable.findFirst({
      where: eq(doctorsTable.id, parsedInput.doctorId),
    });

    if (!doctor) {
      throw new Error("Médico não encontrado");
    }

    const selectedDayOfWeek = dayjs(parsedInput.date).day();

    // 🔥 CORRIGIR VERIFICAÇÃO DE DISPONIBILIDADE
    let doctorIsAvailable = false;

    if (doctor.availableFromWeekDay <= doctor.availableToWeekDay) {
      // Caso normal: segunda(1) a sexta(5)
      doctorIsAvailable =
        selectedDayOfWeek >= doctor.availableFromWeekDay &&
        selectedDayOfWeek <= doctor.availableToWeekDay;
    } else {
      // Caso especial: segunda(1) a domingo(0)
      doctorIsAvailable =
        selectedDayOfWeek >= doctor.availableFromWeekDay ||
        selectedDayOfWeek <= doctor.availableToWeekDay;
    }

    if (!doctorIsAvailable) {
      return [];
    }

    const appointments = await db.query.appointmentsTable.findMany({
      where: eq(appointmentsTable.doctorId, parsedInput.doctorId),
    });

    const appointmentsOnSelectedDate = appointments
      .filter((appointment) => {
        return dayjs(appointment.date).isSame(parsedInput.date, "day");
      })
      .map((appointment) => dayjs(appointment.date).format("HH:mm:ss"));

    const timeSlots = generateTimeSlots();

    // 🔥 USAR HORÁRIOS DIRETOS SEM CONVERSÃO UTC
    const doctorAvailableFromTime = doctor.availableFromTime; // "08:00:00"
    const doctorAvailableToTime = doctor.availableToTime; // "18:00:00"

    const doctorTimeSlots = timeSlots.filter((time) => {
      // 🔥 COMPARAR STRINGS DIRETAMENTE
      return time >= doctorAvailableFromTime && time <= doctorAvailableToTime;
    });

    return doctorTimeSlots.map((time) => {
      return {
        value: time,
        available: !appointmentsOnSelectedDate.includes(time),
        label: time.substring(0, 5),
      };
    });
  });
