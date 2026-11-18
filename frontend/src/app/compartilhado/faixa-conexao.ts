import { Component, inject } from '@angular/core';
import { ConexaoService } from '../core/conexao.service';

@Component({
  selector: 'app-faixa-conexao',
  template: `
    <div role="status">
      @if (!conexao.online()) {
        <p class="faixa faixa-offline">
          <svg aria-hidden="true" viewBox="0 0 24 24" width="24" height="24">
            <path d="M2 8.5a15 15 0 0 1 20 0M5 12a10 10 0 0 1 14 0M8.5 15.5a5 5 0 0 1 7 0" stroke="currentColor" stroke-width="2" fill="none" stroke-linecap="round" />
            <circle cx="12" cy="19" r="1.5" fill="currentColor" />
            <path d="M3 3l18 18" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" />
          </svg>
          Sem internet – a chamada será salva no aparelho
        </p>
      } @else if (conexao.acabouDeVoltar()) {
        <p class="faixa faixa-online">
          <svg aria-hidden="true" viewBox="0 0 24 24" width="24" height="24">
            <path d="M2 8.5a15 15 0 0 1 20 0M5 12a10 10 0 0 1 14 0M8.5 15.5a5 5 0 0 1 7 0" stroke="currentColor" stroke-width="2" fill="none" stroke-linecap="round" />
            <circle cx="12" cy="19" r="1.5" fill="currentColor" />
          </svg>
          Online – conexão restabelecida
        </p>
      }
    </div>
  `,
})
export class FaixaConexao {
  protected readonly conexao = inject(ConexaoService);
}
