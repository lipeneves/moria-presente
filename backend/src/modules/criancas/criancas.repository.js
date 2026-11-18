const camposPublicos = {
  id: true,
  nome: true,
  dataNascimento: true,
  escola: true,
  turnoEscolar: true,
  alergiasRestricoes: true,
  idTurma: true,
  responsavel: { select: { id: true, nome: true, telefone: true, parentesco: true } },
};

export function criarCriancasRepository(prisma) {
  return {
    listarPorTurma(idTurma) {
      return prisma.crianca.findMany({
        where: { idTurma, ativo: true },
        select: camposPublicos,
        orderBy: { nome: 'asc' },
      });
    },

    // Criança e responsável são gravados juntos: ou os dois entram, ou nenhum.
    // O Prisma não aceita misturar chave estrangeira direta (idTurma) com criação aninhada (responsavel),
    // por isso a turma é ligada com connect.
    criarComResponsavel({ responsavel, idTurma, ...crianca }) {
      return prisma.crianca.create({
        data: {
          ...crianca,
          turma: { connect: { id: idTurma } },
          responsavel: { create: responsavel },
        },
        select: camposPublicos,
      });
    },
  };
}
