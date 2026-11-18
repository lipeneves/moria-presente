import { z } from 'zod';

// Esquema puro (sem ler arquivo nem encerrar o processo), para poder ser testado isoladamente.
export const esquemaEnv = z.object({
  DATABASE_URL: z.string().min(1, 'DATABASE_URL é obrigatória'),
  JWT_SECRET: z.string().min(32, 'JWT_SECRET deve ter pelo menos 32 caracteres'),
  CORS_ORIGIN: z.string().default('http://localhost:4200'),
  PORT: z.coerce.number().int().positive().default(3000),
  // Quantos proxies reversos existem na frente da API (0 = acesso direto, 1 = um proxy da hospedagem).
  TRUST_PROXY: z.coerce.number().int().min(0).max(5).default(0),
});
