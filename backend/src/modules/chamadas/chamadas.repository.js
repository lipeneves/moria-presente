export function criarChamadasRepository(prisma) {
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

    // Grava a chamada e as presenças numa única transação.
    // Se já existe chamada para a mesma atividade e dia (outro aparelho ou reenvio),
    // as presenças são mescladas nela em vez de criar uma segunda chamada.
    salvar({ id, idAtividade, data, idUsuario, criadoNoAparelhoEm, presencas }) {
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

        for (const { idCrianca, status } of presencas) {
          await tx.presenca.upsert({
            where: { idChamada_idCrianca: { idChamada, idCrianca } },
            create: { idChamada, idCrianca, status },
            update: { status },
          });
        }

        return { id: idChamada, situacao: existente ? 'atualizada' : 'criada' };
      });
    },
  };
}
