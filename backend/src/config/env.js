import { fileURLToPath } from 'node:url';
import dotenv from 'dotenv';
import { esquemaEnv } from './esquemaEnv.js';

// O .env fica na raiz do repositório (ver .env.example).
dotenv.config({ path: fileURLToPath(new URL('../../../.env', import.meta.url)), quiet: true });

const resultado = esquemaEnv.safeParse(process.env);

if (!resultado.success) {
  console.error('Variáveis de ambiente inválidas:');
  for (const problema of resultado.error.issues) {
    console.error(`  - ${problema.path.join('.')}: ${problema.message}`);
  }
  process.exit(1);
}

export const env = resultado.data;
