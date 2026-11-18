import { Routes } from '@angular/router';
import { exigeLogin, somenteVisitante } from './core/auth.guard';

export const routes: Routes = [
  {
    path: 'entrar',
    title: 'Entrar · Moriá Presente',
    canActivate: [somenteVisitante],
    loadComponent: () => import('./paginas/entrar').then((m) => m.Entrar),
  },
  {
    path: '',
    title: 'Chamadas de hoje · Moriá Presente',
    canActivate: [exigeLogin],
    loadComponent: () => import('./paginas/inicio').then((m) => m.Inicio),
  },
  {
    path: 'chamada/:idAtividade',
    title: 'Chamada · Moriá Presente',
    canActivate: [exigeLogin],
    loadComponent: () => import('./paginas/chamada').then((m) => m.Chamada),
  },
  {
    path: 'resultado/:idChamada',
    title: 'Resultado da chamada · Moriá Presente',
    canActivate: [exigeLogin],
    loadComponent: () => import('./paginas/resultado').then((m) => m.Resultado),
  },
  { path: '**', redirectTo: '' },
];
