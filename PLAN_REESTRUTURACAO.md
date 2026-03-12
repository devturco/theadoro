# Plano de Reestruturação: Monorepo, Docs e Memória Hierárquica

Este plano detalha a transição do projeto THEADORO GIFT para uma arquitetura escalável e amigável para IA.

## 1. Arquitetura Monorepo (Turborepo)

**Por que Monorepo?**
Atualmente, frontend, scripts, regras de banco (Supabase) e tipos estão todos misturados. Em um monorepo, isolamos responsabilidades. Isso evita que uma mudança na UI quebre uma tipagem do banco.

**Dificuldade:** Média. Exige reconfiguração de imports, Vite e TSConfig, mas os benefícios de longo prazo são massivos.

### Estrutura Proposta
```text
theadoro-gift/
├── apps/
│   ├── web/                # Atual frontend React/Vite
│   └── docs/               # Portal de documentação (Swagger/Mintlify)
├── packages/
│   ├── api-client/         # Clientes gerados pelo Kubb (React Query + Axios/Fetch)
│   ├── db/                 # Tipos do Supabase e schemas do Zod
│   ├── ui/                 # Componentes Shadcn isolados (para reuso)
│   └── config/             # Configurações compartilhadas (ESLint, TS, Tailwind)
└── supabase/               # Migrations e Edge Functions
```

## 2. API e Geração de Código (Swagger + Kubb)

**O Problema Atual:** As chamadas ao Supabase estão espalhadas em serviços (`user.service.ts`, `coupon.service.ts`). Tipagens são feitas manualmente, o que gera erros como o que vimos hoje (coluna "status" inexistente).

**A Solução (Swagger/OpenAPI + Kubb):**
1. O Supabase já gera automaticamente uma especificação OpenAPI (Swagger) através do PostgREST.
2. Usaremos o **Kubb** para ler esse Swagger e gerar automaticamente:
   - Tipos TypeScript exatos do banco.
   - Hooks do React Query (`useQuery`, `useMutation`).
   - Schemas de validação (Zod).

**Dificuldade:** Baixa/Média. O Supabase já fornece a base. O trabalho é configurar o Kubb em `packages/api-client`.

## 3. Memória Hierárquica para IA (Hierarchical Agent Memory)

Para que IAs (como eu) consigam dar manutenção sem se perder no tamanho do projeto, usaremos o padrão **HAM (Hierarchical Agent Memory)**.

**Como funciona:**
Em vez de um único arquivo `GEMINI.md` gigante, teremos:

1. **`GEMINI.md` (Raiz):** Regras de ouro (como TDD), comandos globais e um "mapa" dizendo à IA onde achar mais contexto.
2. **`apps/web/GEMINI.md`:** Regras de UI, rotas e componentes.
3. **`packages/api-client/GEMINI.md`:** Como gerar o Kubb e lidar com o Supabase.
4. **`.memory/` (Pasta Oculta):** Log de decisões arquiteturais (ADRs).

**Dificuldade:** Muito baixa. Requer apenas a criação e organização dos arquivos Markdown.

---

## 🚀 Roteiro de Execução (Fases)

### Fase 1: Fundação do Monorepo (Estimativa: 1 dia)
- [ ] Inicializar o **Turborepo** na raiz.
- [ ] Mover o código atual para `apps/web`.
- [ ] Extrair configurações de TypeScript, Tailwind e ESLint para `packages/config`.
- [ ] Garantir que o app continua rodando com `npm run dev` na nova estrutura.

### Fase 2: Geração de API com Kubb (Estimativa: 1 a 2 dias)
- [ ] Criar o pacote `packages/api-client`.
- [ ] Configurar script para baixar o OpenAPI JSON do Supabase.
- [ ] Configurar o **Kubb** para gerar os hooks do TanStack React Query.
- [ ] Refatorar *gradualmente* os serviços antigos (ex: `user.service.ts`) para usar os hooks gerados pelo Kubb.

### Fase 3: Memória Hierárquica e Documentação (Estimativa: 1 dia)
- [ ] Criar o `GEMINI.md` principal com roteamento de contexto.
- [ ] Criar os `GEMINI.md` de cada pacote (`apps/web`, `packages/ui`).
- [ ] Opcional: Subir um app de documentação interativa em `apps/docs` (usando VitePress ou Docusaurus) exibindo a API via Swagger UI.

---
**Resultado:** O projeto passará de um monolito frágil para um ecossistema corporativo, auto-documentado e 100% blindado contra erros de digitação de banco de dados.