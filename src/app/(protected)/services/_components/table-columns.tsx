"use client";

import { ColumnDef } from "@tanstack/react-table";
import { ChevronRight, Layers } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { formatCurrencyInCents } from "@/helpers/currency";

import { TableActions } from "./table-actions";

// 🔥 TIPO ATUALIZADO COM HIERARQUIA
export type Service = {
  id: string;
  name: string;
  priceInCents: number;
  parentServiceId: string | null;
  parentService?: {
    id: string;
    name: string;
  } | null;
  subServices?: {
    id: string;
    name: string;
  }[];
};

export const servicesTableColumns: ColumnDef<Service>[] = [
  {
    accessorKey: "name",
    header: "Nome",
    cell: ({ row }) => {
      const service = row.original;
      const isSubService = !!service.parentServiceId;

      return (
        <div className="flex items-center gap-2">
          {/* 🔥 INDICADOR VISUAL PARA SUB-SERVIÇOS */}
          {isSubService ? (
            <div className="text-muted-foreground flex items-center gap-1">
              <ChevronRight className="h-4 w-4" />
              <span className="font-medium">{service.name}</span>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <Layers className="text-primary h-4 w-4" />
              <span className="font-medium">{service.name}</span>
              {service.subServices && service.subServices.length > 0 && (
                <Badge variant="secondary" className="ml-2">
                  {service.subServices.length} sub-serviço(s)
                </Badge>
              )}
            </div>
          )}
        </div>
      );
    },
  },
  {
    accessorKey: "type",
    header: "Tipo",
    cell: ({ row }) => {
      const service = row.original;
      const isSubService = !!service.parentServiceId;

      return isSubService ? (
        <Badge variant="outline">
          Sub-serviço de: {service.parentService?.name}
        </Badge>
      ) : (
        <Badge variant="default">Serviço Principal</Badge>
      );
    },
  },
  {
    accessorKey: "priceInCents",
    header: "Preço",
    cell: ({ row }) => {
      const service = row.original;
      const isSubService = !!service.parentServiceId;

      return (
        <span className={isSubService ? "text-muted-foreground" : ""}>
          {isSubService
            ? "Sem cobrança"
            : formatCurrencyInCents(service.priceInCents)}
        </span>
      );
    },
  },
  {
    id: "actions",
    cell: ({ row }) => <TableActions service={row.original} />,
  },
];
