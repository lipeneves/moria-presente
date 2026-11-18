export function criarUsuarioRepository(prisma) {
  return {
    buscarPorEmail(email) {
      return prisma.usuario.findUnique({ where: { email } });
    },

    buscarPorId(id) {
      return prisma.usuario.findUnique({ where: { id } });
    },

    criar(dados) {
      return prisma.usuario.create({ data: dados });
    },

    incrementarVersaoToken(id) {
      return prisma.usuario.update({ where: { id }, data: { versaoToken: { increment: 1 } } });
    },
  };
}
