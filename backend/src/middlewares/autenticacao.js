import { ErroNaoAutenticado, ErroSemPermissao } from '../lib/erros.js';

// Lê o header "Authorization: Bearer <token>" e anexa o usuário em req.usuario.
export function criarAutenticar(authService) {
  return async (req, res, next) => {
    const [tipo, token] = (req.headers.authorization ?? '').split(' ');
    if (tipo !== 'Bearer' || !token) {
      throw new ErroNaoAutenticado('Token ausente');
    }

    req.usuario = await authService.verificarToken(token);
    next();
  };
}

export function autorizar(...perfisPermitidos) {
  return (req, res, next) => {
    if (!perfisPermitidos.includes(req.usuario?.perfil)) {
      throw new ErroSemPermissao();
    }
    next();
  };
}
