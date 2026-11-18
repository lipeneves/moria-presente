import { Injectable, signal } from '@angular/core';

/**
 * Mensagens para leitores de tela (TalkBack, VoiceOver, NVDA).
 * O componente raiz mostra a mensagem numa região aria-live, que é lida em voz alta
 * sem tirar o foco de onde o usuário está.
 */
@Injectable({ providedIn: 'root' })
export class AnunciadorService {
  readonly mensagem = signal('');

  anunciar(texto: string): void {
    // Limpa antes para o leitor repetir mesmo quando a mensagem é igual à anterior.
    this.mensagem.set('');
    setTimeout(() => this.mensagem.set(texto), 50);
  }
}
