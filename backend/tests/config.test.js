import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { esquemaEnv } from '../src/config/esquemaEnv.js';

describe('Configuração (variáveis de ambiente)', () => {
  it('aceita configuração mínima e aplica os valores padrão', () => {
    const env = esquemaEnv.parse({ DATABASE_URL: 'postgresql://x', JWT_SECRET: 's'.repeat(32) });

    assert.equal(env.PORT, 3000);
    assert.equal(env.TRUST_PROXY, 0);
    assert.equal(env.CORS_ORIGIN, 'http://localhost:4200');
  });

  it('converte números vindos como texto do .env', () => {
    const env = esquemaEnv.parse({
      DATABASE_URL: 'postgresql://x',
      JWT_SECRET: 's'.repeat(32),
      PORT: '8080',
      TRUST_PROXY: '1',
    });

    assert.equal(env.PORT, 8080);
    assert.equal(env.TRUST_PROXY, 1);
  });

  it('recusa JWT_SECRET curto e DATABASE_URL ausente', () => {
    const resultado = esquemaEnv.safeParse({ JWT_SECRET: 'curto' });

    assert.equal(resultado.success, false);
    const campos = resultado.error.issues.map((p) => p.path[0]).sort();
    assert.deepEqual(campos, ['DATABASE_URL', 'JWT_SECRET']);
  });
});
