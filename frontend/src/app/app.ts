import { Component, inject } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { AcessibilidadeService } from './core/acessibilidade.service';
import { AnunciadorService } from './core/anunciador.service';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet],
  template: `
    <a class="pular-para-conteudo" href="#conteudo">Pular para o conteúdo</a>
    <router-outlet />
    <!-- Região lida pelos leitores de tela a cada marcação, ajuste ou sincronização. -->
    <div class="visualmente-oculto" aria-live="polite" aria-atomic="true">{{ anunciador.mensagem() }}</div>
  `,
})
export class App {
  protected readonly anunciador = inject(AnunciadorService);
  // Instancia logo na abertura para aplicar alto contraste e tamanho de texto salvos.
  private readonly acessibilidade = inject(AcessibilidadeService);
}
