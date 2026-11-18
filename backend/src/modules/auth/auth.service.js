import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { ErroDeConflito, ErroNaoAutenticado } from '../../lib/erros.js';

const MENSAGEM_LOGIN_INVALIDO = 'E-mail ou senha inválidos';

export function criarAuthService({ usuarioRepository, jwtSecret, custoHash = 12, expiracaoToken = '8h' }) {
  // Hash usado quando o e-mail não existe, para o tempo de resposta não revelar quais e-mails estão cadastrados.
  const hashFicticio = bcrypt.hashSync('usuario-inexistente', custoHash);

  function paraUsuarioPublico(usuario) {
    return { id: usuario.id, nome: usuario.nome, email: usuario.email, perfil: usuario.perfil };
  }

  return {
    async login({ email, senha }) {
      const usuario = await usuarioRepository.buscarPorEmail(email);
      const senhaConfere = await bcrypt.compare(senha, usuario?.senhaHash ?? hashFicticio);

      if (!usuario || !usuario.ativo || !senhaConfere) {
        throw new ErroNaoAutenticado(MENSAGEM_LOGIN_INVALIDO);
      }

      const token = jwt.sign({ perfil: usuario.perfil, versao: usuario.versaoToken }, jwtSecret, {
        subject: usuario.id,
        expiresIn: expiracaoToken,
        algorithm: 'HS256',
      });

      return { token, usuario: paraUsuarioPublico(usuario) };
    },

    async verificarToken(token) {
      let conteudo;
      try {
        conteudo = jwt.verify(token, jwtSecret, { algorithms: ['HS256'] });
      } catch {
        throw new ErroNaoAutenticado('Token inválido ou expirado');
      }

      // Confere no banco: usuário desativado ou que fez logout perde o acesso na hora.
      const usuario = await usuarioRepository.buscarPorId(conteudo.sub);
      if (!usuario || !usuario.ativo || usuario.versaoToken !== conteudo.versao) {
        throw new ErroNaoAutenticado('Token inválido ou expirado');
      }

      return { id: usuario.id, perfil: usuario.perfil };
    },

    async sair(idUsuario) {
      await usuarioRepository.incrementarVersaoToken(idUsuario);
    },

    async criarUsuario({ nome, email, senha, perfil }) {
      if (await usuarioRepository.buscarPorEmail(email)) {
        throw new ErroDeConflito('Já existe um usuário com este e-mail');
      }

      const senhaHash = await bcrypt.hash(senha, custoHash);
      const usuario = await usuarioRepository.criar({ nome, email, senhaHash, perfil });
      return paraUsuarioPublico(usuario);
    },
  };
}
