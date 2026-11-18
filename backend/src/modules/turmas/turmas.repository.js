export function criarTurmasRepository(prisma) {
  return {
    listarAtivas() {
      return prisma.turma.findMany({ where: { ativa: true }, orderBy: { nome: 'asc' } });
    },

    buscarPorId(id) {
      return prisma.turma.findUnique({ where: { id } });
    },

    buscarPorNome(nome) {
      return prisma.turma.findUnique({ where: { nome } });
    },

    criar(dados) {
      return prisma.turma.create({ data: dados });
    },

    listarAtividades(idTurma) {
      return prisma.atividade.findMany({ where: { idTurma, ativa: true }, orderBy: { nome: 'asc' } });
    },

    criarAtividade(dados) {
      return prisma.atividade.create({ data: dados });
    },
  };
}
