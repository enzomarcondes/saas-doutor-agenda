"use client";

import { AlertTriangle, Bell, Clock, DollarSign, Phone } from "lucide-react";
import { useMemo } from "react";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatCurrencyInCents } from "@/helpers/currency";

interface SmartNotificationsProps {
  todayAppointments: Array<{
    id: string;
    date: Date;
    appointmentPriceInCents: number;
    status: string;
    statusPagamento: string;
    dueDate?: Date | null;
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

export default function SmartNotifications({
  todayAppointments,
}: SmartNotificationsProps) {
  const notifications = useMemo(() => {
    const now = new Date();
    const todayStart = new Date(now);
    todayStart.setHours(0, 0, 0, 0);
    const todayEnd = new Date(now);
    todayEnd.setHours(23, 59, 59, 999);

    // 🔥 FILTRAR APENAS AGENDAMENTOS DE HOJE
    const todayOnly = todayAppointments.filter((apt) => {
      const aptDate = new Date(apt.date);
      return aptDate >= todayStart && aptDate <= todayEnd;
    });

    // 🔔 Pagamentos vencendo HOJE (de qualquer agendamento da semana)
    const overduePayments = todayAppointments.filter((apt) => {
      if (!apt.dueDate || apt.statusPagamento === "pago") return false;
      const dueDate = new Date(apt.dueDate);
      dueDate.setHours(0, 0, 0, 0);
      return dueDate <= todayStart;
    });

    // 📞 Próximas consultas (próximas 3 horas - APENAS DE HOJE)
    const nextThreeHours = new Date(now.getTime() + 3 * 60 * 60 * 1000);
    const upcomingAppointments = todayOnly
      .filter((apt) => {
        const aptDate = new Date(apt.date);
        return (
          aptDate > now &&
          aptDate <= nextThreeHours &&
          !["cancelado", "finalizado", "nao_compareceu"].includes(apt.status)
        );
      })
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

    // 💰 A receber HOJE - 🔥 USAR DATA DE VENCIMENTO
    const toReceiveToday = todayAppointments
      .filter((apt) => {
        if (!apt.dueDate) return false;

        const dueDate = new Date(apt.dueDate);
        dueDate.setHours(0, 0, 0, 0);

        return (
          dueDate.getTime() === todayStart.getTime() &&
          apt.statusPagamento === "a_receber"
        );
      })
      .reduce((total, apt) => total + apt.appointmentPriceInCents, 0);

    // ⏰ Atrasados (APENAS DE HOJE que passaram da hora e não foram finalizados)
    const lateAppointments = todayOnly.filter((apt) => {
      const aptDate = new Date(apt.date);
      return (
        aptDate < now &&
        !["finalizado", "cancelado", "nao_compareceu"].includes(apt.status)
      );
    });

    return {
      overduePayments,
      upcomingAppointments,
      toReceiveToday,
      lateAppointments,
      todayCount: todayOnly.length,
    };
  }, [todayAppointments]);

  const getNextAppointmentText = () => {
    if (notifications.upcomingAppointments.length === 0)
      return "Nenhuma consulta próxima";

    const next = notifications.upcomingAppointments[0];
    const appointmentTime = new Date(next.date);
    const minutesUntil = Math.ceil(
      (appointmentTime.getTime() - new Date().getTime()) / (1000 * 60),
    );

    if (minutesUntil <= 60) {
      return `Em ${minutesUntil}min: ${next.patient.name}`;
    }

    const hoursUntil = Math.ceil(minutesUntil / 60);
    return `Em ${hoursUntil}h: ${next.patient.name}`;
  };

  return (
    <Card className="dark:bg-card bg-gray-50">
      <CardHeader>
        <div className="flex items-center gap-3">
          <Bell className="text-muted-foreground h-5 w-5" />
          <CardTitle className="text-base">Notificações</CardTitle>
        </div>
      </CardHeader>

      <CardContent className="space-y-3">
        {/* 🔔 Avisos de Vencimento */}
        <div className="flex items-center justify-between rounded-lg border border-amber-200 bg-amber-50 p-3 transition-colors hover:bg-amber-100 dark:border-amber-800 dark:bg-amber-950 dark:hover:bg-amber-900">
          <div className="flex items-center gap-3">
            <AlertTriangle className="h-4 w-4 text-amber-600 dark:text-amber-400" />
            <div>
              <p className="text-sm font-medium text-amber-900 dark:text-amber-100">
                Vencimentos
              </p>
              <p className="text-xs text-amber-700 dark:text-amber-300">
                {notifications.overduePayments.length} pagamento(s) vencendo
                hoje
              </p>
            </div>
          </div>
          <Badge
            variant="outline"
            className="border-amber-300 text-amber-800 dark:border-amber-700 dark:text-amber-200"
          >
            {notifications.overduePayments.length}
          </Badge>
        </div>

        {/* 📞 Próximas Consultas */}
        <div className="flex items-center justify-between rounded-lg border border-blue-200 bg-blue-50 p-3 transition-colors hover:bg-blue-100 dark:border-blue-800 dark:bg-blue-950 dark:hover:bg-blue-900">
          <div className="flex items-center gap-3">
            <Phone className="h-4 w-4 text-blue-600 dark:text-blue-400" />
            <div>
              <p className="text-sm font-medium text-blue-900 dark:text-blue-100">
                Próximas
              </p>
              <p className="text-xs text-blue-700 dark:text-blue-300">
                {getNextAppointmentText()}
              </p>
            </div>
          </div>
          <Badge
            variant="outline"
            className="border-blue-300 text-blue-800 dark:border-blue-700 dark:text-blue-200"
          >
            {notifications.upcomingAppointments.length}
          </Badge>
        </div>

        {/* 💰 A Receber Hoje */}
        <div className="flex items-center justify-between rounded-lg border border-green-200 bg-green-50 p-3 transition-colors hover:bg-green-100 dark:border-green-800 dark:bg-green-950 dark:hover:bg-green-900">
          <div className="flex items-center gap-3">
            <DollarSign className="h-4 w-4 text-green-600 dark:text-green-400" />
            <div>
              <p className="text-sm font-medium text-green-900 dark:text-green-100">
                A Receber
              </p>
              <p className="text-xs text-green-700 dark:text-green-300">
                {formatCurrencyInCents(notifications.toReceiveToday)} com
                vencimento hoje
              </p>
            </div>
          </div>
          <Badge
            variant="outline"
            className="border-green-300 text-green-800 dark:border-green-700 dark:text-green-200"
          >
            {formatCurrencyInCents(notifications.toReceiveToday)}
          </Badge>
        </div>

        {/* ⏰ Atrasados */}
        <div className="flex items-center justify-between rounded-lg border border-red-200 bg-red-50 p-3 transition-colors hover:bg-red-100 dark:border-red-800 dark:bg-red-950 dark:hover:bg-red-900">
          <div className="flex items-center gap-3">
            <Clock className="h-4 w-4 text-red-600 dark:text-red-400" />
            <div>
              <p className="text-sm font-medium text-red-900 dark:text-red-100">
                Atrasados
              </p>
              <p className="text-xs text-red-700 dark:text-red-300">
                {notifications.lateAppointments.length} consulta(s) em atraso
                hoje
              </p>
            </div>
          </div>
          <Badge
            variant="outline"
            className="border-red-300 text-red-800 dark:border-red-700 dark:text-red-200"
          >
            {notifications.lateAppointments.length}
          </Badge>
        </div>

        {/* FOOTER */}
        <div className="bg-muted/50 mt-6 rounded-lg p-3">
          <p className="text-muted-foreground text-center text-xs">
            {notifications.todayCount} agendamentos hoje •
            {notifications.upcomingAppointments.length} próximos •
            {notifications.lateAppointments.length} atrasados
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
