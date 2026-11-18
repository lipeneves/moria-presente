import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import { criarChamadasRepository } from '../src/modules/chamadas/chamadas.repository.js';

// Prisma falso que registra as consultas feitas, para medir quantas idas ao banco a sincronização faz.
function criarPrismaFalso({ chamadaExistente = null, presencasExistentes = [], falharCriacaoUmaVez = false } = {}) {
  const consultas = [];
  let jaFalhou = false;
  let chamadaNoBanco = chamadaExistente;

  const registrar = (nome, retorno) => async (args) => {
    consultas.push(nome);
    return typeof retorno === 'function' ? retorno(args) : retorno;
  };

  const tx = {
    chamada: {
      findUnique: registrar('chamada.findUnique', () => chamadaNoBanco),
      update: registrar('chamada.update', {}),
      create: registrar('chamada.create', ({ data }) => {
        if (falharCriacaoUmaVez && !jaFalhou) {
          jaFalhou = true;
          // Simula outro aparelho criando a mesma chamada no meio da transação.
          chamadaNoBanco = { id: randomUUID() };
          throw Object.assign(new Error('Unique constraint failed'), { code: 'P2002' });
        }
        return data;
      }),
    },
    presenca: {
      findMany: registrar('presenca.findMany', presencasExistentes),
      createMany: registrar('presenca.createMany', {}),
      updateMany: registrar('presenca.updateMany', {}),
      upsert: registrar('presenca.upsert', {}),
    },
  };

  return { consultas, prisma: { $transaction: (fn) => fn(tx) } };
}

function chamadaCom(quantidadeDeCriancas) {
  return {
    id: randomUUID(),
    idAtividade: randomUUID(),
    data: new Date('2026-11-17T00:00:00Z'),
    idUsuario: randomUUID(),
    criadoNoAparelhoEm: new Date(),
    presencas: Array.from({ length: quantidadeDeCriancas }, () => ({ idCrianca: randomUUID(), status: 'presente' })),
  };
}

describe('Repositório de chamadas', () => {
  it('grava as presenças em lote, sem uma consulta por criança', async () => {
    const { prisma, consultas } = criarPrismaFalso();

    await criarChamadasRepository(prisma).salvar(chamadaCom(30));

    assert.equal(consultas.filter((c) => c.startsWith('presenca.')).length, 2);
    assert.equal(consultas.filter((c) => c === 'presenca.upsert').length, 0);
  });

  it('agrupa as alterações por status em vez de atualizar criança por criança', async () => {
    const chamada = chamadaCom(30);
    chamada.presencas.forEach((p, i) => (p.status = ['presente', 'falta', 'justificada'][i % 3]));
    const { prisma, consultas } = criarPrismaFalso({
      chamadaExistente: { id: chamada.id },
      presencasExistentes: chamada.presencas.map((p) => ({ idCrianca: p.idCrianca, status: 'presente' })),
    });

    const resultado = await criarChamadasRepository(prisma).salvar(chamada);

    assert.equal(resultado.situacao, 'atualizada');
    assert.equal(consultas.filter((c) => c === 'presenca.updateMany').length, 2);
    assert.equal(consultas.filter((c) => c === 'presenca.createMany').length, 0);
  });

  it('tenta de novo quando outro aparelho cria a mesma chamada ao mesmo tempo', async () => {
    const { prisma } = criarPrismaFalso({ falharCriacaoUmaVez: true });

    const resultado = await criarChamadasRepository(prisma).salvar(chamadaCom(5));

    assert.equal(resultado.situacao, 'atualizada');
  });
});
