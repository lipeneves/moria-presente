import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { Atividade, ChamadaDoDia, ChamadaLocal, Crianca, ResultadoSincronizacao, Turma } from './modelos';

@Injectable({ providedIn: 'root' })
export class ApiService {
  private readonly http = inject(HttpClient);

  turmas() {
    return firstValueFrom(this.http.get<Turma[]>('/api/turmas'));
  }

  atividades(idTurma: string) {
    return firstValueFrom(this.http.get<Atividade[]>(`/api/turmas/${idTurma}/atividades`));
  }

  criancas(idTurma: string) {
    return firstValueFrom(this.http.get<Crianca[]>('/api/criancas', { params: { idTurma } }));
  }

  chamadasDoDia(data: string) {
    return firstValueFrom(this.http.get<ChamadaDoDia[]>('/api/chamadas', { params: { data } }));
  }

  sincronizar(chamadas: ChamadaLocal[]) {
    const corpo = chamadas.map(({ motivoRejeicao, ...chamada }) => chamada);
    return firstValueFrom(
      this.http.post<{ resultados: ResultadoSincronizacao[] }>('/api/chamadas/sincronizar', { chamadas: corpo }),
    );
  }
}
