import { ErroDeConflito, ErroNaoEncontrado } from '../../lib/erros.js';

export function criarTurmasService({ turmasRepository }) {
  async function garantirTurma(idTurma) {
    const turma = await turmasRepository.buscarPorId(idTurma);
    if (!turma || !turma.ativa) {
      throw new ErroNaoEncontrado('Turma não encontrada');
    }
    return turma;
  }

  return {
    garantirTurma,

    listar() {
      return turmasRepository.listarAtivas();
    },

    async criar({ nome, turno }) {
      if (await turmasRepository.buscarPorNome(nome)) {
        throw new ErroDeConflito('Já existe uma turma com este nome');
      }
      return turmasRepository.criar({ nome, turno });
    },

    async listarAtividades(idTurma) {
      await garantirTurma(idTurma);
      return turmasRepository.listarAtividades(idTurma);
    },

    async criarAtividade(idTurma, { nome, tipo }) {
      await garantirTurma(idTurma);
      // O índice único (nome, id_turma) do banco barra duplicidade; o tratador de erros devolve 409.
      return turmasRepository.criarAtividade({ idTurma, nome, tipo });
    },
  };
}
