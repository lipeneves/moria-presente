import { Router } from 'express';
import { validar } from '../../middlewares/validar.js';
import { listarChamadasQuery, sincronizarSchema } from './chamadas.schemas.js';

export function criarRotasChamadas({ chamadasService, autenticar }) {
  const rotas = Router();
  rotas.use(autenticar);

  rotas.get('/', validar({ query: listarChamadasQuery }), async (req, res) => {
    res.json(await chamadasService.listarDoDia(req.validado.query.data));
  });

  rotas.post('/sincronizar', validar({ body: sincronizarSchema }), async (req, res) => {
    const resultados = await chamadasService.sincronizar(req.validado.body.chamadas, req.usuario.id);
    res.json({ resultados });
  });

  return rotas;
}
