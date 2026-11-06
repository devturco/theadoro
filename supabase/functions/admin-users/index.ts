import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

/**
 * Ações administrativas sobre usuários que exigem a service role:
 *
 *   { action: 'preview-delete', userId }
 *     → conta o que existe vinculado ao usuário (produtos, pedidos, cupons…)
 *
 *   { action: 'delete', userId, cascade?: boolean }
 *     → remove o usuário. Sem `cascade`, recusa quando há produtos/pedidos
 *       do vendedor e devolve 409 pedindo confirmação.
 *
 *   { action: 'set-credentials', userId, email?, password? }
 *     → troca e-mail e/ou senha de um usuário (admin).
 *
 * Quem chama precisa ser admin: o JWT é validado e o papel conferido em
 * `user_roles`. O client do browser nunca vê a service role.
 */

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  })

const MIN_PASSWORD_LENGTH = 8

type Client = ReturnType<typeof createClient>

async function assertAdmin(supabase: Client, authorization: string | null) {
  const token = (authorization || '').replace(/^Bearer\s+/i, '')
  if (!token) return { ok: false, status: 401, message: 'Token ausente.' }

  const { data: userData, error } = await supabase.auth.getUser(token)
  const caller = userData?.user
  if (error || !caller) return { ok: false, status: 401, message: 'Sessão inválida.' }

  const { data: roles } = await supabase
    .from('user_roles')
    .select('role')
    .eq('user_id', caller.id)

  const isAdmin = (roles || []).some((row: { role: string }) => row.role === 'admin')
  if (!isAdmin) return { ok: false, status: 403, message: 'Apenas administradores podem executar esta ação.' }

  return { ok: true as const, callerId: caller.id }
}

async function countRows(supabase: Client, table: string, column: string, value: string) {
  const { count } = await supabase
    .from(table)
    .select('id', { count: 'exact', head: true })
    .eq(column, value)

  return count || 0
}

async function summarize(supabase: Client, userId: string) {
  const [products, ordersAsSeller, ordersAsBuyer, coupons, giftWraps, reviews] = await Promise.all([
    countRows(supabase, 'products', 'seller_id', userId),
    countRows(supabase, 'orders', 'seller_id', userId),
    countRows(supabase, 'orders', 'buyer_id', userId),
    countRows(supabase, 'coupons', 'seller_id', userId),
    countRows(supabase, 'gift_wraps', 'seller_id', userId),
    countRows(supabase, 'reviews', 'buyer_id', userId),
  ])

  return { products, ordersAsSeller, ordersAsBuyer, coupons, giftWraps, reviews }
}

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })
  if (req.method !== 'POST') return json({ error: 'method_not_allowed' }, 405)

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
    )

    const auth = await assertAdmin(supabase, req.headers.get('authorization'))
    if (!auth.ok) return json({ error: 'forbidden', message: auth.message }, auth.status)

    const body = await req.json().catch(() => ({}))
    const action = body?.action
    const userId: string = body?.userId || ''
    if (!userId) return json({ error: 'user_required', message: 'Informe o userId.' }, 400)

    if (userId === auth.callerId && action === 'delete') {
      return json({ error: 'self_delete', message: 'Você não pode excluir a própria conta.' }, 400)
    }

    // ───────────────────────────── Pré-visualização ─────────────────────────
    if (action === 'preview-delete') {
      const summary = await summarize(supabase, userId)
      return json({ ...summary, requiresConfirmation: summary.products > 0 || summary.ordersAsSeller > 0 })
    }

    // ──────────────────────────────── Exclusão ──────────────────────────────
    if (action === 'delete') {
      const cascade = body?.cascade === true
      const summary = await summarize(supabase, userId)

      if (!cascade && (summary.products > 0 || summary.ordersAsSeller > 0)) {
        return json({
          error: 'confirmation_required',
          message: 'Este usuário tem produtos ou pedidos como vendedor. Confirme para apagar tudo.',
          ...summary,
        }, 409)
      }

      // 1. Catálogo do vendedor (as FKs de `products` são SET NULL, então um
      //    delete do perfil deixaria produtos órfãos — apagamos explicitamente).
      if (cascade) {
        await supabase.from('products').delete().eq('seller_id', userId)
        await supabase.from('gift_wraps').delete().eq('seller_id', userId)
      }

      // 2. Pedidos são registro financeiro: mantemos o pedido e soltamos o
      //    vínculo com o vendedor (FK é NO ACTION e bloquearia o delete).
      await supabase.from('orders').update({ seller_id: null }).eq('seller_id', userId)
      await supabase.from('order_items').update({ seller_id: null }).eq('seller_id', userId)

      // 3. Cobranças/assinaturas do vendedor
      await supabase.from('seller_invoices').delete().eq('seller_id', userId)
      await supabase.from('seller_subscriptions').delete().eq('seller_id', userId)
      await supabase.from('seller_applications').delete().eq('user_id', userId)

      // 4. Perfil e papéis (endereços, carrinho, wishlist saem por CASCADE)
      await supabase.from('user_roles').delete().eq('user_id', userId)
      await supabase.from('profiles').delete().eq('id', userId)

      // 5. Usuário do Auth
      const { error: authError } = await supabase.auth.admin.deleteUser(userId)
      if (authError) {
        return json({
          error: 'auth_delete_failed',
          message: `Perfil removido, mas o usuário do Auth não: ${authError.message}`,
        }, 500)
      }

      return json({ ok: true, deleted: summary })
    }

    // ────────────────────── E-mail e/ou senha do usuário ────────────────────
    if (action === 'set-credentials') {
      const email: string | undefined = body?.email?.trim() || undefined
      const password: string | undefined = body?.password || undefined

      if (!email && !password) {
        return json({ error: 'nothing_to_update', message: 'Informe e-mail e/ou senha.' }, 400)
      }

      if (password && password.length < MIN_PASSWORD_LENGTH) {
        return json({
          error: 'weak_password',
          message: `A senha precisa ter ao menos ${MIN_PASSWORD_LENGTH} caracteres.`,
        }, 400)
      }

      const updates: Record<string, unknown> = {}
      if (email) {
        updates.email = email
        updates.email_confirm = true
      }
      if (password) updates.password = password

      const { data, error } = await supabase.auth.admin.updateUserById(userId, updates)
      if (error) return json({ error: 'update_failed', message: error.message }, 400)

      if (email) {
        await supabase.from('profiles').update({ email }).eq('id', userId)
      }

      return json({ ok: true, email: data?.user?.email ?? email ?? null })
    }

    return json({ error: 'unknown_action', message: `Ação desconhecida: ${action}` }, 400)
  } catch (error) {
    console.error('admin-users error:', error)
    return json({ error: 'internal_error', message: (error as Error).message }, 500)
  }
})