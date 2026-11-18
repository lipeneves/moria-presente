// Erros de domínio: os services lançam, o middleware tratarErros converte em resposta HTTP.

export class ErroDeAplicacao extends Error {
  constructor(mensagem, status) {
    super(mensagem);
    this.name = this.constructor.name;
    this.status = status;
  }
}

export class ErroNaoAutenticado extends ErroDeAplicacao {
  constructor(mensagem = 'Não autenticado') {
    super(mensagem, 401);
  }
}

export class ErroSemPermissao extends ErroDeAplicacao {
  constructor(mensagem = 'Sem permissão para esta ação') {
    super(mensagem, 403);
  }
}

export class ErroNaoEncontrado extends ErroDeAplicacao {
  constructor(mensagem = 'Registro não encontrado') {
    super(mensagem, 404);
  }
}

export class ErroDeConflito extends ErroDeAplicacao {
  constructor(mensagem = 'Registro já existe') {
    super(mensagem, 409);
  }
}

export class ErroDeRegraDeNegocio extends ErroDeAplicacao {
  constructor(mensagem) {
    super(mensagem, 422);
  }
}
