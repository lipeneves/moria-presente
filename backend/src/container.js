import { criarUsuarioRepository } from './modules/auth/usuario.repository.js';
import { criarAuthService } from './modules/auth/auth.service.js';
import { criarTurmasRepository } from './modules/turmas/turmas.repository.js';
import { criarTurmasService } from './modules/turmas/turmas.service.js';
import { criarCriancasRepository } from './modules/criancas/criancas.repository.js';
import { criarCriancasService } from './modules/criancas/criancas.service.js';
import { criarChamadasRepository } from './modules/chamadas/chamadas.repository.js';
import { criarChamadasService } from './modules/chamadas/chamadas.service.js';

// Monta repositories → services. É o único lugar que conhece o Prisma além dos repositories.
export function criarServices({ prisma, jwtSecret }) {
  const authService = criarAuthService({
    usuarioRepository: criarUsuarioRepository(prisma),
    jwtSecret,
  });

  const turmasService = criarTurmasService({ turmasRepository: criarTurmasRepository(prisma) });

  const criancasService = criarCriancasService({
    criancasRepository: criarCriancasRepository(prisma),
    turmasService,
  });

  const chamadasService = criarChamadasService({
    chamadasRepository: criarChamadasRepository(prisma),
  });

  return { authService, turmasService, criancasService, chamadasService };
}
