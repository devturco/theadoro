# THEADORO GIFT - Backend (Supabase)

Lógica de banco de dados, segurança e funções de borda.

## 🗄️ Padrão de Migrações
- Arquivos em `migrations/` seguem o padrão `YYYYMMDDHHMMSS_nome_da_mudanca.sql`.
- **IMPORTANTE:** SEMPRE inclua políticas de RLS para novas tabelas.

## 🛡️ Políticas de Segurança (RLS)
- **Profiles:** Apenas o dono pode ver/editar seu próprio perfil (admins veem todos).
- **Products:** Qualquer um vê produtos ativos; apenas o vendedor edita seus próprios.
- **Orders:** Isolamento total por comprador e vendedor.

## ⚡ Edge Functions
- Localizadas em `functions/`. Use para integrações pesadas (gateways de pagamento, emails).
