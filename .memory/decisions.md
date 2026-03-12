# Registro de Decisões de Arquitetura (ADR)

## ADR 001: Transição para Monorepo
**Data:** 12/03/2026
**Status:** Aceito
**Contexto:** O projeto estava crescendo como um monolito, dificultando o reuso de tipos e a manutenção por IA devido ao alto consumo de tokens.
**Decisão:** Adotar **Turborepo** com workspaces em `apps/` e `packages/`.
**Consequência:** Melhor isolamento, build mais rápido e consumo de contexto otimizado para agentes de IA.

## ADR 002: Automação de API com Kubb
**Data:** 12/03/2026
**Status:** Aceito
**Contexto:** Erros manuais de tipagem de banco de dados (ex: coluna 'status' inexistente).
**Decisão:** Usar **Kubb** para ler o OpenAPI (Swagger) do Supabase e gerar hooks e tipos.
**Consequência:** Fim dos erros de sincronia entre frontend e backend.
