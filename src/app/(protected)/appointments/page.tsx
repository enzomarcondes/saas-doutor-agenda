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
  const headersList = await headers();
  const session = await auth.api.getSession({
    headers: new Headers(headersList),
  });

  if (!session?.user?.clinic?.id) {
    redirect("/sign-in");
  }

  const clinicId = session.user.clinic.id;

  try {
    const [appointmentsResult, doctorsResult, servicesResult, patientsResult] =
      await Promise.all([
        // 🔥 APPOINTMENTS COM QUANTITY E PARENT SERVICE INFO
        db
          .select({
            id: appointmentsTable.id,
            date: appointmentsTable.date,
            appointmentPriceInCents: appointmentsTable.appointmentPriceInCents,
            status: appointmentsTable.status,
            dueDate: appointmentsTable.dueDate,
            serviceId: appointmentsTable.serviceId,
            observations: appointmentsTable.observations,
            quantity: appointmentsTable.quantity,
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
              parentServiceId: servicesTable.parentServiceId,
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

        // 🔥 SERVICES COM HIERARQUIA
        db.query.servicesTable.findMany({
          where: eq(servicesTable.clinicId, clinicId),
          with: {
            subServices: {
              orderBy: (subServices, { asc }) => [asc(subServices.name)],
            },
            parentService: true,
          },
          orderBy: (services, { asc }) => [
            asc(services.parentServiceId), // NULL primeiro (principais)
            asc(services.name),
          ],
        }),

        // Patients completos
        db
          .select()
          .from(patientsTable)
          .where(eq(patientsTable.clinicId, clinicId)),
      ]);

    // 🔥 CRIAR MAPA DE SERVICES PARA LOOKUP RÁPIDO
    const servicesMap = new Map();
    servicesResult.forEach((service) => {
      servicesMap.set(service.id, service);
    });

    // 🔥 SANITIZAR COM DISPLAY NAME CALCULADO
    const sanitizedAppointments = appointmentsResult.map((appointment) => {
      let serviceData = null;

      if (appointment.service?.id) {
        const fullService = servicesMap.get(appointment.service.id);

        // 🔥 CALCULAR DISPLAY NAME
        let displayName = appointment.service.name;
        if (fullService?.parentService) {
          displayName = `${fullService.parentService.name} - ${appointment.service.name}`;
        }

        serviceData = {
          id: appointment.service.id,
          name: appointment.service.name,
          displayName: displayName, // 🔥 NOME PARA EXIBIÇÃO
          priceInCents: appointment.service.priceInCents,
          parentServiceId: appointment.service.parentServiceId,
        };
      }

      return {
        id: appointment.id,
        date: appointment.date,
        appointmentPriceInCents: appointment.appointmentPriceInCents,
        status: appointment.status,
        dueDate: appointment.dueDate,
        serviceId: appointment.serviceId,
        observations: appointment.observations,
        quantity: appointment.quantity || 1, // fallback para dados antigos
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
        service: serviceData,
      };
    });

    const safeData = {
      appointments: sanitizedAppointments || [],
      doctors: doctorsResult || [],
      services: servicesResult || [],
      patients: patientsResult || [],
    };

    return <AppointmentsPageClient initialData={safeData} />;
  } catch (error) {
    console.error("❌ Erro ao carregar appointments:", error);

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
