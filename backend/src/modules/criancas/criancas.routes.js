import { Router } from 'express';
import { validar } from '../../middlewares/validar.js';
import { autorizar } from '../../middlewares/autenticacao.js';
import { criarCriancaSchema, listarCriancasQuery } from './criancas.schemas.js';

export function criarRotasCriancas({ criancasService, autenticar }) {
  const rotas = Router();
  rotas.use(autenticar);

  rotas.get('/', validar({ query: listarCriancasQuery }), async (req, res) => {
    res.json(await criancasService.listarPorTurma(req.validado.query.idTurma));
  });

  rotas.post('/', autorizar('coordenacao'), validar({ body: criarCriancaSchema }), async (req, res) => {
    res.status(201).json(await criancasService.criar(req.validado.body));
  });

  return rotas;
}
