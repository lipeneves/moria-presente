import { HttpErrorResponse } from '@angular/common/http';
import { Component, ElementRef, inject, signal, viewChild } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../core/auth.service';
import { Cabecalho } from '../compartilhado/cabecalho';

@Component({
  selector: 'app-entrar',
  imports: [Cabecalho],
  template: `
    <div class="pagina">
      <app-cabecalho titulo="Moriá Presente" subtitulo="Chamada e frequência" />

      <main id="conteudo" class="conteudo" tabindex="-1">
        <h2 class="titulo">Entrar</h2>

        @if (erro()) {
          <p #alertaErro class="alerta-erro" role="alert" tabindex="-1">{{ erro() }}</p>
        }

        <form class="cartao formulario" (submit)="entrar($event)" novalidate>
          <div class="campo">
            <label for="email">E-mail</label>
            <input
              id="email"
              name="email"
              type="email"
              autocomplete="username"
              inputmode="email"
              required
              [value]="email()"
              (input)="email.set($any($event.target).value)"
              [attr.aria-invalid]="!!erro()"
            />
          </div>

          <div class="campo">
            <label for="senha">Senha</label>
            <input
              id="senha"
              name="senha"
              [type]="mostrarSenha() ? 'text' : 'password'"
              autocomplete="current-password"
              required
              [value]="senha()"
              (input)="senha.set($any($event.target).value)"
              [attr.aria-invalid]="!!erro()"
            />
            <label class="mostrar">
              <input type="checkbox" [checked]="mostrarSenha()" (change)="mostrarSenha.set(!mostrarSenha())" />
              Mostrar senha
            </label>
          </div>

          <button type="submit" class="botao botao-primario botao-largo" [disabled]="enviando()">
            {{ enviando() ? 'Entrando…' : 'Entrar' }}
          </button>
        </form>
      </main>
    </div>
  `,
  styles: `
    .titulo {
      font-size: 1.375rem;
    }
    .formulario {
      display: flex;
      flex-direction: column;
      gap: 1.25rem;
    }
    .campo {
      display: flex;
      flex-direction: column;
      gap: 0.375rem;
    }
    label {
      font-weight: 700;
      font-size: 1.0625rem;
    }
    input[type='email'],
    input[type='password'],
    input[type='text'] {
      min-height: var(--alvo-toque);
      padding: 0.625rem 0.875rem;
      border-radius: 0.625rem;
      border: 0.125rem solid var(--cor-borda);
      background: var(--cor-superficie);
      font-size: 1.0625rem;
    }
    input[aria-invalid='true'] {
      border-color: var(--cor-falta);
    }
    .mostrar {
      display: inline-flex;
      align-items: center;
      gap: 0.5rem;
      min-height: var(--alvo-toque);
      font-weight: 400;
    }
    .mostrar input {
      width: 1.375rem;
      height: 1.375rem;
    }
  `,
})
export class Entrar {
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);
  private readonly alertaErro = viewChild<ElementRef<HTMLElement>>('alertaErro');

  protected readonly email = signal('');
  protected readonly senha = signal('');
  protected readonly mostrarSenha = signal(false);
  protected readonly enviando = signal(false);
  protected readonly erro = signal('');

  async entrar(evento: Event): Promise<void> {
    evento.preventDefault();
    if (!this.email().trim() || !this.senha()) {
      return this.mostrarErro('Preencha o e-mail e a senha.');
    }

    this.enviando.set(true);
    this.erro.set('');
    try {
      await this.auth.entrar(this.email().trim(), this.senha());
      await this.router.navigate(['/']);
    } catch (e) {
      const status = e instanceof HttpErrorResponse ? e.status : 0;
      this.mostrarErro(
        status === 401
          ? 'E-mail ou senha inválidos.'
          : status === 429
            ? 'Muitas tentativas. Aguarde alguns minutos e tente de novo.'
            : status === 0
              ? 'Sem conexão com o servidor. O primeiro acesso precisa de internet.'
              : 'Não foi possível entrar agora. Tente de novo.',
      );
    } finally {
      this.enviando.set(false);
    }
  }

  private mostrarErro(mensagem: string): void {
    this.erro.set(mensagem);
    setTimeout(() => this.alertaErro()?.nativeElement.focus());
  }
}
