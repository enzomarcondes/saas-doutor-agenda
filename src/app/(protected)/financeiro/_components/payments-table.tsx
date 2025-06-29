"use client";

import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { CheckCircle, Clock, RefreshCw, Trash2 } from "lucide-react";
import { useAction } from "next-safe-action/hooks";
import { useState } from "react";
import { toast } from "sonner";

import { deletePayment } from "@/actions/delete-payment";
import { markPaymentAsPaid } from "@/actions/mark-payment-as-paid"; // ✅ IMPORT DA ACTION
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
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

interface Payment {
  id: string;
  amountInCents: number;
  paymentMethod: string;
  paymentDate: Date;
  notes: string | null;
  patient: {
    id: string;
    name: string;
  };
  // ✅ CAMPOS ADICIONADOS
  paymentStatus: "pago" | "pendente";
  dueDate: Date;
  paymentType: "avista" | "parcelado";
  installmentNumber?: number | null;
  totalInstallments?: number | null;
}

interface PaymentsTableProps {
  payments: Payment[];
  isLoading: boolean;
  onRefresh: () => void;
  selectedPatientName?: string;
}

const paymentMethodLabels = {
  dinheiro: "Dinheiro",
  cartao_debito: "Cartão Débito",
  cartao_credito: "Cartão Crédito",
  pix: "PIX",
  transferencia: "Transferência",
};

// ✅ COMPONENTE DE BADGE INTERATIVO
const PaymentStatusBadge = ({
  payment,
  onStatusChange,
  isMarkingAsPaid,
}: {
  payment: Payment;
  onStatusChange: (paymentId: string) => void;
  isMarkingAsPaid: boolean;
}) => {
  const formatCurrency = (cents: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(cents / 100);
  };

  // ✅ SE JÁ ESTÁ PAGO, BADGE VERDE NÃO-INTERATIVO
  if (payment.paymentStatus === "pago") {
    return (
      <Badge className="cursor-default border-green-500 bg-green-500 text-white">
        <CheckCircle className="mr-1 h-3 w-3" />
        Pago
      </Badge>
    );
  }

  // ✅ SE ESTÁ PENDENTE, BADGE INTERATIVO
  const isInstallment = payment.paymentType === "parcelado";

  const getStatusConfig = () => {
    if (isInstallment) {
      return {
        label: `⏳ Parcela ${payment.installmentNumber}/${payment.totalInstallments}`,
        className:
          "bg-blue-500 hover:bg-blue-600 text-white cursor-pointer transition-colors border-blue-500",
      };
    } else {
      return {
        label: "⏳ À Vista - Pendente",
        className:
          "bg-orange-500 hover:bg-orange-600 text-white cursor-pointer transition-colors border-orange-500",
      };
    }
  };

  const statusConfig = getStatusConfig();

  // ✅ SE ESTÁ PROCESSANDO, BADGE DESABILITADO
  if (isMarkingAsPaid) {
    return (
      <Badge className="cursor-not-allowed border-gray-500 bg-gray-500 text-white opacity-50">
        <Clock className="mr-1 h-3 w-3" />
        Processando...
      </Badge>
    );
  }

  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Badge
          className={statusConfig.className}
          onClick={(e) => e.stopPropagation()}
        >
          {statusConfig.label}
        </Badge>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Confirmar Pagamento</AlertDialogTitle>
          <AlertDialogDescription>
            Tem certeza que deseja marcar este pagamento como pago?
            <br />
            <br />
            <strong>Valor:</strong> {formatCurrency(payment.amountInCents)}
            <br />
            <strong>Tipo:</strong>{" "}
            {isInstallment
              ? `Parcela ${payment.installmentNumber}/${payment.totalInstallments}`
              : "À Vista"}
            <br />
            <strong>Vencimento:</strong>{" "}
            {format(payment.dueDate, "dd/MM/yyyy", { locale: ptBR })}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancelar</AlertDialogCancel>
          <AlertDialogAction
            onClick={() => onStatusChange(payment.id)}
            className="bg-green-600 text-white hover:bg-green-700 dark:bg-green-600 dark:text-white dark:hover:bg-green-700"
          >
            ✅ Confirmar Pagamento
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};

export function PaymentsTable({
  payments,
  isLoading,
  onRefresh,
  selectedPatientName,
}: PaymentsTableProps) {
  // 🔥 ESTADO PARA CONTROLAR O DIALOG DE DELETE
  const [paymentToDelete, setPaymentToDelete] = useState<Payment | null>(null);

  // ✅ ACTION PARA MARCAR COMO PAGO
  const { execute: executeMarkAsPaid, isPending: isMarkingAsPaid } = useAction(
    markPaymentAsPaid,
    {
      onSuccess: (result) => {
        toast.success(result.data?.message || "Pagamento marcado como pago!");
        onRefresh(); // ✅ ATUALIZAR TABELA
      },
      onError: ({ error }) => {
        toast.error(error.serverError ?? "Erro ao marcar pagamento como pago");
      },
    },
  );

  const { execute: executeDeletePayment, isPending } = useAction(
    deletePayment,
    {
      onSuccess: () => {
        toast.success("Pagamento excluído com sucesso!");
        setPaymentToDelete(null);
        onRefresh();
      },
      onError: () => {
        toast.error("Erro ao excluir pagamento.");
        setPaymentToDelete(null);
      },
    },
  );

  // 🔥 FUNÇÃO PARA MARCAR COMO PAGO
  const handleMarkAsPaid = (paymentId: string) => {
    executeMarkAsPaid({ paymentId });
  };

  // 🔥 FUNÇÃO PARA DELETAR
  const handleDelete = () => {
    if (paymentToDelete) {
      executeDeletePayment({ id: paymentToDelete.id });
    }
  };

  const formatCurrency = (cents: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(cents / 100);
  };

  const getTitle = () => {
    if (selectedPatientName) {
      return `Histórico de Pagamentos - ${selectedPatientName}`;
    }
    return "Histórico de Pagamentos";
  };

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>{getTitle()}</CardTitle>
            <Button
              variant="outline"
              size="sm"
              onClick={onRefresh}
              disabled={isLoading}
            >
              <RefreshCw
                className={`mr-2 h-4 w-4 ${isLoading ? "animate-spin" : ""}`}
              />
              Atualizar
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="py-8 text-center">
              <div className="border-primary mx-auto h-8 w-8 animate-spin rounded-full border-b-2"></div>
              <p className="text-muted-foreground mt-2">
                Carregando pagamentos...
              </p>
            </div>
          ) : payments.length === 0 ? (
            <div className="py-8 text-center">
              <p className="text-muted-foreground">
                {selectedPatientName
                  ? `Nenhum pagamento encontrado para ${selectedPatientName}`
                  : "Nenhum pagamento encontrado"}
              </p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  {!selectedPatientName && <TableHead>Paciente</TableHead>}
                  <TableHead>Data Pagamento</TableHead>
                  <TableHead>Método</TableHead>
                  <TableHead>Valor</TableHead>
                  <TableHead>Vencimento</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Observações</TableHead>
                  <TableHead className="w-16">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {payments.map((payment) => (
                  <TableRow key={payment.id}>
                    {!selectedPatientName && (
                      <TableCell className="font-medium">
                        {payment.patient.name}
                      </TableCell>
                    )}
                    <TableCell>
                      {format(new Date(payment.paymentDate), "dd/MM/yyyy", {
                        locale: ptBR,
                      })}
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">
                        {
                          paymentMethodLabels[
                            payment.paymentMethod as keyof typeof paymentMethodLabels
                          ]
                        }
                      </Badge>
                    </TableCell>
                    <TableCell className="font-medium">
                      {formatCurrency(payment.amountInCents)}
                    </TableCell>
                    <TableCell>
                      {format(new Date(payment.dueDate), "dd/MM/yyyy", {
                        locale: ptBR,
                      })}
                    </TableCell>
                    {/* ✅ BADGE INTERATIVO PARA TODOS OS PAGAMENTOS PENDENTES */}
                    <TableCell>
                      <PaymentStatusBadge
                        payment={payment}
                        onStatusChange={handleMarkAsPaid}
                        isMarkingAsPaid={isMarkingAsPaid}
                      />
                    </TableCell>
                    <TableCell>{payment.notes || "-"}</TableCell>
                    <TableCell>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setPaymentToDelete(payment)}
                        className="text-red-600 hover:text-red-700"
                        disabled={isPending}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* 🔥 DIALOG DE CONFIRMAÇÃO DE DELETE */}
      <AlertDialog
        open={!!paymentToDelete}
        onOpenChange={(open) => !open && setPaymentToDelete(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar Exclusão</AlertDialogTitle>
            <AlertDialogDescription className="space-y-3">
              <div>Tem certeza que deseja deletar este pagamento?</div>

              {paymentToDelete && (
                <div className="bg-muted space-y-2 rounded-lg p-3">
                  <div className="font-medium">
                    <strong>Valor:</strong>{" "}
                    {formatCurrency(paymentToDelete.amountInCents)}
                  </div>
                  <div className="text-sm">
                    <strong>Data:</strong>{" "}
                    {format(
                      new Date(paymentToDelete.paymentDate),
                      "dd/MM/yyyy",
                      { locale: ptBR },
                    )}
                  </div>
                  <div className="text-sm">
                    <strong>Vencimento:</strong>{" "}
                    {format(new Date(paymentToDelete.dueDate), "dd/MM/yyyy", {
                      locale: ptBR,
                    })}
                  </div>
                  <div className="text-sm">
                    <strong>Status:</strong>{" "}
                    {paymentToDelete.paymentStatus === "pago"
                      ? "Pago"
                      : "Pendente"}
                  </div>
                  <div className="text-sm">
                    <strong>Método:</strong>{" "}
                    {
                      paymentMethodLabels[
                        paymentToDelete.paymentMethod as keyof typeof paymentMethodLabels
                      ]
                    }
                  </div>
                  {paymentToDelete.notes && (
                    <div className="text-sm">
                      <strong>Obs:</strong> {paymentToDelete.notes}
                    </div>
                  )}
                </div>
              )}

              <div className="font-medium text-red-600">
                ⚠️ Esta ação não pode ser desfeita.
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isPending}>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={isPending}
              className="bg-red-600 text-white hover:bg-red-700 dark:bg-red-600 dark:text-white dark:hover:bg-red-700"
            >
              {isPending ? "Deletando..." : "Deletar"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
