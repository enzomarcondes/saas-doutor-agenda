import { headers } from "next/headers";
import { redirect } from "next/navigation";

import { getDashboardFinanceiro } from "@/actions/get-dashboard-financeiro";
import { auth } from "@/lib/auth";

import { FinanceiroPageClient } from "./_components/financeiro-page-client";

export default async function FinanceiroPage() {
  // AUTH VERIFICAÇÃO
  const headersList = await headers();
  const session = await auth.api.getSession({
    headers: new Headers(headersList),
  });

  if (!session?.user?.clinic?.id) {
    redirect("/sign-in");
  }

  // ✅ CORREÇÃO: getDashboardFinanceiro não recebe parâmetros
  const dashboardResult = await getDashboardFinanceiro();

  // ✅ VERIFICAR SE A ACTION FOI EXECUTADA COM SUCESSO
  if (!dashboardResult.data) {
    throw new Error("Erro ao carregar dados financeiros");
  }

  const dashboardData = dashboardResult.data;

  return (
    <FinanceiroPageClient
      initialData={{
        patients: dashboardData.patients, // ✅ CORREÇÃO: usar 'patients' não 'allPatients'
        recentPayments: dashboardData.recentPayments,
        totalRevenue: dashboardData.totalRevenue,
        totalPayments: dashboardData.totalPayments,
        totalPending: dashboardData.totalPending,
      }}
    />
  );
}
