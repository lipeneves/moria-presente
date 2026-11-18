import { HttpClient } from '@angular/common/http';
import { Injectable, computed, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { firstValueFrom } from 'rxjs';
import { Usuario } from './modelos';

const CHAVE_SESSAO = 'moria.sessao';

interface Sessao {
  token: string;
  usuario: Usuario;
}

/**
 * A sessão fica no aparelho para a educadora conseguir abrir o app e fazer a chamada sem internet.
 * O token expira em 8h no servidor e é revogado no "Sair".
 */
@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly http = inject(HttpClient);
  private readonly router = inject(Router);
  private readonly sessao = signal<Sessao | null>(this.lerSessao());

  readonly usuario = computed(() => this.sessao()?.usuario ?? null);
  readonly token = computed(() => this.sessao()?.token ?? null);
  readonly autenticado = computed(() => this.sessao() !== null);

  async entrar(email: string, senha: string): Promise<void> {
    const sessao = await firstValueFrom(this.http.post<Sessao>('/api/auth/login', { email, senha }));
    this.salvarSessao(sessao);
  }

  async sair(): Promise<void> {
    try {
      await firstValueFrom(this.http.post('/api/auth/sair', {}));
    } catch {
      // Sem internet o token não é revogado agora, mas a sessão local é apagada mesmo assim.
    }
    this.encerrarSessaoLocal();
  }

  encerrarSessaoLocal(): void {
    this.salvarSessao(null);
    void this.router.navigate(['/entrar']);
  }

  private salvarSessao(sessao: Sessao | null): void {
    this.sessao.set(sessao);
    try {
      if (sessao) localStorage.setItem(CHAVE_SESSAO, JSON.stringify(sessao));
      else localStorage.removeItem(CHAVE_SESSAO);
    } catch {
      /* armazenamento indisponível (modo privado): a sessão vale só enquanto a aba estiver aberta */
    }
  }

  private lerSessao(): Sessao | null {
    try {
      return JSON.parse(localStorage.getItem(CHAVE_SESSAO) ?? 'null');
    } catch {
      return null;
    }
  }
}
