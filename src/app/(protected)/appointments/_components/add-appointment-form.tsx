"use client";

import { useQuery } from "@tanstack/react-query"; // 🔥 REMOVER useQueryClient
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import dayjs from "dayjs";
import { CalendarIcon, Check, Plus, Search, X } from "lucide-react";
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

// 🔥 IMPORTAR COMPONENTE DE CADASTRO DE PACIENTE
import UpsertPatientForm from "../../patients/_components/upsert-patient-form";

interface AddAppointmentFormProps {
  patients: Array<{
    id: string;
    name: string;
    email: string | null;
    phoneNumber: string | null;
    clinicId: string;
  }>;
  doctors: (typeof doctorsTable.$inferSelect)[];
  services: Array<{
    id: string;
    name: string;
    priceInCents: number;
    clinicId: string;
  }>;
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
  const [appointmentPrice, setAppointmentPrice] = useState("");
  const [status, setStatus] = useState<
    "agendado" | "confirmado" | "cancelado" | "nao_compareceu" | "finalizado"
  >("agendado");
  const [dueDate, setDueDate] = useState<Date>();
  const [observations, setObservations] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  // 🔥 NOVOS ESTADOS PARA CONTROLAR POPOVERS
  const [isDatePickerOpen, setIsDatePickerOpen] = useState(false);
  const [isDueDatePickerOpen, setIsDueDatePickerOpen] = useState(false);

  // 🔥 NOVOS ESTADOS PARA BUSCA E CADASTRO DE PACIENTE
  const [isPatientDropdownOpen, setIsPatientDropdownOpen] = useState(false);
  const [patientSearchValue, setPatientSearchValue] = useState("");
  const [isAddPatientDialogOpen, setIsAddPatientDialogOpen] = useState(false);

  // 🔥 LISTA DE PACIENTES (inicia com os dados passados)
  const [patients, setPatients] = useState(initialPatients);

  // 🔥 FILTRAR PACIENTES BASEADO NA BUSCA
  const filteredPatients = patients.filter((patient) =>
    patient.name.toLowerCase().includes(patientSearchValue.toLowerCase()),
  );

  // 🔥 BUSCAR HORÁRIOS DISPONÍVEIS AUTOMATICAMENTE
  const { data: availableTimes } = useQuery({
    queryKey: ["available-times", date, selectedDoctor],
    queryFn: () =>
      getAvailableTimes({
        date: dayjs(date).format("YYYY-MM-DD"),
        doctorId: selectedDoctor,
      }),
    enabled: !!date && !!selectedDoctor,
  });

  // 🔥 AUTO-FILL PREÇO QUANDO SELECIONAR DOUTOR
  useEffect(() => {
    if (selectedDoctor) {
      const doctor = doctors.find((d) => d.id === selectedDoctor);
      if (doctor?.appointmentPriceInCents) {
        const priceInReais = doctor.appointmentPriceInCents / 100;
        setAppointmentPrice(priceInReais.toString());
      }
    }
  }, [selectedDoctor, doctors]);

  // 🔥 AUTO-COMPLETAR PREÇO QUANDO SELECIONAR SERVIÇO
  const handleServiceChange = (serviceId: string) => {
    setSelectedService(serviceId);

    if (serviceId) {
      const service = services.find((s) => s.id === serviceId);
      if (service?.priceInCents) {
        const priceInReais = service.priceInCents / 100;
        setAppointmentPrice(priceInReais.toString());
      }
    }
  };

  // 🔥 VERIFICAR SE DATA ESTÁ DISPONÍVEL PARA O DOUTOR
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

  // 🔥 RESETAR HORÁRIO QUANDO MUDAR DATA OU DOUTOR
  useEffect(() => {
    setTime("");
  }, [date, selectedDoctor]);

  // 🔥 CALCULAR VENCIMENTO PADRÃO QUANDO MUDAR DATA
  useEffect(() => {
    if (date) {
      const defaultDue = dayjs(date).add(30, "days").toDate();
      setDueDate(defaultDue);
    }
  }, [date]);

  // 🔥 FUNÇÕES PARA FECHAR POPOVERS AO SELECIONAR DATA
  const handleDateSelect = (selectedDate: Date | undefined) => {
    setDate(selectedDate);
    setIsDatePickerOpen(false);
  };

  const handleDueDateSelect = (selectedDate: Date | undefined) => {
    setDueDate(selectedDate);
    setIsDueDatePickerOpen(false);
  };

  // 🔥 FUNÇÃO PARA SELECIONAR PACIENTE
  const handlePatientSelect = (patientId: string) => {
    setSelectedPatient(patientId);
    setPatientSearchValue(patients.find((p) => p.id === patientId)?.name || "");
    setIsPatientDropdownOpen(false);
  };

  // 🔥 LIMPAR SELEÇÃO DE PACIENTE
  const handleClearPatient = () => {
    setSelectedPatient("");
    setPatientSearchValue("");
  };

  // 🔥 CALLBACK QUANDO PACIENTE É CRIADO
  const handlePatientCreated = (
    newPatient?: typeof patientsTable.$inferSelect,
  ) => {
    if (newPatient) {
      // 1. Adicionar à lista local
      setPatients((prev) => [...prev, newPatient]);

      // 2. Selecionar automaticamente
      setSelectedPatient(newPatient.id);
      setPatientSearchValue(newPatient.name);
    }

    // 3. Fechar modal
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
      };

      await addAppointment(appointmentData);

      // Reset form
      setDate(undefined);
      setTime("");
      setSelectedPatient("");
      setSelectedDoctor("");
      setSelectedService("");
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
        {/* 🔥 1. PACIENTE - BUSCA SIMPLIFICADA */}
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
                        setIsPatientDropdownOpen(true); // ✅ SEMPRE ABRE AO DIGITAR
                        // ✅ LIMPA SELEÇÃO APENAS SE CAMPO FICAR VAZIO
                        if (!e.target.value) {
                          setSelectedPatient("");
                        }
                      }}
                      onFocus={() => setIsPatientDropdownOpen(true)} // ✅ ABRE AO CLICAR
                      onClick={() => setIsPatientDropdownOpen(true)} // ✅ ABRE AO CLICAR
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
                    {/* ✅ MOSTRAR TODOS OS PACIENTES SE NÃO DIGITOU NADA */}
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
                      /* ✅ MOSTRAR PACIENTES FILTRADOS QUANDO DIGITAR */
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
                      /* ✅ NENHUM RESULTADO + BOTÃO CADASTRAR */
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

            {/* 🔥 BOTÃO CADASTRAR PACIENTE */}
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

        {/* 5. SERVIÇO */}
        <div className="space-y-2">
          <Label htmlFor="service">Serviço</Label>
          <Select value={selectedService} onValueChange={handleServiceChange}>
            <SelectTrigger>
              <SelectValue placeholder="Selecione um serviço (opcional)" />
            </SelectTrigger>
            <SelectContent>
              {services.map((service) => (
                <SelectItem key={service.id} value={service.id}>
                  {service.name} - R$ {(service.priceInCents / 100).toFixed(2)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* 6. VALOR */}
        <div className="space-y-2">
          <Label htmlFor="price">Valor (R$) *</Label>
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
        </div>

        {/* 7. STATUS DA CONSULTA */}
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

        {/* 8. OBSERVAÇÕES */}
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

        {/* 9. DATA DE VENCIMENTO */}
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
