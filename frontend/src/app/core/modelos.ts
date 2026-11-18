export type Perfil = 'coordenacao' | 'educador';
export type StatusPresenca = 'presente' | 'falta' | 'justificada';

export interface Usuario {
  id: string;
  nome: string;
  email: string;
  perfil: Perfil;
}

export interface Turma {
  id: string;
  nome: string;
  turno: 'manha' | 'tarde';
}

export interface Atividade {
  id: string;
  nome: string;
  tipo: string;
  idTurma: string;
}

export interface Crianca {
  id: string;
  nome: string;
  idTurma: string;
}

export interface ResumoPresencas {
  presente: number;
  falta: number;
  justificada: number;
}

export interface ChamadaDoDia {
  id: string;
  idAtividade: string;
  sincronizadoEm: string;
  resumo: ResumoPresencas;
}

/** Chamada salva no aparelho, aguardando envio ao servidor. */
export interface ChamadaLocal {
  id: string;
  idAtividade: string;
  data: string;
  criadoNoAparelhoEm: string;
  presencas: { idCrianca: string; status: StatusPresenca }[];
  /** Preenchido quando o servidor recusou a chamada. */
  motivoRejeicao?: string;
}

export interface ResultadoSincronizacao {
  id: string;
  situacao: 'criada' | 'atualizada' | 'rejeitada';
  motivo?: string;
}

/** Atividade com a turma e as crianças, guardada no aparelho para a chamada funcionar offline. */
export interface AtividadeDoDia {
  atividade: Atividade;
  turma: Turma;
  criancas: Crianca[];
}
