import dayjs from "dayjs";
import { and, asc, count, desc, eq, gte, lte, sql, sum } from "drizzle-orm";

import { db } from "@/db";
import {
  appointmentsTable,
  doctorsTable,
  patientsTable,
  servicesTable,
} from "@/db/schema";

interface Params {
  from: string;
  to: string;
  session: {
    user: {
      clinic: {
        id: string;
      };
    };
  };
}

export const getDashboard = async ({ from, to, session }: Params) => {
  const chartStartDate = new Date(from);
  const chartEndDate = new Date(to);

  // 🔥 CALCULAR SEMANA ATUAL PARA AGENDA
  const today = dayjs();
  const startOfWeek = today.startOf("week"); // Domingo
  const endOfWeek = today.endOf("week"); // Sábado

  const [
    [totalRevenue],
    [totalAppointments],
    [totalPatients],
    [totalDoctors],
    topDoctors,
    topServices,
    weeklyAppointments, // 🔥 RENOMEADO E EXPANDIDO
    dailyAppointmentsData,
  ] = await Promise.all([
    db
      .select({
        total: sum(appointmentsTable.appointmentPriceInCents),
      })
      .from(appointmentsTable)
      .where(
        and(
          eq(appointmentsTable.clinicId, session.user.clinic.id),
          gte(appointmentsTable.date, new Date(from)),
          lte(appointmentsTable.date, new Date(to)),
        ),
      ),
    db
      .select({
        total: count(),
      })
      .from(appointmentsTable)
      .where(
        and(
          eq(appointmentsTable.clinicId, session.user.clinic.id),
          gte(appointmentsTable.date, new Date(from)),
          lte(appointmentsTable.date, new Date(to)),
        ),
      ),
    db
      .select({
        total: count(),
      })
      .from(patientsTable)
      .where(eq(patientsTable.clinicId, session.user.clinic.id)),
    db
      .select({
        total: count(),
      })
      .from(doctorsTable)
      .where(eq(doctorsTable.clinicId, session.user.clinic.id)),
    db
      .select({
        id: doctorsTable.id,
        name: doctorsTable.name,
        avatarImageUrl: doctorsTable.avatarImageUrl,
        appointments: count(appointmentsTable.id),
      })
      .from(doctorsTable)
      .leftJoin(
        appointmentsTable,
        and(
          eq(appointmentsTable.doctorId, doctorsTable.id),
          gte(appointmentsTable.date, new Date(from)),
          lte(appointmentsTable.date, new Date(to)),
        ),
      )
      .where(eq(doctorsTable.clinicId, session.user.clinic.id))
      .groupBy(doctorsTable.id)
      .orderBy(desc(count(appointmentsTable.id)))
      .limit(10),
    db
      .select({
        serviceName: servicesTable.name,
        appointments: count(appointmentsTable.id),
      })
      .from(appointmentsTable)
      .innerJoin(
        servicesTable,
        eq(appointmentsTable.serviceId, servicesTable.id),
      )
      .where(
        and(
          eq(appointmentsTable.clinicId, session.user.clinic.id),
          gte(appointmentsTable.date, new Date(from)),
          lte(appointmentsTable.date, new Date(to)),
        ),
      )
      .groupBy(servicesTable.name)
      .orderBy(desc(count(appointmentsTable.id))),
    // 🔥 AGENDAMENTOS DA SEMANA ATUAL (NÃO SÓ HOJE)
    db.query.appointmentsTable.findMany({
      where: and(
        eq(appointmentsTable.clinicId, session.user.clinic.id),
        gte(appointmentsTable.date, startOfWeek.toDate()),
        lte(appointmentsTable.date, endOfWeek.toDate()),
      ),
      with: {
        patient: true,
        doctor: true,
        service: true,
      },
      orderBy: [asc(appointmentsTable.date)],
    }),
    db
      .select({
        date: sql<string>`DATE(${appointmentsTable.date})`.as("date"),
        appointments: count(appointmentsTable.id),
        revenue:
          sql<number>`COALESCE(SUM(${appointmentsTable.appointmentPriceInCents}), 0)`.as(
            "revenue",
          ),
      })
      .from(appointmentsTable)
      .where(
        and(
          eq(appointmentsTable.clinicId, session.user.clinic.id),
          gte(appointmentsTable.date, chartStartDate),
          lte(appointmentsTable.date, chartEndDate),
        ),
      )
      .groupBy(sql`DATE(${appointmentsTable.date})`)
      .orderBy(sql`DATE(${appointmentsTable.date})`),
  ]);

  return {
    totalRevenue,
    totalAppointments,
    totalPatients,
    totalDoctors,
    topDoctors,
    topServices,
    todayAppointments: weeklyAppointments, // 🔥 RENOMEADO PARA MANTER COMPATIBILIDADE
    dailyAppointmentsData,
  };
};
