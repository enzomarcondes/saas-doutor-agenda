"use client";

import { Card, CardContent } from "@/components/ui/card";
import { doctorsTable, patientsTable } from "@/db/schema";
import { useAppointmentsFilters } from "@/hooks/use-appointments-filters";

import AddAppointmentButton from "./add-appointment-button";
import { AppointmentsFilters } from "./appointments-filters";
import { AppointmentsTable } from "./appointments-table";

// 🔥 USAR TIPOS DO SCHEMA DO BANCO
type DoctorData = typeof doctorsTable.$inferSelect;
type PatientData = typeof patientsTable.$inferSelect;

// 🔥 TIPO PARA SERVICE COM HIERARQUIA - CORRIGIDO updatedAt
interface ServiceData {
  id: string;
  name: string;
  priceInCents: number;
  clinicId: string;
  parentServiceId?: string | null;
  createdAt: Date;
  updatedAt: Date | null;
  subServices?: Array<{
    id: string;
    name: string;
    priceInCents: number;
    clinicId: string;
    parentServiceId: string | null;
    createdAt: Date;
    updatedAt: Date | null;
  }>;
  parentService?: {
    id: string;
    name: string;
    priceInCents: number;
    clinicId: string;
    parentServiceId: string | null;
    createdAt: Date;
    updatedAt: Date | null;
  } | null;
}

// 🔥 TIPO PARA APPOINTMENTS QUE VÊM DA PÁGINA (COM displayName)
interface AppointmentDataWithDisplayName {
  id: string;
  date: Date;
  appointmentPriceInCents: number;
  status: string;
  dueDate?: Date | null;
  serviceId?: string | null;
  observations?: string | null;
  quantity?: number;
  patient: {
    id: string;
    name: string;
    email?: string | null;
    phoneNumber?: string | null;
  };
  doctor: {
    id: string;
    name: string;
    availableFromWeekDay: number;
    availableToWeekDay: number;
    availableFromTime: string;
    availableToTime: string;
  };
  service?: {
    id: string;
    name: string;
    displayName?: string; // 🔥 CAMPO QUE VEM DA PÁGINA
    priceInCents: number;
    parentServiceId?: string | null;
  } | null;
}

// 🔥 TIPO PARA APPOINTMENTS TABLE
interface AppointmentDataForTable {
  id: string;
  date: Date;
  appointmentPriceInCents: number;
  status: string;
  dueDate?: Date | null;
  serviceId?: string | null;
  observations?: string | null;
  quantity: number;
  patient: {
    id: string;
    name: string;
    email?: string | null;
    phoneNumber?: string | null;
  };
  doctor: {
    id: string;
    name: string;
    availableFromWeekDay: number;
    availableToWeekDay: number;
    availableFromTime: string;
    availableToTime: string;
  };
  service?: {
    id: string;
    name: string;
    displayName?: string;
    priceInCents: number;
    parentServiceId?: string | null;
  } | null;
}

interface AppointmentsPageClientProps {
  initialData: {
    appointments: AppointmentDataWithDisplayName[]; // 🔥 USAR TIPO COM displayName
    doctors: DoctorData[];
    services: ServiceData[];
    patients: PatientData[];
  };
}

export function AppointmentsPageClient({
  initialData,
}: AppointmentsPageClientProps) {
  const { appointments, doctors, services, patients } = initialData;

  // 🔥 CONVERTER PARA TIPO DO HOOK (SEM displayName)
  const appointmentsForHook = appointments.map((appointment) => ({
    id: appointment.id,
    date: appointment.date,
    appointmentPriceInCents: appointment.appointmentPriceInCents,
    status: appointment.status,
    dueDate: appointment.dueDate,
    serviceId: appointment.serviceId,
    observations: appointment.observations,
    quantity: appointment.quantity,
    patient: appointment.patient,
    doctor: appointment.doctor,
    service: appointment.service
      ? {
          id: appointment.service.id,
          name: appointment.service.name,
          priceInCents: appointment.service.priceInCents,
          parentServiceId: appointment.service.parentServiceId,
        }
      : null,
  }));

  // 🔥 USAR HOOK DE FILTROS
  const { filters, setFilters, filteredAppointments } =
    useAppointmentsFilters(appointmentsForHook);

  // 🔥 CALCULAR ESTATÍSTICAS
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const startOfWeek = new Date(today);
  startOfWeek.setDate(today.getDate() - today.getDay());

  const endOfWeek = new Date(startOfWeek);
  endOfWeek.setDate(startOfWeek.getDate() + 6);

  const agendamentosHoje = appointments.filter((apt) => {
    const aptDate = new Date(apt.date);
    aptDate.setHours(0, 0, 0, 0);
    return aptDate.getTime() === today.getTime();
  }).length;

  const agendamentosSemana = appointments.filter((apt) => {
    const aptDate = new Date(apt.date);
    return aptDate >= startOfWeek && aptDate <= endOfWeek;
  }).length;

  // 🔥 TRANSFORMAR SERVICES PARA ADD BUTTON
  const servicesForAddButton = services.map((service) => ({
    id: service.id,
    name: service.name,
    priceInCents: service.priceInCents,
    clinicId: service.clinicId,
    parentServiceId: service.parentServiceId,
    subServices: service.subServices?.map((sub) => ({
      id: sub.id,
      name: sub.name,
      priceInCents: sub.priceInCents,
    })),
    parentService: service.parentService
      ? {
          id: service.parentService.id,
          name: service.parentService.name,
          priceInCents: service.parentService.priceInCents,
        }
      : null,
  }));

  // 🔥 TRANSFORMAR SERVICES PARA TABELA
  const servicesForTable = services.map((service) => ({
    id: service.id,
    name: service.name,
    priceInCents: service.priceInCents,
    parentServiceId: service.parentServiceId,
  }));

  // 🔥 MAPEAR APPOINTMENTS FILTRADOS PARA TABELA (PRESERVAR displayName)
  const appointmentsForTable: AppointmentDataForTable[] =
    filteredAppointments.map((filteredApp) => {
      // 🔥 ENCONTRAR O APPOINTMENT ORIGINAL COM displayName
      const originalApp = appointments.find((app) => app.id === filteredApp.id);

      return {
        id: filteredApp.id,
        date: filteredApp.date,
        appointmentPriceInCents: filteredApp.appointmentPriceInCents,
        status: filteredApp.status,
        dueDate: filteredApp.dueDate,
        serviceId: filteredApp.serviceId,
        observations: filteredApp.observations,
        quantity: filteredApp.quantity ?? 1,
        patient: filteredApp.patient,
        doctor: filteredApp.doctor,
        service: originalApp?.service
          ? {
              id: originalApp.service.id,
              name: originalApp.service.name,
              priceInCents: originalApp.service.priceInCents,
              parentServiceId: originalApp.service.parentServiceId,
              displayName: originalApp.service.displayName, // 🔥 USAR displayName DO ORIGINAL
            }
          : null,
      };
    });

  return (
    <div className="flex flex-col gap-6 p-6">
      {/* HEADER */}
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Agendamentos</h1>
          <p className="text-muted-foreground">
            Gerencie os agendamentos da sua clínica
          </p>
        </div>
        <div className="flex items-center gap-4">
          <AddAppointmentButton
            patients={patients}
            doctors={doctors}
            services={servicesForAddButton}
          />
        </div>
      </div>

      {/* CARDS DE ESTATÍSTICAS */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="dark:bg-card bg-gray-50 transition-shadow hover:shadow-md">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-muted-foreground text-sm font-medium">
                  Hoje
                </p>
                <p className="text-3xl font-bold">{agendamentosHoje}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="dark:bg-card bg-gray-50 transition-shadow hover:shadow-md">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-muted-foreground text-sm font-medium">
                  Esta Semana
                </p>
                <p className="text-3xl font-bold">{agendamentosSemana}</p>
                <p className="text-muted-foreground mt-1 text-xs">
                  agendamentos
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* FILTROS */}
      <AppointmentsFilters
        doctors={doctors.map((d) => ({ id: d.id, name: d.name }))}
        onFiltersChange={setFilters}
      />

      {/* CONTADOR DE RESULTADOS */}
      <div className="flex items-center justify-between">
        <p className="text-muted-foreground text-sm">
          Mostrando{" "}
          <span className="font-medium">{filteredAppointments.length}</span> de{" "}
          <span className="font-medium">{appointments.length}</span>{" "}
          agendamentos
          {(filters.search || filters.doctorId || filters.status) && (
            <span className="ml-2 text-blue-600">• Filtros ativos</span>
          )}
        </p>
      </div>

      {/* TABELA COM DADOS FILTRADOS */}
      <Card className="dark:bg-card bg-gray-50">
        <CardContent className="p-0">
          <AppointmentsTable
            appointments={appointmentsForTable}
            services={servicesForTable}
            doctors={doctors.map((d) => ({
              id: d.id,
              name: d.name,
              availableFromWeekDay: d.availableFromWeekDay,
              availableToWeekDay: d.availableToWeekDay,
              availableFromTime: d.availableFromTime,
              availableToTime: d.availableToTime,
            }))}
          />
        </CardContent>
      </Card>
    </div>
  );
}
