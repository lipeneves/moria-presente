-- CreateEnum
CREATE TYPE "Perfil" AS ENUM ('coordenacao', 'educador');

-- CreateEnum
CREATE TYPE "Turno" AS ENUM ('manha', 'tarde');

-- CreateEnum
CREATE TYPE "StatusPresenca" AS ENUM ('presente', 'falta', 'justificada');

-- CreateTable
CREATE TABLE "usuario" (
    "id" UUID NOT NULL,
    "nome" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "senha_hash" TEXT NOT NULL,
    "perfil" "Perfil" NOT NULL,
    "ativo" BOOLEAN NOT NULL DEFAULT true,
    "versao_token" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "usuario_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "responsavel" (
    "id" UUID NOT NULL,
    "nome" TEXT NOT NULL,
    "telefone" TEXT NOT NULL,
    "parentesco" TEXT NOT NULL,
    "consentimento_lgpd" BOOLEAN NOT NULL,
    "data_consentimento" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "responsavel_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "turma" (
    "id" UUID NOT NULL,
    "nome" TEXT NOT NULL,
    "turno" "Turno" NOT NULL,
    "ativa" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "turma_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "atividade" (
    "id" UUID NOT NULL,
    "nome" TEXT NOT NULL,
    "tipo" TEXT NOT NULL,
    "id_turma" UUID NOT NULL,
    "ativa" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "atividade_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "crianca" (
    "id" UUID NOT NULL,
    "nome" TEXT NOT NULL,
    "data_nascimento" DATE NOT NULL,
    "escola" TEXT,
    "turno_escolar" "Turno",
    "alergias_restricoes" TEXT,
    "ativo" BOOLEAN NOT NULL DEFAULT true,
    "id_responsavel" UUID NOT NULL,
    "id_turma" UUID NOT NULL,

    CONSTRAINT "crianca_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "chamada" (
    "id" UUID NOT NULL,
    "id_atividade" UUID NOT NULL,
    "data" DATE NOT NULL,
    "id_usuario" UUID NOT NULL,
    "criado_no_aparelho_em" TIMESTAMP(3) NOT NULL,
    "sincronizado_em" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "chamada_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "presenca" (
    "id" UUID NOT NULL,
    "id_chamada" UUID NOT NULL,
    "id_crianca" UUID NOT NULL,
    "status" "StatusPresenca" NOT NULL,

    CONSTRAINT "presenca_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "usuario_email_key" ON "usuario"("email");

-- CreateIndex
CREATE UNIQUE INDEX "turma_nome_key" ON "turma"("nome");

-- CreateIndex
CREATE UNIQUE INDEX "atividade_nome_id_turma_key" ON "atividade"("nome", "id_turma");

-- CreateIndex
CREATE INDEX "crianca_id_turma_idx" ON "crianca"("id_turma");

-- CreateIndex
CREATE UNIQUE INDEX "chamada_id_atividade_data_key" ON "chamada"("id_atividade", "data");

-- CreateIndex
CREATE UNIQUE INDEX "presenca_id_chamada_id_crianca_key" ON "presenca"("id_chamada", "id_crianca");

-- AddForeignKey
ALTER TABLE "atividade" ADD CONSTRAINT "atividade_id_turma_fkey" FOREIGN KEY ("id_turma") REFERENCES "turma"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "crianca" ADD CONSTRAINT "crianca_id_responsavel_fkey" FOREIGN KEY ("id_responsavel") REFERENCES "responsavel"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "crianca" ADD CONSTRAINT "crianca_id_turma_fkey" FOREIGN KEY ("id_turma") REFERENCES "turma"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "chamada" ADD CONSTRAINT "chamada_id_atividade_fkey" FOREIGN KEY ("id_atividade") REFERENCES "atividade"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "chamada" ADD CONSTRAINT "chamada_id_usuario_fkey" FOREIGN KEY ("id_usuario") REFERENCES "usuario"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "presenca" ADD CONSTRAINT "presenca_id_chamada_fkey" FOREIGN KEY ("id_chamada") REFERENCES "chamada"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "presenca" ADD CONSTRAINT "presenca_id_crianca_fkey" FOREIGN KEY ("id_crianca") REFERENCES "crianca"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
