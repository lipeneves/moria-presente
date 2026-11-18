import { Component, input } from '@angular/core';
import { RouterLink } from '@angular/router';
import { PainelAcessibilidade } from './painel-acessibilidade';

/** Cabeçalho azul das telas: título, subtítulo, link de voltar opcional e ações (projeção de conteúdo). */
@Component({
  selector: 'app-cabecalho',
  imports: [RouterLink, PainelAcessibilidade],
  template: `
    <header class="cabecalho">
      <div class="linha">
        @if (voltarPara()) {
          <a class="voltar" [routerLink]="voltarPara()">
            <span aria-hidden="true">←</span> Voltar
          </a>
        }
        <div class="titulos">
          <h1>{{ titulo() }}</h1>
          @if (subtitulo()) {
            <p class="subtitulo">{{ subtitulo() }}</p>
          }
        </div>
        <ng-content />
      </div>
      <div class="acessibilidade">
        <app-painel-acessibilidade />
      </div>
    </header>
  `,
  styles: `
    .cabecalho {
      position: relative;
      background: var(--cor-primaria);
      color: var(--cor-sobre-primaria);
      padding: 0.875rem 1rem 0.75rem;
      border-bottom: var(--espessura-borda) solid var(--cor-borda);
    }
    .linha {
      display: flex;
      align-items: center;
      gap: 0.75rem;
    }
    .titulos {
      flex: 1;
      min-width: 0;
    }
    h1 {
      font-size: 1.5rem;
      line-height: 1.2;
    }
    .subtitulo {
      font-size: 1rem;
      opacity: 0.95;
    }
    .voltar {
      display: inline-flex;
      align-items: center;
      gap: 0.25rem;
      min-height: var(--alvo-toque);
      padding: 0 0.25rem;
      color: var(--cor-sobre-primaria);
      font-weight: 800;
      font-size: 1.125rem;
      text-decoration: none;
      white-space: nowrap;
    }
    .acessibilidade {
      margin-top: 0.625rem;
      display: flex;
      justify-content: flex-end;
    }
  `,
})
export class Cabecalho {
  readonly titulo = input.required<string>();
  readonly subtitulo = input<string>();
  readonly voltarPara = input<string>();
}
