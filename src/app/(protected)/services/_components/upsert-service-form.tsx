"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useAction } from "next-safe-action/hooks";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { NumericFormat } from "react-number-format";
import { toast } from "sonner";

import { upsertService } from "@/actions/upsert-service";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { type UpsertServiceSchema, upsertServiceSchema } from "@/db/schema";

// 🔥 PROPS ATUALIZADAS
interface UpsertServiceFormProps {
  defaultValues?: UpsertServiceSchema;
  children: React.ReactNode;
  onClose?: () => void;
  // 🔥 NOVOS PROPS PARA SUB-SERVIÇOS
  parentService?: {
    id: string;
    name: string;
  } | null;
  mainServices?: {
    id: string;
    name: string;
  }[];
}

export function UpsertServiceForm({
  defaultValues,
  children,
  onClose,
  parentService,
  mainServices = [],
}: UpsertServiceFormProps) {
  const [open, setOpen] = useState(!!defaultValues?.id || !!parentService);

  // 🔥 DETERMINAR SE É SUB-SERVIÇO
  const isSubService = !!parentService || !!defaultValues?.parentServiceId;
  const isEditing = !!defaultValues?.id;

  const form = useForm<UpsertServiceSchema>({
    resolver: zodResolver(upsertServiceSchema),
    defaultValues: defaultValues ?? {
      name: "",
      priceInCents: isSubService ? 0 : 0, // Sub-serviços sempre 0
      parentServiceId: parentService?.id ?? null,
    },
  });

  // 🔥 ATUALIZAR FORM QUANDO PARENT SERVICE MUDA
  useEffect(() => {
    if (parentService) {
      form.setValue("parentServiceId", parentService.id);
      form.setValue("priceInCents", 0); // Sub-serviços sempre 0
    }
  }, [parentService, form]);

  const { execute: executeUpsertService, isPending } = useAction(
    upsertService,
    {
      onSuccess: () => {
        toast.success(
          isEditing
            ? "Serviço atualizado com sucesso!"
            : isSubService
              ? "Sub-serviço criado com sucesso!"
              : "Serviço criado com sucesso!",
        );
        form.reset();
        handleOpenChange(false);
      },
      onError: ({ error }) => {
        toast.error(error.serverError ?? "Erro inesperado");
      },
    },
  );

  const handleOpenChange = (newOpen: boolean) => {
    setOpen(newOpen);
    if (!newOpen && onClose) {
      onClose();
    }
  };

  const onSubmit = (data: UpsertServiceSchema) => {
    // 🔥 GARANTIR QUE SUB-SERVIÇOS TÊM PREÇO 0
    const finalData = {
      ...data,
      priceInCents: data.parentServiceId ? 0 : data.priceInCents,
    };
    executeUpsertService(finalData);
  };

  // 🔥 TÍTULO DINÂMICO
  const getTitle = () => {
    if (isEditing) {
      return isSubService ? "Editar Sub-serviço" : "Editar Serviço";
    }
    return isSubService
      ? `Criar Sub-serviço para ${parentService?.name}`
      : "Criar Serviço";
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{getTitle()}</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            {/* 🔥 SELETOR DE SERVIÇO PRINCIPAL (APENAS PARA CRIAÇÃO) */}
            {!isEditing && !parentService && (
              <FormField
                control={form.control}
                name="parentServiceId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Tipo de Serviço</FormLabel>
                    <FormControl>
                      <Select
                        value={field.value ?? "main"}
                        onValueChange={(value) => {
                          const newValue = value === "main" ? null : value;
                          field.onChange(newValue);
                          // Reset preço se mudou para sub-serviço
                          if (newValue) {
                            form.setValue("priceInCents", 0);
                          }
                        }}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione o tipo" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="main">
                            Serviço Principal
                          </SelectItem>
                          {mainServices.map((service) => (
                            <SelectItem key={service.id} value={service.id}>
                              Sub-serviço de: {service.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>
                    Nome do {isSubService ? "Sub-serviço" : "Serviço"}
                  </FormLabel>
                  <FormControl>
                    <Input
                      placeholder={
                        isSubService
                          ? "Ex: Moldeira Individual"
                          : "Ex: Prótese Total"
                      }
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* 🔥 CAMPO DE PREÇO (APENAS PARA SERVIÇOS PRINCIPAIS) */}
            {!form.watch("parentServiceId") && (
              <FormField
                control={form.control}
                name="priceInCents"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Preço</FormLabel>
                    <FormControl>
                      <NumericFormat
                        value={field.value / 100}
                        onValueChange={(value) => {
                          const centavos = Math.round(
                            (value.floatValue || 0) * 100,
                          );
                          field.onChange(centavos);
                        }}
                        decimalScale={2}
                        fixedDecimalScale
                        decimalSeparator=","
                        thousandSeparator="."
                        prefix="R$ "
                        allowNegative={false}
                        customInput={Input}
                        placeholder="R$ 0,00"
                        onFocus={(e) => {
                          setTimeout(() => {
                            e.target.select();
                          }, 0);
                        }}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

            {/* 🔥 INFORMAÇÃO PARA SUB-SERVIÇOS */}
            {form.watch("parentServiceId") && (
              <div className="rounded-md border border-blue-200 bg-blue-50 p-3">
                <p className="text-sm text-blue-800">
                  <strong>Sub-serviços não possuem valor próprio.</strong> O
                  valor será cobrado apenas do serviço principal.
                </p>
              </div>
            )}

            <Button type="submit" disabled={isPending} className="w-full">
              {isPending ? "Salvando..." : "Salvar"}
            </Button>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
