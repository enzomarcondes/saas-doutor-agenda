import { eq } from "drizzle-orm";
import { headers } from "next/headers";
import { redirect } from "next/navigation";

import { db } from "@/db";
import {
  appointmentsTable,
  doctorsTable,
  patientsTable,
  servicesTable,
} from "@/db/schema";
import { auth } from "@/lib/auth";

import { AppointmentsPageClient } from "./_components/appointments-page-client";

export default async function AppointmentsPage() {
  // 🔥 AUTH VERIFICAÇÃO
  const headersList = await headers();
  const session = await auth.api.getSession({
    headers: new Headers(headersList),
  });

  if (!session?.user?.clinic?.id) {
    redirect("/sign-in");
  }

  const clinicId = session.user.clinic.id;

  try {
    // 🔥 BUSCAR TODOS OS DADOS
    const [appointmentsResult, doctorsResult, servicesResult, patientsResult] =
      await Promise.all([
        // Appointments com joins
        db
          .select({
            id: appointmentsTable.id,
            date: appointmentsTable.date,
            appointmentPriceInCents: appointmentsTable.appointmentPriceInCents,
            status: appointmentsTable.status,
            dueDate: appointmentsTable.dueDate,
            serviceId: appointmentsTable.serviceId,
            patient: {
              id: patientsTable.id,
              name: patientsTable.name,
              email: patientsTable.email,
              phoneNumber: patientsTable.phoneNumber,
            },
            doctor: {
              id: doctorsTable.id,
              name: doctorsTable.name,
              availableFromWeekDay: doctorsTable.availableFromWeekDay,
              availableToWeekDay: doctorsTable.availableToWeekDay,
              availableFromTime: doctorsTable.availableFromTime,
              availableToTime: doctorsTable.availableToTime,
            },
            service: {
              id: servicesTable.id,
              name: servicesTable.name,
              priceInCents: servicesTable.priceInCents,
            },
          })
          .from(appointmentsTable)
          .innerJoin(
            patientsTable,
            eq(appointmentsTable.patientId, patientsTable.id),
          )
          .innerJoin(
            doctorsTable,
            eq(appointmentsTable.doctorId, doctorsTable.id),
          )
          .leftJoin(
            servicesTable,
            eq(appointmentsTable.serviceId, servicesTable.id),
          )
          .where(eq(appointmentsTable.clinicId, clinicId)),

        // Doctors completos
        db
          .select()
          .from(doctorsTable)
          .where(eq(doctorsTable.clinicId, clinicId)),

        // Services completos
        db
          .select()
          .from(servicesTable)
          .where(eq(servicesTable.clinicId, clinicId)),

        // Patients completos
        db
          .select()
          .from(patientsTable)
          .where(eq(patientsTable.clinicId, clinicId)),
      ]);

    // 🔥 SANITIZAR DADOS PARA EVITAR ERROS DE SERIALIZAÇÃO
    const sanitizedAppointments = appointmentsResult.map((appointment) => ({
      id: appointment.id,
      date: appointment.date,
      appointmentPriceInCents: appointment.appointmentPriceInCents,
      status: appointment.status,
      dueDate: appointment.dueDate,
      serviceId: appointment.serviceId,
      patient: {
        id: appointment.patient.id,
        name: appointment.patient.name,
        email: appointment.patient.email,
        phoneNumber: appointment.patient.phoneNumber,
      },
      doctor: {
        id: appointment.doctor.id,
        name: appointment.doctor.name,
        availableFromWeekDay: appointment.doctor.availableFromWeekDay,
        availableToWeekDay: appointment.doctor.availableToWeekDay,
        availableFromTime: appointment.doctor.availableFromTime,
        availableToTime: appointment.doctor.availableToTime,
      },
      // 🔥 CRUCIAL: GARANTIR QUE service SEJA SEMPRE null OU OBJETO VÁLIDO
      service: appointment.service?.id
        ? {
            id: appointment.service.id,
            name: appointment.service.name,
            priceInCents: appointment.service.priceInCents,
          }
        : null,
    }));

    // 🔥 GARANTIR QUE TODOS OS ARRAYS SEJAM VÁLIDOS
    const safeData = {
      appointments: sanitizedAppointments || [],
      doctors: doctorsResult || [],
      services: servicesResult || [],
      patients: patientsResult || [],
    };

    // 🔥 RETORNAR DADOS SEGUROS
    return <AppointmentsPageClient initialData={safeData} />;
  } catch (error) {
    console.error("❌ Erro ao carregar appointments:", error);

    // 🔥 FALLBACK SEGURO
    return (
      <AppointmentsPageClient
        initialData={{
          appointments: [],
          doctors: [],
          services: [],
          patients: [],
        }}
      />
    );
  }
}
