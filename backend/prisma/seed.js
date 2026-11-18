// Cria o primeiro usuário da coordenação. Os dados vêm do .env, nunca do código.
// Uso: npm run db:seed
import { fileURLToPath } from 'node:url';
import dotenv from 'dotenv';
import { PrismaClient } from '@prisma/client';
import { criarUsuarioRepository } from '../src/modules/auth/usuario.repository.js';
import { criarAuthService } from '../src/modules/auth/auth.service.js';
import { ErroDeConflito } from '../src/lib/erros.js';
import { criarUsuarioSchema } from '../src/modules/auth/auth.schemas.js';

dotenv.config({ path: fileURLToPath(new URL('../../.env', import.meta.url)), quiet: true });

const prisma = new PrismaClient();

try {
  const dados = criarUsuarioSchema.parse({
    nome: process.env.SEED_COORDENACAO_NOME,
    email: process.env.SEED_COORDENACAO_EMAIL,
    senha: process.env.SEED_COORDENACAO_SENHA,
    perfil: 'coordenacao',
  });

  const authService = criarAuthService({
    usuarioRepository: criarUsuarioRepository(prisma),
    jwtSecret: process.env.JWT_SECRET,
  });

  const usuario = await authService.criarUsuario(dados);
  console.log(`Usuário da coordenação criado: ${usuario.email}`);
} catch (erro) {
  if (erro instanceof ErroDeConflito) {
    console.log('Usuário da coordenação já existe, nada a fazer.');
  } else {
    console.error(erro);
    process.exitCode = 1;
  }
} finally {
  await prisma.$disconnect();
}
