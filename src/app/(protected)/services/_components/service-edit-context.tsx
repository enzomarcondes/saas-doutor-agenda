"use client";

import { createContext, ReactNode, useContext, useState } from "react";

// 🔥 TIPO ATUALIZADO COM HIERARQUIA
type Service = {
  id: string;
  name: string;
  priceInCents: number;
  parentServiceId: string | null;
  parentService?: {
    id: string;
    name: string;
  } | null;
  subServices?: {
    id: string;
    name: string;
  }[];
};

type ServiceEditContextType = {
  editingService: Service | null;
  setEditingService: (service: Service | null) => void;
  openEditDialog: (service: Service) => void;
  closeEditDialog: () => void;
  // 🔥 NOVOS ESTADOS PARA SUB-SERVIÇOS
  creatingSubService: Service | null;
  openSubServiceDialog: (parentService: Service) => void;
  closeSubServiceDialog: () => void;
};

const ServiceEditContext = createContext<ServiceEditContextType | undefined>(
  undefined,
);

export function ServiceEditProvider({ children }: { children: ReactNode }) {
  const [editingService, setEditingService] = useState<Service | null>(null);
  const [creatingSubService, setCreatingSubService] = useState<Service | null>(
    null,
  );

  const openEditDialog = (service: Service) => {
    setEditingService(service);
  };

  const closeEditDialog = () => {
    setEditingService(null);
  };

  // 🔥 NOVAS FUNÇÕES PARA SUB-SERVIÇOS
  const openSubServiceDialog = (parentService: Service) => {
    setCreatingSubService(parentService);
  };

  const closeSubServiceDialog = () => {
    setCreatingSubService(null);
  };

  return (
    <ServiceEditContext.Provider
      value={{
        editingService,
        setEditingService,
        openEditDialog,
        closeEditDialog,
        creatingSubService,
        openSubServiceDialog,
        closeSubServiceDialog,
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
