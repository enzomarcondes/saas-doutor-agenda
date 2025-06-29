"use client";

import dayjs from "dayjs";
import { useRouter, useSearchParams } from "next/navigation";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

// Função para capitalizar a primeira letra
const capitalizeFirst = (str: string) => {
  return str.charAt(0).toUpperCase() + str.slice(1);
};

export function MonthPicker() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const currentFrom = searchParams.get("from");

  // Gerar lista: 6 meses passados + mês atual + 6 meses futuros = 13 meses
  const months = Array.from({ length: 13 }, (_, i) => {
    const date = dayjs().subtract(6 - i, "month");
    return {
      value: date.format("YYYY-MM"),
      label: capitalizeFirst(date.format("MMMM YYYY")), // Capitaliza a primeira letra
      from: date.startOf("month").format("YYYY-MM-DD"),
      to: date.endOf("month").format("YYYY-MM-DD"),
    };
  });

  // Inverter a ordem - meses mais novos primeiro
  const sortedMonths = months.reverse();

  // Determinar o mês atual selecionado
  const getCurrentMonth = () => {
    if (currentFrom) {
      return dayjs(currentFrom).format("YYYY-MM");
    }
    return dayjs().format("YYYY-MM");
  };

  const handleMonthChange = (monthValue: string) => {
    const selectedMonth = sortedMonths.find((m) => m.value === monthValue);
    if (selectedMonth) {
      router.push(
        `/dashboard?from=${selectedMonth.from}&to=${selectedMonth.to}`,
      );
    }
  };

  return (
    <div>
      <style jsx global>{`
        [data-radix-select-item][data-state="checked"] {
          background-color: #3b82f6 !important;
          color: white !important;
        }
        [data-radix-select-item][data-highlighted][data-state="checked"] {
          background-color: #2563eb !important;
          color: white !important;
        }
        [data-radix-select-item][data-state="checked"]:hover {
          background-color: #2563eb !important;
          color: white !important;
        }
      `}</style>
      <Select value={getCurrentMonth()} onValueChange={handleMonthChange}>
        <SelectTrigger className="w-[200px]">
          <SelectValue placeholder="Selecione o mês" />
        </SelectTrigger>
        <SelectContent>
          {sortedMonths.map((month) => (
            <SelectItem
              key={month.value}
              value={month.value}
              className="data-[state=checked]:bg-blue-500 data-[state=checked]:text-white"
            >
              {month.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
