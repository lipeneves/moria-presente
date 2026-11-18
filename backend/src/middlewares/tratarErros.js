import { ErroDeAplicacao } from '../lib/erros.js';

export function rotaNaoEncontrada(req, res) {
  res.status(404).json({ erro: 'Rota não encontrada' });
}

// Último middleware da cadeia. Nunca devolve stack trace nem mensagens internas do banco ao cliente.
// eslint-disable-next-line no-unused-vars
export function tratarErros(erro, req, res, next) {
  if (erro instanceof ErroDeAplicacao) {
    return res.status(erro.status).json({ erro: erro.message });
  }

  if (erro?.type === 'entity.parse.failed') {
    return res.status(400).json({ erro: 'JSON malformado' });
  }

  if (erro?.type === 'entity.too.large') {
    return res.status(413).json({ erro: 'Corpo da requisição muito grande' });
  }

  // Erros conhecidos do Prisma
  if (erro?.code === 'P2002') {
    return res.status(409).json({ erro: 'Registro duplicado' });
  }
  if (erro?.code === 'P2025') {
    return res.status(404).json({ erro: 'Registro não encontrado' });
  }

  console.error(erro);
  return res.status(500).json({ erro: 'Erro interno do servidor' });
}
