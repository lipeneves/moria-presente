import { DestroyRef, Injectable, inject, signal } from '@angular/core';

/** Acompanha se o aparelho está com internet (eventos online/offline do navegador). */
@Injectable({ providedIn: 'root' })
export class ConexaoService {
  readonly online = signal(navigator.onLine);
  /** Fica verdadeiro por alguns segundos depois que a internet volta, para mostrar o aviso verde. */
  readonly acabouDeVoltar = signal(false);

  constructor() {
    let temporizador: ReturnType<typeof setTimeout> | undefined;

    const aoFicarOnline = () => {
      this.online.set(true);
      this.acabouDeVoltar.set(true);
      clearTimeout(temporizador);
      temporizador = setTimeout(() => this.acabouDeVoltar.set(false), 8000);
    };
    const aoFicarOffline = () => {
      this.online.set(false);
      this.acabouDeVoltar.set(false);
    };

    window.addEventListener('online', aoFicarOnline);
    window.addEventListener('offline', aoFicarOffline);
    inject(DestroyRef).onDestroy(() => {
      window.removeEventListener('online', aoFicarOnline);
      window.removeEventListener('offline', aoFicarOffline);
      clearTimeout(temporizador);
    });
  }
}
