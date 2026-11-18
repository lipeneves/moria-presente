import { Router } from 'express';
import { validar } from '../../middlewares/validar.js';
import { autorizar } from '../../middlewares/autenticacao.js';
import { criarAtividadeSchema, criarTurmaSchema, idTurmaParams } from './turmas.schemas.js';

export function criarRotasTurmas({ turmasService, autenticar }) {
  const rotas = Router();
  rotas.use(autenticar);

  rotas.get('/', async (req, res) => {
    res.json(await turmasService.listar());
  });

  rotas.post('/', autorizar('coordenacao'), validar({ body: criarTurmaSchema }), async (req, res) => {
    res.status(201).json(await turmasService.criar(req.validado.body));
  });

  rotas.get('/:idTurma/atividades', validar({ params: idTurmaParams }), async (req, res) => {
    res.json(await turmasService.listarAtividades(req.validado.params.idTurma));
  });

  rotas.post(
    '/:idTurma/atividades',
    autorizar('coordenacao'),
    validar({ params: idTurmaParams, body: criarAtividadeSchema }),
    async (req, res) => {
      const { params, body } = req.validado;
      res.status(201).json(await turmasService.criarAtividade(params.idTurma, body));
    },
  );

  return rotas;
}
