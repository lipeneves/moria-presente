import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import { validar } from '../../middlewares/validar.js';
import { autorizar } from '../../middlewares/autenticacao.js';
import { criarUsuarioSchema, loginSchema } from './auth.schemas.js';

export function criarRotasAuth({ authService, autenticar }) {
  const rotas = Router();

  // Limita tentativas de login por IP para dificultar ataques de força bruta.
  const limiteLogin = rateLimit({
    windowMs: 15 * 60 * 1000,
    limit: 10,
    standardHeaders: 'draft-8',
    legacyHeaders: false,
    message: { erro: 'Muitas tentativas de login. Tente novamente em alguns minutos.' },
  });

  rotas.post('/auth/login', limiteLogin, validar({ body: loginSchema }), async (req, res) => {
    res.json(await authService.login(req.validado.body));
  });

  rotas.post('/auth/sair', autenticar, async (req, res) => {
    await authService.sair(req.usuario.id);
    res.status(204).end();
  });

  rotas.post(
    '/usuarios',
    autenticar,
    autorizar('coordenacao'),
    validar({ body: criarUsuarioSchema }),
    async (req, res) => {
      res.status(201).json(await authService.criarUsuario(req.validado.body));
    },
  );

  return rotas;
}
