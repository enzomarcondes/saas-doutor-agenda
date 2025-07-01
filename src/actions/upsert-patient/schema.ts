import { z } from "zod";

// 🔥 FUNÇÃO PARA VALIDAR CPF
const isValidCPF = (cpf: string): boolean => {
  const cleanCPF = cpf.replace(/\D/g, "");

  if (cleanCPF.length !== 11) return false;
  if (/^(\d)\1{10}$/.test(cleanCPF)) return false; // CPF com todos os dígitos iguais

  // Validação do primeiro dígito verificador
  let sum = 0;
  for (let i = 0; i < 9; i++) {
    sum += parseInt(cleanCPF.charAt(i)) * (10 - i);
  }
  let remainder = 11 - (sum % 11);
  if (remainder === 10 || remainder === 11) remainder = 0;
  if (remainder !== parseInt(cleanCPF.charAt(9))) return false;

  // Validação do segundo dígito verificador
  sum = 0;
  for (let i = 0; i < 10; i++) {
    sum += parseInt(cleanCPF.charAt(i)) * (11 - i);
  }
  remainder = 11 - (sum % 11);
  if (remainder === 10 || remainder === 11) remainder = 0;
  if (remainder !== parseInt(cleanCPF.charAt(10))) return false;

  return true;
};

// 🔥 FUNÇÃO PARA VALIDAR CEP
const isValidCEP = (cep: string): boolean => {
  const cleanCEP = cep.replace(/\D/g, "");
  return cleanCEP.length === 8;
};

export const upsertPatientSchema = z.object({
  id: z.string().uuid().optional(),
  name: z.string().trim().min(1, {
    message: "Nome é obrigatório.",
  }),
  // 🔥 EMAIL AGORA OPCIONAL
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

  // 🔥 NOVOS CAMPOS OPCIONAIS
  cpf: z
    .string()
    .optional()
    .refine(
      (cpf) => {
        if (!cpf || cpf.trim() === "") return true; // Opcional
        return isValidCPF(cpf);
      },
      {
        message: "CPF inválido.",
      },
    ),

  cep: z
    .string()
    .optional()
    .refine(
      (cep) => {
        if (!cep || cep.trim() === "") return true; // Opcional
        return isValidCEP(cep);
      },
      {
        message: "CEP deve ter 8 dígitos.",
      },
    ),

  bairro: z.string().optional(),
  rua: z.string().optional(),
  numero: z.string().optional(),
  cidade: z.string().optional(),
  uf: z.string().optional(),
});

export type UpsertPatientSchema = z.infer<typeof upsertPatientSchema>;
