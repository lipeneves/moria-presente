import { ErroDeRegraDeNegocio } from '../../lib/erros.js';
import { paraDataUtc } from '../../lib/datas.js';

export function criarCriancasService({ criancasRepository, turmasService, agora = () => new Date() }) {
  return {
    async listarPorTurma(idTurma) {
      await turmasService.garantirTurma(idTurma);
      return criancasRepository.listarPorTurma(idTurma);
    },

    async criar({ dataNascimento, responsavel, ...dados }) {
      await turmasService.garantirTurma(dados.idTurma);

      const nascimento = paraDataUtc(dataNascimento);
      if (nascimento > agora()) {
        throw new ErroDeRegraDeNegocio('A data de nascimento não pode ser no futuro');
      }

      return criancasRepository.criarComResponsavel({
        ...dados,
        dataNascimento: nascimento,
        responsavel: { ...responsavel, dataConsentimento: agora() },
      });
    },
  };
}
