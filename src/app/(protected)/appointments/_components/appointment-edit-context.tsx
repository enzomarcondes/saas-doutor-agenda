"use client";

import { createContext, ReactNode, useContext, useState } from "react";

import { Appointment } from "./table-columns";

interface AppointmentEditContextType {
  editingAppointment: Appointment | null;
  openEditDialog: (appointment: Appointment) => void;
  closeEditDialog: () => void;
}

const AppointmentEditContext = createContext<
  AppointmentEditContextType | undefined
>(undefined);

export function AppointmentEditProvider({ children }: { children: ReactNode }) {
  const [editingAppointment, setEditingAppointment] =
    useState<Appointment | null>(null);

  const openEditDialog = (appointment: Appointment) => {
    setEditingAppointment(appointment);
  };

  const closeEditDialog = () => {
    setEditingAppointment(null);
  };

  return (
    <AppointmentEditContext.Provider
      value={{
        editingAppointment,
        openEditDialog,
        closeEditDialog,
      }}
    >
      {children}
    </AppointmentEditContext.Provider>
  );
}

export function useAppointmentEdit() {
  const context = useContext(AppointmentEditContext);
  if (context === undefined) {
    throw new Error(
      "useAppointmentEdit must be used within an AppointmentEditProvider",
    );
  }
  return context;
}
