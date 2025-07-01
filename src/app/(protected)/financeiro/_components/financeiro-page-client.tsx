"use client";

import {
  PageContainer,
  PageContent,
  PageDescription,
  PageHeader,
  PageHeaderContent,
  PageTitle,
} from "@/components/ui/page-container";
import { patientsTable } from "@/db/schema"; // 🔥 IMPORT DO SCHEMA

import { FinanceiroContent } from "./financeiro-content";

interface FinanceiroPageClientProps {
  initialData: {
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

export function FinanceiroPageClient({
  initialData,
}: FinanceiroPageClientProps) {
  return (
    <PageContainer>
      <PageHeader>
        <PageHeaderContent>
          <PageTitle>Financeiro</PageTitle>
          <PageDescription>
            Gerencie os pagamentos e finanças da sua clínica
          </PageDescription>
        </PageHeaderContent>
      </PageHeader>
      <PageContent>
        <FinanceiroContent
          initialPatients={initialData.patients}
          dashboardData={initialData}
        />
      </PageContent>
    </PageContainer>
  );
}
