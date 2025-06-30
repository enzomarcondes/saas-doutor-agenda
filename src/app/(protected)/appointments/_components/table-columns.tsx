"use client";

import { ColumnDef } from "@tanstack/react-table";
import dayjs from "dayjs";
import timezone from "dayjs/plugin/timezone";
import utc from "dayjs/plugin/utc";
import { MoreHorizontal, Trash2 } from "lucide-react";
import { useAction } from "next-safe-action/hooks";
import { toast } from "sonner";

import { deleteAppointment } from "@/actions/delete-appointment";
import { updateAppointment } from "@/actions/update-appointment";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

// 🔥 CONFIGURAR DAYJS
dayjs.extend(utc);
dayjs.extend(timezone);

export interface Appointment {
  id: string;
  date: Date;
  appointmentPriceInCents: number;
  status: string;
  dueDate?: Date | null;
  serviceId?: string | null;
  patient: {
    id: string;
    name: string;
    email?: string | null;
    phoneNumber?: string | null;
  };
  doctor: {
    id: string;
    name: string;
    availableFromWeekDay: number;
    availableToWeekDay: number;
    availableFromTime: string;
    availableToTime: string;
  };
  service?: {
    id: string;
    name: string;
    priceInCents: number;
  } | null;
}

// 🔥 FUNÇÃO PARA BADGES CLICÁVEIS DE STATUS AGENDAMENTO
function StatusAgendamentoBadge({ appointment }: { appointment: Appointment }) {
  const { execute: executeUpdate, isPending } = useAction(updateAppointment, {
    onSuccess: () => {
      toast.success("Status atualizado com sucesso!");
    },
    onError: ({ error }) => {
      toast.error(error.serverError ?? "Erro ao atualizar status");
    },
  });

  const handleStatusChange = (newStatus: string) => {
    executeUpdate({
      id: appointment.id,
      status: newStatus as
        | "agendado"
        | "confirmado"
        | "cancelado"
        | "nao_compareceu"
        | "finalizado",
    });
  };

  const getStatusConfig = (status: string) => {
    switch (status) {
      case "agendado":
        return {
          label: "Agendado",
          className:
            "bg-purple-500 hover:bg-purple-600 text-white cursor-pointer transition-colors",
        };
      case "confirmado":
        return {
          label: "Confirmado",
          className:
            "bg-blue-500 hover:bg-blue-600 text-white cursor-pointer transition-colors",
        };
      case "cancelado":
        return {
          label: "Cancelado",
          className:
            "bg-red-500 hover:bg-red-600 text-white cursor-pointer transition-colors",
        };
      case "nao_compareceu":
        return {
          label: "Não Compareceu",
          className:
            "bg-black hover:bg-gray-800 text-white cursor-pointer transition-colors",
        };
      case "finalizado":
        return {
          label: "Finalizado",
          className:
            "bg-green-500 hover:bg-green-600 text-white cursor-pointer transition-colors",
        };
      default:
        return {
          label: "Agendado",
          className:
            "bg-purple-500 hover:bg-purple-600 text-white cursor-pointer transition-colors",
        };
    }
  };

  const statusConfig = getStatusConfig(appointment.status);

  const getAvailableOptions = () => {
    const allOptions = [
      { value: "agendado", label: "Agendado", color: "bg-purple-500" },
      { value: "confirmado", label: "Confirmado", color: "bg-blue-500" },
      { value: "cancelado", label: "Cancelado", color: "bg-red-500" },
      { value: "nao_compareceu", label: "Não Compareceu", color: "bg-black" },
      { value: "finalizado", label: "Finalizado", color: "bg-green-500" },
    ];

    return allOptions.filter((option) => option.value !== appointment.status);
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Badge
          className={statusConfig.className}
          onClick={(e) => e.stopPropagation()}
        >
          {isPending ? "..." : statusConfig.label}
        </Badge>
      </DropdownMenuTrigger>
      <DropdownMenuContent onClick={(e) => e.stopPropagation()}>
        {getAvailableOptions().map((option) => (
          <DropdownMenuItem
            key={option.value}
            onClick={() => handleStatusChange(option.value)}
          >
            <div className="flex items-center gap-2">
              <div className={`h-3 w-3 rounded-full ${option.color}`}></div>
              {option.label}
            </div>
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

// 🔥 COMPONENTE SEPARADO PARA MENU DE AÇÕES
function AppointmentActionsMenu({ appointment }: { appointment: Appointment }) {
  const { execute: executeDelete, isPending: isDeleting } = useAction(
    deleteAppointment,
    {
      onSuccess: () => {
        toast.success("Agendamento excluído com sucesso!");
      },
      onError: ({ error }) => {
        toast.error(error.serverError ?? "Erro ao excluir agendamento");
      },
    },
  );

  const handleDelete = () => {
    if (confirm("Tem certeza que deseja excluir este agendamento?")) {
      executeDelete({ id: appointment.id });
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          className="h-8 w-8 p-0"
          onClick={(e) => e.stopPropagation()}
        >
          <span className="sr-only">Abrir menu</span>
          <MoreHorizontal className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" onClick={(e) => e.stopPropagation()}>
        <DropdownMenuItem
          onClick={handleDelete}
          disabled={isDeleting}
          className="text-red-600 focus:text-red-600"
        >
          <Trash2 className="mr-2 h-4 w-4" />
          {isDeleting ? "Excluindo..." : "Excluir"}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

export const columns: ColumnDef<Appointment>[] = [
  {
    accessorKey: "doctor.name",
    header: "Dentista",
    cell: ({ row }) => (
      <div className="font-medium">{row.original.doctor.name}</div>
    ),
  },
  {
    accessorKey: "patient.name",
    header: "Paciente",
    cell: ({ row }) => (
      <div className="font-medium">{row.original.patient.name}</div>
    ),
  },
  {
    accessorKey: "service.name",
    header: "Serviço",
    cell: ({ row }) => (
      <div>{row.original.service?.name || "Não especificado"}</div>
    ),
  },
  {
    accessorKey: "appointmentPriceInCents",
    header: "Valor",
    cell: ({ row }) => {
      const value = row.original.appointmentPriceInCents;
      const formatted = new Intl.NumberFormat("pt-BR", {
        style: "currency",
        currency: "BRL",
      }).format(value / 100);
      return <div className="font-medium">{formatted}</div>;
    },
  },
  {
    accessorKey: "date",
    header: () => <div className="text-center">Data Agendamento</div>,
    cell: ({ row }) => {
      // 🔥 CONVERSÃO GARANTIDA UTC → BRASIL
      const appointmentDateBR = dayjs
        .utc(row.original.date)
        .tz("America/Sao_Paulo");
      const todayBR = dayjs().tz("America/Sao_Paulo");
      const tomorrowBR = todayBR.add(1, "day");

      const isToday =
        appointmentDateBR.format("YYYY-MM-DD") === todayBR.format("YYYY-MM-DD");
      const isTomorrow =
        appointmentDateBR.format("YYYY-MM-DD") ===
        tomorrowBR.format("YYYY-MM-DD");

      // 🔥 USAR DAYJS PARA FORMATAR (NÃO DATE-FNS)
      const formattedDate = appointmentDateBR.format("DD/MM/YYYY [às] HH:mm");

      if (isToday) {
        return (
          <div className="text-center">
            <div className="text-sm">{formattedDate}</div>
            <div className="mt-1 text-xs font-medium text-yellow-600 dark:text-yellow-400">
              Hoje
            </div>
          </div>
        );
      }

      if (isTomorrow) {
        return (
          <div className="text-center">
            <div className="text-sm">{formattedDate}</div>
            <div className="mt-1 text-xs font-medium text-blue-600 dark:text-blue-400">
              Amanhã
            </div>
          </div>
        );
      }

      return (
        <div className="text-center">
          <div className="text-sm">{formattedDate}</div>
        </div>
      );
    },
    meta: {
      className: "pl-1",
    },
  },
  {
    accessorKey: "status",
    header: "Status",
    cell: ({ row }) => <StatusAgendamentoBadge appointment={row.original} />,
    meta: {
      className: "pr-1",
    },
  },
  {
    id: "actions",
    cell: ({ row }) => <AppointmentActionsMenu appointment={row.original} />,
  },
];
