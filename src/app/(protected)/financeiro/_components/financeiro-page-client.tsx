"use client";

import {
  PageContainer,
  PageContent,
  PageDescription,
  PageHeader,
  PageHeaderContent,
  PageTitle,
} from "@/components/ui/page-container";

import { FinanceiroContent } from "./financeiro-content";

interface FinanceiroPageClientProps {
  initialData: {
    patients: Array<{
      id: string;
      name: string;
      email: string;
      phoneNumber: string;
      sex: "male" | "female";
      createdAt: Date;
      updatedAt: Date | null;
      clinicId: string;
    }>;
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
      patient: {
        id: string;
        name: string;
        email: string;
        phoneNumber: string;
        sex: "male" | "female";
        createdAt: Date;
        updatedAt: Date | null;
        clinicId: string;
      };
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
