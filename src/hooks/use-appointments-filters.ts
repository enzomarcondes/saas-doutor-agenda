import { useMemo, useState } from "react";

// 🔥 INTERFACE FILTERS ATUALIZADA (SEM statusPagamento)
export interface Filters {
  search: string;
  doctorId: string;
  status: string;
  // 🔥 REMOVIDO: statusPagamento: string;
}

// 🔥 TIPO PARA APPOINTMENT (SEM statusPagamento)
interface AppointmentData {
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
}

export function useAppointmentsFilters(appointments: AppointmentData[]) {
  const [filters, setFilters] = useState<Filters>({
    search: "",
    doctorId: "",
    status: "",
    // 🔥 REMOVIDO: statusPagamento: "",
  });

  const filteredAppointments = useMemo(() => {
    return appointments.filter((appointment) => {
      // 🔥 FILTRO DE BUSCA
      if (filters.search) {
        const searchLower = filters.search.toLowerCase();
        const matchesPatient = appointment.patient.name
          .toLowerCase()
          .includes(searchLower);
        const matchesDoctor = appointment.doctor.name
          .toLowerCase()
          .includes(searchLower);
        const matchesService = appointment.service?.name
          ?.toLowerCase()
          .includes(searchLower);

        if (!matchesPatient && !matchesDoctor && !matchesService) {
          return false;
        }
      }

      // 🔥 FILTRO DE DOUTOR
      if (filters.doctorId && filters.doctorId !== "all") {
        if (appointment.doctor.id !== filters.doctorId) {
          return false;
        }
      }

      // 🔥 FILTRO DE STATUS
      if (filters.status && filters.status !== "all") {
        if (appointment.status !== filters.status) {
          return false;
        }
      }

      // 🔥 REMOVIDO FILTRO DE STATUS PAGAMENTO

      return true;
    });
  }, [appointments, filters]);

  return {
    filters,
    setFilters,
    filteredAppointments,
  };
}
