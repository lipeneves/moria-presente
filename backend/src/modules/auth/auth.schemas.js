import { z } from 'zod';

const email = z
  .string()
  .trim()
  .toLowerCase()
  .pipe(z.email('E-mail inválido').max(254));

export const loginSchema = z.object({
  email,
  senha: z.string().min(1, 'Senha é obrigatória').max(128),
});

export const criarUsuarioSchema = z.object({
  nome: z.string().trim().min(2).max(120),
  email,
  // bcrypt só considera os primeiros 72 bytes da senha, por isso o limite.
  senha: z.string().min(10, 'A senha deve ter pelo menos 10 caracteres').max(72),
  perfil: z.enum(['coordenacao', 'educador']),
});
