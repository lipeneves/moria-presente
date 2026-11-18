import { Component, OnInit, computed, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { AuthService } from '../core/auth.service';
import { ChamadasService } from '../core/chamadas.service';
import { diaPorExtenso, hojeIso, nomeCurto } from '../core/datas';
import { Cabecalho } from '../compartilhado/cabecalho';
import { FaixaConexao } from '../compartilhado/faixa-conexao';
import { IconeAtividade } from '../compartilhado/icone-atividade';

@Component({
  selector: 'app-inicio',
  imports: [RouterLink, Cabecalho, FaixaConexao, IconeAtividade],
  template: `
    <div class="pagina">
      <app-cabecalho titulo="Moriá Presente" [subtitulo]="subtitulo()">
        <button type="button" class="sair" (click)="auth.sair()">
          <span aria-hidden="true">⇥</span> Sair
        </button>
      </app-cabecalho>
      <app-faixa-conexao />

      <main id="conteudo" class="conteudo" tabindex="-1">
        <h2 class="titulo">Chamadas de hoje · {{ hoje }}</h2>

        @if (chamadas.atividades().length === 0) {
          <p class="cartao">Nenhuma atividade cadastrada para as suas turmas.</p>
        }

        <ul class="lista" role="list">
          @for (item of chamadas.atividades(); track item.atividade.id) {
            @let situacao = chamadas.situacaoDe(item.atividade.id);
            <li>
              <a class="cartao atividade" [routerLink]="['/chamada', item.atividade.id]">
                <app-icone-atividade [tipo]="item.atividade.tipo" />
                <span class="info">
                  <span class="nome">{{ item.atividade.nome }}</span>
                  <span class="detalhe">{{ item.turma.nome }} · {{ item.criancas.length }} crianças</span>
                  @switch (situacao) {
                    @case ('feita') {
                      <span class="selo selo-presente"><span aria-hidden="true">✓</span> Feita</span>
                    }
                    @case ('pendente') {
                      <span class="selo selo-aviso"><span aria-hidden="true">◷</span> Salva no aparelho</span>
                    }
                    @default {
                      <span class="selo selo-aviso"><span aria-hidden="true">●</span> A fazer</span>
                    }
                  }
                </span>
                <span class="seta" aria-hidden="true">›</span>
              </a>
            </li>
          }
        </ul>

        @if (chamadas.totalPendentes() > 0) {
          <section class="cartao pendentes" aria-labelledby="titulo-pendentes">
            <span class="relogio" aria-hidden="true">◷</span>
            <div>
              <h3 id="titulo-pendentes">Chamadas pendentes: {{ chamadas.totalPendentes() }}</h3>
              <p>Serão enviadas quando houver internet</p>
            </div>
          </section>
        }
      </main>

      <footer class="rodape">Toque em uma atividade para fazer a chamada</footer>
    </div>
  `,
  styles: `
    .sair {
      display: inline-flex;
      align-items: center;
      gap: 0.375rem;
      min-height: var(--alvo-toque);
      padding: 0.5rem 0.875rem;
      border-radius: var(--raio);
      border: 0.125rem solid var(--cor-sobre-primaria);
      background: transparent;
      color: var(--cor-sobre-primaria);
      font-weight: 700;
      font-size: 1.0625rem;
    }
    .titulo {
      font-size: 1.375rem;
    }
    .lista {
      list-style: none;
      margin: 0;
      padding: 0;
      display: flex;
      flex-direction: column;
      gap: 0.875rem;
    }
    .atividade {
      display: flex;
      align-items: center;
      gap: 1rem;
      color: inherit;
      text-decoration: none;
      min-height: 5.5rem;
    }
    .info {
      flex: 1;
      display: flex;
      flex-direction: column;
      align-items: flex-start;
      gap: 0.25rem;
    }
    .nome {
      font-size: 1.3125rem;
      font-weight: 800;
    }
    .detalhe {
      color: var(--cor-texto-suave);
    }
    .seta {
      font-size: 2rem;
      font-weight: 700;
      color: var(--cor-primaria);
    }
    :host-context(.alto-contraste) .seta {
      color: #ffff00;
    }
    .pendentes {
      display: flex;
      gap: 1rem;
      align-items: center;
      border: 0.125rem solid var(--cor-aviso-borda);
      background: var(--cor-aviso-fundo);
    }
    .pendentes h3 {
      font-size: 1.1875rem;
    }
    .relogio {
      font-size: 2.25rem;
      color: var(--cor-aviso);
    }
    .rodape {
      padding: 1rem;
      text-align: center;
      color: var(--cor-texto-suave);
      border-top: var(--espessura-borda) solid var(--cor-borda);
    }
  `,
})
export class Inicio implements OnInit {
  protected readonly auth = inject(AuthService);
  protected readonly chamadas = inject(ChamadasService);
  protected readonly hoje = diaPorExtenso(hojeIso());

  protected readonly subtitulo = computed(() => {
    const usuario = this.auth.usuario();
    if (!usuario) return '';
    const perfil = usuario.perfil === 'coordenacao' ? 'Coordenação' : 'Educadora';
    return `${nomeCurto(usuario.nome)} · ${perfil}`;
  });

  ngOnInit(): void {
    void this.chamadas.carregarDoDia();
  }
}
