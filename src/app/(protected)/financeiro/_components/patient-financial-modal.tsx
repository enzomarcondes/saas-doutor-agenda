"use client";

import * as Dialog from "@radix-ui/react-dialog";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import {
  AlertTriangle,
  Calendar,
  CheckCircle,
  Clock,
  CreditCard,
  Plus,
  User,
  X,
} from "lucide-react";
import { useAction } from "next-safe-action/hooks";
import { useCallback, useEffect, useRef, useState } from "react";

import { getPatientFinancialDetails } from "@/actions/get-patient-financial-details";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

import { CreatePaymentDialog } from "./create-payment-dialog";
import { PaymentsTable } from "./payments-table";

interface PatientFinancialModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  patientId: string | null;
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
  onDataUpdate?: () => void;
}

interface PaymentData {
  id: string;
  paymentDate: Date;
  amountInCents: number;
  paymentMethod:
    | "dinheiro"
    | "cartao_debito"
    | "cartao_credito"
    | "pix"
    | "transferencia";
  notes: string | null;
  createdAt: Date;
  updatedAt: Date | null;
  clinicId: string;
  patientId: string;
  paymentType: "avista" | "parcelado";
  paymentStatus: "pago" | "pendente";
  dueDate: Date;
  installmentNumber?: number | null;
  totalInstallments?: number | null;
  installmentGroupId?: string | null;
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
}

interface AppointmentData {
  id: string;
  date: Date;
  appointmentPriceInCents: number;
  status:
    | "agendado"
    | "confirmado"
    | "cancelado"
    | "nao_compareceu"
    | "finalizado";
  dueDate?: Date | null;
  doctor: {
    id: string;
    name: string;
  };
  service: {
    id: string;
    name: string;
  } | null;
}

const statusLabels = {
  agendado: "Agendado",
  confirmado: "Confirmado",
  cancelado: "Cancelado",
  nao_compareceu: "Não Compareceu",
  finalizado: "Finalizado",
};

export function PatientFinancialModal({
  open,
  onOpenChange,
  patientId,
  patients,
  onDataUpdate,
}: PatientFinancialModalProps) {
  const { execute, result, isPending, reset } = useAction(
    getPatientFinancialDetails,
  );

  const [isCreatePaymentOpen, setIsCreatePaymentOpen] = useState(false);
  const [localData, setLocalData] = useState<{
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
    appointments: AppointmentData[];
    payments: PaymentData[];
    totalAppointments: number;
    totalPayments: number;
    balance: number;
    isFullyPaid: boolean;
  } | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const currentPatientRef = useRef<string | null>(null);

  const fetchPatientData = useCallback(
    async (targetPatientId: string) => {
      currentPatientRef.current = targetPatientId;

      setIsRefreshing(true);
      setLocalData(null);
      reset();

      await new Promise((resolve) => setTimeout(resolve, 150));

      currentPatientRef.current = targetPatientId;
      execute({ patientId: targetPatientId });
    },
    [execute, reset],
  );

  // 🔥 handlePaymentSuccess COM useCallback PARA EVITAR STALE CLOSURE
  const handlePaymentSuccess = useCallback(
    async (paymentData: { patientId: string }) => {
      setIsCreatePaymentOpen(false);

      const isCorrectPatient = paymentData.patientId === patientId;
      const isModalActive = open && patientId === currentPatientRef.current;

      if (isCorrectPatient && isModalActive) {
        if (patientId) {
          console.log("🔄 FAZENDO FETCH DOS DADOS...");
          setTimeout(async () => {
            await fetchPatientData(patientId);
          }, 500);
        }
      }

      if (onDataUpdate && isCorrectPatient) {
        setTimeout(() => {
          onDataUpdate();
        }, 300);
      }
    },
    [patientId, open, fetchPatientData, onDataUpdate],
  );

  const handlePaymentStatusChange = useCallback(async () => {
    if (patientId) {
      await fetchPatientData(patientId);
    }

    if (onDataUpdate) {
      onDataUpdate();
    }
  }, [patientId, fetchPatientData, onDataUpdate]);

  useEffect(() => {
    if (patientId && open) {
      currentPatientRef.current = patientId;
      fetchPatientData(patientId);
    }

    if (!open) {
      setLocalData(null);
      reset();
    }
  }, [patientId, open, fetchPatientData, reset]);

  useEffect(() => {
    if (result?.data && !isPending) {
      if (
        result.data.patient?.id === patientId &&
        result.data.patient?.id === currentPatientRef.current &&
        patientId === currentPatientRef.current
      ) {
        setLocalData(result.data);
        setIsRefreshing(false);
      } else {
        if (patientId && patientId === currentPatientRef.current) {
          setTimeout(() => {
            if (patientId === currentPatientRef.current) {
              fetchPatientData(patientId);
            }
          }, 300);
        } else {
          setIsRefreshing(false);
        }
      }
    }
  }, [result, isPending, patientId, fetchPatientData]);

  useEffect(() => {
    if (isRefreshing) {
      const timeoutId = setTimeout(() => {
        setIsRefreshing(false);
        setLocalData(null);
      }, 10000);

      return () => {
        clearTimeout(timeoutId);
      };
    }
  }, [isRefreshing]);

  useEffect(() => {
    if (!open) {
      setIsCreatePaymentOpen(false);
    }
  }, [open]);

  const patient = patients.find((p) => p.id === patientId);
  const data = localData;

  if (!patient) return null;

  const formatCurrency = (cents: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(cents / 100);
  };

  const formatPhone = (phone: string) => {
    return phone.replace(/(\d{2})(\d{5})(\d{4})/, "($1) $2-$3");
  };

  const getAppointmentAlert = (appointment: AppointmentData) => {
    if (!appointment.dueDate) return null;

    const now = new Date();
    const dueDate = new Date(appointment.dueDate);

    if (
      dueDate <= now ||
      dueDate.getTime() - now.getTime() <= 7 * 24 * 60 * 60 * 1000
    ) {
      return {
        show: true,
        text: `À vencer ${format(dueDate, "dd/MM/yyyy", { locale: ptBR })}`,
        className:
          "bg-yellow-50 border-yellow-300 text-yellow-700 dark:bg-yellow-950 dark:border-yellow-700 dark:text-yellow-300",
      };
    }

    return null;
  };

  return (
    <>
      <Dialog.Root open={open} onOpenChange={onOpenChange}>
        <Dialog.Portal>
          <Dialog.Overlay className="data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 fixed inset-0 bg-black/50" />
          <Dialog.Content className="bg-background data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 fixed top-[50%] left-[50%] z-50 flex h-[90vh] w-[95vw] max-w-[95vw] translate-x-[-50%] translate-y-[-50%] flex-col overflow-hidden rounded-lg border shadow-lg duration-200">
            <div className="flex items-center justify-between border-b p-6">
              <div>
                <Dialog.Title className="flex items-center gap-3 text-xl font-semibold">
                  <User className="h-6 w-6" />
                  Financeiro - {patient.name}
                </Dialog.Title>
                <Dialog.Description className="text-muted-foreground mt-2 text-base">
                  Informações financeiras completas do paciente
                </Dialog.Description>
              </div>
              <div className="flex items-center gap-3">
                <Button
                  onClick={() => setIsCreatePaymentOpen(true)}
                  className="flex items-center gap-2"
                  size="sm"
                >
                  <Plus className="h-4 w-4" />
                  Registrar Pagamento
                </Button>
                <Dialog.Close className="ring-offset-background focus:ring-ring rounded-sm p-2 opacity-70 transition-opacity hover:opacity-100 focus:ring-2 focus:ring-offset-2 focus:outline-none disabled:pointer-events-none">
                  <X className="h-5 w-5" />
                  <span className="sr-only">Close</span>
                </Dialog.Close>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-6">
              {isPending || isRefreshing ? (
                <div className="py-12 text-center">
                  <div className="border-primary mx-auto h-12 w-12 animate-spin rounded-full border-b-2"></div>
                  <p className="text-muted-foreground mt-4 text-base">
                    {isRefreshing
                      ? "Atualizando dados..."
                      : "Carregando dados financeiros..."}
                  </p>
                </div>
              ) : (
                <div className="space-y-6">
                  <Card className="p-4">
                    <CardHeader className="pb-4">
                      <CardTitle className="text-xl">
                        Informações do Paciente
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-2 gap-6 md:grid-cols-4">
                        <div className="space-y-1">
                          <p className="text-muted-foreground text-sm font-medium">
                            Nome
                          </p>
                          <p className="text-base font-semibold">
                            {patient.name}
                          </p>
                        </div>
                        <div className="space-y-1">
                          <p className="text-muted-foreground text-sm font-medium">
                            Telefone
                          </p>
                          <p className="text-base font-semibold">
                            {formatPhone(patient.phoneNumber)}
                          </p>
                        </div>
                        <div className="space-y-1">
                          <p className="text-muted-foreground text-sm font-medium">
                            Email
                          </p>
                          <p className="text-base font-semibold">
                            {patient.email}
                          </p>
                        </div>
                        <div className="space-y-1">
                          <p className="text-muted-foreground text-sm font-medium">
                            Sexo
                          </p>
                          <Badge
                            variant="outline"
                            className="px-3 py-1 text-sm"
                          >
                            {patient.sex === "male" ? "Masculino" : "Feminino"}
                          </Badge>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
                    <Card className="p-4">
                      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
                        <CardTitle className="text-base font-semibold">
                          Total Agendamentos
                        </CardTitle>
                        <Calendar className="text-muted-foreground h-5 w-5" />
                      </CardHeader>
                      <CardContent className="pt-1">
                        <div className="text-2xl font-bold">
                          {formatCurrency(data?.totalAppointments || 0)}
                        </div>
                      </CardContent>
                    </Card>

                    <Card className="p-4">
                      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
                        <CardTitle className="text-base font-semibold">
                          Total Pago
                        </CardTitle>
                        <CheckCircle className="h-5 w-5 text-green-600" />
                      </CardHeader>
                      <CardContent className="pt-1">
                        <div className="text-2xl font-bold text-green-600">
                          {formatCurrency(data?.totalPayments || 0)}
                        </div>
                      </CardContent>
                    </Card>

                    <Card className="p-4">
                      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
                        <CardTitle className="text-base font-semibold">
                          Saldo Devedor
                        </CardTitle>
                        <Clock className="h-5 w-5 text-orange-600" />
                      </CardHeader>
                      <CardContent className="pt-1">
                        <div className="text-2xl font-bold text-orange-600">
                          {formatCurrency(
                            Math.max(
                              0,
                              (data?.totalAppointments || 0) -
                                (data?.totalPayments || 0),
                            ),
                          )}
                        </div>
                      </CardContent>
                    </Card>

                    <Card className="p-4">
                      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
                        <CardTitle className="text-base font-semibold">
                          Status
                        </CardTitle>
                        <CreditCard className="text-muted-foreground h-5 w-5" />
                      </CardHeader>
                      <CardContent className="flex items-center pt-1">
                        {(data?.totalAppointments || 0) <=
                        (data?.totalPayments || 0) ? (
                          <Badge className="bg-green-100 px-3 py-1 text-base text-green-800 dark:bg-green-900 dark:text-green-200">
                            ✅ Em dia
                          </Badge>
                        ) : (
                          <Badge className="bg-orange-100 px-3 py-1 text-base text-orange-800 dark:bg-orange-900 dark:text-orange-200">
                            ⏳ Pendente
                          </Badge>
                        )}
                      </CardContent>
                    </Card>
                  </div>

                  <Card className="p-4">
                    <CardHeader className="pb-4">
                      <CardTitle className="text-xl">
                        Agendamentos do Paciente
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      {data?.appointments && data.appointments.length > 0 ? (
                        <div className="rounded-lg border">
                          <Table>
                            <TableHeader>
                              <TableRow className="bg-muted/50">
                                <TableHead className="h-12 px-4 text-sm font-semibold">
                                  Data
                                </TableHead>
                                <TableHead className="h-12 px-4 text-sm font-semibold">
                                  Serviço
                                </TableHead>
                                <TableHead className="h-12 px-4 text-sm font-semibold">
                                  Doutor
                                </TableHead>
                                <TableHead className="h-12 px-4 text-sm font-semibold">
                                  Valor
                                </TableHead>
                                <TableHead className="h-12 px-4 text-sm font-semibold">
                                  Status
                                </TableHead>
                                <TableHead className="h-12 px-4 text-sm font-semibold">
                                  Vencimento
                                </TableHead>
                              </TableRow>
                            </TableHeader>
                            <TableBody>
                              {data.appointments.map(
                                (appointment: AppointmentData) => {
                                  const alert =
                                    getAppointmentAlert(appointment);

                                  return (
                                    <TableRow
                                      key={appointment.id}
                                      className="hover:bg-muted/30 h-14"
                                    >
                                      <TableCell className="px-4 py-3 text-sm font-medium">
                                        {format(
                                          appointment.date,
                                          "dd/MM/yyyy",
                                          {
                                            locale: ptBR,
                                          },
                                        )}
                                      </TableCell>
                                      <TableCell className="px-4 py-3 text-sm">
                                        {appointment.service?.name || "-"}
                                      </TableCell>
                                      <TableCell className="px-4 py-3 text-sm">
                                        {appointment.doctor.name}
                                      </TableCell>
                                      <TableCell className="px-4 py-3 text-sm font-semibold">
                                        {formatCurrency(
                                          appointment.appointmentPriceInCents,
                                        )}
                                      </TableCell>
                                      <TableCell className="px-4 py-3">
                                        <Badge
                                          variant={
                                            appointment.status === "finalizado"
                                              ? "default"
                                              : "secondary"
                                          }
                                          className="px-2 py-1 text-xs"
                                        >
                                          {statusLabels[appointment.status]}
                                        </Badge>
                                      </TableCell>
                                      <TableCell className="px-4 py-3 text-sm">
                                        {alert ? (
                                          <div
                                            className={`flex items-center gap-2 rounded-lg border px-3 py-2 ${alert.className}`}
                                          >
                                            <AlertTriangle className="h-4 w-4" />
                                            <span className="text-xs font-medium">
                                              {alert.text}
                                            </span>
                                          </div>
                                        ) : appointment.dueDate ? (
                                          format(
                                            appointment.dueDate,
                                            "dd/MM/yyyy",
                                            { locale: ptBR },
                                          )
                                        ) : (
                                          "-"
                                        )}
                                      </TableCell>
                                    </TableRow>
                                  );
                                },
                              )}
                            </TableBody>
                          </Table>
                        </div>
                      ) : (
                        <div className="py-12 text-center">
                          <Calendar className="text-muted-foreground mx-auto h-12 w-12" />
                          <p className="text-muted-foreground mt-4 text-base">
                            Nenhum agendamento encontrado
                          </p>
                        </div>
                      )}
                    </CardContent>
                  </Card>

                  <Card className="p-4">
                    <CardHeader className="pb-4">
                      <CardTitle className="text-xl">
                        Histórico de Pagamentos
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      {data?.payments && data.payments.length > 0 ? (
                        <PaymentsTable
                          payments={data.payments}
                          isLoading={false}
                          onRefresh={handlePaymentStatusChange}
                          selectedPatientName={patient.name}
                        />
                      ) : (
                        <div className="py-12 text-center">
                          <CreditCard className="text-muted-foreground mx-auto h-12 w-12" />
                          <p className="text-muted-foreground mt-4 text-base">
                            Nenhum pagamento registrado
                          </p>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </div>
              )}
            </div>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>

      <CreatePaymentDialog
        key={patientId}
        open={isCreatePaymentOpen}
        onOpenChange={setIsCreatePaymentOpen}
        onSuccess={handlePaymentSuccess}
        initialPatients={patients}
        preSelectedPatientId={patientId}
      />
    </>
  );
}
