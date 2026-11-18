import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import request from 'supertest';
import { criarApp } from '../src/app.js';
import { criarAmbienteDeTeste } from './apoio.js';

// App cujo serviço de turmas lança o erro informado, para testar o tratador de erros.
function appQueLanca(erro) {
  const { services } = criarAmbienteDeTeste();
  services.authService.verificarToken = async () => ({ id: 'u1', perfil: 'coordenacao' });
  services.turmasService.listar = async () => {
    throw erro;
  };
  return criarApp({ services });
}

const listarTurmas = (app) => request(app).get('/turmas').set('Authorization', 'Bearer qualquer');

describe('Tratamento de erros', () => {
  it('responde 404 em JSON para rota inexistente', async () => {
    const resposta = await request(criarAmbienteDeTeste().app).get('/nao-existe');

    assert.equal(resposta.status, 404);
    assert.deepEqual(resposta.body, { erro: 'Rota não encontrada' });
  });

  it('responde 400 para JSON malformado', async () => {
    const resposta = await request(criarAmbienteDeTeste().app)
      .post('/auth/login')
      .set('Content-Type', 'application/json')
      .send('{"email": ');

    assert.equal(resposta.status, 400);
    assert.deepEqual(resposta.body, { erro: 'JSON malformado' });
  });

  it('responde 413 para corpo acima do limite', async () => {
    const resposta = await request(criarAmbienteDeTeste().app)
      .post('/auth/login')
      .send({ email: 'a@exemplo.org', senha: 'x'.repeat(300_000) });

    assert.equal(resposta.status, 413);
  });

  it('converte violação de unicidade do Prisma (P2002) em 409', async () => {
    const resposta = await listarTurmas(appQueLanca(Object.assign(new Error('unique'), { code: 'P2002' })));

    assert.equal(resposta.status, 409);
  });

  it('converte registro inexistente do Prisma (P2025) em 404', async () => {
    const resposta = await listarTurmas(appQueLanca(Object.assign(new Error('not found'), { code: 'P2025' })));

    assert.equal(resposta.status, 404);
  });

  it('esconde detalhes de erros inesperados do cliente', async () => {
    const erroOriginal = console.error;
    console.error = () => {};
    try {
      const resposta = await listarTurmas(appQueLanca(new Error('senha do banco: segredo123')));

      assert.equal(resposta.status, 500);
      assert.deepEqual(resposta.body, { erro: 'Erro interno do servidor' });
      assert.doesNotMatch(resposta.text, /segredo123/);
    } finally {
      console.error = erroOriginal;
    }
  });

  it('não expõe o cabeçalho X-Powered-By e envia cabeçalhos de segurança', async () => {
    const resposta = await request(criarAmbienteDeTeste().app).get('/saude');

    assert.equal(resposta.status, 200);
    assert.equal(resposta.headers['x-powered-by'], undefined);
    assert.equal(resposta.headers['x-content-type-options'], 'nosniff');
  });
});
