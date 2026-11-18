import { TestBed } from '@angular/core/testing';
import { beforeEach, describe, expect, it } from 'vitest';
import { AcessibilidadeService } from './acessibilidade.service';

describe('AcessibilidadeService', () => {
  beforeEach(() => {
    localStorage.clear();
    document.documentElement.className = '';
    document.documentElement.style.fontSize = '';
    TestBed.resetTestingModule();
  });

  function criar() {
    const servico = TestBed.inject(AcessibilidadeService);
    TestBed.tick(); // executa o effect que aplica as preferências no <html>
    return servico;
  }

  it('começa sem alto contraste e com texto em 100%', () => {
    const servico = criar();

    expect(servico.altoContraste()).toBe(false);
    expect(document.documentElement.style.fontSize).toBe('100%');
  });

  it('liga o alto contraste no <html> e salva a preferência', () => {
    const servico = criar();

    servico.alternarAltoContraste();
    TestBed.tick();

    expect(document.documentElement.classList.contains('alto-contraste')).toBe(true);
    expect(JSON.parse(localStorage.getItem('moria.acessibilidade')!).altoContraste).toBe(true);
  });

  it('aumenta e diminui o texto dentro dos limites de 100% a 175%', () => {
    const servico = criar();

    expect(servico.diminuirTexto()).toBe(false);
    for (let i = 0; i < 4; i++) expect(servico.aumentarTexto()).toBe(true);
    expect(servico.aumentarTexto()).toBe(false);
    TestBed.tick();

    expect(servico.escalaFonte()).toBe(175);
    expect(document.documentElement.style.fontSize).toBe('175%');
  });

  it('recupera as preferências salvas ao abrir o app de novo', () => {
    localStorage.setItem('moria.acessibilidade', JSON.stringify({ altoContraste: true, escalaFonte: 130 }));

    const servico = criar();

    expect(servico.altoContraste()).toBe(true);
    expect(servico.escalaFonte()).toBe(130);
  });

  it('ignora valor salvo inválido', () => {
    localStorage.setItem('moria.acessibilidade', JSON.stringify({ escalaFonte: 999 }));

    expect(criar().escalaFonte()).toBe(100);
  });
});
