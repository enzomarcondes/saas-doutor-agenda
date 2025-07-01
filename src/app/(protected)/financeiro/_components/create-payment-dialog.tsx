"use client";

import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Calculator, CalendarIcon, CreditCard, Receipt } from "lucide-react";
import { useAction } from "next-safe-action/hooks";
import { useEffect, useState } from "react";
import { toast } from "sonner";

import { createPayment } from "@/actions/create-payment";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { patientsTable } from "@/db/schema"; // 🔥 IMPORT DO SCHEMA
import { cn } from "@/lib/utils";

interface CreatePaymentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: (paymentData: { patientId: string }) => void;
  initialPatients: Array<typeof patientsTable.$inferSelect>; // 🔥 CORRIGIDO: USA TIPO DO SCHEMA
  preSelectedPatientId?: string | null;
}

type PaymentMethod =
  | "dinheiro"
  | "cartao_debito"
  | "cartao_credito"
  | "pix"
  | "transferencia";

type PaymentType = "avista" | "parcelado";

const paymentMethods: Array<{ value: PaymentMethod; label: string }> = [
  { value: "dinheiro", label: "Dinheiro" },
  { value: "cartao_debito", label: "Cartão Débito" },
  { value: "cartao_credito", label: "Cartão Crédito" },
  { value: "pix", label: "PIX" },
  { value: "transferencia", label: "Transferência" },
];

const installmentOptions = [2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12];

export function CreatePaymentDialog({
  open,
  onOpenChange,
  onSuccess,
  initialPatients = [],
  preSelectedPatientId,
}: CreatePaymentDialogProps) {
  const [patientId, setPatientId] = useState<string>("");
  const [amount, setAmount] = useState<string>("");
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod | "">("");
  const [paymentDate, setPaymentDate] = useState<Date>(new Date());
  const [notes, setNotes] = useState<string>("");

  // 🔥 NOVOS ESTADOS PARA PARCELAMENTO E STATUS
  const [paymentType, setPaymentType] = useState<PaymentType>("avista");
  const [installments, setInstallments] = useState<number>(2);
  const [paymentStatus, setPaymentStatus] = useState<"pago" | "pendente">(
    "pendente",
  );

  useEffect(() => {
    if (open && preSelectedPatientId) {
      setPatientId(preSelectedPatientId);
    } else if (open && !preSelectedPatientId) {
      setPatientId("");
    }

    if (!open) {
      setPatientId("");
    }
  }, [open, preSelectedPatientId]);

  const { execute, isPending } = useAction(createPayment, {
    onSuccess: (result) => {
      toast.success(
        paymentType === "parcelado"
          ? `Parcelamento criado com sucesso! ${installments} parcelas registradas.`
          : "Pagamento criado com sucesso!",
      );

      // 🔥 GUARDAR patientId ANTES de resetar o form
      const currentPatientId = patientId;

      resetForm();

      // ✅ USAR SEMPRE O result.data.patientId OU O currentPatientId
      const targetPatientId = result.data?.patientId || currentPatientId;

      if (targetPatientId) {
        onSuccess({ patientId: targetPatientId });
      } else {
        console.error("❌ Nenhum patientId encontrado para callback!");
      }
    },
    onError: (error) => {
      console.log("❌ CREATE PAYMENT ERROR:", error);
      toast.error(error.error.serverError || "Erro ao criar pagamento");
    },
  });

  const resetForm = () => {
    setPatientId("");
    setAmount("");
    setPaymentMethod("");
    setPaymentDate(new Date());
    setNotes("");
    setPaymentType("avista");
    setInstallments(2);
    setPaymentStatus("pendente");
  };

  // 🔥 LABELS DINÂMICOS BASEADOS NO TIPO
  const getFieldLabels = () => {
    if (paymentType === "parcelado") {
      return {
        dateLabel: "Data da primeira parcela",
        valueLabel: "Valor total a ser parcelado",
        showInstallments: true,
      };
    }

    return {
      dateLabel: "Data",
      valueLabel: "Valor",
      showInstallments: false,
    };
  };

  const { dateLabel, valueLabel, showInstallments } = getFieldLabels();

  // 🔥 CALCULAR PREVIEW DAS PARCELAS
  const getInstallmentPreview = () => {
    if (paymentType !== "parcelado" || !amount || !paymentDate) return [];

    const totalValue = parseFloat(amount) || 0;
    const installmentValue = totalValue / installments;

    return Array.from({ length: installments }).map((_, index) => {
      const dueDate = new Date(
        paymentDate.getFullYear(),
        paymentDate.getMonth() + index,
        paymentDate.getDate(),
      );

      return {
        number: index + 1,
        value: installmentValue,
        dueDate,
      };
    });
  };

  const preview = getInstallmentPreview();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!patientId || !amount || !paymentMethod) {
      toast.error("Preencha todos os campos obrigatórios");
      return;
    }

    if (paymentType === "parcelado" && installments < 2) {
      toast.error("Número de parcelas deve ser no mínimo 2");
      return;
    }

    const amountInCents = Math.round(parseFloat(amount) * 100);

    // 🔥 CHAMAR ACTION COM NOVOS PARÂMETROS
    execute({
      patientId,
      amountInCents,
      paymentMethod: paymentMethod as PaymentMethod,
      paymentDate,
      notes: notes || undefined,
      // Novos campos
      paymentType,
      installments: paymentType === "parcelado" ? installments : undefined,
      paymentStatus,
    });
  };

  if (!initialPatients || initialPatients.length === 0) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Novo Pagamento</DialogTitle>
            <DialogDescription>Carregando pacientes...</DialogDescription>
          </DialogHeader>
          <div className="py-4 text-center">
            <div className="border-primary mx-auto h-8 w-8 animate-spin rounded-full border-b-2"></div>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {paymentType === "parcelado" ? (
              <CreditCard className="h-5 w-5 text-green-600" />
            ) : (
              <Receipt className="h-5 w-5 text-blue-600" />
            )}
            Novo Pagamento
            <Badge
              variant="outline"
              className={
                paymentType === "parcelado"
                  ? "bg-green-50 text-green-700"
                  : "bg-blue-50 text-blue-700"
              }
            >
              {paymentType === "parcelado" ? "Parcelado" : "À Vista"}
            </Badge>
          </DialogTitle>
          <DialogDescription>
            {paymentType === "parcelado"
              ? "Configure o parcelamento do pagamento para o paciente."
              : "Registre um pagamento à vista para um paciente."}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Paciente */}
          <div className="space-y-2">
            <Label htmlFor="patient">Paciente *</Label>
            <Select value={patientId} onValueChange={setPatientId}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione um paciente" />
              </SelectTrigger>
              <SelectContent>
                {initialPatients?.map((patient) => (
                  <SelectItem key={patient.id} value={patient.id}>
                    {patient.name}
                  </SelectItem>
                )) || []}
              </SelectContent>
            </Select>
          </div>

          {/* 🔥 TIPO DE PAGAMENTO */}
          <div className="space-y-2">
            <Label htmlFor="payment-type">Tipo de Pagamento *</Label>
            <Select
              value={paymentType}
              onValueChange={(value) => setPaymentType(value as PaymentType)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Selecione o tipo" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="avista">
                  <div className="flex items-center gap-2">
                    <Receipt className="h-4 w-4 text-blue-600" />À Vista
                  </div>
                </SelectItem>
                <SelectItem value="parcelado">
                  <div className="flex items-center gap-2">
                    <CreditCard className="h-4 w-4 text-green-600" />
                    Parcelado
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* ✅ STATUS DO PAGAMENTO (só para À Vista) */}
          {paymentType === "avista" && (
            <div className="space-y-2">
              <Label htmlFor="payment-status">Status do Pagamento *</Label>
              <Select
                value={paymentStatus}
                onValueChange={(value) =>
                  setPaymentStatus(value as "pago" | "pendente")
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="pago">
                    <div className="flex items-center gap-2">
                      <div className="h-2 w-2 rounded-full bg-green-500"></div>
                      Pago
                    </div>
                  </SelectItem>
                  <SelectItem value="pendente">
                    <div className="flex items-center gap-2">
                      <div className="h-2 w-2 rounded-full bg-orange-500"></div>
                      Pendente
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}

          {/* 🔥 VALOR COM LABEL DINÂMICO */}
          <div className="space-y-2">
            <Label htmlFor="amount">{valueLabel} (R$) *</Label>
            <Input
              id="amount"
              type="number"
              step="0.01"
              placeholder={
                paymentType === "parcelado"
                  ? "Ex: 300.00 (será dividido em parcelas)"
                  : "Ex: 100.00"
              }
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
            />
          </div>

          {/* 🔥 NÚMERO DE PARCELAS (só para parcelado) */}
          {showInstallments && (
            <div className="space-y-2">
              <Label htmlFor="installments">Número de Parcelas *</Label>
              <Select
                value={installments.toString()}
                onValueChange={(value) => setInstallments(parseInt(value))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione" />
                </SelectTrigger>
                <SelectContent>
                  {installmentOptions.map((num) => (
                    <SelectItem key={num} value={num.toString()}>
                      {num}x
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-muted-foreground text-sm">
                Valor será dividido igualmente entre as parcelas
              </p>
            </div>
          )}

          {/* Método de Pagamento */}
          <div className="space-y-2">
            <Label htmlFor="payment-method">Método de Pagamento *</Label>
            <Select
              value={paymentMethod}
              onValueChange={(value) =>
                setPaymentMethod(value as PaymentMethod)
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="Selecione o método" />
              </SelectTrigger>
              <SelectContent>
                {paymentMethods.map((method) => (
                  <SelectItem key={method.value} value={method.value}>
                    {method.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* 🔥 DATA COM LABEL DINÂMICO */}
          <div className="space-y-2">
            <Label>{dateLabel}</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "w-full justify-start text-left font-normal",
                    !paymentDate && "text-muted-foreground",
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {paymentDate ? (
                    format(paymentDate, "dd/MM/yyyy", { locale: ptBR })
                  ) : (
                    <span>Selecione a data</span>
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0">
                <Calendar
                  mode="single"
                  selected={paymentDate}
                  onSelect={(date) => date && setPaymentDate(date)}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
            {paymentType === "parcelado" && (
              <p className="text-muted-foreground text-sm">
                ⏰ As demais parcelas vencerão no mesmo dia dos meses seguintes
              </p>
            )}
          </div>

          {/* 🔥 PREVIEW DAS PARCELAS */}
          {paymentType === "parcelado" && preview.length > 0 && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-base">
                  <Calculator className="h-4 w-4" />
                  Preview das Parcelas
                </CardTitle>
                <CardDescription>
                  Confira como ficará o parcelamento
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="max-h-40 space-y-2 overflow-y-auto">
                  {preview.map((installment) => (
                    <div
                      key={installment.number}
                      className="bg-muted/50 flex items-center justify-between rounded-lg p-2"
                    >
                      <span className="text-sm font-medium">
                        Parcela {installment.number}/{installments}
                      </span>
                      <div className="text-right">
                        <div className="text-sm font-semibold text-green-600">
                          {new Intl.NumberFormat("pt-BR", {
                            style: "currency",
                            currency: "BRL",
                          }).format(installment.value)}
                        </div>
                        <div className="text-muted-foreground text-xs">
                          Vence{" "}
                          {format(installment.dueDate, "dd/MM/yyyy", {
                            locale: ptBR,
                          })}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="mt-3 border-t pt-3">
                  <div className="flex items-center justify-between text-sm">
                    <span className="font-medium">Total:</span>
                    <span className="text-lg font-semibold">
                      {new Intl.NumberFormat("pt-BR", {
                        style: "currency",
                        currency: "BRL",
                      }).format(parseFloat(amount || "0"))}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Observações */}
          <div className="space-y-2">
            <Label htmlFor="notes">Observações</Label>
            <Textarea
              id="notes"
              placeholder="Observações sobre o pagamento..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
            />
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isPending}
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={isPending}>
              {isPending
                ? "Salvando..."
                : paymentType === "parcelado"
                  ? `Criar ${installments} Parcelas`
                  : "Salvar Pagamento"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
