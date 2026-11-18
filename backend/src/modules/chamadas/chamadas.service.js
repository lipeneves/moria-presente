import { ErroDeAplicacao, ErroDeRegraDeNegocio, ErroNaoEncontrado } from '../../lib/erros.js';
import { paraDataUtc } from '../../lib/datas.js';

export function criarChamadasService({ chamadasRepository, agora = () => new Date() }) {
  async function sincronizarUma(chamada, idUsuario) {
    const atividade = await chamadasRepository.buscarAtividade(chamada.idAtividade);
    if (!atividade || !atividade.ativa) {
      throw new ErroNaoEncontrado('Atividade não encontrada');
    }

    const data = paraDataUtc(chamada.data);
    if (data > agora()) {
      throw new ErroDeRegraDeNegocio('Não é possível registrar chamada em data futura');
    }

    // Só aceita crianças da turma da atividade: o aparelho não pode marcar presença de qualquer id.
    const idsDaTurma = await chamadasRepository.idsCriancasAtivasDaTurma(atividade.idTurma);
    const foraDaTurma = chamada.presencas.filter((p) => !idsDaTurma.has(p.idCrianca));
    if (foraDaTurma.length > 0) {
      throw new ErroDeRegraDeNegocio(`${foraDaTurma.length} criança(s) não pertencem à turma desta atividade`);
    }

    return chamadasRepository.salvar({
      id: chamada.id,
      idAtividade: chamada.idAtividade,
      data,
      idUsuario,
      criadoNoAparelhoEm: new Date(chamada.criadoNoAparelhoEm),
      presencas: chamada.presencas,
    });
  }

  return {
    // Processa cada chamada separadamente: uma chamada com problema não impede
    // que as outras do mesmo lote sejam gravadas. O aparelho reenvia só as que falharam.
    async sincronizar(chamadas, idUsuario) {
      const resultados = [];

      for (const chamada of chamadas) {
        try {
          resultados.push(await sincronizarUma(chamada, idUsuario));
        } catch (erro) {
          if (!(erro instanceof ErroDeAplicacao)) throw erro;
          resultados.push({ id: chamada.id, situacao: 'rejeitada', motivo: erro.message });
        }
      }

      return resultados;
    },
  };
}
