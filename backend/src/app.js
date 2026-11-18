import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import { criarAutenticar } from './middlewares/autenticacao.js';
import { rotaNaoEncontrada, tratarErros } from './middlewares/tratarErros.js';
import { criarRotasAuth } from './modules/auth/auth.routes.js';
import { criarRotasTurmas } from './modules/turmas/turmas.routes.js';
import { criarRotasCriancas } from './modules/criancas/criancas.routes.js';
import { criarRotasChamadas } from './modules/chamadas/chamadas.routes.js';

// Recebe os services prontos (injeção de dependência): nos testes entram versões com repositórios em memória.
export function criarApp({ services, origemCors = 'http://localhost:4200' }) {
  const app = express();
  const autenticar = criarAutenticar(services.authService);

  app.disable('x-powered-by');
  app.use(helmet());
  app.use(cors({ origin: origemCors }));
  app.use(express.json({ limit: '200kb' }));

  app.get('/saude', (req, res) => res.json({ status: 'ok' }));

  app.use(criarRotasAuth({ authService: services.authService, autenticar }));
  app.use('/turmas', criarRotasTurmas({ turmasService: services.turmasService, autenticar }));
  app.use('/criancas', criarRotasCriancas({ criancasService: services.criancasService, autenticar }));
  app.use('/chamadas', criarRotasChamadas({ chamadasService: services.chamadasService, autenticar }));

  app.use(rotaNaoEncontrada);
  app.use(tratarErros);

  return app;
}
