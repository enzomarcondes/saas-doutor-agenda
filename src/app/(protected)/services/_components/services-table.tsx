"use client";

import { DataTable } from "@/components/ui/data-table";

import { ServiceEditProvider, useServiceEdit } from "./service-edit-context";
import { Service, servicesTableColumns } from "./table-columns";
import { UpsertServiceForm } from "./upsert-service-form";

interface ServicesTableProps {
  services: Service[];
}

function ServicesTableContent({ services }: ServicesTableProps) {
  const { editingService, openEditDialog, closeEditDialog } = useServiceEdit();

  const handleRowClick = (service: Service) => {
    openEditDialog(service);
  };

  return (
    <div className="space-y-4">
      <DataTable
        data={services}
        columns={servicesTableColumns}
        onRowClick={handleRowClick}
      />

      {editingService && (
        <UpsertServiceForm
          key={`edit-${editingService.id}`}
          defaultValues={{
            id: editingService.id,
            name: editingService.name,
            priceInCents: editingService.priceInCents,
          }}
          onClose={closeEditDialog}
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
