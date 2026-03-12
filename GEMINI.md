# THEADORO GIFT - Monorepo Master

Este é o índice principal do projeto THEADORO GIFT. Siga as instruções abaixo para navegar e manter o ecossistema.

## 🧭 Context Routing (Roteamento de Memória)
Sempre carregue o `GEMINI.md` específico antes de realizar tarefas em subpastas:

→ **Frontend:** `apps/web/GEMINI.md` (UI, Rotas, Componentes)
→ **API & Tipos:** `packages/api-client/GEMINI.md` (Kubb, Hooks, Schemas)
→ **Configuração:** `packages/config/GEMINI.md` (TS, Tailwind, ESLint)
→ **Backend:** `supabase/GEMINI.md` (Migrations, RLS, Edge Functions)

## 🔴 Mandatos Globais (Não Negociáveis)
1. **Test-First (TDD):** Escreva testes antes de implementar a lógica.
2. **Type Safety:** NUNCA use `any`. Use os tipos gerados em `@theadoro/api-client`.
3. **Segurança (RLS):** Toda tabela nova no Supabase deve ter políticas de RLS.
4. **Migrations:** Alterações de banco apenas via arquivos em `supabase/migrations/`.

## 🛠️ Comandos do Monorepo
- `npm run dev`: Inicia todos os apps em desenvolvimento.
- `npm run build`: Build de produção de todo o workspace.
- `npx turbo run generate --filter=@theadoro/api-client`: Atualiza os hooks de API via Kubb.

## 🧠 Memória de Decisões
ADRs (Architecture Decision Records) estão em `.memory/decisions.md`.
