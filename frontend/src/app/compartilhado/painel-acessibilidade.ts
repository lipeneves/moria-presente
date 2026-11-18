import { Component, ElementRef, inject, signal, viewChild } from '@angular/core';
import { AcessibilidadeService } from '../core/acessibilidade.service';
import { AnunciadorService } from '../core/anunciador.service';

/**
 * Botão "Acessibilidade" do cabeçalho com o painel de ajustes:
 * alto contraste (interruptor) e tamanho do texto (A− / A+).
 */
@Component({
  selector: 'app-painel-acessibilidade',
  template: `
    <button
      #gatilho
      type="button"
      class="gatilho"
      [attr.aria-expanded]="aberto()"
      aria-controls="painel-acessibilidade"
      (click)="alternar()"
    >
      <svg aria-hidden="true" viewBox="0 0 24 24" width="22" height="22">
        <circle cx="12" cy="4" r="2" fill="currentColor" />
        <path d="M4 8h16M12 8v6m0 0-4 7m4-7 4 7" stroke="currentColor" stroke-width="2" fill="none" stroke-linecap="round" />
      </svg>
      <span>Acessibilidade</span>
    </button>

    @if (aberto()) {
      <section
        id="painel-acessibilidade"
        class="painel"
        role="region"
        aria-labelledby="titulo-acessibilidade"
        (keydown.escape)="fechar()"
      >
        <h2 id="titulo-acessibilidade">Ajustes de acessibilidade</h2>

        <div class="linha">
          <span id="rotulo-contraste" class="rotulo">Alto contraste</span>
          <button
            type="button"
            role="switch"
            class="interruptor"
            aria-labelledby="rotulo-contraste"
            [attr.aria-checked]="a11y.altoContraste()"
            (click)="alternarContraste()"
          >
            <span class="trilho" aria-hidden="true"><span class="bolinha"></span></span>
            <span class="estado">{{ a11y.altoContraste() ? 'Ligado' : 'Desligado' }}</span>
          </button>
        </div>

        <div class="linha">
          <span id="rotulo-texto" class="rotulo">Tamanho do texto</span>
          <div class="grupo-texto" role="group" aria-labelledby="rotulo-texto">
            <button type="button" class="botao-texto" aria-label="Diminuir texto" (click)="diminuir()">A−</button>
            <output class="valor" aria-live="off">{{ a11y.escalaFonte() }}%</output>
            <button type="button" class="botao-texto" aria-label="Aumentar texto" (click)="aumentar()">A+</button>
          </div>
        </div>

        <button type="button" class="botao fechar" (click)="fechar()">Fechar ajustes</button>
      </section>
    }
  `,
  styles: `
    :host {
      display: contents;
    }
    .gatilho {
      display: inline-flex;
      align-items: center;
      gap: 0.375rem;
      min-height: var(--alvo-toque);
      padding: 0.5rem 0.75rem;
      border-radius: var(--raio);
      border: 0.125rem solid var(--cor-sobre-primaria);
      background: transparent;
      color: var(--cor-sobre-primaria);
      font-weight: 700;
    }
    .painel {
      position: absolute;
      left: 0;
      right: 0;
      top: 100%;
      z-index: 20;
      margin: 0 auto;
      max-width: 40rem;
      padding: 1rem;
      display: flex;
      flex-direction: column;
      gap: 1rem;
      background: var(--cor-superficie);
      color: var(--cor-texto);
      border: var(--espessura-borda) solid var(--cor-borda);
      border-top: none;
      box-shadow: 0 0.75rem 1.5rem rgb(0 0 0 / 0.18);
    }
    h2 {
      font-size: 1.125rem;
    }
    .linha {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 1rem;
      flex-wrap: wrap;
    }
    .rotulo {
      font-weight: 700;
      font-size: 1.0625rem;
    }
    .interruptor {
      display: inline-flex;
      align-items: center;
      gap: 0.625rem;
      min-height: var(--alvo-toque);
      padding: 0.25rem 0.5rem;
      border: none;
      background: transparent;
      font-weight: 700;
    }
    .trilho {
      width: 3.25rem;
      height: 1.875rem;
      border-radius: 999px;
      background: #8a9aab;
      position: relative;
      border: 0.125rem solid var(--cor-borda);
    }
    .bolinha {
      position: absolute;
      top: 0.125rem;
      left: 0.125rem;
      width: 1.375rem;
      height: 1.375rem;
      border-radius: 50%;
      background: #ffffff;
      transition: transform 0.15s;
    }
    .interruptor[aria-checked='true'] .trilho {
      background: var(--cor-presente);
    }
    .interruptor[aria-checked='true'] .bolinha {
      transform: translateX(1.375rem);
      background: #000000;
    }
    .grupo-texto {
      display: inline-flex;
      align-items: center;
      gap: 0.5rem;
    }
    .botao-texto {
      min-width: var(--alvo-toque);
      min-height: var(--alvo-toque);
      border-radius: var(--raio);
      border: 0.125rem solid var(--cor-primaria);
      background: var(--cor-superficie);
      color: var(--cor-primaria);
      font-weight: 800;
      font-size: 1.125rem;
    }
    :host-context(.alto-contraste) .botao-texto {
      border-color: #ffff00;
      color: #ffff00;
    }
    .valor {
      min-width: 3.5rem;
      text-align: center;
      font-weight: 800;
      font-size: 1.125rem;
    }
    .fechar {
      align-self: stretch;
    }
  `,
})
export class PainelAcessibilidade {
  protected readonly a11y = inject(AcessibilidadeService);
  private readonly anunciador = inject(AnunciadorService);
  private readonly gatilho = viewChild.required<ElementRef<HTMLButtonElement>>('gatilho');

  protected readonly aberto = signal(false);

  alternar(): void {
    this.aberto.update((v) => !v);
  }

  fechar(): void {
    this.aberto.set(false);
    this.gatilho().nativeElement.focus();
  }

  alternarContraste(): void {
    this.a11y.alternarAltoContraste();
    this.anunciador.anunciar(`Alto contraste ${this.a11y.altoContraste() ? 'ligado' : 'desligado'}`);
  }

  aumentar(): void {
    const mudou = this.a11y.aumentarTexto();
    this.anunciador.anunciar(mudou ? `Texto em ${this.a11y.escalaFonte()}%` : 'O texto já está no tamanho máximo');
  }

  diminuir(): void {
    const mudou = this.a11y.diminuirTexto();
    this.anunciador.anunciar(mudou ? `Texto em ${this.a11y.escalaFonte()}%` : 'O texto já está no tamanho mínimo');
  }
}
