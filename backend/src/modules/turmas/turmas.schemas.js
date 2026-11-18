import { z } from 'zod';

export const idTurmaParams = z.object({
  idTurma: z.uuid('Identificador de turma inválido'),
});

export const criarTurmaSchema = z.object({
  nome: z.string().trim().min(2).max(80),
  turno: z.enum(['manha', 'tarde']),
});

export const criarAtividadeSchema = z.object({
  nome: z.string().trim().min(2).max(80),
  tipo: z.string().trim().min(2).max(40),
});
