"use client";

import { createContext, ReactNode, useContext, useState } from "react";

type Service = {
  id: string;
  name: string;
  priceInCents: number;
};

type ServiceEditContextType = {
  editingService: Service | null;
  setEditingService: (service: Service | null) => void;
  openEditDialog: (service: Service) => void;
  closeEditDialog: () => void;
};

const ServiceEditContext = createContext<ServiceEditContextType | undefined>(
  undefined,
);

export function ServiceEditProvider({ children }: { children: ReactNode }) {
  const [editingService, setEditingService] = useState<Service | null>(null);

  const openEditDialog = (service: Service) => {
    setEditingService(service);
  };

  const closeEditDialog = () => {
    setEditingService(null);
  };

  return (
    <ServiceEditContext.Provider
      value={{
        editingService,
        setEditingService,
        openEditDialog,
        closeEditDialog,
      }}
    >
      {children}
    </ServiceEditContext.Provider>
  );
}

export function useServiceEdit() {
  const context = useContext(ServiceEditContext);
  if (context === undefined) {
    throw new Error("useServiceEdit must be used within a ServiceEditProvider");
  }
  return context;
}
