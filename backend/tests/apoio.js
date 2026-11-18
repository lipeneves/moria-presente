// Repositórios em memória com a mesma interface dos repositórios Prisma.
// Permitem testar services e rotas sem banco de dados.
import { randomUUID } from 'node:crypto';
import bcrypt from 'bcryptjs';
import { criarApp } from '../src/app.js';
import { criarAuthService } from '../src/modules/auth/auth.service.js';
import { criarTurmasService } from '../src/modules/turmas/turmas.service.js';
import { criarCriancasService } from '../src/modules/criancas/criancas.service.js';
import { criarChamadasService } from '../src/modules/chamadas/chamadas.service.js';

export const JWT_SECRET_TESTE = 'segredo-de-teste-com-mais-de-32-caracteres';
export const CUSTO_HASH_TESTE = 4;

export function criarBancoEmMemoria() {
  const banco = { usuarios: [], turmas: [], atividades: [], criancas: [], chamadas: [], presencas: [] };

  const usuarioRepository = {
    async buscarPorEmail(email) {
      return banco.usuarios.find((u) => u.email === email) ?? null;
    },
    async buscarPorId(id) {
      return banco.usuarios.find((u) => u.id === id) ?? null;
    },
    async criar(dados) {
      const usuario = { id: randomUUID(), ativo: true, versaoToken: 0, ...dados };
      banco.usuarios.push(usuario);
      return usuario;
    },
    async incrementarVersaoToken(id) {
      const usuario = banco.usuarios.find((u) => u.id === id);
      usuario.versaoToken += 1;
      return usuario;
    },
  };

  const turmasRepository = {
    async listarAtivas() {
      return banco.turmas.filter((t) => t.ativa);
    },
    async buscarPorId(id) {
      return banco.turmas.find((t) => t.id === id) ?? null;
    },
    async buscarPorNome(nome) {
      return banco.turmas.find((t) => t.nome === nome) ?? null;
    },
    async criar(dados) {
      const turma = { id: randomUUID(), ativa: true, ...dados };
      banco.turmas.push(turma);
      return turma;
    },
    async listarAtividades(idTurma) {
      return banco.atividades.filter((a) => a.idTurma === idTurma && a.ativa);
    },
    async criarAtividade(dados) {
      const atividade = { id: randomUUID(), ativa: true, ...dados };
      banco.atividades.push(atividade);
      return atividade;
    },
  };

  const criancasRepository = {
    async listarPorTurma(idTurma) {
      return banco.criancas.filter((c) => c.idTurma === idTurma && c.ativo);
    },
    async criarComResponsavel({ responsavel, ...dados }) {
      const crianca = { id: randomUUID(), ativo: true, ...dados, responsavel: { id: randomUUID(), ...responsavel } };
      banco.criancas.push(crianca);
      return crianca;
    },
  };

  const chamadasRepository = {
    async buscarAtividade(id) {
      return banco.atividades.find((a) => a.id === id) ?? null;
    },
    async idsCriancasAtivasDaTurma(idTurma) {
      return new Set(banco.criancas.filter((c) => c.idTurma === idTurma && c.ativo).map((c) => c.id));
    },
    async salvar({ id, idAtividade, data, idUsuario, criadoNoAparelhoEm, presencas }) {
      const existente = banco.chamadas.find(
        (c) => c.idAtividade === idAtividade && c.data.getTime() === data.getTime(),
      );
      const idChamada = existente?.id ?? id;
      if (!existente) banco.chamadas.push({ id, idAtividade, data, idUsuario, criadoNoAparelhoEm });

      for (const { idCrianca, status } of presencas) {
        const presenca = banco.presencas.find((p) => p.idChamada === idChamada && p.idCrianca === idCrianca);
        if (presenca) presenca.status = status;
        else banco.presencas.push({ idChamada, idCrianca, status });
      }

      return { id: idChamada, situacao: existente ? 'atualizada' : 'criada' };
    },
  };

  return { banco, usuarioRepository, turmasRepository, criancasRepository, chamadasRepository };
}

export function criarAmbienteDeTeste({ agora, proxiesConfiaveis = 0 } = {}) {
  const repos = criarBancoEmMemoria();

  const authService = criarAuthService({
    usuarioRepository: repos.usuarioRepository,
    jwtSecret: JWT_SECRET_TESTE,
    custoHash: CUSTO_HASH_TESTE,
  });
  const turmasService = criarTurmasService({ turmasRepository: repos.turmasRepository });
  const criancasService = criarCriancasService({
    criancasRepository: repos.criancasRepository,
    turmasService,
    ...(agora && { agora }),
  });
  const chamadasService = criarChamadasService({
    chamadasRepository: repos.chamadasRepository,
    ...(agora && { agora }),
  });

  const services = { authService, turmasService, criancasService, chamadasService };
  return { ...repos, services, app: criarApp({ services, proxiesConfiaveis }) };
}

export async function criarUsuarioDeTeste(usuarioRepository, { perfil = 'coordenacao', senha = 'senha-de-teste-123' } = {}) {
  return usuarioRepository.criar({
    nome: `Usuário ${perfil}`,
    email: `${perfil}@exemplo.org`,
    senhaHash: await bcrypt.hash(senha, CUSTO_HASH_TESTE),
    perfil,
  });
}
