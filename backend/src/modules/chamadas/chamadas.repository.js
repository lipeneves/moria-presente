const VIOLACAO_DE_UNICIDADE = 'P2002';

export function criarChamadasRepository(prisma) {
  // Grava a chamada e as presenças numa única transação.
  // Se já existe chamada para a mesma atividade e dia (outro aparelho ou reenvio),
  // as presenças são mescladas nela em vez de criar uma segunda chamada.
  function salvarEmTransacao({ id, idAtividade, data, idUsuario, criadoNoAparelhoEm, presencas }) {
    return prisma.$transaction(async (tx) => {
      const existente = await tx.chamada.findUnique({
        where: { idAtividade_data: { idAtividade, data } },
      });

      const idChamada = existente?.id ?? id;

      if (existente) {
        await tx.chamada.update({ where: { id: idChamada }, data: { sincronizadoEm: new Date() } });
      } else {
        await tx.chamada.create({
          data: { id: idChamada, idAtividade, data, idUsuario, criadoNoAparelhoEm },
        });
      }

      // Escrita em lote: o número de consultas não cresce com o tamanho da turma.
      const atuais = await tx.presenca.findMany({
        where: { idChamada },
        select: { idCrianca: true, status: true },
      });
      const statusAtual = new Map(atuais.map((p) => [p.idCrianca, p.status]));

      const novas = presencas.filter((p) => !statusAtual.has(p.idCrianca));
      if (novas.length > 0) {
        await tx.presenca.createMany({
          data: novas.map(({ idCrianca, status }) => ({ idChamada, idCrianca, status })),
        });
      }

      // Presenças alteradas são agrupadas por status: no máximo 3 updateMany.
      const alteradas = presencas.filter(
        (p) => statusAtual.has(p.idCrianca) && statusAtual.get(p.idCrianca) !== p.status,
      );
      for (const status of new Set(alteradas.map((p) => p.status))) {
        await tx.presenca.updateMany({
          where: {
            idChamada,
            idCrianca: { in: alteradas.filter((p) => p.status === status).map((p) => p.idCrianca) },
          },
          data: { status },
        });
      }

      return { id: idChamada, situacao: existente ? 'atualizada' : 'criada' };
    });
  }

  return {
    buscarAtividade(id) {
      return prisma.atividade.findUnique({ where: { id } });
    },

    async idsCriancasAtivasDaTurma(idTurma) {
      const criancas = await prisma.crianca.findMany({
        where: { idTurma, ativo: true },
        select: { id: true },
      });
      return new Set(criancas.map((c) => c.id));
    },

    async salvar(chamada) {
      try {
        return await salvarEmTransacao(chamada);
      } catch (erro) {
        // Dois aparelhos sincronizaram a mesma atividade/dia ao mesmo tempo e este perdeu a corrida
        // no índice único. Na nova tentativa a chamada já existe e as presenças são mescladas.
        if (erro?.code === VIOLACAO_DE_UNICIDADE) {
          return salvarEmTransacao(chamada);
        }
        throw erro;
      }
    },
  };
}
