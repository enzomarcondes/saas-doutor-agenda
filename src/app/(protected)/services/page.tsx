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
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  // 🔥 BUSCAR SERVIÇOS COM HIERARQUIA
  const services = await db.query.servicesTable.findMany({
    where: eq(servicesTable.clinicId, session!.user.clinic!.id),
    with: {
      subServices: {
        orderBy: (subServices, { asc }) => [asc(subServices.name)],
      },
      parentService: true,
    },
    orderBy: (services, { desc, asc }) => [
      asc(services.parentServiceId), // NULL primeiro (serviços principais)
      desc(services.createdAt),
    ],
  });

  // 🔥 LISTA DE SERVIÇOS PRINCIPAIS PARA O BOTÃO ADD
  const mainServices = services
    .filter((service) => !service.parentServiceId)
    .map((service) => ({
      id: service.id,
      name: service.name,
    }));

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
            <AddServiceButton mainServices={mainServices} />
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
