import { eq } from "drizzle-orm";
import { headers } from "next/headers";

import {
  PageActions,
  PageContainer,
  PageContent,
  PageDescription,
  PageHeader,
  PageHeaderContent,
  PageTitle,
} from "@/components/ui/page-container";
import { db } from "@/db";
import { servicesTable } from "@/db/schema";
import WithAuthentication from "@/hocs/with-authentication";
import { auth } from "@/lib/auth";

import { AddServiceButton } from "./_components/add-service-button";
import { ServicesTable } from "./_components/services-table";

const ServicesPage = async () => {
  // 🔥 COPIANDO EXATAMENTE DO SEU CÓDIGO DE APPOINTMENTS:
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  const services = await db.query.servicesTable.findMany({
    where: eq(servicesTable.clinicId, session!.user.clinic!.id),
    orderBy: (services, { desc }) => [desc(services.createdAt)],
  });

  return (
    <WithAuthentication mustHaveClinic mustHavePlan>
      <PageContainer>
        <PageHeader>
          <PageHeaderContent>
            <PageTitle>Serviços</PageTitle>
            <PageDescription>
              Gerencie os serviços oferecidos pela sua clínica
            </PageDescription>
          </PageHeaderContent>
          <PageActions>
            <AddServiceButton />
          </PageActions>
        </PageHeader>
        <PageContent>
          <ServicesTable services={services} />
        </PageContent>
      </PageContainer>
    </WithAuthentication>
  );
};

export default ServicesPage;
