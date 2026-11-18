import { describe, it, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import request from 'supertest';
import { criarAmbienteDeTeste, criarUsuarioDeTeste } from './apoio.js';

describe('Sincronização de chamadas offline (RF04 e RF05)', () => {
  let ambiente;
  let token;
  let atividade;
  let criancas;

  beforeEach(async () => {
    ambiente = criarAmbienteDeTeste({ agora: () => new Date('2026-11-17T18:00:00Z') });
    await criarUsuarioDeTeste(ambiente.usuarioRepository, { perfil: 'educador' });
    token = (
      await request(ambiente.app)
        .post('/auth/login')
        .send({ email: 'educador@exemplo.org', senha: 'senha-de-teste-123' })
    ).body.token;

    const turma = await ambiente.turmasRepository.criar({ nome: 'Turma Girassol', turno: 'tarde' });
    atividade = await ambiente.turmasRepository.criarAtividade({ idTurma: turma.id, nome: 'Futebol', tipo: 'esporte' });
    criancas = [];
    for (const nome of ['Ana', 'Bruno', 'Carla']) {
      criancas.push(await ambiente.criancasRepository.criarComResponsavel({ nome, idTurma: turma.id, responsavel: {} }));
    }
  });

  function chamada(sobrescrever = {}) {
    return {
      id: randomUUID(),
      idAtividade: atividade.id,
      data: '2026-11-17',
      criadoNoAparelhoEm: '2026-11-17T14:05:00-03:00',
      presencas: criancas.map((c) => ({ idCrianca: c.id, status: 'presente' })),
      ...sobrescrever,
    };
  }

  function sincronizar(chamadas) {
    return request(ambiente.app)
      .post('/chamadas/sincronizar')
      .set('Authorization', `Bearer ${token}`)
      .send({ chamadas });
  }

  it('grava uma chamada nova com todas as presenças', async () => {
    const resposta = await sincronizar([chamada()]);

    assert.equal(resposta.status, 200);
    assert.equal(resposta.body.resultados[0].situacao, 'criada');
    assert.equal(ambiente.banco.chamadas.length, 1);
    assert.equal(ambiente.banco.presencas.length, 3);
  });

  it('reenviar a mesma chamada não duplica registros', async () => {
    const mesma = chamada();

    await sincronizar([mesma]);
    const reenvio = await sincronizar([mesma]);

    assert.equal(reenvio.body.resultados[0].situacao, 'atualizada');
    assert.equal(ambiente.banco.chamadas.length, 1);
    assert.equal(ambiente.banco.presencas.length, 3);
  });

  it('dois aparelhos na mesma atividade e dia mesclam na mesma chamada', async () => {
    const primeira = chamada();
    await sincronizar([primeira]);

    const segunda = chamada({ presencas: [{ idCrianca: criancas[0].id, status: 'falta' }] });
    const resposta = await sincronizar([segunda]);

    assert.equal(resposta.body.resultados[0].id, primeira.id);
    assert.equal(ambiente.banco.chamadas.length, 1);
    const statusAna = ambiente.banco.presencas.find((p) => p.idCrianca === criancas[0].id).status;
    assert.equal(statusAna, 'falta');
  });

  it('rejeita só a chamada com criança de outra turma e grava as demais do lote', async () => {
    const valida = chamada();
    const invalida = chamada({
      data: '2026-11-16',
      presencas: [{ idCrianca: randomUUID(), status: 'presente' }],
    });

    const resposta = await sincronizar([valida, invalida]);

    assert.equal(resposta.status, 200);
    assert.deepEqual(
      resposta.body.resultados.map((r) => r.situacao),
      ['criada', 'rejeitada'],
    );
    assert.equal(ambiente.banco.chamadas.length, 1);
  });

  it('rejeita chamada em data futura', async () => {
    const resposta = await sincronizar([chamada({ data: '2026-11-18' })]);

    assert.equal(resposta.body.resultados[0].situacao, 'rejeitada');
    assert.equal(ambiente.banco.chamadas.length, 0);
  });

  it('recusa criança repetida na mesma chamada', async () => {
    const repetida = chamada({
      presencas: [
        { idCrianca: criancas[0].id, status: 'presente' },
        { idCrianca: criancas[0].id, status: 'falta' },
      ],
    });

    const resposta = await sincronizar([repetida]);

    assert.equal(resposta.status, 400);
  });

  it('recusa status de presença fora da lista permitida', async () => {
    const resposta = await sincronizar([
      chamada({ presencas: [{ idCrianca: criancas[0].id, status: "presente'; DROP TABLE presenca;--" }] }),
    ]);

    assert.equal(resposta.status, 400);
    assert.equal(ambiente.banco.chamadas.length, 0);
  });
});
