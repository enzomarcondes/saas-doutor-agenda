"use client";

import { ColumnDef } from "@tanstack/react-table";
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

export interface Appointment {
  id: string;
  date: Date;
  appointmentPriceInCents: number;
  status: string;
  dueDate?: Date | null;
  serviceId?: string | null;
  observations?: string | null;
  quantity: number;
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
    displayName?: string; // 🔥 NOME PARA EXIBIÇÃO
    priceInCents: number;
    parentServiceId?: string | null;
  } | null;
}

// 🔥 FUNÇÃO SIMPLES PARA VERIFICAR DATA - SEM DAYJS
function getDateInfo(appointmentDate: Date) {
  const today = new Date();
  const tomorrow = new Date();
  tomorrow.setDate(today.getDate() + 1);

  // 🔥 COMPARAR APENAS DIA/MÊS/ANO (IGNORAR HORÁRIO)
  const appointmentDay = new Date(
    appointmentDate.getFullYear(),
    appointmentDate.getMonth(),
    appointmentDate.getDate(),
  );
  const todayDay = new Date(
    today.getFullYear(),
    today.getMonth(),
    today.getDate(),
  );
  const tomorrowDay = new Date(
    tomorrow.getFullYear(),
    tomorrow.getMonth(),
    tomorrow.getDate(),
  );

  const isToday = appointmentDay.getTime() === todayDay.getTime();
  const isTomorrow = appointmentDay.getTime() === tomorrowDay.getTime();

  // 🔥 FORMATAR DATA E HORA
  const formattedDate = appointmentDate.toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });

  const formattedTime = appointmentDate.toLocaleTimeString("pt-BR", {
    hour: "2-digit",
    minute: "2-digit",
  });

  const fullFormatted = `${formattedDate} às ${formattedTime}`;

  return { isToday, isTomorrow, fullFormatted };
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
    cell: ({ row }) => {
      const service = row.original.service;
      if (!service) {
        return <div className="text-muted-foreground">Não especificado</div>;
      }

      // 🔥 USAR displayName SE DISPONÍVEL, SENÃO O NAME NORMAL
      const displayName = service.displayName || service.name;
      const isSubService = !!service.parentServiceId;

      return (
        <div className="flex items-center gap-2">
          {isSubService && (
            <span className="text-muted-foreground text-xs">└</span>
          )}
          <span className={isSubService ? "text-sm" : "font-medium"}>
            {displayName}
          </span>
        </div>
      );
    },
  },
  // 🔥 NOVA COLUNA: QUANTIDADE
  {
    accessorKey: "quantity",
    header: () => <div className="text-center">Qtd</div>,
    cell: ({ row }) => (
      <div className="text-center">
        <span className="bg-muted inline-flex h-6 w-8 items-center justify-center rounded text-sm font-medium">
          {row.original.quantity}
        </span>
      </div>
    ),
    meta: {
      className: "w-16",
    },
  },
  {
    accessorKey: "appointmentPriceInCents",
    header: "Valor Total",
    cell: ({ row }) => {
      // 🔥 CALCULAR VALOR TOTAL = QUANTIDADE × PREÇO
      const unitPrice = row.original.appointmentPriceInCents;
      const quantity = row.original.quantity;
      const totalValue = unitPrice * quantity;

      const formatted = new Intl.NumberFormat("pt-BR", {
        style: "currency",
        currency: "BRL",
      }).format(totalValue / 100);

      return (
        <div className="font-medium">
          {formatted}
          {quantity > 1 && (
            <div className="text-muted-foreground text-xs">
              {quantity}x{" "}
              {new Intl.NumberFormat("pt-BR", {
                style: "currency",
                currency: "BRL",
              }).format(unitPrice / 100)}
            </div>
          )}
        </div>
      );
    },
  },
  {
    accessorKey: "date",
    header: () => <div className="text-center">Data Agendamento</div>,
    cell: ({ row }) => {
      // 🔥 USAR FUNÇÃO SIMPLES - SEM DAYJS
      const { isToday, isTomorrow, fullFormatted } = getDateInfo(
        row.original.date,
      );

      if (isToday) {
        return (
          <div className="text-center">
            <div className="text-sm">{fullFormatted}</div>
            <div className="mt-1 text-xs font-medium text-yellow-600 dark:text-yellow-400">
              Hoje
            </div>
          </div>
        );
      }

      if (isTomorrow) {
        return (
          <div className="text-center">
            <div className="text-sm">{fullFormatted}</div>
            <div className="mt-1 text-xs font-medium text-blue-600 dark:text-blue-400">
              Amanhã
            </div>
          </div>
        );
      }

      return (
        <div className="text-center">
          <div className="text-sm">{fullFormatted}</div>
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
    accessorKey: "observations",
    header: "Observações",
    cell: ({ row }) => {
      const observations = row.original.observations;
      if (!observations) {
        return <div className="text-muted-foreground text-sm">-</div>;
      }

      // Truncar texto se for muito longo
      const truncated =
        observations.length > 50
          ? observations.substring(0, 50) + "..."
          : observations;

      return (
        <div className="max-w-[200px] text-sm" title={observations}>
          {truncated}
        </div>
      );
    },
  },
  {
    id: "actions",
    cell: ({ row }) => <AppointmentActionsMenu appointment={row.original} />,
  },
];
