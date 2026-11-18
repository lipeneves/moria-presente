import { env } from './config/env.js';
import { prisma } from './lib/prisma.js';
import { criarServices } from './container.js';
import { criarApp } from './app.js';

const services = criarServices({ prisma, jwtSecret: env.JWT_SECRET });
const app = criarApp({ services, origemCors: env.CORS_ORIGIN, proxiesConfiaveis: env.TRUST_PROXY });

const servidor = app.listen(env.PORT, () => {
  console.log(`API Moriá Presente rodando na porta ${env.PORT}`);
});

// Encerramento limpo: para de aceitar conexões e devolve as conexões do pool ao banco.
async function encerrar(sinal) {
  console.log(`${sinal} recebido, encerrando...`);
  servidor.close(async () => {
    await prisma.$disconnect();
    process.exit(0);
  });
}

process.on('SIGINT', encerrar);
process.on('SIGTERM', encerrar);
