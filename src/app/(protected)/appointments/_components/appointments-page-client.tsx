"use client";

import { Card, CardContent } from "@/components/ui/card";
import { doctorsTable, patientsTable, servicesTable } from "@/db/schema";
import { useAppointmentsFilters } from "@/hooks/use-appointments-filters";

import AddAppointmentButton from "./add-appointment-button";
import { AppointmentsFilters } from "./appointments-filters";
import { AppointmentsTable } from "./appointments-table";

// 🔥 USAR TIPOS DO SCHEMA DO BANCO
type DoctorData = typeof doctorsTable.$inferSelect;
type ServiceData = typeof servicesTable.$inferSelect;
type PatientData = typeof patientsTable.$inferSelect;

// 🔥 TIPO PARA APPOINTMENT COM JOINS (REMOVIDO statusPagamento)
interface AppointmentData {
  id: string;
  date: Date;
  appointmentPriceInCents: number;
  status: string;
  dueDate?: Date | null;
  serviceId?: string | null;
  // 🔥 NOVO CAMPO: OBSERVAÇÕES
  observations?: string | null;
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
    priceInCents: number;
  } | null;
}

interface AppointmentsPageClientProps {
  initialData: {
    appointments: AppointmentData[];
    doctors: DoctorData[];
    services: ServiceData[];
    patients: PatientData[];
  };
}

export function AppointmentsPageClient({
  initialData,
}: AppointmentsPageClientProps) {
  const { appointments, doctors, services, patients } = initialData;

  // 🔥 USAR HOOK DE FILTROS
  const { filters, setFilters, filteredAppointments } =
    useAppointmentsFilters(appointments);

  // 🔥 CALCULAR ESTATÍSTICAS (sempre baseado em TODOS os appointments)
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
            services={services}
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
                <p className="text-muted-foreground mt-1 text-xs"></p>
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

      {/* 🔥 SOMENTE OS FILTROS NOVOS - REMOVIDA A BUSCA ANTIGA */}
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
          {(filters.search || filters.doctorId || filters.status) && ( // 🔥 REMOVIDO filters.statusPagamento
            <span className="ml-2 text-blue-600">• Filtros ativos</span>
          )}
        </p>
      </div>

      {/* TABELA COM DADOS FILTRADOS */}
      <Card className="dark:bg-card bg-gray-50">
        <CardContent className="p-0">
          <AppointmentsTable
            appointments={filteredAppointments}
            services={services}
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
