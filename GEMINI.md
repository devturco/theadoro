# Diretrizes do Projeto: THEADORO GIFT

Este arquivo contém mandatos fundamentais para qualquer agente de IA que trabalhe neste repositório. Estas instruções têm precedência sobre os comportamentos padrão.

## 🔴 Mandato Principal: Test-First (TDD)

**Sempre escreva e execute testes unitários ANTES de implementar ou modificar qualquer funcionalidade.**

### Fluxo de Trabalho Obrigatório:
1.  **Red (Falha)**: Crie um arquivo de teste que cubra o bug reportado ou a nova funcionalidade desejada. Execute o teste e confirme que ele **falha**.
2.  **Green (Sucesso)**: Implemente a mudança mínima necessária para fazer o teste passar.
3.  **Refactor (Refatoração)**: Limpe o código, mantendo o teste passando.
4.  **Validate**: Execute o conjunto de testes completo para garantir que não houve regressões.

### Padrões de Teste:
- Use **Vitest** ou **Jest** (verificar configuração no package.json).
- Foque em lógica de negócio nos `services` e comportamentos de UI nos `components`.
- Nunca aceite uma tarefa como concluída sem a evidência de que os testes novos e existentes estão passando.

## 🛠️ Skills Recomendadas
Sempre ative as seguintes skills ao iniciar uma tarefa de implementação:
- `test-driven-development`
- `unit-testing-test-generate`
- `verification-before-completion`

### 🗄️ Alterações de Banco de Dados (SQL)
- **Entrega via Arquivo (CRÍTICO)**: NUNCA peça para copiar SQL diretamente do chat/CLI (devido aos números de linha). Sempre crie ou atualize um arquivo em `supabase/migrations/` e instrua o usuário a abrir esse arquivo para copiar o código.
- **Migrations Obrigatórias**: Toda alteração no esquema do banco deve ser salva em um novo arquivo `.sql`.
- **Lembrete de Execução**: O agente deve SEMPRE informar o caminho do arquivo e lembrar o usuário de executá-lo no Editor SQL do Supabase.
- **Segurança (RLS)**: Nunca crie uma tabela sem políticas de RLS adequadas.

---
*Este documento é a "Constituição" do desenvolvimento deste projeto.*
