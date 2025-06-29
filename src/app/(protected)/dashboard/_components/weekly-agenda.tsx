"use client";

import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { ChevronLeft, ChevronRight, Clock, User } from "lucide-react";
import { useAction } from "next-safe-action/hooks";
import { useState } from "react";
import { toast } from "sonner";

import { updateAppointment } from "@/actions/update-appointment";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";

interface WeeklyAgendaProps {
  todayAppointments: Array<{
    id: string;
    date: Date;
    appointmentPriceInCents: number;
    status: string;
    statusPagamento: string;
    patient: {
      id: string;
      name: string;
      email?: string | null;
      phoneNumber?: string | null;
    };
    doctor: {
      id: string;
      name: string;
    };
    service?: {
      id: string;
      name: string;
      priceInCents: number;
    } | null;
  }>;
}

// 🔥 COMPONENTE INTERATIVO PARA STATUS AGENDAMENTO
function InteractiveStatusBadge({
  appointment,
}: {
  appointment: WeeklyAgendaProps["todayAppointments"][0];
}) {
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
            "bg-gray-500 hover:bg-gray-600 text-white cursor-pointer transition-colors",
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
      {
        value: "nao_compareceu",
        label: "Não Compareceu",
        color: "bg-gray-500",
      },
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

export default function WeeklyAgenda({ todayAppointments }: WeeklyAgendaProps) {
  const [currentWeek, setCurrentWeek] = useState(new Date());

  // 🗓️ GERAR SEMANA ATUAL
  const getWeekDays = (date: Date) => {
    const week = [];
    const startOfWeek = new Date(date);
    startOfWeek.setDate(date.getDate() - date.getDay()); // Domingo = 0

    for (let i = 0; i < 7; i++) {
      const day = new Date(startOfWeek);
      day.setDate(startOfWeek.getDate() + i);
      week.push(day);
    }
    return week;
  };

  const weekDays = getWeekDays(currentWeek);
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // 📅 ORGANIZAR AGENDAMENTOS POR DATA E ORDENAR POR HORÁRIO
  const organizedAppointments = todayAppointments.reduce(
    (acc, appointment) => {
      const appointmentDate = new Date(appointment.date);
      const dateKey = format(appointmentDate, "yyyy-MM-dd");

      if (!acc[dateKey]) acc[dateKey] = [];
      acc[dateKey].push(appointment);

      return acc;
    },
    {} as Record<string, typeof todayAppointments>,
  );

  // 🔄 ORDENAR AGENDAMENTOS DE CADA DIA POR HORÁRIO
  Object.keys(organizedAppointments).forEach((dateKey) => {
    organizedAppointments[dateKey].sort((a, b) => {
      return new Date(a.date).getTime() - new Date(b.date).getTime();
    });
  });

  // 🧭 NAVEGAÇÃO DA SEMANA
  const goToPreviousWeek = () => {
    const prevWeek = new Date(currentWeek);
    prevWeek.setDate(currentWeek.getDate() - 7);
    setCurrentWeek(prevWeek);
  };

  const goToNextWeek = () => {
    const nextWeek = new Date(currentWeek);
    nextWeek.setDate(currentWeek.getDate() + 7);
    setCurrentWeek(nextWeek);
  };

  const goToToday = () => {
    setCurrentWeek(new Date());
  };

  return (
    <Card className="dark:bg-card bg-gray-50">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Clock className="text-muted-foreground h-5 w-5" />
            <CardTitle className="text-base">Agenda da Semana</CardTitle>
          </div>

          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={goToToday}>
              Hoje
            </Button>
            <Button variant="outline" size="sm" onClick={goToPreviousWeek}>
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <span className="px-2 text-sm font-medium">
              {format(weekDays[0], "dd/MM", { locale: ptBR })} -{" "}
              {format(weekDays[6], "dd/MM", { locale: ptBR })}
            </span>
            <Button variant="outline" size="sm" onClick={goToNextWeek}>
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardHeader>

      <CardContent className="p-0">
        <div className="overflow-x-auto">
          {/* 🔥 HEADER DOS DIAS */}
          <div className="grid grid-cols-7 border-b">
            {weekDays.map((day, index) => {
              const isToday =
                format(day, "yyyy-MM-dd") === format(today, "yyyy-MM-dd");
              const dayName = ["DOM", "SEG", "TER", "QUA", "QUI", "SEX", "SAB"][
                index
              ];

              return (
                <div
                  key={day.toISOString()}
                  className={cn(
                    "border-l p-4 text-center first:border-l-0",
                    isToday && "border-blue-200 bg-blue-50",
                  )}
                >
                  <div className="text-muted-foreground text-xs font-medium">
                    {dayName}
                  </div>
                  <div
                    className={cn(
                      "mt-1 text-lg font-bold",
                      isToday && "text-blue-600",
                    )}
                  >
                    {format(day, "dd")}
                  </div>
                  <div className="text-muted-foreground text-xs">
                    {format(day, "MMM", { locale: ptBR })}
                  </div>
                </div>
              );
            })}
          </div>

          {/* 🔥 GRID DOS AGENDAMENTOS */}
          <div className="grid min-h-[400px] grid-cols-7">
            {weekDays.map((day) => {
              const dateKey = format(day, "yyyy-MM-dd");
              const dayAppointments = organizedAppointments[dateKey] || [];
              const isToday =
                format(day, "yyyy-MM-dd") === format(today, "yyyy-MM-dd");

              return (
                <div
                  key={day.toISOString()}
                  className={cn(
                    "space-y-2 border-l p-3 first:border-l-0",
                    isToday && "bg-blue-50/30",
                  )}
                >
                  {dayAppointments.map((appointment) => {
                    const appointmentTime = format(
                      new Date(appointment.date),
                      "HH:mm",
                    );

                    return (
                      <div
                        key={appointment.id}
                        className="bg-card cursor-pointer rounded-lg border p-3 shadow-sm transition-all hover:shadow-md"
                      >
                        {/* 🕐 HORÁRIO NO TOPO */}
                        <div className="mb-2 flex items-center gap-2">
                          <Clock className="h-3 w-3 text-blue-600" />
                          <span className="text-sm font-bold text-blue-600">
                            {appointmentTime}
                          </span>
                        </div>

                        {/* 👤 PACIENTE */}
                        <div className="mb-2 flex items-center gap-2">
                          <User className="text-muted-foreground h-3 w-3" />
                          <span className="truncate text-sm font-medium">
                            {appointment.patient.name}
                          </span>
                        </div>

                        {/* 🦷 DOUTOR */}
                        <div className="text-muted-foreground mb-2 truncate text-xs">
                          🦷 {appointment.doctor.name}
                        </div>

                        {/* 🔧 SERVIÇO */}
                        {appointment.service && (
                          <div className="text-muted-foreground mb-3 truncate text-xs">
                            🔧 {appointment.service.name}
                          </div>
                        )}

                        {/* 🔥 BADGE INTERATIVO DE STATUS */}
                        <div className="flex justify-center">
                          <InteractiveStatusBadge appointment={appointment} />
                        </div>
                      </div>
                    );
                  })}

                  {/* PLACEHOLDER QUANDO NÃO HÁ AGENDAMENTOS */}
                  {dayAppointments.length === 0 && (
                    <div className="text-muted-foreground py-8 text-center text-xs">
                      Nenhum agendamento
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* FOOTER COM RESUMO */}
        <div className="bg-muted/20 border-t p-3">
          <div className="text-muted-foreground flex items-center justify-between text-xs">
            <span>{todayAppointments.length} agendamentos na semana</span>
            <span>Hoje: {format(today, "dd/MM/yyyy", { locale: ptBR })}</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
