import { Router } from 'express';
import { validar } from '../../middlewares/validar.js';
import { sincronizarSchema } from './chamadas.schemas.js';

export function criarRotasChamadas({ chamadasService, autenticar }) {
  const rotas = Router();
  rotas.use(autenticar);

  rotas.post('/sincronizar', validar({ body: sincronizarSchema }), async (req, res) => {
    const resultados = await chamadasService.sincronizar(req.validado.body.chamadas, req.usuario.id);
    res.json({ resultados });
  });

  return rotas;
}
