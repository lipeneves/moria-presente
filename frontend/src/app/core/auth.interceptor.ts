import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { catchError, throwError } from 'rxjs';
import { AuthService } from './auth.service';

/** Envia o token nas chamadas à API e encerra a sessão local se o servidor responder 401. */
export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const auth = inject(AuthService);
  const token = auth.token();
  const ehApi = req.url.startsWith('/api/');
  const ehLogin = req.url === '/api/auth/login';

  const requisicao = token && ehApi && !ehLogin ? req.clone({ setHeaders: { Authorization: `Bearer ${token}` } }) : req;

  return next(requisicao).pipe(
    catchError((erro: unknown) => {
      if (erro instanceof HttpErrorResponse && erro.status === 401 && ehApi && !ehLogin) {
        auth.encerrarSessaoLocal();
      }
      return throwError(() => erro);
    }),
  );
};
