"use client";

import { Plus } from "lucide-react";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Dialog, DialogTrigger } from "@/components/ui/dialog";
import { doctorsTable } from "@/db/schema"; // 🔥 IMPORTAR O TIPO

import { AddAppointmentForm } from "./add-appointment-form";

interface AddAppointmentButtonProps {
  patients: Array<{
    id: string;
    name: string;
    email: string | null;
    phoneNumber: string | null;
    clinicId: string;
  }>;
  doctors: (typeof doctorsTable.$inferSelect)[]; // 🔥 USAR TIPO COMPLETO DO BANCO
  services: Array<{
    id: string;
    name: string;
    priceInCents: number;
    clinicId: string;
  }>;
}

const AddAppointmentButton = ({
  patients,
  doctors,
  services,
}: AddAppointmentButtonProps) => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button>
          <Plus />
          Adicionar Agendamento
        </Button>
      </DialogTrigger>
      <AddAppointmentForm
        patients={patients}
        doctors={doctors}
        services={services}
        onSuccess={() => setIsOpen(false)}
      />
    </Dialog>
  );
};

export default AddAppointmentButton;
