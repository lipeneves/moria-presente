import { Injectable } from '@angular/core';
import Dexie, { type Table } from 'dexie';
import { AtividadeDoDia, ChamadaLocal } from './modelos';

/**
 * Banco IndexedDB do aparelho (via Dexie).
 * - pendentes: chamadas feitas offline que ainda não chegaram ao servidor;
 * - atividades: turma, atividade e lista de crianças, para abrir a chamada sem internet.
 */
@Injectable({ providedIn: 'root' })
export class BancoLocal extends Dexie {
  pendentes!: Table<ChamadaLocal, string>;
  atividades!: Table<AtividadeDoDia & { id: string }, string>;

  constructor() {
    super('moria-presente');
    this.version(1).stores({
      pendentes: 'id, idAtividade, data',
      atividades: 'id',
    });
  }
}
