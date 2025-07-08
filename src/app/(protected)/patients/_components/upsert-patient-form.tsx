"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useAction } from "next-safe-action/hooks";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { PatternFormat } from "react-number-format";
import { toast } from "sonner";
import { z } from "zod";

import { upsertPatient } from "@/actions/upsert-patient";
import { Button } from "@/components/ui/button";
import {
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
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
import { patientsTable } from "@/db/schema";

// 🔥 SCHEMA LOCAL ATUALIZADO COM DATA DE NASCIMENTO
const formSchema = z.object({
  name: z.string().trim().min(1, {
    message: "Nome é obrigatório.",
  }),
  email: z
    .string()
    .email({
      message: "Email inválido.",
    })
    .optional()
    .or(z.literal("")),
  phoneNumber: z.string().trim().min(1, {
    message: "Número de telefone é obrigatório.",
  }),
  sex: z.enum(["male", "female"], {
    required_error: "Sexo é obrigatório.",
  }),
  // 🔥 NOVO CAMPO: DATA DE NASCIMENTO OPCIONAL
  birthDate: z.string().optional(), // String no formulário, será convertida para Date
  cpf: z.string().optional(),
  cep: z.string().optional(),
  bairro: z.string().optional(),
  rua: z.string().optional(),
  numero: z.string().optional(),
  cidade: z.string().optional(),
  uf: z.string().optional(),
});

interface UpsertPatientFormProps {
  isOpen: boolean;
  patient?: typeof patientsTable.$inferSelect;
  onSuccess?: (createdPatient?: typeof patientsTable.$inferSelect) => void;
}

const UpsertPatientForm = ({
  patient,
  onSuccess,
  isOpen,
}: UpsertPatientFormProps) => {
  const [isLoadingCEP, setIsLoadingCEP] = useState(false);

  // 🔥 FUNÇÃO HELPER PARA FORMATAR DATA PARA MÁSCARA DD/MM/AAAA
  const formatDateForInput = (date: Date | null | undefined): string => {
    if (!date) return "";
    const day = String(date.getDate()).padStart(2, "0");
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const year = String(date.getFullYear());
    return `${day}${month}${year}`; // Retorna DDMMAAAA para a máscara
  };

  const form = useForm<z.infer<typeof formSchema>>({
    shouldUnregister: true,
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: patient?.name ?? "",
      email: patient?.email ?? "",
      phoneNumber: patient?.phoneNumber ?? "",
      sex: patient?.sex ?? undefined,
      birthDate: formatDateForInput(patient?.birthDate ?? null), // 🔥 CONVERSÃO SEGURA
      cpf: patient?.cpf ?? "",
      cep: patient?.cep ?? "",
      bairro: patient?.bairro ?? "",
      rua: patient?.rua ?? "",
      numero: patient?.numero ?? "",
      cidade: patient?.cidade ?? "",
      uf: patient?.uf ?? "",
    },
  });

  // 🔥 CORREÇÃO NO useEffect TAMBÉM:
  useEffect(() => {
    if (isOpen && patient) {
      const patientData = {
        name: patient.name,
        email: patient.email || "",
        phoneNumber: patient.phoneNumber,
        sex: patient.sex,
        birthDate: formatDateForInput(patient.birthDate ?? null), // 🔥 CONVERSÃO SEGURA
        cpf: patient.cpf || "",
        cep: patient.cep || "",
        bairro: patient.bairro || "",
        rua: patient.rua || "",
        numero: patient.numero || "",
        cidade: patient.cidade || "",
        uf: patient.uf || "",
      };
      form.reset(patientData);
    }
  }, [isOpen, form, patient]);

  // 🔥 FUNÇÃO PARA BUSCAR ENDEREÇO POR CEP (EXISTENTE)
  const fetchAddressByCEP = async (cep: string) => {
    const cleanCEP = cep.replace(/\D/g, "");

    if (cleanCEP.length !== 8) return;

    setIsLoadingCEP(true);

    try {
      const response = await fetch(
        `https://viacep.com.br/ws/${cleanCEP}/json/`,
      );
      const data = await response.json();

      if (data.erro) {
        toast.error("CEP não encontrado.");
        return;
      }

      form.setValue("bairro", data.bairro || "");
      form.setValue("rua", data.logradouro || "");
      form.setValue("cidade", data.localidade || "");
      form.setValue("uf", data.uf || "");

      toast.success("Endereço preenchido automaticamente!");
    } catch {
      toast.error("Erro ao buscar CEP.");
    } finally {
      setIsLoadingCEP(false);
    }
  };

  const upsertPatientAction = useAction(upsertPatient, {
    onSuccess: (result) => {
      toast.success("Paciente salvo com sucesso.");
      onSuccess?.(result.data);
    },
    onError: () => {
      toast.error("Erro ao salvar paciente.");
    },
  });

  const onSubmit = (values: z.infer<typeof formSchema>) => {
    // 🔥 FUNÇÃO CORRIGIDA PARA CONVERTER DD/MM/AAAA PARA DATE
    const convertBirthDate = (dateString: string): Date | undefined => {
      if (!dateString || dateString.length !== 8) return undefined;

      const day = parseInt(dateString.slice(0, 2));
      const month = parseInt(dateString.slice(2, 4));
      const year = parseInt(dateString.slice(4, 8));

      // 🔥 CRIAR DATA NO TIMEZONE LOCAL (sem conversão UTC)
      const date = new Date(year, month - 1, day); // month - 1 porque Date usa 0-11
      return isNaN(date.getTime()) ? undefined : date;
    };

    // 🔥 LIMPAR CAMPOS VAZIOS E CONVERTER DATA
    const cleanValues = {
      ...values,
      email: values.email || undefined,
      birthDate: convertBirthDate(values.birthDate ?? ""), // 🔥 CONVERTER MÁSCARA PARA DATE
      cpf: values.cpf || undefined,
      cep: values.cep || undefined,
      bairro: values.bairro || undefined,
      rua: values.rua || undefined,
      numero: values.numero || undefined,
      cidade: values.cidade || undefined,
      uf: values.uf || undefined,
    };

    upsertPatientAction.execute({
      ...cleanValues,
      id: patient?.id,
    });
  };

  return (
    <DialogContent className="max-h-[90vh] max-w-2xl overflow-y-auto">
      <DialogHeader>
        <DialogTitle>
          {patient ? patient.name : "Adicionar paciente"}
        </DialogTitle>
        <DialogDescription>
          {patient
            ? "Edite as informações desse paciente."
            : "Adicione um novo paciente."}
        </DialogDescription>
      </DialogHeader>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          {/* 🔥 SEÇÃO: DADOS PESSOAIS */}
          <div className="space-y-4">
            <h3 className="text-muted-foreground text-sm font-medium">
              Dados Pessoais
            </h3>

            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nome do paciente</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Digite o nome completo do paciente"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email (opcional)</FormLabel>
                    <FormControl>
                      <Input
                        type="email"
                        placeholder="exemplo@email.com"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="phoneNumber"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Telefone</FormLabel>
                    <FormControl>
                      <PatternFormat
                        format="(##) #####-####"
                        mask="_"
                        placeholder="(11) 99999-9999"
                        value={field.value}
                        onValueChange={(value) => {
                          field.onChange(value.value);
                        }}
                        customInput={Input}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-3 gap-4">
              <FormField
                control={form.control}
                name="sex"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Sexo</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione o sexo" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="male">Masculino</SelectItem>
                        <SelectItem value="female">Feminino</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* 🔥 CAMPO DATA DE NASCIMENTO COM MÁSCARA */}
              <FormField
                control={form.control}
                name="birthDate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Data de Nascimento (opcional)</FormLabel>
                    <FormControl>
                      <PatternFormat
                        format="##/##/####"
                        mask="_"
                        placeholder="DD/MM/AAAA"
                        value={field.value}
                        onValueChange={(value) => {
                          field.onChange(value.value);
                        }}
                        customInput={Input}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="cpf"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>CPF (opcional)</FormLabel>
                    <FormControl>
                      <PatternFormat
                        format="###.###.###-##"
                        mask="_"
                        placeholder="000.000.000-00"
                        value={field.value}
                        onValueChange={(value) => {
                          field.onChange(value.value);
                        }}
                        customInput={Input}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          </div>

          {/* 🔥 SEÇÃO: ENDEREÇO (CONTINUA IGUAL) */}
          <div className="space-y-4">
            <h3 className="text-muted-foreground text-sm font-medium">
              Endereço (opcional)
            </h3>

            <FormField
              control={form.control}
              name="cep"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>CEP</FormLabel>
                  <FormControl>
                    <PatternFormat
                      format="#####-###"
                      mask="_"
                      placeholder="00000-000"
                      value={field.value}
                      onValueChange={(value) => {
                        field.onChange(value.value);
                        if (value.value && value.value.length === 8) {
                          fetchAddressByCEP(value.value);
                        }
                      }}
                      customInput={Input}
                      disabled={isLoadingCEP}
                    />
                  </FormControl>
                  <FormMessage />
                  {isLoadingCEP && (
                    <p className="text-muted-foreground text-xs">
                      Buscando endereço...
                    </p>
                  )}
                </FormItem>
              )}
            />

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="rua"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Rua</FormLabel>
                    <FormControl>
                      <Input placeholder="Nome da rua" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="numero"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Número</FormLabel>
                    <FormControl>
                      <Input placeholder="123" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="bairro"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Bairro</FormLabel>
                    <FormControl>
                      <Input placeholder="Nome do bairro" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="cidade"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Cidade</FormLabel>
                    <FormControl>
                      <Input placeholder="Nome da cidade" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="uf"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>UF</FormLabel>
                  <FormControl>
                    <Input placeholder="SP" maxLength={2} {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <DialogFooter>
            <Button type="submit" disabled={upsertPatientAction.isPending}>
              {upsertPatientAction.isPending ? "Salvando..." : "Salvar"}
            </Button>
          </DialogFooter>
        </form>
      </Form>
    </DialogContent>
  );
};

export default UpsertPatientForm;
