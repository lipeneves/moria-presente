// Converte "AAAA-MM-DD" em Date à meia-noite UTC, formato usado nas colunas DATE do banco.
export function paraDataUtc(dataIso) {
  return new Date(`${dataIso}T00:00:00.000Z`);
}
