import dayjs from "dayjs";
import { headers } from "next/headers";
import { redirect } from "next/navigation";

import {
  PageActions,
  PageContainer,
  PageContent,
  PageDescription,
  PageHeader,
  PageHeaderContent,
  PageTitle,
} from "@/components/ui/page-container";
import { getDashboard } from "@/data/get-dashboard";
import WithAuthentication from "@/hocs/with-authentication";
import { auth } from "@/lib/auth";

import { MonthPicker } from "./_components/month-picker";
import StatsCards from "./_components/stats-cards";
import WeeklyAgenda from "./_components/weekly-agenda";

interface DashboardPageProps {
  searchParams: Promise<{
    from: string;
    to: string;
  }>;
}

const DashboardPage = async ({ searchParams }: DashboardPageProps) => {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  // Verificação de segurança para clínica
  if (!session?.user?.clinic?.id) {
    redirect("/clinic-form");
  }

  const { from, to } = await searchParams;
  if (!from || !to) {
    // Redirecionar para o mês atual por padrão
    redirect(
      `/dashboard?from=${dayjs().startOf("month").format("YYYY-MM-DD")}&to=${dayjs().endOf("month").format("YYYY-MM-DD")}`,
    );
  }

  const {
    totalRevenue,
    totalAppointments,
    totalPatients,
    totalDoctors,
    todayAppointments,
  } = await getDashboard({
    from,
    to,
    session: {
      user: {
        clinic: {
          id: session.user.clinic.id,
        },
      },
    },
  });

  return (
    <WithAuthentication mustHaveClinic mustHavePlan>
      <PageContainer>
        <PageHeader>
          <PageHeaderContent>
            <PageTitle>Dashboard</PageTitle>
            <PageDescription>
              Tenha uma visão geral da sua clínica.
            </PageDescription>
          </PageHeaderContent>
          <PageActions>
            <MonthPicker />
          </PageActions>
        </PageHeader>
        <PageContent className="space-y-6">
          {/* 📊 STATS CARDS */}
          <StatsCards
            totalRevenue={
              totalRevenue.total ? Number(totalRevenue.total) : null
            }
            totalAppointments={totalAppointments.total}
            totalPatients={totalPatients.total}
            totalDoctors={totalDoctors.total}
          />
          {/* 📅 AGENDA SEMANAL INTERATIVA */}
          <div className="w-full">
            <WeeklyAgenda todayAppointments={todayAppointments} />
          </div>
        </PageContent>
      </PageContainer>
    </WithAuthentication>
  );
};

export default DashboardPage;
