import { Component, OnInit, computed, inject, input, signal } from '@angular/core';
import { Router } from '@angular/router';
import { AnunciadorService } from '../core/anunciador.service';
import { ChamadasService } from '../core/chamadas.service';
import { diaPorExtenso, hojeIso, nomeCurto } from '../core/datas';
import { AtividadeDoDia, StatusPresenca } from '../core/modelos';
import { Cabecalho } from '../compartilhado/cabecalho';
import { FaixaConexao } from '../compartilhado/faixa-conexao';

const PROXIMO: Record<StatusPresenca | 'nao-marcado', StatusPresenca> = {
  'nao-marcado': 'presente',
  presente: 'falta',
  falta: 'justificada',
  justificada: 'presente',
};

const ROTULO: Record<StatusPresenca | 'nao-marcado', string> = {
  'nao-marcado': 'Não marcado',
  presente: 'Presente',
  falta: 'Falta',
  justificada: 'Justificada',
};

const SIMBOLO: Record<StatusPresenca | 'nao-marcado', string> = {
  'nao-marcado': '—',
  presente: '✓',
  falta: '✕',
  justificada: 'J',
};

@Component({
  selector: 'app-chamada',
  imports: [Cabecalho, FaixaConexao],
  template: `
    <div class="pagina">
      <app-cabecalho [titulo]="titulo()" [subtitulo]="subtitulo" voltarPara="/" />
      <app-faixa-conexao />

      <main id="conteudo" class="conteudo" tabindex="-1">
        @if (dados(); as d) {
          <p class="instrucao">Toque no nome para marcar. Toque de novo para mudar.</p>

          <div class="resumo">
            <p class="contagem" aria-live="polite">{{ marcadas() }} de {{ d.criancas.length }} marcadas</p>
            <button type="button" class="botao" (click)="todosPresentes()">
              <span aria-hidden="true">✓</span> Todos presentes
            </button>
          </div>

          @if (faltamMarcar().length > 0) {
            <p class="alerta-erro" id="aviso-faltam">
              <span aria-hidden="true">⚠</span>
              Faltam {{ faltamMarcar().length }} {{ faltamMarcar().length === 1 ? 'criança' : 'crianças' }}:
              {{ nomesFaltando() }}. Marque antes de salvar.
            </p>
          }

          <ul class="lista" role="list" aria-label="Crianças da turma">
            @for (crianca of d.criancas; track crianca.id) {
              @let status = statusDe(crianca.id);
              <li>
                <button
                  type="button"
                  class="crianca"
                  [class]="'crianca ' + status"
                  [attr.aria-label]="nomeCurto(crianca.nome) + ': ' + rotulo[status] + '. Toque para mudar.'"
                  (click)="marcar(crianca.id, crianca.nome)"
                >
                  <span class="nome">{{ nomeCurto(crianca.nome) }}</span>
                  <span class="selo" [class]="'selo selo-' + status" aria-hidden="true">
                    {{ simbolo[status] }} {{ rotulo[status] }}
                  </span>
                </button>
              </li>
            }
          </ul>
        } @else {
          <p class="cartao">Atividade não encontrada neste aparelho. Volte ao início com internet para atualizar.</p>
        }
      </main>

      @if (dados()) {
        <div class="barra-salvar">
          <button
            type="button"
            class="botao botao-primario botao-largo"
            [disabled]="faltamMarcar().length > 0 || salvando()"
            [attr.aria-describedby]="faltamMarcar().length > 0 ? 'aviso-faltam' : null"
            (click)="salvar()"
          >
            @if (faltamMarcar().length > 0) {
              Salvar chamada (faltam {{ faltamMarcar().length }})
            } @else {
              Salvar chamada
            }
          </button>
        </div>
      }
    </div>
  `,
  styles: `
    .instrucao {
      color: var(--cor-texto-suave);
      font-size: 1.0625rem;
    }
    .resumo {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 1rem;
      flex-wrap: wrap;
    }
    .contagem {
      font-size: 1.3125rem;
      font-weight: 800;
    }
    .lista {
      list-style: none;
      margin: 0;
      padding: 0;
      display: flex;
      flex-direction: column;
      gap: 0.75rem;
    }
    .crianca {
      width: 100%;
      min-height: 4.25rem;
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 0.75rem;
      padding: 0.75rem 1rem;
      border-radius: var(--raio);
      border: var(--espessura-borda) solid var(--cor-borda);
      background: var(--cor-superficie);
      text-align: left;
    }
    .crianca .nome {
      font-size: 1.25rem;
      font-weight: 800;
      overflow-wrap: anywhere;
    }
    .crianca.nao-marcado {
      border: 0.125rem dashed var(--cor-neutra);
    }
    .crianca.presente {
      background: var(--cor-presente-fundo);
      border-color: var(--cor-presente);
    }
    .crianca.falta {
      background: var(--cor-falta-fundo);
      border-color: var(--cor-falta);
    }
    .crianca.justificada {
      background: var(--cor-justificada-fundo);
      border-color: var(--cor-justificada);
    }
    :host-context(.alto-contraste) .crianca {
      border-width: 0.1875rem;
    }
    .selo-nao-marcado {
      color: var(--cor-neutra);
    }
    .barra-salvar {
      position: sticky;
      bottom: 0;
      padding: 0.75rem 1rem 1rem;
      background: var(--cor-superficie);
      border-top: var(--espessura-borda) solid var(--cor-borda);
    }
  `,
})
export class Chamada implements OnInit {
  private readonly chamadas = inject(ChamadasService);
  private readonly router = inject(Router);
  private readonly anunciador = inject(AnunciadorService);

  readonly idAtividade = input.required<string>();

  protected readonly rotulo = ROTULO;
  protected readonly simbolo = SIMBOLO;
  protected readonly nomeCurto = nomeCurto;
  protected readonly subtitulo = `${diaPorExtenso(hojeIso())} · Chamada`;

  protected readonly dados = signal<AtividadeDoDia | undefined>(undefined);
  protected readonly marcacoes = signal(new Map<string, StatusPresenca>());
  protected readonly salvando = signal(false);

  protected readonly titulo = computed(() => {
    const d = this.dados();
    return d ? `${d.atividade.nome} – ${d.turma.turno === 'tarde' ? 'Tarde' : 'Manhã'}` : 'Chamada';
  });
  protected readonly marcadas = computed(() => this.marcacoes().size);
  protected readonly faltamMarcar = computed(() =>
    (this.dados()?.criancas ?? []).filter((c) => !this.marcacoes().has(c.id)),
  );
  protected readonly nomesFaltando = computed(() => {
    const nomes = this.faltamMarcar().map((c) => c.nome.split(' ')[0]);
    if (nomes.length <= 3) return nomes.join(', ').replace(/, ([^,]*)$/, ' e $1');
    return `${nomes.slice(0, 3).join(', ')} e mais ${nomes.length - 3}`;
  });

  async ngOnInit(): Promise<void> {
    this.dados.set(await this.chamadas.buscarAtividadeGuardada(this.idAtividade()));
  }

  protected statusDe(idCrianca: string): StatusPresenca | 'nao-marcado' {
    return this.marcacoes().get(idCrianca) ?? 'nao-marcado';
  }

  protected marcar(idCrianca: string, nome: string): void {
    const novo = PROXIMO[this.statusDe(idCrianca)];
    this.marcacoes.update((m) => new Map(m).set(idCrianca, novo));
    this.anunciador.anunciar(`${nomeCurto(nome)}: ${ROTULO[novo]}`);
  }

  protected todosPresentes(): void {
    const todas = new Map(this.marcacoes());
    for (const c of this.dados()?.criancas ?? []) {
      if (!todas.has(c.id)) todas.set(c.id, 'presente');
    }
    this.marcacoes.set(todas);
    this.anunciador.anunciar('Crianças sem marcação foram marcadas como presentes');
  }

  protected async salvar(): Promise<void> {
    if (this.faltamMarcar().length > 0) return;
    this.salvando.set(true);
    try {
      const chamada = await this.chamadas.salvar(this.idAtividade(), this.marcacoes());
      await this.router.navigate(['/resultado', chamada.id], { state: { chamada } });
    } finally {
      this.salvando.set(false);
    }
  }
}
