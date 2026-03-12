# THEADORO GIFT - API Client (@theadoro/api-client)

Este pacote gerencia a comunicação com o Supabase usando geração automática de código.

## ⚙️ Fluxo de Trabalho
1. Se o banco de dados mudar, rode `npm run generate` nesta pasta.
2. O Kubb lerá o `swagger.json` e atualizará `src/gen/`.
3. Nunca edite arquivos dentro de `src/gen/` manualmente.

## 🧩 Estrutura de Geração
- `src/gen/hooks`: Hooks do TanStack Query (`useQuery`, `useMutation`).
- `src/gen/types`: Interfaces TypeScript geradas do banco.
- `src/gen/zod`: Schemas de validação para formulários.

## 🚀 Como usar
Importe hooks e tipos diretamente no frontend:
```typescript
import { useGetProfiles, Profiles } from '@theadoro/api-client';
```
