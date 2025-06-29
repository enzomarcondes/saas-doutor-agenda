"use client";

import { Search, X } from "lucide-react";
import { useEffect, useState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface Doctor {
  id: string;
  name: string;
}

interface AppointmentsFiltersProps {
  doctors: Doctor[];
  onFiltersChange: (filters: {
    search: string;
    doctorId: string;
    status: string;
    // 🔥 REMOVIDO: statusPagamento: string;
  }) => void;
}

export function AppointmentsFilters({
  doctors,
  onFiltersChange,
}: AppointmentsFiltersProps) {
  const [search, setSearch] = useState("");
  const [doctorId, setDoctorId] = useState("");
  const [status, setStatus] = useState("");
  // 🔥 REMOVIDO: const [statusPagamento, setStatusPagamento] = useState("");

  // 🔥 APLICAR FILTROS COM DEBOUNCE DE 300MS
  useEffect(() => {
    const timer = setTimeout(() => {
      onFiltersChange({
        search,
        doctorId,
        status,
        // 🔥 REMOVIDO: statusPagamento,
      });
    }, 300);

    return () => clearTimeout(timer);
  }, [search, doctorId, status, onFiltersChange]); // 🔥 REMOVIDO statusPagamento da dependência

  // 🔥 LIMPAR TODOS OS FILTROS
  const clearFilters = () => {
    setSearch("");
    setDoctorId("");
    setStatus("");
    // 🔥 REMOVIDO: setStatusPagamento("");
  };

  // 🔥 VERIFICAR SE TEM FILTROS ATIVOS
  const hasActiveFilters = search || doctorId || status; // 🔥 REMOVIDO || statusPagamento

  return (
    <div className="flex flex-col gap-4">
      {/* CAMPO DE BUSCA */}
      <div className="relative max-w-md">
        <Search className="text-muted-foreground absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2" />
        <Input
          placeholder="Buscar por paciente, dentista, serviço..."
          className="pl-9"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {/* FILTROS EM LINHA */}
      <div className="flex flex-wrap items-center gap-2">
        {/* STATUS DA CONSULTA */}
        <Select value={status} onValueChange={setStatus}>
          <SelectTrigger className="w-40">
            <SelectValue placeholder="Status Consulta" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos Status</SelectItem>
            <SelectItem value="agendado">Agendado</SelectItem>
            <SelectItem value="confirmado">Confirmado</SelectItem>
            <SelectItem value="cancelado">Cancelado</SelectItem>
            <SelectItem value="nao_compareceu">Não Compareceu</SelectItem>
            <SelectItem value="finalizado">Finalizado</SelectItem>
          </SelectContent>
        </Select>

        {/* 🔥 REMOVIDO COMPLETAMENTE O SELECT DE STATUS PAGAMENTO */}

        {/* DENTISTA */}
        <Select value={doctorId} onValueChange={setDoctorId}>
          <SelectTrigger className="w-40">
            <SelectValue placeholder="Dentista" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos Dentistas</SelectItem>
            {doctors.map((doctor) => (
              <SelectItem key={doctor.id} value={doctor.id}>
                {doctor.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* BOTÃO LIMPAR FILTROS */}
        {hasActiveFilters && (
          <Button variant="outline" size="sm" onClick={clearFilters}>
            <X className="mr-2 h-4 w-4" />
            Limpar Filtros
          </Button>
        )}
      </div>
    </div>
  );
}
