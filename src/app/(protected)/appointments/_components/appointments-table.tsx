"use client";

import { DataTable } from "@/components/ui/data-table";

import {
  AppointmentEditProvider,
  useAppointmentEdit,
} from "./appointment-edit-context";
import { EditAppointmentDialog } from "./edit-appointment-dialog";
import { Appointment, columns } from "./table-columns"; // 🔥 VOLTAR AO NORMAL

interface AppointmentsTableProps {
  appointments: Array<{
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
      displayName?: string; // 🔥 ADICIONAR displayName
      priceInCents: number;
      parentServiceId?: string | null;
    } | null;
  }>;
  services?: Array<{
    id: string;
    name: string;
    priceInCents: number;
    parentServiceId?: string | null;
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
    parentServiceId?: string | null;
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
      <DataTable
        columns={columns} // 🔥 USAR COLUNAS NORMAIS
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

      // Prioridade 1: Não finalizados sempre no topo
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

      // Prioridade 2: Entre não finalizados, ordenar por data
      if (a.status !== "finalizado" && b.status !== "finalizado") {
        return dateA.getTime() - dateB.getTime();
      }

      // Prioridade 3: Finalizados de hoje ficam no meio
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

      // Prioridade 4: Entre finalizado e não finalizado
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

  // 🔥 MAPEAMENTO PARA APPOINTMENT TYPE (COM displayName)
  const formattedAppointments: Appointment[] = sortedAppointments.map(
    (appointment): Appointment => ({
      id: appointment.id,
      date: appointment.date,
      appointmentPriceInCents: appointment.appointmentPriceInCents,
      status: appointment.status,
      dueDate: appointment.dueDate,
      serviceId: appointment.serviceId,
      observations: appointment.observations,
      quantity: appointment.quantity || 1,
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
            displayName: appointment.service.displayName, // 🔥 PRESERVAR displayName
            priceInCents: appointment.service.priceInCents,
            parentServiceId: appointment.service.parentServiceId,
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
