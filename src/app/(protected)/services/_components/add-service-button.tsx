"use client";

import { Plus } from "lucide-react";

import { Button } from "@/components/ui/button";

import { UpsertServiceForm } from "./upsert-service-form";

// 🔥 INTERFACE PARA RECEBER SERVIÇOS PRINCIPAIS
interface AddServiceButtonProps {
  mainServices?: {
    id: string;
    name: string;
  }[];
}

export function AddServiceButton({ mainServices = [] }: AddServiceButtonProps) {
  return (
    <UpsertServiceForm mainServices={mainServices}>
      <Button>
        <Plus />
        Adicionar Serviço
      </Button>
    </UpsertServiceForm>
  );
}
