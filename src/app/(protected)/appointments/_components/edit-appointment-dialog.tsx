"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useQuery } from "@tanstack/react-query";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import dayjs from "dayjs";
import {
  CalendarIcon,
  Clock,
  CreditCard,
  Stethoscope,
  User,
} from "lucide-react";
import { useAction } from "next-safe-action/hooks";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { NumericFormat } from "react-number-format";
import { toast } from "sonner";
import { z } from "zod";

import { getAvailableTimes } from "@/actions/get-available-times";
import { updateAppointment } from "@/actions/update-appointment";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Card, CardContent } from "@/components/ui/card";
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
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";

import { Appointment } from "./table-columns";

const updateAppointmentFormSchema = z.object({
  id: z.string(),
  date: z.date().optional(),
  time: z.string().optional(),
  appointmentPriceInCents: z.number().optional(),
  status: z
    .enum([
      "agendado",
      "confirmado",
      "cancelado",
      "nao_compareceu",
      "finalizado",
    ])
    .optional(),
  dueDate: z.date().optional(),
  serviceId: z.string().nullable().optional(),
});

type UpdateAppointmentFormData = z.infer<typeof updateAppointmentFormSchema>;

interface EditAppointmentDialogProps {
  defaultValues: Appointment;
  children: React.ReactNode;
  onClose?: () => void;
  services?: Array<{
    id: string;
    name: string;
    priceInCents: number;
  }>;
  doctors?: Array<{
    id: string;
    name: string;
    availableFromWeekDay: number;
    availableToWeekDay: number;
    availableFromTime: string;
    availableToTime: string;
  }>;
}

export function EditAppointmentDialog({
  defaultValues,
  children,
  onClose,
  services = [],
  doctors = [],
}: EditAppointmentDialogProps) {
  const [open, setOpen] = useState(!!defaultValues?.id);
  const [dateCalendarOpen, setDateCalendarOpen] = useState(false);
  const [dueDateCalendarOpen, setDueDateCalendarOpen] = useState(false);

  const extractTime = (date: Date) => {
    return date.toTimeString().slice(0, 5);
  };

  const form = useForm<UpdateAppointmentFormData>({
    resolver: zodResolver(updateAppointmentFormSchema),
    defaultValues: {
      id: defaultValues.id,
      date: defaultValues.date,
      time: extractTime(defaultValues.date),
      appointmentPriceInCents: defaultValues.appointmentPriceInCents,
      status: defaultValues.status as
        | "agendado"
        | "confirmado"
        | "cancelado"
        | "nao_compareceu"
        | "finalizado",
      dueDate: defaultValues.dueDate || undefined,
      serviceId: defaultValues.serviceId || null,
    },
  });

  const watchedDate = form.watch("date");

  // 🔥 CORREÇÃO: Acessar availableTimes.data corretamente
  const { data: availableTimesResult } = useQuery({
    queryKey: ["available-times", watchedDate, defaultValues.doctor.id],
    queryFn: () =>
      getAvailableTimes({
        date: dayjs(watchedDate).format("YYYY-MM-DD"),
        doctorId: defaultValues.doctor.id,
      }),
    enabled: !!watchedDate,
  });

  // 🔥 EXTRAIR OS DADOS CORRETAMENTE
  const availableTimes = availableTimesResult?.data;

  const currentDoctor = doctors.find(
    (d) => d.id === defaultValues.doctor.id,
  ) || {
    id: defaultValues.doctor.id,
    name: defaultValues.doctor.name,
    availableFromWeekDay: defaultValues.doctor.availableFromWeekDay || 1,
    availableToWeekDay: defaultValues.doctor.availableToWeekDay || 5,
    availableFromTime: defaultValues.doctor.availableFromTime || "08:00",
    availableToTime: defaultValues.doctor.availableToTime || "18:00",
  };

  const isDateAvailable = (date: Date) => {
    if (!currentDoctor) return true;
    const dayOfWeek = date.getDay();
    return (
      dayOfWeek >= currentDoctor.availableFromWeekDay &&
      dayOfWeek <= currentDoctor.availableToWeekDay
    );
  };

  const selectedServiceId = form.watch("serviceId");

  useEffect(() => {
    if (selectedServiceId && selectedServiceId !== "none") {
      const selectedService = services.find(
        (service) => service.id === selectedServiceId,
      );
      if (selectedService) {
        form.setValue("appointmentPriceInCents", selectedService.priceInCents);
      }
    }
  }, [selectedServiceId, services, form]);

  const { execute: executeUpdateAppointment, isPending } = useAction(
    updateAppointment,
    {
      onSuccess: () => {
        toast.success("Agendamento atualizado com sucesso!");
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

  const onSubmit = (data: UpdateAppointmentFormData) => {
    if (data.date && data.time) {
      const [hours, minutes] = data.time.split(":");
      const combinedDate = new Date(data.date);
      combinedDate.setHours(parseInt(hours), parseInt(minutes));
      data.date = combinedDate;
    }

    executeUpdateAppointment(data);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="max-h-[95vh] w-[650px] max-w-none">
        <DialogHeader className="pb-2">
          <DialogTitle className="flex items-center gap-2 text-sm">
            <Clock className="h-4 w-4" />
            Ficha do Agendamento
          </DialogTitle>
        </DialogHeader>

        <ScrollArea className="max-h-[calc(95vh-100px)]">
          <div className="space-y-6 pr-4">
            {/* DADOS DO PACIENTE */}
            <Card>
              <CardContent className="pt-3">
                <div className="mb-3 flex items-center gap-2 text-sm">
                  <User className="h-4 w-4 text-blue-500" />
                  <span className="font-semibold">Dados do Paciente</span>
                </div>
                <div className="space-y-2">
                  <div>
                    <p className="text-muted-foreground mb-1 text-sm font-medium">
                      Nome
                    </p>
                    <p className="text-sm font-semibold">
                      {defaultValues.patient.name}
                    </p>
                  </div>
                  <div>
                    <p className="text-muted-foreground mb-1 text-sm font-medium">
                      Email
                    </p>
                    <p className="text-sm break-all">
                      {defaultValues.patient.email || "Não informado"}
                    </p>
                  </div>
                  <div>
                    <p className="text-muted-foreground mb-1 text-sm font-medium">
                      Telefone
                    </p>
                    <p className="text-sm">
                      {defaultValues.patient.phoneNumber || "Não informado"}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* DENTISTA RESPONSÁVEL */}
            <Card>
              <CardContent className="pt-3">
                <div className="mb-3 flex items-center gap-2 text-sm">
                  <Stethoscope className="h-4 w-4 text-green-500" />
                  <span className="font-semibold">Dentista Responsável</span>
                </div>
                <p className="text-sm font-semibold">
                  {defaultValues.doctor.name}
                </p>
              </CardContent>
            </Card>

            {/* FORMULÁRIO DE AGENDAMENTO */}
            <Card>
              <CardContent className="pt-3">
                <div className="mb-4 flex items-center gap-2 text-sm">
                  <CreditCard className="h-4 w-4 text-orange-500" />
                  <span className="font-semibold">Detalhes do Agendamento</span>
                </div>
                <Form {...form}>
                  <form
                    onSubmit={form.handleSubmit(onSubmit)}
                    className="space-y-4"
                  >
                    {/* SERVIÇO */}
                    <FormField
                      control={form.control}
                      name="serviceId"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-sm font-medium">
                            Serviço
                          </FormLabel>
                          <Select
                            onValueChange={field.onChange}
                            defaultValue={field.value || undefined}
                          >
                            <FormControl>
                              <SelectTrigger className="h-10 text-sm">
                                <SelectValue placeholder="Selecione um serviço" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="none">
                                Não especificado
                              </SelectItem>
                              {services.map((service) => (
                                <SelectItem key={service.id} value={service.id}>
                                  {service.name} - R${" "}
                                  {(service.priceInCents / 100)
                                    .toFixed(2)
                                    .replace(".", ",")}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    {/* DATA E HORÁRIO */}
                    <div className="grid grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="date"
                        render={({ field }) => (
                          <FormItem className="flex flex-col">
                            <FormLabel className="text-sm font-medium">
                              Data
                            </FormLabel>
                            <Popover
                              open={dateCalendarOpen}
                              onOpenChange={setDateCalendarOpen}
                            >
                              <PopoverTrigger asChild>
                                <FormControl>
                                  <Button
                                    variant="outline"
                                    className={cn(
                                      "h-10 w-full pl-3 text-left text-sm font-normal",
                                      !field.value && "text-muted-foreground",
                                    )}
                                  >
                                    {field.value ? (
                                      format(field.value, "dd/MM/yyyy", {
                                        locale: ptBR,
                                      })
                                    ) : (
                                      <span>Selecione uma data</span>
                                    )}
                                    <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                                  </Button>
                                </FormControl>
                              </PopoverTrigger>
                              <PopoverContent
                                className="w-auto p-0"
                                align="start"
                              >
                                <Calendar
                                  mode="single"
                                  selected={field.value}
                                  onSelect={(date) => {
                                    field.onChange(date);
                                    setDateCalendarOpen(false);
                                  }}
                                  disabled={(date) => !isDateAvailable(date)}
                                  initialFocus
                                />
                              </PopoverContent>
                            </Popover>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="time"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-sm font-medium">
                              Horário
                            </FormLabel>
                            <Select
                              onValueChange={field.onChange}
                              defaultValue={field.value}
                            >
                              <FormControl>
                                <SelectTrigger className="h-10 text-sm">
                                  <SelectValue placeholder="Selecione um horário" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                {/* 🔥 CORREÇÃO: Verificar se availableTimes existe e tem dados */}
                                {availableTimes && availableTimes.length > 0 ? (
                                  availableTimes.map(
                                    (timeOption: {
                                      value: string;
                                      label: string;
                                      available: boolean;
                                    }) => (
                                      <SelectItem
                                        key={timeOption.value}
                                        value={timeOption.value}
                                        disabled={!timeOption.available}
                                      >
                                        {timeOption.label}{" "}
                                        {!timeOption.available && "(Ocupado)"}
                                      </SelectItem>
                                    ),
                                  )
                                ) : (
                                  <SelectItem disabled value="no-times">
                                    Nenhum horário disponível
                                  </SelectItem>
                                )}
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    {/* VALOR DO AGENDAMENTO */}
                    <FormField
                      control={form.control}
                      name="appointmentPriceInCents"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-sm font-medium">
                            Valor do Agendamento (R$)
                          </FormLabel>
                          <FormControl>
                            <NumericFormat
                              value={field.value ? field.value / 100 : ""}
                              onValueChange={(values) => {
                                const { floatValue } = values;
                                field.onChange(
                                  floatValue ? Math.round(floatValue * 100) : 0,
                                );
                              }}
                              thousandSeparator="."
                              decimalSeparator=","
                              decimalScale={2}
                              fixedDecimalScale={true}
                              allowNegative={false}
                              customInput={Input}
                              className="h-10 text-sm"
                              placeholder="0,00"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    {/* STATUS */}
                    <FormField
                      control={form.control}
                      name="status"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-sm font-medium">
                            Status
                          </FormLabel>
                          <Select
                            onValueChange={field.onChange}
                            defaultValue={field.value}
                          >
                            <FormControl>
                              <SelectTrigger className="h-10 text-sm">
                                <SelectValue placeholder="Selecione o status" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="agendado">Agendado</SelectItem>
                              <SelectItem value="confirmado">
                                Confirmado
                              </SelectItem>
                              <SelectItem value="cancelado">
                                Cancelado
                              </SelectItem>
                              <SelectItem value="nao_compareceu">
                                Não Compareceu
                              </SelectItem>
                              <SelectItem value="finalizado">
                                Finalizado
                              </SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    {/* DATA DE VENCIMENTO */}
                    <FormField
                      control={form.control}
                      name="dueDate"
                      render={({ field }) => (
                        <FormItem className="flex flex-col">
                          <FormLabel className="text-sm font-medium">
                            Data de Vencimento
                          </FormLabel>
                          <Popover
                            open={dueDateCalendarOpen}
                            onOpenChange={setDueDateCalendarOpen}
                          >
                            <PopoverTrigger asChild>
                              <FormControl>
                                <Button
                                  variant="outline"
                                  className={cn(
                                    "h-10 w-full pl-3 text-left text-sm font-normal",
                                    !field.value && "text-muted-foreground",
                                  )}
                                >
                                  {field.value ? (
                                    format(field.value, "dd/MM/yyyy", {
                                      locale: ptBR,
                                    })
                                  ) : (
                                    <span>Selecione uma data</span>
                                  )}
                                  <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                                </Button>
                              </FormControl>
                            </PopoverTrigger>
                            <PopoverContent
                              className="w-auto p-0"
                              align="start"
                            >
                              <Calendar
                                mode="single"
                                selected={field.value}
                                onSelect={(date) => {
                                  field.onChange(date);
                                  setDueDateCalendarOpen(false);
                                }}
                                initialFocus
                              />
                            </PopoverContent>
                          </Popover>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    {/* BOTÕES */}
                    <div className="flex justify-end gap-2 pt-4">
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => handleOpenChange(false)}
                      >
                        Cancelar
                      </Button>
                      <Button type="submit" disabled={isPending}>
                        {isPending ? "Salvando..." : "Salvar Alterações"}
                      </Button>
                    </div>
                  </form>
                </Form>
              </CardContent>
            </Card>
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
