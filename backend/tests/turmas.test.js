import { describe, it, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import request from 'supertest';
import { criarAmbienteDeTeste, criarUsuarioDeTeste } from './apoio.js';

describe('Turmas e atividades (RF02)', () => {
  let ambiente;
  let tokenCoordenacao;
  let tokenEducador;

  beforeEach(async () => {
    ambiente = criarAmbienteDeTeste();
    await criarUsuarioDeTeste(ambiente.usuarioRepository, { perfil: 'coordenacao' });
    await criarUsuarioDeTeste(ambiente.usuarioRepository, { perfil: 'educador' });
    const login = async (email) =>
      (await request(ambiente.app).post('/auth/login').send({ email, senha: 'senha-de-teste-123' })).body.token;
    tokenCoordenacao = await login('coordenacao@exemplo.org');
    tokenEducador = await login('educador@exemplo.org');
  });

  const como = (token, req) => req.set('Authorization', `Bearer ${token}`);
  const criarTurma = (corpo, token = tokenCoordenacao) =>
    como(token, request(ambiente.app).post('/turmas')).send(corpo);

  it('coordenação cadastra turma e educador consegue listar', async () => {
    const criada = await criarTurma({ nome: 'Turma Girassol', turno: 'tarde' });
    const lista = await como(tokenEducador, request(ambiente.app).get('/turmas'));

    assert.equal(criada.status, 201);
    assert.equal(lista.status, 200);
    assert.deepEqual(lista.body.map((t) => t.nome), ['Turma Girassol']);
  });

  it('recusa turma com nome repetido', async () => {
    await criarTurma({ nome: 'Turma Girassol', turno: 'tarde' });
    const repetida = await criarTurma({ nome: 'Turma Girassol', turno: 'manha' });

    assert.equal(repetida.status, 409);
  });

  it('recusa turno fora de manhã/tarde', async () => {
    const resposta = await criarTurma({ nome: 'Turma Noturna', turno: 'noite' });

    assert.equal(resposta.status, 400);
    assert.equal(resposta.body.detalhes[0].campo, 'body.turno');
  });

  it('impede educador de cadastrar turma', async () => {
    const resposta = await criarTurma({ nome: 'Turma Girassol', turno: 'tarde' }, tokenEducador);

    assert.equal(resposta.status, 403);
  });

  it('cadastra e lista atividades da turma', async () => {
    const turma = (await criarTurma({ nome: 'Turma Girassol', turno: 'tarde' })).body;

    const criada = await como(tokenCoordenacao, request(ambiente.app).post(`/turmas/${turma.id}/atividades`)).send({
      nome: 'Futebol',
      tipo: 'esporte',
    });
    const lista = await como(tokenEducador, request(ambiente.app).get(`/turmas/${turma.id}/atividades`));

    assert.equal(criada.status, 201);
    assert.equal(criada.body.idTurma, turma.id);
    assert.deepEqual(lista.body.map((a) => a.nome), ['Futebol']);
  });

  it('devolve 404 para atividades de turma inexistente', async () => {
    const resposta = await como(
      tokenEducador,
      request(ambiente.app).get('/turmas/00000000-0000-4000-8000-000000000000/atividades'),
    );

    assert.equal(resposta.status, 404);
  });

  it('devolve 400 para identificador de turma malformado', async () => {
    const resposta = await como(tokenEducador, request(ambiente.app).get("/turmas/1' OR '1'='1/atividades"));

    assert.equal(resposta.status, 400);
  });

  it('lista as crianças da turma para a chamada', async () => {
    const turma = (await criarTurma({ nome: 'Turma Girassol', turno: 'tarde' })).body;
    await ambiente.criancasRepository.criarComResponsavel({ nome: 'Ana', idTurma: turma.id, responsavel: {} });

    const resposta = await como(tokenEducador, request(ambiente.app).get(`/criancas?idTurma=${turma.id}`));

    assert.equal(resposta.status, 200);
    assert.deepEqual(resposta.body.map((c) => c.nome), ['Ana']);
  });
});
