import { describe, it, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import request from 'supertest';
import { criarAmbienteDeTeste, criarUsuarioDeTeste } from './apoio.js';

describe('Autenticação (RF01)', () => {
  let ambiente;

  beforeEach(async () => {
    ambiente = criarAmbienteDeTeste();
    await criarUsuarioDeTeste(ambiente.usuarioRepository, { perfil: 'coordenacao' });
    await criarUsuarioDeTeste(ambiente.usuarioRepository, { perfil: 'educador' });
  });

  async function login(email, senha = 'senha-de-teste-123') {
    return request(ambiente.app).post('/auth/login').send({ email, senha });
  }

  it('faz login com e-mail e senha corretos e não devolve o hash da senha', async () => {
    const resposta = await login('COORDENACAO@exemplo.org ');

    assert.equal(resposta.status, 200);
    assert.ok(resposta.body.token);
    assert.equal(resposta.body.usuario.perfil, 'coordenacao');
    assert.equal(resposta.body.usuario.senhaHash, undefined);
  });

  it('recusa senha errada e e-mail inexistente com a mesma mensagem', async () => {
    const senhaErrada = await login('coordenacao@exemplo.org', 'senha-errada');
    const emailInexistente = await login('ninguem@exemplo.org');

    assert.equal(senhaErrada.status, 401);
    assert.equal(emailInexistente.status, 401);
    assert.deepEqual(senhaErrada.body, emailInexistente.body);
  });

  it('bloqueia rotas protegidas sem token ou com token adulterado', async () => {
    const semToken = await request(ambiente.app).get('/turmas');
    const tokenAdulterado = await request(ambiente.app)
      .get('/turmas')
      .set('Authorization', 'Bearer abc.def.ghi');

    assert.equal(semToken.status, 401);
    assert.equal(tokenAdulterado.status, 401);
  });

  it('invalida o token depois do logout', async () => {
    const { token } = (await login('educador@exemplo.org')).body;
    const autorizado = (r) => r.set('Authorization', `Bearer ${token}`);

    assert.equal((await autorizado(request(ambiente.app).get('/turmas'))).status, 200);
    assert.equal((await autorizado(request(ambiente.app).post('/auth/sair'))).status, 204);
    assert.equal((await autorizado(request(ambiente.app).get('/turmas'))).status, 401);
  });

  it('bloqueia o IP após 10 tentativas de login, sem afetar outros IPs atrás do mesmo proxy', async () => {
    const atrasDoProxy = criarAmbienteDeTeste({ proxiesConfiaveis: 1 });
    await criarUsuarioDeTeste(atrasDoProxy.usuarioRepository, { perfil: 'educador' });
    const tentar = (ip, senha) =>
      request(atrasDoProxy.app)
        .post('/auth/login')
        .set('X-Forwarded-For', ip)
        .send({ email: 'educador@exemplo.org', senha });

    for (let i = 0; i < 10; i++) {
      assert.equal((await tentar('203.0.113.10', 'senha-errada')).status, 401);
    }

    assert.equal((await tentar('203.0.113.10', 'senha-de-teste-123')).status, 429);
    assert.equal((await tentar('198.51.100.20', 'senha-de-teste-123')).status, 200);
  });

  it('impede educador de cadastrar usuários', async () => {
    const { token } = (await login('educador@exemplo.org')).body;

    const resposta = await request(ambiente.app)
      .post('/usuarios')
      .set('Authorization', `Bearer ${token}`)
      .send({ nome: 'Novo Educador', email: 'novo@exemplo.org', senha: 'senha-forte-123', perfil: 'educador' });

    assert.equal(resposta.status, 403);
  });

  it('coordenação cadastra usuário e a senha é guardada como hash bcrypt', async () => {
    const { token } = (await login('coordenacao@exemplo.org')).body;

    const resposta = await request(ambiente.app)
      .post('/usuarios')
      .set('Authorization', `Bearer ${token}`)
      .send({ nome: 'Novo Educador', email: 'novo@exemplo.org', senha: 'senha-forte-123', perfil: 'educador' });

    assert.equal(resposta.status, 201);
    const salvo = await ambiente.usuarioRepository.buscarPorEmail('novo@exemplo.org');
    assert.match(salvo.senhaHash, /^\$2[aby]\$/);
    assert.notEqual(salvo.senhaHash, 'senha-forte-123');
  });
});
