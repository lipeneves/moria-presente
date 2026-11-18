import { Injectable, effect, signal } from '@angular/core';

const CHAVE = 'moria.acessibilidade';
export const ESCALAS_FONTE = [100, 115, 130, 150, 175] as const;
export type EscalaFonte = (typeof ESCALAS_FONTE)[number];

interface Preferencias {
  altoContraste: boolean;
  escalaFonte: EscalaFonte;
}

/**
 * Preferências de acessibilidade da pessoa que usa o aparelho:
 * - alto contraste (fundo preto, texto branco, destaques amarelos);
 * - tamanho do texto de 100% a 175%.
 * Ficam salvas no aparelho e valem para todas as telas, inclusive offline.
 */
@Injectable({ providedIn: 'root' })
export class AcessibilidadeService {
  private readonly inicial = this.ler();

  readonly altoContraste = signal(this.inicial.altoContraste);
  readonly escalaFonte = signal<EscalaFonte>(this.inicial.escalaFonte);

  constructor() {
    effect(() => {
      const preferencias: Preferencias = { altoContraste: this.altoContraste(), escalaFonte: this.escalaFonte() };
      const raiz = document.documentElement;
      raiz.classList.toggle('alto-contraste', preferencias.altoContraste);
      raiz.style.fontSize = `${preferencias.escalaFonte}%`;
      try {
        localStorage.setItem(CHAVE, JSON.stringify(preferencias));
      } catch {
        /* sem armazenamento: a preferência vale até fechar o app */
      }
    });
  }

  alternarAltoContraste(): void {
    this.altoContraste.update((ativo) => !ativo);
  }

  aumentarTexto(): boolean {
    const i = ESCALAS_FONTE.indexOf(this.escalaFonte());
    if (i >= ESCALAS_FONTE.length - 1) return false;
    this.escalaFonte.set(ESCALAS_FONTE[i + 1]);
    return true;
  }

  diminuirTexto(): boolean {
    const i = ESCALAS_FONTE.indexOf(this.escalaFonte());
    if (i <= 0) return false;
    this.escalaFonte.set(ESCALAS_FONTE[i - 1]);
    return true;
  }

  private ler(): Preferencias {
    try {
      const salvo = JSON.parse(localStorage.getItem(CHAVE) ?? '{}') as Partial<Preferencias>;
      return {
        altoContraste: salvo.altoContraste === true,
        escalaFonte: ESCALAS_FONTE.includes(salvo.escalaFonte as EscalaFonte) ? (salvo.escalaFonte as EscalaFonte) : 100,
      };
    } catch {
      return { altoContraste: false, escalaFonte: 100 };
    }
  }
}
