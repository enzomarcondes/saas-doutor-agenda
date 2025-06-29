"use client";

import { ColumnDef } from "@tanstack/react-table";

import { formatCurrencyInCents } from "@/helpers/currency";

import { TableActions } from "./table-actions";

export type Service = {
  id: string;
  name: string;
  priceInCents: number;
};

export const servicesTableColumns: ColumnDef<Service>[] = [
  {
    accessorKey: "name",
    header: "Nome",
    cell: ({ row }) => <span className="font-medium">{row.original.name}</span>,
  },
  {
    accessorKey: "priceInCents",
    header: "Preço",
    cell: ({ row }) => (
      <span>{formatCurrencyInCents(row.original.priceInCents)}</span>
    ),
  },
  {
    id: "actions",
    cell: ({ row }) => <TableActions service={row.original} />,
  },
];
