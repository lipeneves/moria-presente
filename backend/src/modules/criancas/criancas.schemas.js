import { z } from 'zod';

// Apenas letras (com acento), espaços, hífen e apóstrofo: bloqueia HTML/script em campos de nome.
const nomePessoa = z
  .string()
  .trim()
  .min(2)
  .max(120)
  .regex(/^[\p{L}\s'-]+$/u, 'Use apenas letras, espaços, hífen ou apóstrofo');

const textoOpcional = (max) =>
  z
    .string()
    .trim()
    .max(max)
    .optional()
    .transform((valor) => valor || undefined);

const responsavelSchema = z.object({
  nome: nomePessoa,
  telefone: z
    .string()
    .trim()
    .transform((valor) => valor.replace(/\D/g, ''))
    .pipe(z.string().regex(/^\d{10,11}$/, 'Telefone deve ter DDD + número (10 ou 11 dígitos)')),
  parentesco: z.string().trim().min(2).max(40),
  // RF03: sem o consentimento do responsável (LGPD) o cadastro não é aceito.
  consentimentoLgpd: z.literal(true, 'O consentimento LGPD do responsável é obrigatório'),
});

export const criarCriancaSchema = z.object({
  nome: nomePessoa,
  dataNascimento: z.iso.date('Data de nascimento inválida (use AAAA-MM-DD)'),
  escola: textoOpcional(120),
  turnoEscolar: z.enum(['manha', 'tarde']).optional(),
  alergiasRestricoes: textoOpcional(500),
  idTurma: z.uuid('Identificador de turma inválido'),
  responsavel: responsavelSchema,
});

export const listarCriancasQuery = z.object({
  idTurma: z.uuid('Identificador de turma inválido'),
});
