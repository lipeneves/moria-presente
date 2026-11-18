import { describe, it, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import request from 'supertest';
import { criarAmbienteDeTeste, criarUsuarioDeTeste } from './apoio.js';

describe('Cadastro de crianças e responsáveis (RF03)', () => {
  let ambiente;
  let token;
  let turma;

  beforeEach(async () => {
    ambiente = criarAmbienteDeTeste({ agora: () => new Date('2026-11-17T12:00:00Z') });
    await criarUsuarioDeTeste(ambiente.usuarioRepository);
    token = (
      await request(ambiente.app)
        .post('/auth/login')
        .send({ email: 'coordenacao@exemplo.org', senha: 'senha-de-teste-123' })
    ).body.token;
    turma = await ambiente.turmasRepository.criar({ nome: 'Turma Girassol', turno: 'tarde' });
  });

  function criancaValida(sobrescrever = {}) {
    return {
      nome: 'Ana Clara Souza',
      dataNascimento: '2017-03-09',
      escola: 'Escola Municipal Exemplo',
      turnoEscolar: 'manha',
      idTurma: turma.id,
      responsavel: {
        nome: 'Maria Souza',
        telefone: '(47) 99999-0000',
        parentesco: 'mãe',
        consentimentoLgpd: true,
      },
      ...sobrescrever,
    };
  }

  function cadastrar(corpo) {
    return request(ambiente.app).post('/criancas').set('Authorization', `Bearer ${token}`).send(corpo);
  }

  it('cadastra criança com responsável e registra a data do consentimento', async () => {
    const resposta = await cadastrar(criancaValida());

    assert.equal(resposta.status, 201);
    const salva = ambiente.banco.criancas[0];
    assert.equal(salva.responsavel.telefone, '47999990000');
    assert.equal(salva.responsavel.dataConsentimento.toISOString(), '2026-11-17T12:00:00.000Z');
  });

  it('recusa o cadastro sem consentimento LGPD', async () => {
    const corpo = criancaValida();
    corpo.responsavel.consentimentoLgpd = false;

    const resposta = await cadastrar(corpo);

    assert.equal(resposta.status, 400);
    assert.ok(resposta.body.detalhes.some((d) => d.campo === 'body.responsavel.consentimentoLgpd'));
    assert.equal(ambiente.banco.criancas.length, 0);
  });

  it('recusa nome com HTML ou script', async () => {
    const resposta = await cadastrar(criancaValida({ nome: '<script>alert(1)</script>' }));

    assert.equal(resposta.status, 400);
    assert.equal(ambiente.banco.criancas.length, 0);
  });

  it('descarta campos que não estão no esquema (ex.: ativo, id)', async () => {
    const resposta = await cadastrar(criancaValida({ id: 'id-forjado', ativo: false }));

    assert.equal(resposta.status, 201);
    assert.notEqual(ambiente.banco.criancas[0].id, 'id-forjado');
    assert.equal(ambiente.banco.criancas[0].ativo, true);
  });

  it('recusa data de nascimento no futuro', async () => {
    const resposta = await cadastrar(criancaValida({ dataNascimento: '2030-01-01' }));

    assert.equal(resposta.status, 422);
  });

  it('devolve 404 para turma inexistente', async () => {
    const resposta = await cadastrar(criancaValida({ idTurma: '00000000-0000-4000-8000-000000000000' }));

    assert.equal(resposta.status, 404);
  });
});
