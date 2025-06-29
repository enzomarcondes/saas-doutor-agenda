"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useAction } from "next-safe-action/hooks";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { NumericFormat } from "react-number-format";
import { toast } from "sonner";

import {
  type UpsertServiceSchema,
  upsertServiceSchema,
} from "@/actions/schema";
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

interface UpsertServiceFormProps {
  defaultValues?: UpsertServiceSchema;
  children: React.ReactNode;
  onClose?: () => void;
}

export function UpsertServiceForm({
  defaultValues,
  children,
  onClose,
}: UpsertServiceFormProps) {
  const [open, setOpen] = useState(!!defaultValues?.id);

  const form = useForm<UpsertServiceSchema>({
    resolver: zodResolver(upsertServiceSchema),
    defaultValues: defaultValues ?? {
      name: "",
      priceInCents: 0,
    },
  });

  const { execute: executeUpsertService, isPending } = useAction(
    upsertService,
    {
      onSuccess: () => {
        toast.success(
          defaultValues
            ? "Serviço atualizado com sucesso!"
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
    executeUpsertService(data);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            {defaultValues ? "Editar" : "Criar"} Serviço
          </DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nome do Serviço</FormLabel>
                  <FormControl>
                    <Input placeholder="Ex: Limpeza de dentes" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

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
                        // 🔥 SELECIONA TODO O TEXTO QUANDO CLICA
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

            <Button type="submit" disabled={isPending} className="w-full">
              {isPending ? "Salvando..." : "Salvar"}
            </Button>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
