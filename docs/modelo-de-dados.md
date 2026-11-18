# Modelo de dados (PostgreSQL)

| Entidade | Finalidade | Principais atributos |
|----------|-----------|----------------------|
| usuario | Equipe que acessa o sistema | id (UUID), nome, email (único), senha_hash (bcrypt), perfil (coordenacao/educador), ativo, versao_token |
| responsavel | Contato da família | id, nome, telefone, parentesco, consentimento_lgpd, data_consentimento |
| crianca | Criança atendida | id, nome, data_nascimento, escola, turno_escolar, alergias_restricoes, ativo, id_responsavel, id_turma |
| turma | Agrupamento do contraturno | id, nome (único), turno, ativa |
| atividade | Atividade de uma turma | id, nome, tipo, id_turma, ativa — único (nome, id_turma) |
| chamada | Chamada de uma atividade em um dia | id (UUID gerado no aparelho), id_atividade, data, id_usuario, criado_no_aparelho_em, sincronizado_em — único (id_atividade, data) |
| presenca | Status da criança na chamada | id, id_chamada, id_crianca, status (presente/falta/justificada) — único (id_chamada, id_crianca) |

Relacionamentos: responsavel 1:N crianca · turma 1:N crianca · turma 1:N atividade · atividade 1:N chamada · usuario 1:N chamada · chamada 1:N presenca · crianca 1:N presenca.
