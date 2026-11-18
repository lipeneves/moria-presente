import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { criarServices } from '../src/container.js';
import { criarUsuarioRepository } from '../src/modules/auth/usuario.repository.js';
import { criarTurmasRepository } from '../src/modules/turmas/turmas.repository.js';
import { criarCriancasRepository } from '../src/modules/criancas/criancas.repository.js';
import { criarChamadasRepository } from '../src/modules/chamadas/chamadas.repository.js';

// Prisma falso que guarda cada chamada (modelo.metodo + argumentos) para conferir as consultas geradas.
function criarPrismaEspiao(retornos = {}) {
  const chamadas = [];
  const modelo = (nome) =>
    new Proxy(
      {},
      {
        get: (_, metodo) => async (args) => {
          chamadas.push({ consulta: `${nome}.${metodo}`, args });
          return retornos[`${nome}.${metodo}`] ?? null;
        },
      },
    );

  const prisma = {
    usuario: modelo('usuario'),
    turma: modelo('turma'),
    atividade: modelo('atividade'),
    crianca: modelo('crianca'),
  };
  return { prisma, chamadas, ultima: () => chamadas.at(-1) };
}

describe('Repositórios Prisma', () => {
  it('usuário: busca por e-mail e id, cria e incrementa a versão do token', async () => {
    const espiao = criarPrismaEspiao();
    const repo = criarUsuarioRepository(espiao.prisma);

    await repo.buscarPorEmail('a@exemplo.org');
    assert.deepEqual(espiao.ultima(), { consulta: 'usuario.findUnique', args: { where: { email: 'a@exemplo.org' } } });

    await repo.buscarPorId('u1');
    assert.deepEqual(espiao.ultima().args, { where: { id: 'u1' } });

    await repo.criar({ nome: 'Ana' });
    assert.deepEqual(espiao.ultima(), { consulta: 'usuario.create', args: { data: { nome: 'Ana' } } });

    await repo.incrementarVersaoToken('u1');
    assert.deepEqual(espiao.ultima().args, { where: { id: 'u1' }, data: { versaoToken: { increment: 1 } } });
  });

  it('turmas: lista só turmas e atividades ativas', async () => {
    const espiao = criarPrismaEspiao();
    const repo = criarTurmasRepository(espiao.prisma);

    await repo.listarAtivas();
    assert.deepEqual(espiao.ultima().args.where, { ativa: true });

    await repo.buscarPorId('t1');
    assert.deepEqual(espiao.ultima().args, { where: { id: 't1' } });

    await repo.buscarPorNome('Girassol');
    assert.deepEqual(espiao.ultima().args, { where: { nome: 'Girassol' } });

    await repo.criar({ nome: 'Girassol', turno: 'tarde' });
    assert.equal(espiao.ultima().consulta, 'turma.create');

    await repo.listarAtividades('t1');
    assert.deepEqual(espiao.ultima().args.where, { idTurma: 't1', ativa: true });

    await repo.criarAtividade({ nome: 'Futebol' });
    assert.equal(espiao.ultima().consulta, 'atividade.create');
  });

  it('crianças: grava criança e responsável juntos e não expõe campos internos', async () => {
    const espiao = criarPrismaEspiao();
    const repo = criarCriancasRepository(espiao.prisma);

    await repo.criarComResponsavel({ nome: 'Ana', idTurma: 't1', responsavel: { nome: 'Maria' } });
    const { args } = espiao.ultima();
    assert.deepEqual(args.data.responsavel, { create: { nome: 'Maria' } });
    assert.equal(args.select.ativo, undefined);
    assert.equal(args.select.responsavel.select.consentimentoLgpd, undefined);

    await repo.listarPorTurma('t1');
    assert.deepEqual(espiao.ultima().args.where, { idTurma: 't1', ativo: true });
  });

  it('chamadas: busca atividade e devolve os ids das crianças ativas da turma', async () => {
    const espiao = criarPrismaEspiao({ 'crianca.findMany': [{ id: 'c1' }, { id: 'c2' }] });
    const repo = criarChamadasRepository(espiao.prisma);

    await repo.buscarAtividade('a1');
    assert.deepEqual(espiao.ultima(), { consulta: 'atividade.findUnique', args: { where: { id: 'a1' } } });

    const ids = await repo.idsCriancasAtivasDaTurma('t1');
    assert.deepEqual([...ids], ['c1', 'c2']);
  });

  it('chamadas: repassa erros que não são de corrida entre aparelhos', async () => {
    const prisma = {
      $transaction: async () => {
        throw Object.assign(new Error('conexão perdida'), { code: 'P1001' });
      },
    };

    await assert.rejects(criarChamadasRepository(prisma).salvar({ presencas: [] }), /conexão perdida/);
  });

  it('container monta os quatro services a partir do Prisma', () => {
    const services = criarServices({ prisma: criarPrismaEspiao().prisma, jwtSecret: 'x'.repeat(32) });

    assert.deepEqual(Object.keys(services).sort(), [
      'authService',
      'chamadasService',
      'criancasService',
      'turmasService',
    ]);
  });
});
