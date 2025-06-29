"use client";

import { DataTable } from "@/components/ui/data-table";

import {
  AppointmentEditProvider,
  useAppointmentEdit,
} from "./appointment-edit-context";
import { EditAppointmentDialog } from "./edit-appointment-dialog";
import { Appointment, columns } from "./table-columns";

interface AppointmentsTableProps {
  appointments: Array<{
    id: string;
    date: Date;
    appointmentPriceInCents: number;
    status: string;
    // 🔥 REMOVIDO: statusPagamento: string;
    dueDate?: Date | null;
    serviceId?: string | null;
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
  }>;
  services?: Array<{
    id: string;
    name: string;
    priceInCents: number;
  }>;
  doctors?: Array<{
    id: string;
    name: string;
    availableFromWeekDay: number;
    availableToWeekDay: number;
    availableFromTime: string;
    availableToTime: string;
  }>;
}

type AppointmentForSorting = AppointmentsTableProps["appointments"][0];

function AppointmentsTableContent({
  appointments,
  services = [],
  doctors = [],
}: {
  appointments: Appointment[];
  services?: Array<{
    id: string;
    name: string;
    priceInCents: number;
  }>;
  doctors?: Array<{
    id: string;
    name: string;
    availableFromWeekDay: number;
    availableToWeekDay: number;
    availableFromTime: string;
    availableToTime: string;
  }>;
}) {
  const { editingAppointment, openEditDialog, closeEditDialog } =
    useAppointmentEdit();

  const handleRowClick = (appointment: Appointment) => {
    openEditDialog(appointment);
  };

  return (
    <div className="space-y-4">
      {/* 🔥 SÓ A TABELA - SEM BUSCA */}
      <DataTable
        columns={columns}
        data={appointments}
        onRowClick={handleRowClick}
      />

      {editingAppointment && (
        <EditAppointmentDialog
          key={`edit-${editingAppointment.id}`}
          defaultValues={editingAppointment}
          onClose={closeEditDialog}
          services={services}
          doctors={doctors}
        >
          <button style={{ display: "none" }}>Hidden</button>
        </EditAppointmentDialog>
      )}
    </div>
  );
}

export function AppointmentsTable({
  appointments,
  services = [],
  doctors = [],
}: AppointmentsTableProps) {
  // 🔥 LÓGICA DE ORDENAÇÃO MANTIDA
  const sortAppointments = (
    appointments: AppointmentForSorting[],
  ): AppointmentForSorting[] => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    return appointments.sort((a, b) => {
      const dateA = new Date(a.date);
      const dateB = new Date(b.date);

      const dayA = new Date(dateA);
      dayA.setHours(0, 0, 0, 0);
      const dayB = new Date(dateB);
      dayB.setHours(0, 0, 0, 0);

      const isToday = (date: Date) => date.getTime() === today.getTime();

      // 🔥 PRIORIDADE 1: Não finalizados (qualquer dia) sempre no topo
      if (a.status !== "finalizado" && b.status === "finalizado") {
        if (!isToday(dayB)) {
          return -1;
        }
      }

      if (b.status !== "finalizado" && a.status === "finalizado") {
        if (!isToday(dayA)) {
          return 1;
        }
      }

      // 🔥 PRIORIDADE 2: Entre não finalizados, ordenar por data (mais antigo primeiro)
      if (a.status !== "finalizado" && b.status !== "finalizado") {
        return dateA.getTime() - dateB.getTime();
      }

      // 🔥 PRIORIDADE 3: Finalizados de hoje ficam no meio (ordenados por data)
      if (a.status === "finalizado" && b.status === "finalizado") {
        const aIsToday = isToday(dayA);
        const bIsToday = isToday(dayB);

        if (aIsToday && bIsToday) {
          return dateA.getTime() - dateB.getTime();
        }

        if (aIsToday && !bIsToday) {
          return -1;
        }

        if (!aIsToday && bIsToday) {
          return 1;
        }

        return dateA.getTime() - dateB.getTime();
      }

      // 🔥 PRIORIDADE 4: Entre finalizado e não finalizado
      if (a.status === "finalizado" && b.status !== "finalizado") {
        const aIsToday = isToday(dayA);

        if (aIsToday) {
          return dateA.getTime() - dateB.getTime();
        } else {
          return 1;
        }
      }

      if (b.status === "finalizado" && a.status !== "finalizado") {
        const bIsToday = isToday(dayB);

        if (bIsToday) {
          return dateA.getTime() - dateB.getTime();
        } else {
          return -1;
        }
      }

      return dateA.getTime() - dateB.getTime();
    });
  };

  const sortedAppointments = sortAppointments([...appointments]);

  const formattedAppointments: Appointment[] = sortedAppointments.map(
    (appointment): Appointment => ({
      id: appointment.id,
      date: appointment.date,
      appointmentPriceInCents: appointment.appointmentPriceInCents,
      status: appointment.status,
      // 🔥 REMOVIDO: statusPagamento: appointment.statusPagamento,
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
      service: appointment.service
        ? {
            id: appointment.service.id,
            name: appointment.service.name,
            priceInCents: appointment.service.priceInCents,
          }
        : null,
    }),
  );

  return (
    <AppointmentEditProvider>
      <AppointmentsTableContent
        appointments={formattedAppointments}
        services={services}
        doctors={doctors}
      />
    </AppointmentEditProvider>
  );
}
