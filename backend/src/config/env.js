import { fileURLToPath } from 'node:url';
import dotenv from 'dotenv';
import { z } from 'zod';

// O .env fica na raiz do repositório (ver .env.example).
dotenv.config({ path: fileURLToPath(new URL('../../../.env', import.meta.url)), quiet: true });

const esquema = z.object({
  DATABASE_URL: z.string().min(1, 'DATABASE_URL é obrigatória'),
  JWT_SECRET: z.string().min(32, 'JWT_SECRET deve ter pelo menos 32 caracteres'),
  CORS_ORIGIN: z.string().default('http://localhost:4200'),
  PORT: z.coerce.number().int().positive().default(3000),
  // Quantos proxies reversos existem na frente da API (0 = acesso direto, 1 = um proxy da hospedagem).
  TRUST_PROXY: z.coerce.number().int().min(0).max(5).default(0),
});

const resultado = esquema.safeParse(process.env);

if (!resultado.success) {
  console.error('Variáveis de ambiente inválidas:');
  for (const problema of resultado.error.issues) {
    console.error(`  - ${problema.path.join('.')}: ${problema.message}`);
  }
  process.exit(1);
}

export const env = resultado.data;
