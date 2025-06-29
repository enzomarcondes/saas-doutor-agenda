"use client";

import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { CreditCard, DollarSign, Receipt, User } from "lucide-react";
import { useMemo, useState } from "react";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

import { PatientFinancialModal } from "./patient-financial-modal";

interface Patient {
  id: string;
  name: string;
  email: string;
  phoneNumber: string;
  sex: "male" | "female";
  createdAt: Date;
  updatedAt: Date | null;
  clinicId: string;
}

interface PatientStatusData {
  patientId: string;
  hasYellowDueDate: boolean;
  yellowDueDate: Date | null;
  alertType: "parcela" | "pagamento_avista_pendente" | "agendamento" | null;
  isFinancialPending: boolean;
  totalAppointments: number;
  totalPayments: number;
  installmentNumber?: number;
  totalInstallments?: number;
  parcelaValue?: number;
  pagamentoValue?: number;
}

interface PatientsFinancialListProps {
  patients: Patient[];
  showAlert?: boolean;
  patientsStatusData?: Record<string, PatientStatusData>;
  isLoadingStatus?: boolean;
  onDataUpdate?: () => void; // ✅ ADICIONAR ESTA LINHA
}

export function PatientsFinancialList({
  patients,
  showAlert = false,
  patientsStatusData = {},
  isLoadingStatus = false,
  onDataUpdate, // ✅ RECEBER O CALLBACK
}: PatientsFinancialListProps) {
  const [selectedPatientId, setSelectedPatientId] = useState<string | null>(
    null,
  );
  const [isModalOpen, setIsModalOpen] = useState(false);

  const handlePatientClick = (patientId: string) => {
    setSelectedPatientId(patientId);
    setIsModalOpen(true);
  };

  const formatPhone = (phone: string) => {
    return phone.replace(/(\d{2})(\d{5})(\d{4})/, "($1) $2-$3");
  };

  const getDaysDifference = (dueDate: Date): number => {
    const today = new Date();
    const due = new Date(dueDate);

    today.setHours(0, 0, 0, 0);
    due.setHours(0, 0, 0, 0);

    const diffTime = due.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    return diffDays;
  };

  const sortedPatients = useMemo(() => {
    const getSortPriority = (patient: Patient): number => {
      const statusData = patientsStatusData[patient.id];

      if (!statusData?.hasYellowDueDate || !statusData?.yellowDueDate) {
        return 1000;
      }

      const daysDiff = getDaysDifference(statusData.yellowDueDate);

      if (daysDiff < 0) {
        return Math.abs(daysDiff);
      } else {
        return 100 + daysDiff;
      }
    };

    return [...patients].sort((a, b) => {
      const priorityA = getSortPriority(a);
      const priorityB = getSortPriority(b);

      if (priorityA !== priorityB) {
        return priorityA - priorityB;
      }

      return a.name.localeCompare(b.name);
    });
  }, [patients, patientsStatusData]);

  const getAlertInfo = (statusData: PatientStatusData) => {
    if (!statusData.yellowDueDate) return null;

    const daysDiff = getDaysDifference(statusData.yellowDueDate);

    if (daysDiff < 0) {
      return {
        text: "Atrasado",
        className:
          "bg-red-100 border-red-300 text-red-700 dark:bg-red-950 dark:border-red-700 dark:text-red-300 hover:bg-red-200 dark:hover:bg-red-900 cursor-pointer text-sm font-medium",
        icon:
          statusData.alertType === "parcela" ? (
            <CreditCard className="mr-1 h-3 w-3" />
          ) : (
            <Receipt className="mr-1 h-3 w-3" />
          ),
      };
    } else if (daysDiff === 0) {
      return {
        text: "Hoje",
        className:
          "bg-red-100 border-red-300 text-red-700 dark:bg-red-950 dark:border-red-700 dark:text-red-300 hover:bg-red-200 dark:hover:bg-red-900 cursor-pointer text-sm font-medium",
        icon:
          statusData.alertType === "parcela" ? (
            <CreditCard className="mr-1 h-3 w-3" />
          ) : (
            <Receipt className="mr-1 h-3 w-3" />
          ),
      };
    } else if (daysDiff <= 5) {
      const color = statusData.alertType === "parcela" ? "blue" : "orange";
      return {
        text: `Vence em ${daysDiff} dia${daysDiff > 1 ? "s" : ""}`,
        className: `bg-${color}-100 border-${color}-300 text-${color}-700 dark:bg-${color}-950 dark:border-${color}-700 dark:text-${color}-300 hover:bg-${color}-200 dark:hover:bg-${color}-900 cursor-pointer text-sm font-medium`,
        icon:
          statusData.alertType === "parcela" ? (
            <CreditCard className="mr-1 h-3 w-3" />
          ) : (
            <Receipt className="mr-1 h-3 w-3" />
          ),
      };
    } else {
      const formattedDate = format(
        new Date(statusData.yellowDueDate),
        "dd/MM",
        { locale: ptBR },
      );
      const color = statusData.alertType === "parcela" ? "blue" : "orange";
      return {
        text: `Vence ${formattedDate}`,
        className: `bg-${color}-100 border-${color}-300 text-${color}-700 dark:bg-${color}-950 dark:border-${color}-700 dark:text-${color}-300 hover:bg-${color}-200 dark:hover:bg-${color}-900 cursor-pointer text-sm font-medium`,
        icon:
          statusData.alertType === "parcela" ? (
            <CreditCard className="mr-1 h-3 w-3" />
          ) : (
            <Receipt className="mr-1 h-3 w-3" />
          ),
      };
    }
  };

  const getAlertData = (
    patient: Patient,
  ): {
    show: boolean;
    statusData?: PatientStatusData;
  } => {
    const statusData = patientsStatusData[patient.id];

    if (!statusData?.hasYellowDueDate || !statusData?.yellowDueDate) {
      return { show: false };
    }

    return { show: true, statusData };
  };

  const AlertCellContent = ({ patient }: { patient: Patient }) => {
    const { show: showPatientAlert, statusData } = getAlertData(patient);

    if (showPatientAlert && statusData) {
      const alertInfo = getAlertInfo(statusData);

      if (alertInfo) {
        return (
          <Badge
            variant="outline"
            className={`transition-colors ${alertInfo.className}`}
            onClick={(e) => {
              e.stopPropagation();
              handlePatientClick(patient.id);
            }}
          >
            {alertInfo.icon}
            {alertInfo.text}
          </Badge>
        );
      }
    }

    if (isLoadingStatus) {
      return (
        <Badge variant="outline" className="text-sm">
          <div className="mr-1 h-3 w-3 animate-spin rounded-full border-b border-current"></div>
          Carregando...
        </Badge>
      );
    }

    return (
      <Badge
        variant="outline"
        className="cursor-pointer border-green-300 bg-green-100 text-sm font-medium text-green-700 hover:bg-green-200 dark:border-green-700 dark:bg-green-950 dark:text-green-300 dark:hover:bg-green-900"
        onClick={(e) => {
          e.stopPropagation();
          handlePatientClick(patient.id);
        }}
      >
        Em dia
      </Badge>
    );
  };

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            Pacientes da Clínica ({patients.length})
            {showAlert && (
              <Badge variant="secondary" className="ml-2">
                Vencimentos pendentes
              </Badge>
            )}
            {isLoadingStatus && (
              <div className="border-primary ml-2 h-4 w-4 animate-spin rounded-full border-b-2"></div>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {patients.length === 0 ? (
            <div className="py-8 text-center">
              <p className="text-muted-foreground">
                {showAlert
                  ? "Nenhum paciente com vencimentos pendentes encontrado"
                  : "Nenhum paciente encontrado"}
              </p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[25%]">Nome</TableHead>
                  <TableHead className="w-[18%]">Telefone</TableHead>
                  <TableHead className="w-[25%]">Email</TableHead>
                  <TableHead className="w-[17%]">Status Financeiro</TableHead>
                  <TableHead className="w-[15%] text-center">Alertas</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {sortedPatients.map((patient) => {
                  return (
                    <TableRow
                      key={patient.id}
                      className="hover:bg-muted/50 cursor-pointer"
                      onClick={() => handlePatientClick(patient.id)}
                    >
                      <TableCell className="font-medium">
                        {patient.name}
                      </TableCell>

                      <TableCell className="font-medium">
                        {formatPhone(patient.phoneNumber)}
                      </TableCell>

                      <TableCell className="max-w-[200px] truncate text-sm font-medium">
                        {patient.email}
                      </TableCell>

                      <TableCell>
                        <Badge variant="secondary" className="text-xs">
                          <DollarSign className="mr-1 h-3 w-3" />
                          Ver financeiro
                        </Badge>
                      </TableCell>

                      <TableCell className="text-center">
                        <AlertCellContent patient={patient} />
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* ✅ MODAL COM CALLBACK PASSADO */}
      <PatientFinancialModal
        open={isModalOpen}
        onOpenChange={setIsModalOpen}
        patientId={selectedPatientId}
        patients={patients}
        onDataUpdate={onDataUpdate} // ✅ CALLBACK PASSADO
      />
    </>
  );
}
