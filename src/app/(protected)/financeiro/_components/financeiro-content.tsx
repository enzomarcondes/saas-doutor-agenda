"use client";

import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { AlertTriangle, Calendar, Filter, Plus, Search } from "lucide-react";
import { useAction } from "next-safe-action/hooks";
import { useCallback, useEffect, useMemo, useState } from "react";

import { getFinancialSummary } from "@/actions/get-financial-summary";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { patientsTable } from "@/db/schema"; // 🔥 IMPORT DO SCHEMA

import { CreatePaymentDialog } from "./create-payment-dialog";
import { PatientsFinancialList } from "./patients-financial-list";

interface FinanceiroContentProps {
  initialPatients: Array<typeof patientsTable.$inferSelect>; // 🔥 CORRIGIDO: USA TIPO DO SCHEMA
  dashboardData: {
    patients: Array<typeof patientsTable.$inferSelect>; // 🔥 CORRIGIDO: USA TIPO DO SCHEMA
    recentPayments: Array<{
      id: string;
      createdAt: Date;
      updatedAt: Date | null;
      clinicId: string;
      patientId: string;
      amountInCents: number;
      paymentMethod:
        | "dinheiro"
        | "cartao_debito"
        | "cartao_credito"
        | "pix"
        | "transferencia";
      paymentDate: Date;
      notes: string | null;
      patient: typeof patientsTable.$inferSelect; // 🔥 CORRIGIDO: USA TIPO DO SCHEMA
    }>;
    totalRevenue: number;
    totalPayments: number;
    totalPending: number;
  };
}

// 🔥 TIPO ATUALIZADO COM NOVOS CAMPOS
interface PatientStatusData {
  patientId: string;
  hasYellowDueDate: boolean;
  yellowDueDate: Date | null;
  alertType: "parcela" | "pagamento_avista_pendente" | "agendamento" | null;
  isFinancialPending: boolean;
  totalAppointments: number;
  totalPayments: number;
  // Campos específicos para parcelas
  installmentNumber?: number;
  totalInstallments?: number;
  parcelaValue?: number;
  // Campos específicos para pagamentos à vista
  pagamentoValue?: number;
}

// ✅ INTERFACE DO PERÍODO
interface PeriodOption {
  id: string;
  label: string;
  month?: number;
  year?: number;
  showAll: boolean;
}

export function FinanceiroContent({
  initialPatients,
  dashboardData,
}: FinanceiroContentProps) {
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [showOnlyPending, setShowOnlyPending] = useState(false);
  const [patientsStatusData, setPatientsStatusData] = useState<
    Record<string, PatientStatusData>
  >({});
  const [isLoadingStatus, setIsLoadingStatus] = useState(true);

  // ✅ ESTADO DO PERÍODO SELECIONADO
  const [selectedPeriod, setSelectedPeriod] = useState<string>("all");

  // ✅ AÇÃO PARA BUSCAR DADOS FINANCEIROS POR PERÍODO
  const {
    execute: executeFinancialSummary,
    result: financialResult,
    isPending: isFinancialLoading,
  } = useAction(getFinancialSummary);

  // ✅ GERAR OPÇÕES DE PERÍODO (ÚLTIMOS 12 MESES + TODOS)
  const periodOptions = useMemo((): PeriodOption[] => {
    const options: PeriodOption[] = [
      { id: "all", label: "Todos", showAll: true },
    ];

    const now = new Date();

    // Adicionar últimos 12 meses
    for (let i = 0; i < 12; i++) {
      const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const month = date.getMonth() + 1;
      const year = date.getFullYear();

      options.push({
        id: `${year}-${month.toString().padStart(2, "0")}`,
        label: format(date, "MMM yyyy", { locale: ptBR }),
        month,
        year,
        showAll: false,
      });
    }

    return options;
  }, []);

  // ✅ BUSCAR DADOS FINANCEIROS QUANDO PERÍODO MUDAR
  useEffect(() => {
    const selectedOption = periodOptions.find(
      (opt) => opt.id === selectedPeriod,
    );
    if (!selectedOption) return;

    executeFinancialSummary({
      month: selectedOption.month,
      year: selectedOption.year,
      showAll: selectedOption.showAll,
    });
  }, [selectedPeriod, periodOptions, executeFinancialSummary]);

  // ✅ DADOS FINANCEIROS (usa resultado da action ou fallback para dashboardData)
  const financialData = useMemo(() => {
    if (financialResult?.data) {
      return {
        totalRevenue: financialResult.data.totalAppointments,
        totalPayments: financialResult.data.totalPayments,
        totalPending: financialResult.data.pending,
      };
    }

    // Fallback para dados iniciais
    return {
      totalRevenue: dashboardData.totalRevenue,
      totalPayments: dashboardData.totalPayments,
      totalPending: dashboardData.totalPending,
    };
  }, [financialResult, dashboardData]);

  const fetchPatientsStatus = useCallback(async (patientIds: string[]) => {
    try {
      setIsLoadingStatus(true);

      const response = await fetch("/api/patients-status", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ patientIds }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();

      if (data && Array.isArray(data)) {
        const statusMap = data.reduce(
          (
            acc: Record<string, PatientStatusData>,
            patient: PatientStatusData,
          ) => {
            acc[patient.patientId] = patient;
            return acc;
          },
          {} as Record<string, PatientStatusData>,
        );

        setPatientsStatusData(statusMap);
      }
    } catch (error) {
      console.error("Erro ao buscar status de vencimento:", error);
    } finally {
      setIsLoadingStatus(false);
    }
  }, []);

  useEffect(() => {
    if (initialPatients.length > 0) {
      const patientIds = initialPatients.map((p) => p.id);
      fetchPatientsStatus(patientIds);
    }
  }, [initialPatients, fetchPatientsStatus]);

  const hasYellowDueDate = useCallback(
    (patient: (typeof initialPatients)[0]) => {
      const statusData = patientsStatusData[patient.id];
      return statusData?.hasYellowDueDate || false;
    },
    [patientsStatusData],
  );

  // ✅ FUNÇÃO PARA VERIFICAR SE VENCE HOJE
  const isDueToday = useCallback((yellowDueDate: Date | null): boolean => {
    if (!yellowDueDate) return false;

    const today = new Date();
    const dueDate = new Date(yellowDueDate);

    return (
      today.getFullYear() === dueDate.getFullYear() &&
      today.getMonth() === dueDate.getMonth() &&
      today.getDate() === dueDate.getDate()
    );
  }, []);

  // ✅ FILTRAR APENAS PACIENTES COM VENCIMENTO HOJE
  const patientsWithTodayAlert = useMemo(() => {
    return initialPatients.filter((patient) => {
      const statusData = patientsStatusData[patient.id];

      if (!statusData?.hasYellowDueDate || !statusData?.yellowDueDate) {
        return false;
      }

      // ✅ SÓ INCLUI SE VENCE HOJE
      return isDueToday(statusData.yellowDueDate);
    });
  }, [initialPatients, patientsStatusData, isDueToday]);

  const filteredPatients = useMemo(() => {
    return initialPatients.filter((patient) => {
      const matchesSearch = patient.name
        .toLowerCase()
        .includes(searchTerm.toLowerCase());

      const matchesPendingFilter =
        !showOnlyPending || hasYellowDueDate(patient);

      return matchesSearch && matchesPendingFilter;
    });
  }, [initialPatients, searchTerm, showOnlyPending, hasYellowDueDate]);

  // 🔥 FUNÇÃO PARA OBTER TEXTO DO ALERTA POR TIPO
  const getAlertText = useCallback((statusData: PatientStatusData) => {
    switch (statusData.alertType) {
      case "parcela":
        return `${statusData.installmentNumber}/${statusData.totalInstallments} parcelas pendentes`;
      case "pagamento_avista_pendente":
        return "Pagamento à vista pendente";
      case "agendamento":
        return "Agendamento pendente";
      default:
        return "Pendências financeiras";
    }
  }, []);

  if (!dashboardData) {
    return (
      <div className="py-8 text-center">
        <div className="border-primary mx-auto h-8 w-8 animate-spin rounded-full border-b-2"></div>
        <p className="text-muted-foreground mt-2">
          Carregando dados financeiros...
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* ✅ SELETOR DE PERÍODO NO CANTO SUPERIOR DIREITO */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Calendar className="text-muted-foreground h-5 w-5" />
          <h2 className="text-lg font-semibold">Resumo Financeiro</h2>
          {isFinancialLoading && (
            <div className="border-primary h-4 w-4 animate-spin rounded-full border-b-2"></div>
          )}
        </div>

        <div className="flex items-center gap-2">
          <span className="text-muted-foreground text-sm">Período:</span>
          <div className="flex gap-1">
            {periodOptions.slice(0, 6).map((option) => (
              <Button
                key={option.id}
                variant={selectedPeriod === option.id ? "default" : "outline"}
                size="sm"
                onClick={() => setSelectedPeriod(option.id)}
                disabled={isFinancialLoading}
                className={
                  selectedPeriod === option.id
                    ? "bg-blue-600 hover:bg-blue-700"
                    : ""
                }
              >
                {option.label}
              </Button>
            ))}
          </div>
        </div>
      </div>

      {/* ✅ ALERTA APENAS PARA VENCIMENTOS DE HOJE */}
      {!isLoadingStatus && patientsWithTodayAlert.length > 0 && (
        <div className="rounded-lg border border-red-500 bg-red-50 p-4 dark:bg-red-950">
          <div className="flex items-start gap-3">
            <AlertTriangle className="mt-0.5 h-5 w-5 text-red-600" />
            <div>
              <h4 className="font-semibold text-red-800 dark:text-red-200">
                🚨 Atenção - Vencimentos HOJE
              </h4>
              <p className="mt-1 text-sm text-red-700 dark:text-red-300">
                {patientsWithTodayAlert.length} paciente(s) com pagamentos
                vencendo HOJE.{" "}
                <button
                  onClick={() => {
                    setShowOnlyPending(true);
                    setSearchTerm("");
                  }}
                  className="font-medium underline hover:no-underline"
                >
                  Ver todos pendentes
                </button>
              </p>
              {/* 🔥 PREVIEW DOS TIPOS DE ALERTA PARA HOJE */}
              <div className="mt-2 flex flex-wrap gap-2">
                {patientsWithTodayAlert.slice(0, 3).map((patient) => {
                  const statusData = patientsStatusData[patient.id];
                  if (!statusData) return null;

                  return (
                    <Badge
                      key={patient.id}
                      variant="outline"
                      className="border-red-300 bg-red-100 text-xs text-red-700"
                    >
                      {patient.name}: {getAlertText(statusData)}
                    </Badge>
                  );
                })}
                {patientsWithTodayAlert.length > 3 && (
                  <Badge
                    variant="outline"
                    className="border-red-300 bg-red-100 text-xs text-red-700"
                  >
                    +{patientsWithTodayAlert.length - 3} mais
                  </Badge>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Loading para status de vencimento */}
      {isLoadingStatus && (
        <div className="bg-muted/50 rounded-lg border p-4">
          <div className="flex items-center gap-2">
            <div className="border-primary h-4 w-4 animate-spin rounded-full border-b-2"></div>
            <p className="text-muted-foreground text-sm">
              Verificando vencimentos de hoje...
            </p>
          </div>
        </div>
      )}

      {/* ✅ CARDS DE RESUMO GERAL COM DADOS DINÂMICOS */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Total a Receber
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {new Intl.NumberFormat("pt-BR", {
                style: "currency",
                currency: "BRL",
              }).format((financialData.totalRevenue || 0) / 100)}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Total Recebido
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {new Intl.NumberFormat("pt-BR", {
                style: "currency",
                currency: "BRL",
              }).format((financialData.totalPayments || 0) / 100)}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pendente</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">
              {new Intl.NumberFormat("pt-BR", {
                style: "currency",
                currency: "BRL",
              }).format(Math.max(0, financialData.totalPending || 0) / 100)}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Ações rápidas */}
      <Card>
        <CardHeader>
          <CardTitle>Ações Rápidas</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4">
            <Button onClick={() => setIsCreateDialogOpen(true)}>
              <Plus className="mr-2 h-4 w-4" />
              Registrar Pagamento
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Filtros da lista de pacientes */}
      <Card>
        <CardHeader>
          <CardTitle>Filtros</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col gap-4 md:flex-row md:items-center">
            {/* Campo de busca */}
            <div className="relative flex-1">
              <Search className="text-muted-foreground absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2" />
              <Input
                placeholder="Buscar paciente por nome..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9"
              />
            </div>

            {/* Filtro de pendentes */}
            <div className="flex items-center gap-2">
              <Button
                variant={showOnlyPending ? "default" : "outline"}
                size="sm"
                onClick={() => setShowOnlyPending(!showOnlyPending)}
                disabled={isLoadingStatus}
              >
                {showOnlyPending ? "Mostrando pendentes" : "Apenas pendentes"}
              </Button>
              {showOnlyPending && !isLoadingStatus && (
                <Badge variant="secondary">
                  <Filter className="mr-1 h-3 w-3" />
                  {filteredPatients.length} resultado(s)
                </Badge>
              )}
            </div>
          </div>

          {/* Limpar filtros */}
          {(searchTerm || showOnlyPending) && (
            <div className="mt-3 border-t pt-3">
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setSearchTerm("");
                  setShowOnlyPending(false);
                }}
              >
                Limpar filtros
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Lista de pacientes filtrada */}
      <PatientsFinancialList
        patients={filteredPatients}
        showAlert={showOnlyPending}
        patientsStatusData={patientsStatusData}
        isLoadingStatus={isLoadingStatus}
        onDataUpdate={() => {
          const selectedOption = periodOptions.find(
            (opt) => opt.id === selectedPeriod,
          );
          if (selectedOption) {
            executeFinancialSummary({
              month: selectedOption.month,
              year: selectedOption.year,
              showAll: selectedOption.showAll,
            });
          }

          const patientIds = initialPatients.map((p) => p.id);
          fetchPatientsStatus(patientIds);
        }}
      />

      <CreatePaymentDialog
        open={isCreateDialogOpen}
        onOpenChange={setIsCreateDialogOpen}
        onSuccess={() => {
          // ✅ ATUALIZAR DADOS APÓS CRIAR PAGAMENTO
          const patientIds = initialPatients.map((p) => p.id);
          fetchPatientsStatus(patientIds);

          // ✅ REFRESH DOS DADOS FINANCEIROS
          const selectedOption = periodOptions.find(
            (opt) => opt.id === selectedPeriod,
          );
          if (selectedOption) {
            executeFinancialSummary({
              month: selectedOption.month,
              year: selectedOption.year,
              showAll: selectedOption.showAll,
            });
          }
        }}
        initialPatients={initialPatients}
      />
    </div>
  );
}
