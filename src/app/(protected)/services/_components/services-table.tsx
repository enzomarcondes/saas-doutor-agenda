"use client";

import { DataTable } from "@/components/ui/data-table";

import { ServiceEditProvider, useServiceEdit } from "./service-edit-context";
import { Service, servicesTableColumns } from "./table-columns";
import { UpsertServiceForm } from "./upsert-service-form";

interface ServicesTableProps {
  services: Service[];
}

function ServicesTableContent({ services }: ServicesTableProps) {
  const {
    editingService,
    openEditDialog,
    closeEditDialog,
    creatingSubService,
    closeSubServiceDialog,
  } = useServiceEdit();

  const handleRowClick = (service: Service) => {
    openEditDialog(service);
  };

  // 🔥 ORGANIZAR DADOS HIERARQUICAMENTE
  const organizedServices = services.reduce((acc, service) => {
    if (!service.parentServiceId) {
      // É um serviço principal
      acc.push(service);
      // Adicionar seus sub-serviços logo após
      const subServices = services.filter(
        (s) => s.parentServiceId === service.id,
      );
      acc.push(...subServices);
    }
    return acc;
  }, [] as Service[]);

  // 🔥 LISTA DE SERVIÇOS PRINCIPAIS PARA O FORMULÁRIO
  const mainServices = services
    .filter((service) => !service.parentServiceId)
    .map((service) => ({
      id: service.id,
      name: service.name,
    }));

  return (
    <div className="space-y-4">
      <DataTable
        data={organizedServices}
        columns={servicesTableColumns}
        onRowClick={handleRowClick}
      />

      {/* 🔥 MODAL DE EDIÇÃO */}
      {editingService && (
        <UpsertServiceForm
          key={`edit-${editingService.id}`}
          defaultValues={{
            id: editingService.id,
            name: editingService.name,
            priceInCents: editingService.priceInCents,
            parentServiceId: editingService.parentServiceId,
          }}
          onClose={closeEditDialog}
          mainServices={mainServices}
        >
          <button style={{ display: "none" }}>Hidden</button>
        </UpsertServiceForm>
      )}

      {/* 🔥 MODAL DE CRIAÇÃO DE SUB-SERVIÇO */}
      {creatingSubService && (
        <UpsertServiceForm
          key={`sub-${creatingSubService.id}`}
          parentService={{
            id: creatingSubService.id,
            name: creatingSubService.name,
          }}
          onClose={closeSubServiceDialog}
          mainServices={mainServices}
        >
          <button style={{ display: "none" }}>Hidden</button>
        </UpsertServiceForm>
      )}
    </div>
  );
}

export function ServicesTable({ services }: ServicesTableProps) {
  return (
    <ServiceEditProvider>
      <ServicesTableContent services={services} />
    </ServiceEditProvider>
  );
}
