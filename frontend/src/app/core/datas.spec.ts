import { describe, expect, it } from 'vitest';
import { diaPorExtenso, hojeIso, nomeCurto } from './datas';

describe('datas', () => {
  it('hojeIso usa a data local, não a UTC (23h em Joinville ainda é o mesmo dia)', () => {
    const noite = new Date(2026, 10, 17, 23, 30);
    expect(hojeIso(noite)).toBe('2026-11-17');
  });

  it('diaPorExtenso mostra o dia da semana sem "-feira"', () => {
    expect(diaPorExtenso('2026-11-17')).toBe('terça, 17/11');
  });

  it('nomeCurto mostra o primeiro nome e a inicial do último sobrenome', () => {
    expect(nomeCurto('Alice Martins')).toBe('Alice M.');
    expect(nomeCurto('João Pedro Alves')).toBe('João A.');
    expect(nomeCurto('Kauã')).toBe('Kauã');
  });
});
