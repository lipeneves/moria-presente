// Dados FICTÍCIOS para demonstração local: uma educadora, a Turma Tarde, 3 atividades e 20 crianças.
// Usa os mesmos services e esquemas de validação da API. Pode ser executado mais de uma vez.
// Uso: npm run db:seed:demo
import { fileURLToPath } from 'node:url';
import dotenv from 'dotenv';
import { PrismaClient } from '@prisma/client';
import { criarServices } from '../src/container.js';
import { criarUsuarioSchema } from '../src/modules/auth/auth.schemas.js';
import { criarCriancaSchema } from '../src/modules/criancas/criancas.schemas.js';

dotenv.config({ path: fileURLToPath(new URL('../../.env', import.meta.url)), quiet: true });

const prisma = new PrismaClient();
const { authService, turmasService, criancasService } = criarServices({
  prisma,
  jwtSecret: process.env.JWT_SECRET,
});

const CRIANCAS = [
  ['Alice Martins', '2016-04-12', 'Maria Martins', 'mãe'],
  ['Bruno Silva', '2015-09-03', 'José Silva', 'pai'],
  ['Carla Teixeira', '2017-01-22', 'Rosa Teixeira', 'avó'],
  ['Davi Rocha', '2016-07-30', 'Paula Rocha', 'mãe'],
  ['Elisa Pereira', '2015-11-18', 'Márcia Pereira', 'mãe'],
  ['Felipe Andrade', '2017-03-05', 'Carlos Andrade', 'pai'],
  ['Gabriel Oliveira', '2016-02-14', 'Sandra Oliveira', 'mãe'],
  ['Heitor Lima', '2015-06-27', 'Joana Lima', 'tia'],
  ['Isabela Costa', '2017-08-09', 'Renata Costa', 'mãe'],
  ['João Pedro Alves', '2016-10-01', 'Fábio Alves', 'pai'],
  ['Kauã Ribeiro', '2015-12-24', 'Luciana Ribeiro', 'mãe'],
  ['Laura Gomes', '2016-05-16', 'Cláudia Gomes', 'mãe'],
  ['Miguel Barbosa', '2017-02-28', 'Adriana Barbosa', 'avó'],
  ['Nicole Cardoso', '2015-08-11', 'Patrícia Cardoso', 'mãe'],
  ['Otávio Moreira', '2016-11-07', 'Rogério Moreira', 'pai'],
  ['Pietra Nunes', '2017-05-19', 'Simone Nunes', 'mãe'],
  ['Rafael Dias', '2015-04-02', 'Vanessa Dias', 'mãe'],
  ['Sofia Mendes', '2016-09-25', 'Eduardo Mendes', 'pai'],
  ['Thiago Freitas', '2017-06-13', 'Cristina Freitas', 'tia'],
  ['Valentina Araújo', '2016-01-30', 'Helena Araújo', 'avó'],
];

const ATIVIDADES = [
  ['Futebol', 'esporte'],
  ['Horta', 'meio ambiente'],
  ['Biblioteca', 'leitura'],
];

try {
  // Educadora
  const dadosEducadora = criarUsuarioSchema.parse({
    nome: 'Ana Souza',
    email: process.env.SEED_EDUCADOR_EMAIL ?? 'educadora@exemplo.org',
    senha: process.env.SEED_EDUCADOR_SENHA,
    perfil: 'educador',
  });
  if (!(await prisma.usuario.findUnique({ where: { email: dadosEducadora.email } }))) {
    await authService.criarUsuario(dadosEducadora);
  }

  // Turma e atividades
  const turma =
    (await prisma.turma.findUnique({ where: { nome: 'Turma Tarde' } })) ??
    (await turmasService.criar({ nome: 'Turma Tarde', turno: 'tarde' }));

  for (const [nome, tipo] of ATIVIDADES) {
    const existe = await prisma.atividade.findUnique({ where: { nome_idTurma: { nome, idTurma: turma.id } } });
    if (!existe) await turmasService.criarAtividade(turma.id, { nome, tipo });
  }

  // Crianças com responsável e consentimento LGPD
  const jaCadastradas = new Set(
    (await prisma.crianca.findMany({ where: { idTurma: turma.id }, select: { nome: true } })).map((c) => c.nome),
  );
  let telefone = 47999990000;
  for (const [nome, dataNascimento, responsavel, parentesco] of CRIANCAS) {
    telefone += 1;
    if (jaCadastradas.has(nome)) continue;
    await criancasService.criar(
      criarCriancaSchema.parse({
        nome,
        dataNascimento,
        escola: 'Escola Municipal Exemplo',
        turnoEscolar: 'manha',
        idTurma: turma.id,
        responsavel: { nome: responsavel, telefone: String(telefone), parentesco, consentimentoLgpd: true },
      }),
    );
  }

  console.log(`Demonstração pronta: ${turma.nome}, ${ATIVIDADES.length} atividades, ${CRIANCAS.length} crianças.`);
} catch (erro) {
  console.error(erro);
  process.exitCode = 1;
} finally {
  await prisma.$disconnect();
}
