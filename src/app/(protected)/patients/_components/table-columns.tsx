"use client";

import { ColumnDef } from "@tanstack/react-table";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

import { patientsTable } from "@/db/schema";

import PatientsTableActions from "./table-actions";

type Patient = typeof patientsTable.$inferSelect;

// 🔥 FUNÇÃO HELPER PARA CALCULAR IDADE
const calculateAge = (birthDate: Date | null | undefined): string => {
  if (!birthDate) return "Não informado";

  const today = new Date();
  let age = today.getFullYear() - birthDate.getFullYear();
  const monthDiff = today.getMonth() - birthDate.getMonth();

  if (
    monthDiff < 0 ||
    (monthDiff === 0 && today.getDate() < birthDate.getDate())
  ) {
    age--;
  }

  return `${age} anos`;
};

export const patientsTableColumns: ColumnDef<Patient>[] = [
  {
    id: "name",
    accessorKey: "name",
    header: "Nome",
  },
  {
    id: "email",
    accessorKey: "email",
    header: "Email",
    cell: (params) => {
      const patient = params.row.original;
      return patient.email || "Não informado";
    },
  },
  {
    id: "phoneNumber",
    accessorKey: "phoneNumber",
    header: "Telefone",
    cell: (params) => {
      const patient = params.row.original;
      const phoneNumber = patient.phoneNumber;
      if (!phoneNumber) return "";
      const formatted = phoneNumber.replace(
        /(\d{2})(\d{5})(\d{4})/,
        "($1) $2-$3",
      );
      return formatted;
    },
  },
  // 🔥 NOVA COLUNA: DATA DE NASCIMENTO E IDADE
  {
    id: "birthDate",
    accessorKey: "birthDate",
    header: "Data Nascimento / Idade",
    cell: (params) => {
      const patient = params.row.original;
      if (!patient.birthDate) return "Não informado";

      const formattedDate = format(patient.birthDate, "dd/MM/yyyy", {
        locale: ptBR,
      });
      const age = calculateAge(patient.birthDate);

      return (
        <div className="space-y-1">
          <div className="text-sm">{formattedDate}</div>
          <div className="text-muted-foreground text-xs">{age}</div>
        </div>
      );
    },
  },
  {
    id: "cpf",
    accessorKey: "cpf",
    header: "CPF",
    cell: (params) => {
      const patient = params.row.original;
      if (!patient.cpf) return "Não informado";
      return patient.cpf.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, "$1.$2.$3-$4");
    },
  },
  {
    id: "city",
    header: "Cidade",
    cell: (params) => {
      const patient = params.row.original;
      if (patient.cidade && patient.uf) {
        return `${patient.cidade} - ${patient.uf}`;
      }
      return "Não informado";
    },
  },
  {
    id: "sex",
    accessorKey: "sex",
    header: "Sexo",
    cell: (params) => {
      const patient = params.row.original;
      return patient.sex === "male" ? "Masculino" : "Feminino";
    },
  },
  {
    id: "actions",
    cell: (params) => {
      const patient = params.row.original;
      return <PatientsTableActions patient={patient} />;
    },
  },
];
