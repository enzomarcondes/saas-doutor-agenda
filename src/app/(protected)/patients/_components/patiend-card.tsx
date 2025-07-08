"use client";

import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Calendar, FileText, Mail, MapPin, Phone, User } from "lucide-react";
import { useState } from "react";

import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
} from "@/components/ui/card";
import { Dialog, DialogTrigger } from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
import { patientsTable } from "@/db/schema";

import UpsertPatientForm from "./upsert-patient-form";

interface PatientCardProps {
  patient: typeof patientsTable.$inferSelect;
}

const PatientCard = ({ patient }: PatientCardProps) => {
  const [isUpsertPatientDialogOpen, setIsUpsertPatientDialogOpen] =
    useState(false);

  const patientInitials = patient.name
    .split(" ")
    .map((name) => name[0])
    .join("");

  const formatPhoneNumber = (phone: string) => {
    const cleaned = phone.replace(/\D/g, "");
    if (cleaned.length === 11) {
      return `(${cleaned.slice(0, 2)}) ${cleaned.slice(2, 7)}-${cleaned.slice(7)}`;
    }
    return phone;
  };

  const formatCPF = (cpf: string) => {
    const cleaned = cpf.replace(/\D/g, "");
    if (cleaned.length === 11) {
      return `${cleaned.slice(0, 3)}.${cleaned.slice(3, 6)}.${cleaned.slice(6, 9)}-${cleaned.slice(9)}`;
    }
    return cpf;
  };

  const getSexLabel = (sex: "male" | "female") => {
    return sex === "male" ? "Masculino" : "Feminino";
  };

  const getAddress = () => {
    const parts = [];
    if (patient.rua) parts.push(patient.rua);
    if (patient.numero) parts.push(patient.numero);
    if (patient.bairro) parts.push(patient.bairro);
    if (patient.cidade && patient.uf)
      parts.push(`${patient.cidade} - ${patient.uf}`);
    return parts.join(", ");
  };

  // 🔥 NOVA FUNÇÃO: CALCULAR IDADE E FORMATAR DATA
  const getBirthDateInfo = () => {
    if (!patient.birthDate) return null;

    const birthDate = patient.birthDate;
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();

    if (
      monthDiff < 0 ||
      (monthDiff === 0 && today.getDate() < birthDate.getDate())
    ) {
      age--;
    }

    const formattedDate = format(birthDate, "dd/MM/yyyy", { locale: ptBR });

    return {
      formatted: formattedDate,
      age: `${age} anos`,
    };
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <Avatar className="h-10 w-10">
            <AvatarFallback>{patientInitials}</AvatarFallback>
          </Avatar>
          <div>
            <h3 className="text-sm font-medium">{patient.name}</h3>
            <p className="text-muted-foreground text-sm">
              {getSexLabel(patient.sex)}
            </p>
          </div>
        </div>
      </CardHeader>
      <Separator />
      <CardContent className="flex flex-col gap-2">
        {/* 🔥 EMAIL */}
        <Badge variant="outline">
          <Mail className="mr-1 h-3 w-3" />
          {patient.email || "Não informado"}
        </Badge>

        {/* 🔥 TELEFONE */}
        <Badge variant="outline">
          <Phone className="mr-1 h-3 w-3" />
          {formatPhoneNumber(patient.phoneNumber)}
        </Badge>

        {/* 🔥 NOVA BADGE: DATA DE NASCIMENTO E IDADE */}
        {getBirthDateInfo() && (
          <Badge variant="outline">
            <Calendar className="mr-1 h-3 w-3" />
            <div className="flex flex-col">
              <span className="text-xs">{getBirthDateInfo()?.formatted}</span>
              <span className="text-muted-foreground text-xs">
                {getBirthDateInfo()?.age}
              </span>
            </div>
          </Badge>
        )}

        {/* 🔥 CPF */}
        {patient.cpf && (
          <Badge variant="outline">
            <FileText className="mr-1 h-3 w-3" />
            {formatCPF(patient.cpf)}
          </Badge>
        )}

        {/* 🔥 ENDEREÇO */}
        {getAddress() && (
          <Badge variant="outline" className="text-xs">
            <MapPin className="mr-1 h-3 w-3 flex-shrink-0" />
            <span className="truncate">{getAddress()}</span>
          </Badge>
        )}

        {/* 🔥 SEXO */}
        <Badge variant="outline">
          <User className="mr-1 h-3 w-3" />
          {getSexLabel(patient.sex)}
        </Badge>
      </CardContent>
      <Separator />
      <CardFooter className="flex flex-col gap-2">
        <Dialog
          open={isUpsertPatientDialogOpen}
          onOpenChange={setIsUpsertPatientDialogOpen}
        >
          <DialogTrigger asChild>
            <Button className="w-full">Ver detalhes</Button>
          </DialogTrigger>
          <UpsertPatientForm
            patient={patient}
            onSuccess={() => setIsUpsertPatientDialogOpen(false)}
            isOpen={isUpsertPatientDialogOpen}
          />
        </Dialog>
      </CardFooter>
    </Card>
  );
};

export default PatientCard;
