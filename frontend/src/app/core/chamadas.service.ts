import { Injectable, computed, effect, inject, signal } from '@angular/core';
import { liveQuery } from 'dexie';
import { ApiService } from './api.service';
import { BancoLocal } from './banco-local';
import { ConexaoService } from './conexao.service';
import { hojeIso } from './datas';
import { AtividadeDoDia, ChamadaDoDia, ChamadaLocal, StatusPresenca } from './modelos';

/** Mesma ordem com ou sem internet: por turma e depois pelo nome da atividade. */
function ordenar(lista: AtividadeDoDia[]): AtividadeDoDia[] {
  return [...lista].sort(
    (a, b) =>
      a.turma.nome.localeCompare(b.turma.nome, 'pt-BR') || a.atividade.nome.localeCompare(b.atividade.nome, 'pt-BR'),
  );
}

/**
 * Fluxo offline-first da chamada:
 * 1. a lista de atividades e crianças é baixada quando há internet e guardada no aparelho;
 * 2. a chamada é sempre salva primeiro no aparelho (IndexedDB);
 * 3. o envio ao servidor acontece na hora, se houver internet, ou assim que ela voltar.
 */
@Injectable({ providedIn: 'root' })
export class ChamadasService {
  private readonly api = inject(ApiService);
  private readonly banco = inject(BancoLocal);
  private readonly conexao = inject(ConexaoService);

  readonly atividades = signal<AtividadeDoDia[]>([]);
  readonly chamadasDoServidor = signal<ChamadaDoDia[]>([]);
  readonly pendentes = signal<ChamadaLocal[]>([]);
  readonly sincronizando = signal(false);
  readonly ultimaSincronizacao = signal<Date | null>(null);

  readonly totalPendentes = computed(() => this.pendentes().length);

  constructor() {
    liveQuery(() => this.banco.pendentes.toArray()).subscribe((lista) => this.pendentes.set(lista));

    // Quando a internet volta, envia o que estiver pendente.
    effect(() => {
      if (this.conexao.online()) void this.sincronizar();
    });
  }

  async carregarDoDia(): Promise<void> {
    const guardadas = await this.banco.atividades.toArray();
    if (guardadas.length) this.atividades.set(ordenar(guardadas));

    if (!this.conexao.online()) return;

    try {
      const turmas = await this.api.turmas();
      const atualizadas: AtividadeDoDia[] = [];
      for (const turma of turmas) {
        const [atividades, criancas] = await Promise.all([this.api.atividades(turma.id), this.api.criancas(turma.id)]);
        for (const atividade of atividades) atualizadas.push({ atividade, turma, criancas });
      }

      await this.banco.transaction('rw', this.banco.atividades, async () => {
        await this.banco.atividades.clear();
        await this.banco.atividades.bulkPut(atualizadas.map((a) => ({ id: a.atividade.id, ...a })));
      });
      this.atividades.set(ordenar(atualizadas));
      this.chamadasDoServidor.set(await this.api.chamadasDoDia(hojeIso()));
    } catch {
      // Falhou a rede no meio do caminho: continua com o que está guardado no aparelho.
    }
  }

  atividade(idAtividade: string): AtividadeDoDia | undefined {
    return this.atividades().find((a) => a.atividade.id === idAtividade);
  }

  async buscarAtividadeGuardada(idAtividade: string): Promise<AtividadeDoDia | undefined> {
    return this.atividade(idAtividade) ?? (await this.banco.atividades.get(idAtividade));
  }

  situacaoDe(idAtividade: string): 'feita' | 'pendente' | 'a-fazer' {
    const hoje = hojeIso();
    if (this.pendentes().some((p) => p.idAtividade === idAtividade && p.data === hoje)) return 'pendente';
    if (this.chamadasDoServidor().some((c) => c.idAtividade === idAtividade)) return 'feita';
    return 'a-fazer';
  }

  async salvar(idAtividade: string, marcacoes: Map<string, StatusPresenca>): Promise<ChamadaLocal> {
    const chamada: ChamadaLocal = {
      id: crypto.randomUUID(),
      idAtividade,
      data: hojeIso(),
      criadoNoAparelhoEm: new Date().toISOString(),
      presencas: [...marcacoes].map(([idCrianca, status]) => ({ idCrianca, status })),
    };
    await this.banco.pendentes.put(chamada);
    void this.sincronizar();
    return chamada;
  }

  /** Envia as pendentes. Devolve true se tudo foi aceito pelo servidor. */
  async sincronizar(): Promise<boolean> {
    if (this.sincronizando() || !this.conexao.online()) return false;
    const pendentes = await this.banco.pendentes.toArray();
    if (!pendentes.length) return true;

    this.sincronizando.set(true);
    try {
      const { resultados } = await this.api.sincronizar(pendentes);
      // Os resultados vêm na mesma ordem do envio. Usa a posição, não o id: quando o servidor
      // mescla com uma chamada já existente, ele devolve o id daquela chamada, não o do aparelho.
      for (const [i, resultado] of resultados.entries()) {
        const local = pendentes[i];
        if (resultado.situacao === 'rejeitada') {
          await this.banco.pendentes.update(local.id, { motivoRejeicao: resultado.motivo });
        } else {
          await this.banco.pendentes.delete(local.id);
        }
      }
      this.ultimaSincronizacao.set(new Date());
      this.chamadasDoServidor.set(await this.api.chamadasDoDia(hojeIso()));
      return resultados.every((r) => r.situacao !== 'rejeitada');
    } catch {
      return false;
    } finally {
      this.sincronizando.set(false);
    }
  }
}
