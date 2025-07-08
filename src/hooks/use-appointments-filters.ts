import { useMemo, useState } from "react";

// 🔥 EXPORTAR O TIPO APPOINTMENT DATA
export interface AppointmentData {
  id: string;
  date: Date;
  appointmentPriceInCents: number;
  status: string;
  dueDate?: Date | null;
  serviceId?: string | null;
  observations?: string | null;
  // 🔥 QUANTITY OPCIONAL PARA COMPATIBILIDADE COM DADOS ANTIGOS
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
    priceInCents: number;
    parentServiceId?: string | null;
  } | null;
}

// 🔥 EXPORTAR INTERFACE DE FILTROS
export interface AppointmentFilters {
  search: string;
  doctorId: string;
  status: string;
  dateFrom?: Date;
  dateTo?: Date;
}

export function useAppointmentsFilters(appointments: AppointmentData[]) {
  const [filters, setFilters] = useState<AppointmentFilters>({
    search: "",
    doctorId: "",
    status: "",
    dateFrom: undefined,
    dateTo: undefined,
  });

  const filteredAppointments = useMemo(() => {
    return appointments.filter((appointment) => {
      // 🔥 FILTRO POR BUSCA (PACIENTE)
      if (filters.search) {
        const searchLower = filters.search.toLowerCase();
        const patientName = appointment.patient.name.toLowerCase();
        if (!patientName.includes(searchLower)) {
          return false;
        }
      }

      // 🔥 FILTRO POR DOUTOR
      if (filters.doctorId && appointment.doctor.id !== filters.doctorId) {
        return false;
      }

      // 🔥 FILTRO POR STATUS
      if (filters.status && appointment.status !== filters.status) {
        return false;
      }

      // 🔥 FILTRO POR DATA (DE)
      if (filters.dateFrom) {
        const appointmentDate = new Date(appointment.date);
        appointmentDate.setHours(0, 0, 0, 0);
        const fromDate = new Date(filters.dateFrom);
        fromDate.setHours(0, 0, 0, 0);
        if (appointmentDate < fromDate) {
          return false;
        }
      }

      // 🔥 FILTRO POR DATA (ATÉ)
      if (filters.dateTo) {
        const appointmentDate = new Date(appointment.date);
        appointmentDate.setHours(0, 0, 0, 0);
        const toDate = new Date(filters.dateTo);
        toDate.setHours(0, 0, 0, 0);
        if (appointmentDate > toDate) {
          return false;
        }
      }

      return true;
    });
  }, [appointments, filters]);

  return {
    filters,
    setFilters,
    filteredAppointments,
  };
}
