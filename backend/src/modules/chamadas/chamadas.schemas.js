import { z } from 'zod';

const presencaSchema = z.object({
  idCrianca: z.uuid('Identificador de criança inválido'),
  status: z.enum(['presente', 'falta', 'justificada']),
});

const chamadaSchema = z.object({
  // UUID gerado no aparelho: reenviar a mesma chamada não cria duplicidade (RF05).
  id: z.uuid('Identificador da chamada inválido'),
  idAtividade: z.uuid('Identificador de atividade inválido'),
  data: z.iso.date('Data inválida (use AAAA-MM-DD)'),
  criadoNoAparelhoEm: z.iso.datetime({ offset: true }),
  presencas: z
    .array(presencaSchema)
    .min(1, 'A chamada precisa ter pelo menos uma presença')
    .max(300)
    .refine(
      (presencas) => new Set(presencas.map((p) => p.idCrianca)).size === presencas.length,
      'A mesma criança aparece mais de uma vez na chamada',
    ),
});

export const sincronizarSchema = z.object({
  chamadas: z.array(chamadaSchema).min(1).max(50),
});
