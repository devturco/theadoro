# Supabase — banco, migrations e edge functions

Projeto: **`pfpbaepzvgovqheeqxlg`** (TheAdoro, região `sa-east-1`).

Este diretório é a fonte de verdade do backend. Alterações de schema entram por migration; integrações sensíveis entram por edge function.

---

## Migrations

`migrations/20261109000000_baseline_public_schema.sql` é a **fonte de verdade** do banco. Foi gerado a partir do projeto de produção em 2026-11-09 e inclui:

- enums, sequences, tabelas e colunas
- constraints, índices e as views `seller_summary` / `product_stats_daily`
- functions e triggers (inclusive `auth.users.on_auth_user_created`)
- RLS e todas as policies
- buckets e policies de Storage

É idempotente: usa `create ... if not exists`, `create or replace` e blocos `do $$` que conferem `pg_constraint` / `pg_policies`.

As migrations antigas ficam em `migrations/archive/` **apenas como histórico**. Não as aplique em um projeto novo — o baseline já contém o resultado delas.

### Projeto novo

```bash
supabase link --project-ref <novo-ref>
supabase db push
```

Depois do push:

1. `20261109000001_bootstrap_master_admin.sql` cria `admin@theadoro.com.br` (senha `theadoro@2025` — troque no primeiro acesso).
2. `20261109000002_seed_catalog.sql` cria categorias, planos, embalagens e configurações públicas.
3. Configure os secrets/credenciais de Pagar.me, Uber e e-mail (ver abaixo).

### Projeto existente

O banco de produção já corresponde ao baseline. Não rode `db push` cego: o histórico remoto das migrations antigas não bate com os arquivos locais. Mudanças novas entram como migration normal, `migrations/YYYYMMDDHHMMSS_nome.sql`.

### Regra

- Toda tabela nova precisa de RLS habilitado e policies explícitas.
- Nunca altere o schema pelo dashboard sem gerar a migration correspondente.
- Não edite migration já aplicada; crie uma nova.

### Padrões usados no projeto

- IDs `UUID` com `gen_random_uuid()`.
- `created_at` / `updated_at` com trigger `update_updated_at_column`.
- Slugs gerados por `generate_product_slug` / `slugify`.
- Aprovação de vendedor dispara `handle_seller_approval_subscription`.
- Helpers de autorização para RLS: `has_role`, `is_admin`, `can_access_order`, `is_order_seller_check`.

### Admin master

`migrations/20261109000001_bootstrap_master_admin.sql` (roda depois do baseline) cria o administrador padrão de uma instalação nova:

- e-mail `admin@theadoro.com.br`, senha `theadoro@2025`
- perfil em `profiles` (`role = 'admin'`, `verified`, `is_approved`)
- papel `admin` em `user_roles`
- identidade de e-mail em `auth.identities`, com e-mail confirmado

É **idempotente**: se o e-mail já existir, não altera a senha — apenas garante perfil e papel. Troque a senha no primeiro acesso ou edite `v_password` antes de aplicar.

### Segurança

`public.exec_sql(query text)` é `SECURITY DEFINER` e permitia execução por `anon` — qualquer visitante com a chave pública podia rodar SQL arbitrário. O `EXECUTE` foi revogado de `PUBLIC`, `anon` e `authenticated`; permanece apenas para `service_role`, que é o que os scripts de `scripts/` usam.

O mesmo vale para os helpers de introspecção: `get_table_columns`, `get_table_info`, `list_cols`, `get_coupons_columns`, `get_user_debug_info`.

**Não reintroduza `GRANT EXECUTE ... TO anon` nesses objetos.**

---

## Edge Functions

```
functions/
├── process-payment/          # Pagar.me: cria/consulta/cancela cobranças de pedido
├── seller-invoice-payment/   # Pagar.me: cobra fatura de assinatura do vendedor
├── pagarme-webhook/          # recebe eventos e confirma pedidos e faturas
├── send-email/               # e-mail transacional (SMTP ou Resend)
├── uber-delivery/            # Uber Direct: quote + request
├── admin-users/              # exclusão de usuário + troca de e-mail/senha (admin)
└── ai-gift-assistant/        # sugestão de presentes (Gemini)
```

### Configuração de JWT

Definida em `config.toml`:

```toml
[functions.process-payment]
verify_jwt = true

[functions.pagarme-webhook]
verify_jwt = false

[functions.uber-delivery]
verify_jwt = true

[functions.seller-invoice-payment]
verify_jwt = false

[functions.send-email]
verify_jwt = false

[functions.admin-users]
verify_jwt = false
```

`ai-gift-assistant` não tem entrada → mantém o padrão (`true`).

`process-payment` e `uber-delivery` exigem JWT **e** conferem o usuário dentro do código — o gateway aceita a chave anônima como JWT válido, então `verify_jwt` sozinho não bloqueia visitante.

`verify_jwt = false` só é aceitável porque cada function se protege sozinha:

- `pagarme-webhook` exige autenticação (Basic Auth ou `x-webhook-secret`) e recusa tudo se nenhum secret estiver configurado.
- `seller-invoice-payment` valida o JWT, confere que a fatura pertence ao chamador e lê o valor do banco.
- `send-email` valida o JWT para não virar relay de spam.
- `admin-users` valida o JWT do chamador e confere o papel `admin` em `user_roles` antes de qualquer ação.

### Secrets

```bash
supabase secrets set UBER_CLIENT_ID=... UBER_CLIENT_SECRET=... UBER_CUSTOMER_ID=...
supabase secrets set PAGARME_WEBHOOK_USER=... PAGARME_WEBHOOK_PASSWORD=...
# alternativa ao Basic Auth:
supabase secrets set PAGARME_WEBHOOK_SECRET=...

# e-mail transacional (escolha SMTP ou Resend):
supabase secrets set EMAIL_FROM="TheAdoro <noreply@theadoro.com.br>"
supabase secrets set SMTP_HOST=smtp.hostinger.com SMTP_PORT=465 SMTP_SECURE=true \
  SMTP_USER=noreply@theadoro.com.br SMTP_PASS=...
# ou:
supabase secrets set RESEND_API_KEY=...
```

Sem `SMTP_PASS` nem `RESEND_API_KEY`, a function responde 503 e o
`EmailService` apenas registra o aviso — o checkout não quebra.

`SUPABASE_URL` e `SUPABASE_SERVICE_ROLE_KEY` são injetados pelo runtime.

### Deploy

```bash
supabase functions deploy process-payment          --project-ref pfpbaepzvgovqheeqxlg
supabase functions deploy seller-invoice-payment   --project-ref pfpbaepzvgovqheeqxlg --no-verify-jwt
supabase functions deploy pagarme-webhook          --project-ref pfpbaepzvgovqheeqxlg --no-verify-jwt
supabase functions deploy send-email               --project-ref pfpbaepzvgovqheeqxlg --no-verify-jwt
supabase functions deploy uber-delivery            --project-ref pfpbaepzvgovqheeqxlg
supabase functions deploy admin-users              --project-ref pfpbaepzvgovqheeqxlg --no-verify-jwt
supabase functions deploy ai-gift-assistant        --project-ref pfpbaepzvgovqheeqxlg
```

> `process-payment` e `uber-delivery` exigem JWT porque o gateway aceita a
> chave anônima como JWT válido. As duas functions ainda conferem o usuário
> dentro do código.

### Rodar localmente

```bash
supabase functions serve uber-delivery --env-file supabase/.env.local
```

O arquivo `supabase/.env.local` não é versionado — crie com os secrets acima.

### `uber-delivery` — contrato

```jsonc
// cotação
{ "action": "quote", "origin": {...}, "destination": { "zip": "78000-000" }, "items": [...] }

// despacho (usa o quote salvo no pedido)
{ "action": "request", "orderId": "<uuid>" }
```

Respostas de erro são sempre `{ error, message }` com o motivo legível. O despacho é idempotente por `orders.uber_delivery_id`.

### `admin-users` — contrato

```jsonc
// confere o que existe vinculado ao usuário antes de excluir
{ "action": "preview-delete", "userId": "<uuid>" }

// exclui; sem `cascade` recusa (409) quando há produtos/pedidos do vendedor
{ "action": "delete", "userId": "<uuid>", "cascade": true }

// troca e-mail e/ou senha (mínimo de 8 caracteres)
{ "action": "set-credentials", "userId": "<uuid>", "email": "...", "password": "..." }
```

Regras da exclusão:

1. Sem `cascade`, a function responde **409** com as contagens quando o usuário tem produtos ou pedidos como vendedor.
2. Com `cascade`, apaga **produtos** e **embalagens** do vendedor.
3. **Pedidos nunca são apagados**: são registro financeiro. O vínculo (`orders.seller_id`, `order_items.seller_id`) vai para `null` — as FKs são `NO ACTION` e bloqueariam o delete.
4. Remove `seller_invoices`, `seller_subscriptions`, `seller_applications`, `user_roles` e `profiles`.
5. Por último, exclui o usuário em `auth.users` pela Admin API.

O próprio admin não pode excluir a própria conta (`{ "error": "self_delete" }`).

### `pagarme-webhook` — contrato

Recebe o evento do Pagar.me, autentica, encontra o pagamento por `provider_transaction_id` ou `merchant_order_code`, atualiza `payments`/`orders`, grava em `payment_events` e dispara o despacho Uber quando aplicável.

Eventos tratados: `charge.paid`, `order.paid`, `charge.payment_failed`, `order.payment_failed`, `charge.failed`, `order.failed`.

Também confirma faturas de assinatura: quando o código do pedido começa com
`INV-`, o evento atualiza `seller_invoices` em vez de `orders`.

**Cadastro obrigatório no painel do Pagar.me:** a URL do webhook com Basic
Auth está em `supabase/.env.webhook.local` (arquivo ignorado pelo git). Sem
esse cadastro, PIX de pedido e de fatura nunca confirmam.

### `seller-invoice-payment` — contrato

```jsonc
// cobrança no cartão (token gerado no navegador)
{ "action": "pay_card", "invoiceId": "<uuid>", "cardToken": "token_...", "installments": 1 }

// PIX da fatura (a confirmação chega pelo webhook)
{ "action": "create_pix", "invoiceId": "<uuid>" }

// troca de plano (cria/atualiza assinatura e gera a fatura)
{ "action": "change_plan", "planId": "<uuid>" }

// cancelamento da assinatura
{ "action": "cancel_subscription" }
```

- Valida o JWT do chamador e confere que a fatura pertence a ele.
- Lê o valor de `seller_invoices` e o preço do plano no banco — nunca aceita
  valor do cliente.
- Cartão aprovado marca a fatura como paga; PIX fica pendente até o webhook.
- O vendedor não tem permissão de UPDATE em `seller_invoices`/`seller_subscriptions`;
  a marcação de pago e a troca de plano são feitas no servidor.

### `send-email` — contrato

```jsonc
{
  "to": "cliente@email.com",
  "subject": "Pedido confirmado",
  "template": "order_confirmation", // ou "shipping_update"
  "data": { "orderId": "<uuid>", "items": ["..."], "total": 123.45 }
}
```

- Valida o JWT do chamador (não é relay aberto).
- Usa `RESEND_API_KEY` ou `SMTP_*`; remetente padrão `EMAIL_FROM`.
- Sem credencial configurada responde **503 `not_configured`** — o
  `EmailService` registra o aviso e o checkout continua.

---

## Checklist antes de publicar uma function

- [ ] Testou localmente com `supabase functions serve`
- [ ] Não loga segredo (nem em `console.log` de erro)
- [ ] Erros retornam `{ error, message }` com status HTTP correto
- [ ] Operação é idempotente (webhooks reenviam)
- [ ] Se usa `service_role`, não devolve dados de outros usuários ao cliente
- [ ] `config.toml` atualizado quando `verify_jwt` muda