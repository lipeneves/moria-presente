# Backend – API Node.js/Express

API REST do Moriá Presente. Monolito em camadas: **rotas → services → repositories (Prisma) → PostgreSQL**.

## Estrutura

```
backend/
├── prisma/
│   ├── schema.prisma        # modelo de dados (docs/modelo-de-dados.md)
│   └── seed.js              # cria o primeiro usuário da coordenação
├── src/
│   ├── config/env.js        # variáveis de ambiente validadas com Zod
│   ├── lib/                 # Prisma client, erros de domínio, datas
│   ├── middlewares/         # autenticação, autorização, validação, erros
│   ├── modules/
│   │   ├── auth/            # RF01 – login por perfil
│   │   ├── turmas/          # RF02 – turmas e atividades
│   │   ├── criancas/        # RF03 – crianças e responsáveis (LGPD)
│   │   └── chamadas/        # RF04/RF05 – sincronização de chamadas offline
│   ├── container.js         # liga repositories → services
│   ├── app.js               # monta o Express (recebe os services prontos)
│   └── server.js            # ponto de entrada
└── tests/                   # testes com node:test + supertest (sem banco)
```

## Como rodar

Pré-requisitos: Node.js 22+ e um PostgreSQL (ex.: Supabase).

```bash
# na raiz do repositório
cp .env.example .env         # preencha DATABASE_URL, JWT_SECRET e os dados do seed

cd backend
npm install
npm run db:migrate           # cria as tabelas
npm run db:seed              # cria o usuário da coordenação
npm run dev                  # http://localhost:3000
```

Testes (não precisam de banco):

```bash
npm test
```

## Endpoints

| Método | Rota | Perfil | Descrição |
|--------|------|--------|-----------|
| GET | `/saude` | público | Verifica se a API está no ar |
| POST | `/auth/login` | público | Login, devolve token JWT (8h) |
| POST | `/auth/sair` | autenticado | Revoga todos os tokens do usuário |
| POST | `/usuarios` | coordenação | Cadastra coordenador ou educador |
| GET | `/turmas` | autenticado | Lista turmas ativas |
| POST | `/turmas` | coordenação | Cadastra turma |
| GET | `/turmas/:idTurma/atividades` | autenticado | Lista atividades da turma |
| POST | `/turmas/:idTurma/atividades` | coordenação | Cadastra atividade |
| GET | `/criancas?idTurma=` | autenticado | Lista crianças da turma (para a chamada) |
| POST | `/criancas` | coordenação | Cadastra criança e responsável (exige consentimento LGPD) |
| POST | `/chamadas/sincronizar` | autenticado | Envia lote de chamadas feitas offline |

Rotas autenticadas usam o header `Authorization: Bearer <token>`.

### Sincronização de chamadas

O aparelho gera o `id` (UUID) de cada chamada. Reenviar a mesma chamada não duplica nada, e duas chamadas da mesma atividade no mesmo dia são mescladas. Cada chamada do lote volta com `situacao` igual a `criada`, `atualizada` ou `rejeitada` (com `motivo`), para o aparelho reenviar só as que falharam.

```json
{
  "chamadas": [
    {
      "id": "7c1e1f0a-3b9e-4c3e-9a51-2f0c8a6d4b11",
      "idAtividade": "…",
      "data": "2026-11-17",
      "criadoNoAparelhoEm": "2026-11-17T14:05:00-03:00",
      "presencas": [{ "idCrianca": "…", "status": "presente" }]
    }
  ]
}
```
