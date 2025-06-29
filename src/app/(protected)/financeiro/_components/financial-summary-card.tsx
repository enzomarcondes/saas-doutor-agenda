"use client";

import { CheckCircle, Clock, DollarSign, User } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface FinancialSummaryCardProps {
  summary: {
    patient:
      | {
          id: string;
          name: string;
          email: string;
          createdAt: Date;
          updatedAt: Date | null;
          clinicId: string;
          phoneNumber: string;
          sex: "male" | "female";
        }
      | null
      | undefined;
    totalAppointments: number;
    totalPayments: number;
    pending: number;
    isFullyPaid: boolean;
  };
  isLoading: boolean;
}

export function FinancialSummaryCard({
  summary,
  isLoading,
}: FinancialSummaryCardProps) {
  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            Carregando...
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="py-4 text-center">
            <div className="border-primary mx-auto h-8 w-8 animate-spin rounded-full border-b-2"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!summary.patient) {
    return null;
  }

  const formatCurrency = (cents: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(cents / 100);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <User className="h-5 w-5" />
          {summary.patient.name}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
          {/* Total de Agendamentos */}
          <div className="flex items-center gap-3 rounded-lg bg-blue-50 p-4 dark:bg-blue-950">
            <DollarSign className="h-8 w-8 text-blue-600 dark:text-blue-400" />
            <div>
              <p className="text-muted-foreground text-sm">
                Total Agendamentos
              </p>
              <p className="text-xl font-bold text-blue-600 dark:text-blue-400">
                {formatCurrency(summary.totalAppointments)}
              </p>
            </div>
          </div>

          {/* Total Pago */}
          <div className="flex items-center gap-3 rounded-lg bg-green-50 p-4 dark:bg-green-950">
            <CheckCircle className="h-8 w-8 text-green-600 dark:text-green-400" />
            <div>
              <p className="text-muted-foreground text-sm">Total Pago</p>
              <p className="text-xl font-bold text-green-600 dark:text-green-400">
                {formatCurrency(summary.totalPayments)}
              </p>
            </div>
          </div>

          {/* Valor Pendente */}
          <div className="flex items-center gap-3 rounded-lg bg-orange-50 p-4 dark:bg-orange-950">
            <Clock className="h-8 w-8 text-orange-600 dark:text-orange-400" />
            <div>
              <p className="text-muted-foreground text-sm">Pendente</p>
              <p className="text-xl font-bold text-orange-600 dark:text-orange-400">
                {formatCurrency(Math.max(0, summary.pending))}
              </p>
            </div>
          </div>

          {/* Status */}
          <div className="flex items-center justify-center p-4">
            {summary.isFullyPaid ? (
              <Badge className="bg-green-100 px-4 py-2 text-lg text-green-800 dark:bg-green-900 dark:text-green-200">
                ✅ Tudo Recebido!
              </Badge>
            ) : (
              <Badge className="bg-orange-100 px-4 py-2 text-lg text-orange-800 dark:bg-orange-900 dark:text-orange-200">
                ⏳ Pendente: {formatCurrency(summary.pending)}
              </Badge>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
