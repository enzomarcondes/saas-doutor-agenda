"use client";

import { useQuery } from "@tanstack/react-query";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import dayjs from "dayjs";
import { CalendarIcon, Check, Minus, Plus, Search, X } from "lucide-react";
import { useEffect, useState } from "react";
import { NumericFormat } from "react-number-format";

import { addAppointment } from "@/actions/add-appointment";
import { getAvailableTimes } from "@/actions/get-available-times";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
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
import { doctorsTable, patientsTable } from "@/db/schema";
import { cn } from "@/lib/utils";

import UpsertPatientForm from "../../patients/_components/upsert-patient-form";

// 🔥 INTERFACE CORRETA PARA SERVICES
interface ServiceWithHierarchy {
  id: string;
  name: string;
  priceInCents: number;
  clinicId: string;
  parentServiceId?: string | null;
  subServices?: Array<{
    id: string;
    name: string;
    priceInCents: number;
  }>;
  parentService?: {
    id: string;
    name: string;
    priceInCents: number;
  } | null;
}

interface AddAppointmentFormProps {
  patients: Array<{
    id: string;
    name: string;
    email: string | null;
    phoneNumber: string | null;
    clinicId: string;
  }>;
  doctors: (typeof doctorsTable.$inferSelect)[];
  services: ServiceWithHierarchy[];
  onSuccess: () => void;
}

export function AddAppointmentForm({
  patients: initialPatients,
  doctors,
  services,
  onSuccess,
}: AddAppointmentFormProps) {
  const [date, setDate] = useState<Date>();
  const [time, setTime] = useState("");
  const [selectedPatient, setSelectedPatient] = useState("");
  const [selectedDoctor, setSelectedDoctor] = useState("");
  const [selectedService, setSelectedService] = useState("");
  // 🔥 NOVO ESTADO: QUANTIDADE
  const [quantity, setQuantity] = useState(1);
  const [appointmentPrice, setAppointmentPrice] = useState("");
  const [status, setStatus] = useState<
    "agendado" | "confirmado" | "cancelado" | "nao_compareceu" | "finalizado"
  >("agendado");
  const [dueDate, setDueDate] = useState<Date>();
  const [observations, setObservations] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  // Estados para controlar popovers
  const [isDatePickerOpen, setIsDatePickerOpen] = useState(false);
  const [isDueDatePickerOpen, setIsDueDatePickerOpen] = useState(false);

  // Estados para busca e cadastro de paciente
  const [isPatientDropdownOpen, setIsPatientDropdownOpen] = useState(false);
  const [patientSearchValue, setPatientSearchValue] = useState("");
  const [isAddPatientDialogOpen, setIsAddPatientDialogOpen] = useState(false);

  const [patients, setPatients] = useState(initialPatients);

  // 🔥 ORGANIZAR SERVIÇOS HIERARQUICAMENTE - CORREÇÃO
  const organizedServices: Array<{
    id: string;
    name: string;
    priceInCents: number;
    isMainService: boolean;
    level: number;
    parentServiceId?: string | null;
  }> = [];

  // Primeiro, adicionar serviços principais
  services
    .filter((service) => !service.parentServiceId)
    .forEach((service) => {
      organizedServices.push({
        id: service.id,
        name: service.name,
        priceInCents: service.priceInCents,
        isMainService: true,
        level: 0,
        parentServiceId: service.parentServiceId,
      });

      // Depois adicionar sub-serviços
      services
        .filter((s) => s.parentServiceId === service.id)
        .forEach((subService) => {
          organizedServices.push({
            id: subService.id,
            name: subService.name,
            priceInCents: subService.priceInCents,
            isMainService: false,
            level: 1,
            parentServiceId: subService.parentServiceId,
          });
        });
    });

  const filteredPatients = patients.filter((patient) =>
    patient.name.toLowerCase().includes(patientSearchValue.toLowerCase()),
  );

  // Buscar horários disponíveis automaticamente
  const { data: availableTimes } = useQuery({
    queryKey: ["available-times", date, selectedDoctor],
    queryFn: () =>
      getAvailableTimes({
        date: dayjs(date).format("YYYY-MM-DD"),
        doctorId: selectedDoctor,
      }),
    enabled: !!date && !!selectedDoctor,
  });

  // Auto-fill preço quando selecionar doutor
  useEffect(() => {
    if (selectedDoctor) {
      const doctor = doctors.find((d) => d.id === selectedDoctor);
      if (doctor?.appointmentPriceInCents) {
        const priceInReais = doctor.appointmentPriceInCents / 100;
        setAppointmentPrice(priceInReais.toString());
      }
    }
  }, [selectedDoctor, doctors]);

  // 🔥 AUTO-COMPLETAR PREÇO QUANDO SELECIONAR SERVIÇO - CORREÇÃO
  const handleServiceChange = (serviceId: string) => {
    setSelectedService(serviceId);

    if (serviceId) {
      const service = services.find((s) => s.id === serviceId);
      if (service) {
        // 🔥 SE FOR SUB-SERVIÇO, USAR PREÇO DO PAI
        let priceToUse = service.priceInCents;

        if (service.parentServiceId) {
          const parentService = services.find(
            (s) => s.id === service.parentServiceId,
          );
          if (parentService) {
            priceToUse = parentService.priceInCents;
          }
        }

        const priceInReais = priceToUse / 100;
        setAppointmentPrice(priceInReais.toString());
      }
    }
  };

  // 🔥 FUNÇÕES PARA CONTROLAR QUANTIDADE
  const handleQuantityIncrease = () => {
    setQuantity((prev) => prev + 1);
  };

  const handleQuantityDecrease = () => {
    setQuantity((prev) => Math.max(1, prev - 1));
  };

  const handleQuantityChange = (value: string) => {
    const numValue = parseInt(value) || 1;
    setQuantity(Math.max(1, numValue));
  };

  // Verificar se data está disponível para o doutor
  const isDateAvailable = (date: Date) => {
    if (!selectedDoctor) return false;
    const doctor = doctors.find((d) => d.id === selectedDoctor);
    if (!doctor) return false;

    const dayOfWeek = date.getDay();

    if (doctor.availableFromWeekDay <= doctor.availableToWeekDay) {
      return (
        dayOfWeek >= doctor.availableFromWeekDay &&
        dayOfWeek <= doctor.availableToWeekDay
      );
    } else {
      return (
        dayOfWeek >= doctor.availableFromWeekDay ||
        dayOfWeek <= doctor.availableToWeekDay
      );
    }
  };

  // Resetar horário quando mudar data ou doutor
  useEffect(() => {
    setTime("");
  }, [date, selectedDoctor]);

  // Calcular vencimento padrão quando mudar data
  useEffect(() => {
    if (date) {
      const defaultDue = dayjs(date).add(30, "days").toDate();
      setDueDate(defaultDue);
    }
  }, [date]);

  const handleDateSelect = (selectedDate: Date | undefined) => {
    setDate(selectedDate);
    setIsDatePickerOpen(false);
  };

  const handleDueDateSelect = (selectedDate: Date | undefined) => {
    setDueDate(selectedDate);
    setIsDueDatePickerOpen(false);
  };

  const handlePatientSelect = (patientId: string) => {
    setSelectedPatient(patientId);
    setPatientSearchValue(patients.find((p) => p.id === patientId)?.name || "");
    setIsPatientDropdownOpen(false);
  };

  const handleClearPatient = () => {
    setSelectedPatient("");
    setPatientSearchValue("");
  };

  const handlePatientCreated = (
    newPatient?: typeof patientsTable.$inferSelect,
  ) => {
    if (newPatient) {
      setPatients((prev) => [...prev, newPatient]);
      setSelectedPatient(newPatient.id);
      setPatientSearchValue(newPatient.name);
    }
    setIsAddPatientDialogOpen(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (
      !date ||
      !time ||
      !selectedPatient ||
      !selectedDoctor ||
      !appointmentPrice
    ) {
      alert("Preencha todos os campos obrigatórios");
      return;
    }

    setIsLoading(true);

    try {
      const priceInCents = Math.round(parseFloat(appointmentPrice) * 100);
      const timeForAction = time.substring(0, 5);

      const appointmentData = {
        date,
        time: timeForAction,
        patientId: selectedPatient,
        doctorId: selectedDoctor,
        serviceId: selectedService || undefined,
        appointmentPriceInCents: priceInCents,
        status,
        dueDate,
        observations: observations.trim() || undefined,
        // 🔥 NOVO CAMPO
        quantity,
      };

      await addAppointment(appointmentData);

      // Reset form
      setDate(undefined);
      setTime("");
      setSelectedPatient("");
      setSelectedDoctor("");
      setSelectedService("");
      setQuantity(1);
      setAppointmentPrice("");
      setStatus("agendado");
      setDueDate(undefined);
      setObservations("");
      setPatientSearchValue("");

      alert("Agendamento criado com sucesso!");
      onSuccess();
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Tente novamente.";
      alert(`Erro ao criar agendamento: ${errorMessage}`);
    } finally {
      setIsLoading(false);
    }
  };

  const isDateTimeEnabled = selectedPatient && selectedDoctor;

  return (
    <DialogContent className="max-h-[90vh] max-w-md overflow-y-auto">
      <DialogHeader>
        <DialogTitle>Novo Agendamento</DialogTitle>
      </DialogHeader>

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* 1. PACIENTE - BUSCA SIMPLIFICADA */}
        <div className="space-y-2">
          <Label htmlFor="patient">Paciente *</Label>
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Popover
                open={isPatientDropdownOpen}
                onOpenChange={setIsPatientDropdownOpen}
              >
                <PopoverTrigger asChild>
                  <div className="relative">
                    <Input
                      placeholder="Buscar paciente..."
                      value={patientSearchValue}
                      onChange={(e) => {
                        setPatientSearchValue(e.target.value);
                        setIsPatientDropdownOpen(true);
                        if (!e.target.value) {
                          setSelectedPatient("");
                        }
                      }}
                      onFocus={() => setIsPatientDropdownOpen(true)}
                      onClick={() => setIsPatientDropdownOpen(true)}
                    />
                    {selectedPatient && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="absolute top-1/2 right-1 h-6 w-6 -translate-y-1/2 p-0"
                        onClick={handleClearPatient}
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    )}
                  </div>
                </PopoverTrigger>
                <PopoverContent className="w-[300px] p-0">
                  <div className="max-h-60 overflow-y-auto">
                    {patientSearchValue === "" ? (
                      <div className="p-1">
                        {patients.map((patient) => (
                          <div
                            key={patient.id}
                            className={cn(
                              "hover:bg-accent flex cursor-pointer items-center gap-2 rounded-sm p-2",
                              selectedPatient === patient.id && "bg-accent",
                            )}
                            onClick={() => handlePatientSelect(patient.id)}
                          >
                            <Check
                              className={cn(
                                "h-4 w-4",
                                selectedPatient === patient.id
                                  ? "opacity-100"
                                  : "opacity-0",
                              )}
                            />
                            <div className="flex flex-col">
                              <span className="font-medium">
                                {patient.name}
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : filteredPatients.length > 0 ? (
                      <div className="p-1">
                        {filteredPatients.map((patient) => (
                          <div
                            key={patient.id}
                            className={cn(
                              "hover:bg-accent flex cursor-pointer items-center gap-2 rounded-sm p-2",
                              selectedPatient === patient.id && "bg-accent",
                            )}
                            onClick={() => handlePatientSelect(patient.id)}
                          >
                            <Check
                              className={cn(
                                "h-4 w-4",
                                selectedPatient === patient.id
                                  ? "opacity-100"
                                  : "opacity-0",
                              )}
                            />
                            <div className="flex flex-col">
                              <span className="font-medium">
                                {patient.name}
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="flex flex-col items-center gap-2 p-4">
                        <Search className="text-muted-foreground h-8 w-8" />
                        <p className="text-muted-foreground text-sm">
                          Nenhum paciente encontrado
                        </p>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setIsPatientDropdownOpen(false);
                            setIsAddPatientDialogOpen(true);
                          }}
                        >
                          <Plus className="mr-2 h-4 w-4" />
                          Cadastrar novo paciente
                        </Button>
                      </div>
                    )}
                  </div>
                </PopoverContent>
              </Popover>
            </div>

            <Dialog
              open={isAddPatientDialogOpen}
              onOpenChange={setIsAddPatientDialogOpen}
            >
              <DialogTrigger asChild>
                <Button type="button" variant="outline" size="icon">
                  <Plus className="h-4 w-4" />
                </Button>
              </DialogTrigger>
              <UpsertPatientForm
                isOpen={isAddPatientDialogOpen}
                onSuccess={handlePatientCreated}
              />
            </Dialog>
          </div>
        </div>

        {/* 2. DOUTOR */}
        <div className="space-y-2">
          <Label htmlFor="doctor">Doutor *</Label>
          <Select value={selectedDoctor} onValueChange={setSelectedDoctor}>
            <SelectTrigger>
              <SelectValue placeholder="Selecione um doutor" />
            </SelectTrigger>
            <SelectContent>
              {doctors.map((doctor) => (
                <SelectItem key={doctor.id} value={doctor.id}>
                  {doctor.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* 3. DATA */}
        <div className="space-y-2">
          <Label htmlFor="date">Data *</Label>
          <Popover open={isDatePickerOpen} onOpenChange={setIsDatePickerOpen}>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                disabled={!isDateTimeEnabled}
                className={cn(
                  "w-full justify-start text-left font-normal",
                  !date && "text-muted-foreground",
                )}
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {date
                  ? format(date, "PPP", { locale: ptBR })
                  : "Selecione uma data"}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0">
              <Calendar
                mode="single"
                selected={date}
                onSelect={handleDateSelect}
                disabled={(date) => {
                  const today = new Date();
                  today.setHours(0, 0, 0, 0);
                  const checkDate = new Date(date);
                  checkDate.setHours(0, 0, 0, 0);
                  return checkDate < today || !isDateAvailable(date);
                }}
                initialFocus
              />
            </PopoverContent>
          </Popover>
        </div>

        {/* 4. HORÁRIO */}
        <div className="space-y-2">
          <Label htmlFor="time">Horário *</Label>
          <Select
            value={time}
            onValueChange={setTime}
            disabled={!isDateTimeEnabled || !date}
          >
            <SelectTrigger>
              <SelectValue placeholder="Selecione um horário" />
            </SelectTrigger>
            <SelectContent>
              {availableTimes?.data?.map((timeSlot) => (
                <SelectItem
                  key={timeSlot.value}
                  value={timeSlot.value}
                  disabled={!timeSlot.available}
                >
                  {timeSlot.label} {!timeSlot.available && "(Indisponível)"}
                </SelectItem>
              ))}
              {(!availableTimes?.data || availableTimes.data.length === 0) && (
                <div className="text-muted-foreground px-2 py-1.5 text-sm">
                  Nenhum horário disponível
                </div>
              )}
            </SelectContent>
          </Select>
        </div>

        {/* 5. SERVIÇO COM HIERARQUIA */}
        <div className="space-y-2">
          <Label htmlFor="service">Serviço</Label>
          <Select value={selectedService} onValueChange={handleServiceChange}>
            <SelectTrigger>
              <SelectValue placeholder="Selecione um serviço (opcional)" />
            </SelectTrigger>
            <SelectContent>
              {organizedServices.map((service) => (
                <SelectItem key={service.id} value={service.id}>
                  <div className="flex items-center gap-2">
                    {service.level > 0 && (
                      <span className="text-muted-foreground">└</span>
                    )}
                    <span
                      className={service.level > 0 ? "text-sm" : "font-medium"}
                    >
                      {service.name}
                    </span>
                    {service.isMainService && (
                      <span className="text-muted-foreground text-sm">
                        - R$ {(service.priceInCents / 100).toFixed(2)}
                      </span>
                    )}
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* 🔥 6. QUANTIDADE */}
        <div className="space-y-2">
          <Label htmlFor="quantity">Quantidade</Label>
          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="outline"
              size="icon"
              className="h-9 w-9"
              onClick={handleQuantityDecrease}
              disabled={quantity <= 1}
            >
              <Minus className="h-4 w-4" />
            </Button>
            <Input
              type="number"
              value={quantity}
              onChange={(e) => handleQuantityChange(e.target.value)}
              className="text-center"
              min="1"
            />
            <Button
              type="button"
              variant="outline"
              size="icon"
              className="h-9 w-9"
              onClick={handleQuantityIncrease}
            >
              <Plus className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* 7. VALOR UNITÁRIO */}
        <div className="space-y-2">
          <Label htmlFor="price">Valor Unitário (R$) *</Label>
          <NumericFormat
            customInput={Input}
            thousandSeparator="."
            decimalSeparator=","
            prefix="R$ "
            decimalScale={2}
            fixedDecimalScale
            allowNegative={false}
            value={appointmentPrice}
            onValueChange={(values) => {
              setAppointmentPrice(values.floatValue?.toString() || "");
            }}
            placeholder="R$ 0,00"
          />
          {quantity > 1 && appointmentPrice && (
            <div className="text-muted-foreground text-sm">
              Total: R${" "}
              {((parseFloat(appointmentPrice) || 0) * quantity)
                .toFixed(2)
                .replace(".", ",")}
            </div>
          )}
        </div>

        {/* 8. STATUS DA CONSULTA */}
        <div className="space-y-2">
          <Label htmlFor="status">Status da Consulta</Label>
          <Select
            value={status}
            onValueChange={(value) => setStatus(value as typeof status)}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="agendado">Agendado</SelectItem>
              <SelectItem value="confirmado">Confirmado</SelectItem>
              <SelectItem value="cancelado">Cancelado</SelectItem>
              <SelectItem value="nao_compareceu">Não compareceu</SelectItem>
              <SelectItem value="finalizado">Finalizado</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* 9. OBSERVAÇÕES */}
        <div className="space-y-2">
          <Label htmlFor="observations">Observações</Label>
          <Textarea
            id="observations"
            value={observations}
            onChange={(e) => setObservations(e.target.value)}
            placeholder="Exemplo: Cor A1, dente 22"
            rows={3}
            className="resize-none"
          />
        </div>

        {/* 10. DATA DE VENCIMENTO */}
        <div className="space-y-2">
          <Label htmlFor="dueDate">Data de Vencimento</Label>
          <Popover
            open={isDueDatePickerOpen}
            onOpenChange={setIsDueDatePickerOpen}
          >
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className={cn(
                  "w-full justify-start text-left font-normal",
                  !dueDate && "text-muted-foreground",
                )}
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {dueDate
                  ? format(dueDate, "PPP", { locale: ptBR })
                  : "Selecione uma data de vencimento"}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0">
              <Calendar
                mode="single"
                selected={dueDate}
                onSelect={handleDueDateSelect}
                initialFocus
              />
            </PopoverContent>
          </Popover>
        </div>

        <Button type="submit" className="w-full" disabled={isLoading}>
          {isLoading ? "Criando..." : "Criar Agendamento"}
        </Button>
      </form>
    </DialogContent>
  );
}
