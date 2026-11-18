# Frontend – PWA Angular

Aplicativo da educadora para fazer a chamada no celular, **mesmo sem internet**. Angular 22 (componentes standalone, signals, sem zone.js), Dexie (IndexedDB) e Service Worker.

## Telas

| Rota | Tela |
|------|------|
| `/entrar` | Login |
| `/` | Chamadas de hoje: atividades com situação *A fazer*, *Feita* ou *Salva no aparelho* |
| `/chamada/:idAtividade` | Chamada com um toque por criança (presente → falta → justificada) |
| `/resultado/:idChamada` | Totais da chamada e situação do envio |

## Offline-first

1. Com internet, a lista de turmas, atividades e crianças é baixada e guardada no IndexedDB.
2. A chamada é sempre salva primeiro no aparelho (`ChamadasService.salvar`).
3. O envio acontece na hora, se houver internet, ou automaticamente quando a conexão volta. O servidor não duplica chamadas reenviadas.

## Acessibilidade

- **Painel "Acessibilidade"** no cabeçalho de todas as telas:
  - **Alto contraste** (interruptor `role="switch"`): fundo preto, texto branco e destaques amarelos;
  - **Tamanho do texto** de 100% a 175% (A− / A+). Todas as medidas usam `rem`, então a tela inteira acompanha.
  - As preferências ficam salvas no aparelho e são aplicadas antes do primeiro desenho da tela.
- **Leitor de tela:** cada marcação é anunciada ("Alice M.: Presente") por uma região `aria-live`; botões têm rótulos completos; link "Pular para o conteúdo".
- **Não depende só de cor:** cada situação tem símbolo e texto (✓ Presente, ✕ Falta, J Justificada, — Não marcado).
- Alvos de toque de pelo menos 48px, foco sempre visível e respeito a `prefers-reduced-motion`.

## Como rodar

Com a API rodando em `http://localhost:3000` (ver `backend/README.md`):

```bash
npm install
npm start        # http://localhost:4200 (o proxy envia /api para a API)
npm test         # testes unitários (Vitest)
npm run build    # build de produção com Service Worker
```

As capturas de tela do app em funcionamento estão em [`docs/evidencias/`](../docs/evidencias/).
