import { Component, computed, input } from '@angular/core';

/** Ícone decorativo por tipo de atividade (o nome da atividade já está escrito ao lado). */
@Component({
  selector: 'app-icone-atividade',
  template: `
    <span class="icone" [class]="'icone ' + variante()" aria-hidden="true">
      <svg viewBox="0 0 24 24" width="30" height="30" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        @switch (variante()) {
          @case ('esporte') {
            <circle cx="12" cy="12" r="9" />
            <path d="M12 7l4 3-1.5 4.5h-5L8 10z" fill="currentColor" />
          }
          @case ('natureza') {
            <path d="M12 21v-9" />
            <path d="M12 12c0-4 3-6 7-6 0 4-3 6-7 6z" />
            <path d="M12 14c0-3-2.5-5-6-5 0 3 2.5 5 6 5z" />
          }
          @case ('leitura') {
            <path d="M3 5h6a3 3 0 0 1 3 3v12a2 2 0 0 0-2-2H3z" />
            <path d="M21 5h-6a3 3 0 0 0-3 3v12a2 2 0 0 1 2-2h7z" />
          }
          @default {
            <circle cx="12" cy="12" r="9" />
            <path d="M8 12h8M12 8v8" />
          }
        }
      </svg>
    </span>
  `,
  styles: `
    .icone {
      display: grid;
      place-items: center;
      width: 3.5rem;
      height: 3.5rem;
      border-radius: 0.75rem;
      flex-shrink: 0;
    }
    .esporte { background: #e8f0fb; color: #1d4f8f; }
    .natureza { background: #e6f3ea; color: #1e6b3a; }
    .leitura { background: #fdf0e6; color: #8a3b0a; }
    .outra { background: #eef0f4; color: #3c4656; }
    :host-context(.alto-contraste) .icone {
      background: #000000;
      color: #ffffff;
      border: 2px solid #ffffff;
    }
  `,
})
export class IconeAtividade {
  readonly tipo = input.required<string>();

  protected readonly variante = computed(() => {
    const tipo = this.tipo().toLowerCase();
    if (tipo.includes('esporte')) return 'esporte';
    if (tipo.includes('ambiente') || tipo.includes('horta')) return 'natureza';
    if (tipo.includes('leitura')) return 'leitura';
    return 'outra';
  });
}
