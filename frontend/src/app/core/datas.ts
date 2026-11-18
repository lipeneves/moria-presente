/** Data local do aparelho no formato AAAA-MM-DD (não usa UTC: à noite o UTC já é o dia seguinte). */
export function hojeIso(agora = new Date()): string {
  const ano = agora.getFullYear();
  const mes = String(agora.getMonth() + 1).padStart(2, '0');
  const dia = String(agora.getDate()).padStart(2, '0');
  return `${ano}-${mes}-${dia}`;
}

/** "terça, 17/11" */
export function diaPorExtenso(dataIso: string): string {
  const [ano, mes, dia] = dataIso.split('-').map(Number);
  const data = new Date(ano, mes - 1, dia);
  const semana = data.toLocaleDateString('pt-BR', { weekday: 'long' }).replace('-feira', '');
  return `${semana}, ${String(dia).padStart(2, '0')}/${String(mes).padStart(2, '0')}`;
}

export function horaCurta(data: Date | string): string {
  return new Date(data).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
}

/** "Alice Martins" -> "Alice M." (mostra só o necessário na tela, como no protótipo). */
export function nomeCurto(nomeCompleto: string): string {
  const partes = nomeCompleto.trim().split(/\s+/);
  if (partes.length === 1) return partes[0];
  return `${partes[0]} ${partes[partes.length - 1][0]}.`;
}
