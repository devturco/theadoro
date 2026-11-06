# Supabase — banco, migrations e edge functions

Projeto: **`pfpbaepzvgovqheeqxlg`** (TheAdoro, região `sa-east-1`).

Este diretório é a fonte de verdade do backend. Alterações de schema entram por migration; integrações sensíveis entram por edge function.

---

## Migrations

### Regra

- Arquivo em `migrations/`, padrão `YYYYMMDDHHMMSS_nome_da_mudanca.sql`.
- **Toda tabela nova precisa de RLS habilitado e policies explícitas.**
- Nunca altere o schema pelo dashboard sem gerar a migration correspondente.
- Não edite migration já aplicada; crie uma nova.

### Aplicar

```bash
supabase link --project-ref pfpbaepzvgovqheeqxlg
supabase db push
```

Sem CLI: cole o SQL no **SQL Editor** do dashboard.

> ⚠️ **Antes do primeiro `db push`:** o histórico de migrations foi construído manualmente e aplicado via SQL Editor. A tabela `supabase_migrations.schema_migrations` pode **não** refletir o banco real. Rode `supabase db diff` ou compare as tabelas/colunas antes de deixar o CLI tentar reaplicar tudo.

### Padrões usados no projeto

- IDs `UUID` com `gen_random_uuid()`.
- `created_at` / `updated_at` com trigger `update_updated_at_column`.
- Slugs gerados por `generate_product_slug` / `slugify`.
- Aprovação de vendedor dispara `handle_seller_approval_subscription`.
- Helpers de autorização para RLS: `has_role`, `is_admin`, `can_access_order`, `is_order_seller_check`.

### Segurança

`public.exec_sql(query text)` é `SECURITY DEFINER` e permitia execução por `anon` — qualquer visitante com a chave pública podia rodar SQL arbitrário. O `EXECUTE` foi revogado de `PUBLIC`, `anon` e `authenticated`; permanece apenas para `service_role`, que é o que os scripts de `scripts/` usam.

O mesmo vale para os helpers de introspecção: `get_table_columns`, `get_table_info`, `list_cols`, `get_coupons_columns`, `get_user_debug_info`.

**Não reintroduza `GRANT EXECUTE ... TO anon` nesses objetos.**

---

## Edge Functions

```
functions/
├── process-payment/     # Pagar.me: cria/consulta/cancela cobranças
├── pagarme-webhook/     # recebe eventos e confirma pagamento
├── uber-delivery/       # Uber Direct: quote + request
└── ai-gift-assistant/   # sugestão de presentes (Gemini)
```

### Configuração de JWT

Definida em `config.toml`:

```toml
[functions.process-payment]
verify_jwt = false

[functions.pagarme-webhook]
verify_jwt = false

[functions.uber-delivery]
verify_jwt = false
```

`ai-gift-assistant` não tem entrada → mantém o padrão (`true`).

`verify_jwt = false` só é aceitável porque cada function se protege sozinha:

- `pagarme-webhook` exige autenticação (Basic Auth ou `x-webhook-secret`) e recusa tudo se nenhum secret estiver configurado.
- `uber-delivery` só executa ações previstas e usa a service role para ler/gravar o pedido.
- `process-payment` valida o payload e nunca devolve segredo ao cliente.

### Secrets

```bash
supabase secrets set UBER_CLIENT_ID=... UBER_CLIENT_SECRET=... UBER_CUSTOMER_ID=...
supabase secrets set PAGARME_WEBHOOK_USER=... PAGARME_WEBHOOK_PASSWORD=...
# alternativa ao Basic Auth:
supabase secrets set PAGARME_WEBHOOK_SECRET=...
```

`SUPABASE_URL` e `SUPABASE_SERVICE_ROLE_KEY` são injetados pelo runtime.

### Deploy

```bash
supabase functions deploy process-payment   --project-ref pfpbaepzvgovqheeqxlg --no-verify-jwt
supabase functions deploy pagarme-webhook   --project-ref pfpbaepzvgovqheeqxlg --no-verify-jwt
supabase functions deploy uber-delivery     --project-ref pfpbaepzvgovqheeqxlg --no-verify-jwt
supabase functions deploy ai-gift-assistant --project-ref pfpbaepzvgovqheeqxlg
```

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

### `pagarme-webhook` — contrato

Recebe o evento do Pagar.me, autentica, encontra o pagamento por `provider_transaction_id` ou `merchant_order_code`, atualiza `payments`/`orders`, grava em `payment_events` e dispara o despacho Uber quando aplicável.

Eventos tratados: `charge.paid`, `order.paid`, `charge.payment_failed`, `order.payment_failed`, `charge.failed`, `order.failed`.

---

## Checklist antes de publicar uma function

- [ ] Testou localmente com `supabase functions serve`
- [ ] Não loga segredo (nem em `console.log` de erro)
- [ ] Erros retornam `{ error, message }` com status HTTP correto
- [ ] Operação é idempotente (webhooks reenviam)
- [ ] Se usa `service_role`, não devolve dados de outros usuários ao cliente
- [ ] `config.toml` atualizado quando `verify_jwt` muda