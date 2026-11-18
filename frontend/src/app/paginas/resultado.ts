import { Component, computed, inject, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { AnunciadorService } from '../core/anunciador.service';
import { ChamadasService } from '../core/chamadas.service';
import { ConexaoService } from '../core/conexao.service';
import { diaPorExtenso, horaCurta } from '../core/datas';
import { ChamadaLocal } from '../core/modelos';
import { Cabecalho } from '../compartilhado/cabecalho';
import { FaixaConexao } from '../compartilhado/faixa-conexao';

@Component({
  selector: 'app-resultado',
  imports: [RouterLink, Cabecalho, FaixaConexao],
  template: `
    <div class="pagina">
      <app-cabecalho titulo="Resultado da chamada" [subtitulo]="subtitulo()" />
      <app-faixa-conexao />

      <main id="conteudo" class="conteudo" tabindex="-1">
        @if (chamada(); as c) {
          <section class="cartao status" [class.enviada]="enviada()" role="status" aria-live="polite">
            @if (enviada()) {
              <h2><span aria-hidden="true">✓</span> Chamada sincronizada</h2>
              <p>Enviada ao sistema às {{ horaEnvio() }}</p>
            } @else if (rejeitada()) {
              <h2><span aria-hidden="true">⚠</span> Chamada recusada pelo servidor</h2>
              <p>{{ rejeitada() }}</p>
            } @else {
              <h2><span aria-hidden="true">◷</span> Chamada salva no aparelho</h2>
              <p>Será enviada automaticamente quando houver internet</p>
            }
            <ul class="totais" role="list" aria-label="Totais da chamada">
              <li class="selo selo-presente"><span aria-hidden="true">✓</span> {{ totais().presente }} {{ totais().presente === 1 ? 'presente' : 'presentes' }}</li>
              <li class="selo selo-falta"><span aria-hidden="true">✕</span> {{ totais().falta }} {{ totais().falta === 1 ? 'falta' : 'faltas' }}</li>
              <li class="selo selo-justificada"><span aria-hidden="true">J</span> {{ totais().justificada }} {{ totais().justificada === 1 ? 'justificada' : 'justificadas' }}</li>
            </ul>
          </section>

          <section class="cartao pendentes" aria-labelledby="titulo-pendentes">
            <div>
              <h2 id="titulo-pendentes">Chamadas pendentes: {{ chamadas.totalPendentes() }}</h2>
              <p class="suave">{{ chamadas.totalPendentes() === 0 ? 'Tudo enviado' : 'Aguardando internet' }}</p>
            </div>
            <button type="button" class="botao" [disabled]="chamadas.sincronizando()" (click)="sincronizarAgora()">
              <span aria-hidden="true">↻</span> {{ chamadas.sincronizando() ? 'Enviando…' : 'Sincronizar agora' }}
            </button>
          </section>
        } @else {
          <p class="cartao">Nenhuma chamada para mostrar.</p>
        }
      </main>

      <div class="acoes">
        <a class="botao botao-primario botao-largo link-botao" [routerLink]="['/']">
          <span aria-hidden="true">+</span> Nova chamada
        </a>
        <a class="botao botao-largo link-botao" [routerLink]="['/']">Voltar ao início</a>
      </div>
    </div>
  `,
  styles: `
    .status {
      display: flex;
      flex-direction: column;
      gap: 0.5rem;
      border: 0.125rem solid var(--cor-aviso-borda);
      background: var(--cor-aviso-fundo);
    }
    .status.enviada {
      border-color: var(--cor-presente);
      background: var(--cor-presente-fundo);
    }
    .status h2 {
      font-size: 1.375rem;
    }
    .status.enviada h2 {
      color: var(--cor-presente);
    }
    .totais {
      list-style: none;
      margin: 0.5rem 0 0;
      padding: 0;
      display: flex;
      flex-wrap: wrap;
      gap: 0.5rem;
    }
    .pendentes {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 1rem;
      flex-wrap: wrap;
    }
    .pendentes h2 {
      font-size: 1.1875rem;
    }
    .suave {
      color: var(--cor-texto-suave);
    }
    .acoes {
      display: flex;
      flex-direction: column;
      gap: 0.75rem;
      padding: 0.75rem 1rem 1rem;
      border-top: var(--espessura-borda) solid var(--cor-borda);
      background: var(--cor-superficie);
    }
    .link-botao {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 0.5rem;
      text-decoration: none;
    }
  `,
})
export class Resultado {
  protected readonly chamadas = inject(ChamadasService);
  private readonly conexao = inject(ConexaoService);
  private readonly anunciador = inject(AnunciadorService);

  protected readonly chamada = signal<ChamadaLocal | undefined>(
    inject(Router).currentNavigation()?.extras.state?.['chamada'] ?? history.state?.chamada,
  );

  protected readonly totais = computed(() => {
    const t = { presente: 0, falta: 0, justificada: 0 };
    for (const p of this.chamada()?.presencas ?? []) t[p.status] += 1;
    return t;
  });

  /** A chamada saiu da fila do aparelho = o servidor aceitou. */
  protected readonly enviada = computed(() => {
    const id = this.chamada()?.id;
    return !!id && !this.chamadas.pendentes().some((p) => p.id === id) && this.chamadas.ultimaSincronizacao() !== null;
  });
  protected readonly rejeitada = computed(
    () => this.chamadas.pendentes().find((p) => p.id === this.chamada()?.id)?.motivoRejeicao ?? '',
  );
  protected readonly horaEnvio = computed(() => horaCurta(this.chamadas.ultimaSincronizacao() ?? new Date()));

  protected readonly subtitulo = computed(() => {
    const c = this.chamada();
    if (!c) return '';
    const nome = this.chamadas.atividade(c.idAtividade)?.atividade.nome ?? 'Atividade';
    return `${nome} · ${diaPorExtenso(c.data)}`;
  });

  protected async sincronizarAgora(): Promise<void> {
    if (!this.conexao.online()) {
      this.anunciador.anunciar('Sem internet. A chamada continua salva no aparelho.');
      return;
    }
    const ok = await this.chamadas.sincronizar();
    this.anunciador.anunciar(ok ? 'Chamadas enviadas ao sistema' : 'Não foi possível enviar agora');
  }
}
