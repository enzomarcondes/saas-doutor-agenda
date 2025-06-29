import { Plus } from "lucide-react";

import { Button } from "@/components/ui/button";

import { UpsertServiceForm } from "./upsert-service-form";

export function AddServiceButton() {
  return (
    <UpsertServiceForm>
      <Button>
        <Plus className="mr-2 h-4 w-4" />
        Adicionar Serviço
      </Button>
    </UpsertServiceForm>
  );
}
