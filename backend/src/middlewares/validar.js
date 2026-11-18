// Valida body, params e query com esquemas Zod antes de chegar ao controller.
// Campos fora do esquema são descartados; o resultado limpo fica em req.validado.
export function validar(esquemas) {
  return (req, res, next) => {
    const validado = {};
    const problemas = [];

    for (const parte of ['body', 'params', 'query']) {
      const esquema = esquemas[parte];
      if (!esquema) continue;

      const resultado = esquema.safeParse(req[parte] ?? {});
      if (resultado.success) {
        validado[parte] = resultado.data;
      } else {
        for (const problema of resultado.error.issues) {
          problemas.push({ campo: [parte, ...problema.path].join('.'), mensagem: problema.message });
        }
      }
    }

    if (problemas.length > 0) {
      return res.status(400).json({ erro: 'Dados inválidos', detalhes: problemas });
    }

    req.validado = validado;
    next();
  };
}
