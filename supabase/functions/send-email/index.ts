import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import nodemailer from 'npm:nodemailer@6.9.16'

/**
 * E-mail transacional.
 *
 * Provedores suportados (configure um):
 *   RESEND_API_KEY
 *   SMTP_HOST / SMTP_PORT / SMTP_USER / SMTP_PASS / SMTP_SECURE
 *
 * Remetente padrão: TheAdoro <noreply@theadoro.com.br> (EMAIL_FROM).
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

const DEFAULT_FROM = 'TheAdoro <noreply@theadoro.com.br>'

const escapeHtml = (value: unknown) =>
  String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')

const formatMoney = (value: unknown) => {
  const amount = Number(value)
  if (!Number.isFinite(amount)) return ''
  return amount.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
}

type Template = 'order_confirmation' | 'shipping_update' | string

function renderTemplate({
  template,
  data,
}: {
  template: Template
  data: Record<string, any>
}): { subject: string; html: string; text: string } {
  if (template === 'order_confirmation') {
    const items = Array.isArray(data?.items) ? data.items : []
    const itemsHtml = items.map((item: unknown) => `<li>${escapeHtml(item)}</li>`).join('')
    const orderId = escapeHtml(data?.orderId || '')

    const html = `
      <div style="font-family:Arial,sans-serif;color:#2b2b2b;line-height:1.6">
        <h2 style="color:#6b1f2a">Pedido confirmado</h2>
        <p>Recebemos seu pedido <strong>#${orderId.slice(0, 8)}</strong>.</p>
        ${itemsHtml ? `<ul>${itemsHtml}</ul>` : ''}
        ${data?.total ? `<p><strong>Total:</strong> ${escapeHtml(formatMoney(data.total))}</p>` : ''}
        <p>Você pode acompanhar o pedido na sua conta.</p>
        <p style="color:#777;font-size:12px">TheAdoro — presentes que contam histórias.</p>
      </div>
    `

    return {
      subject: `Pedido #${orderId.slice(0, 8)} confirmado`,
      html,
      text: `Pedido #${orderId.slice(0, 8)} confirmado. Total: ${formatMoney(data?.total)}`,
    }
  }

  if (template === 'shipping_update') {
    const orderId = escapeHtml(data?.orderId || '')
    const status = escapeHtml(data?.status || 'atualizado')

    return {
      subject: `Atualização do pedido #${orderId.slice(0, 8)}`,
      html: `
        <div style="font-family:Arial,sans-serif;color:#2b2b2b;line-height:1.6">
          <h2 style="color:#6b1f2a">Seu pedido foi atualizado</h2>
          <p>Pedido <strong>#${orderId.slice(0, 8)}</strong>: ${status}.</p>
          ${data?.trackingUrl ? `<p><a href="${escapeHtml(data.trackingUrl)}">Acompanhar entrega</a></p>` : ''}
        </div>
      `,
      text: `Pedido #${orderId.slice(0, 8)}: ${status}.`,
    }
  }

  return {
    subject: escapeHtml(data?.subject || 'Mensagem TheAdoro'),
    html: `<div style="font-family:Arial,sans-serif;color:#2b2b2b">${escapeHtml(data?.message || '')}</div>`,
    text: String(data?.message || ''),
  }
}

async function sendWithResend({
  apiKey,
  from,
  to,
  subject,
  html,
  text,
}: {
  apiKey: string
  from: string
  to: string
  subject: string
  html: string
  text: string
}) {
  const response = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ from, to: [to], subject, html, text }),
  })

  const payload = await response.json().catch(() => null)

  if (!response.ok) {
    throw new Error(payload?.message || `Resend respondeu ${response.status}`)
  }

  return payload?.id || null
}

async function sendWithSmtp({
  from,
  to,
  subject,
  html,
  text,
}: {
  from: string
  to: string
  subject: string
  html: string
  text: string
}) {
  const host = Deno.env.get('SMTP_HOST')
  const user = Deno.env.get('SMTP_USER')
  const pass = Deno.env.get('SMTP_PASS')
  const port = Number(Deno.env.get('SMTP_PORT') || 465)
  const secure = Deno.env.get('SMTP_SECURE') !== 'false'

  if (!host || !user || !pass) {
    throw new Error('SMTP não configurado: defina SMTP_HOST, SMTP_USER e SMTP_PASS.')
  }

  const transport = nodemailer.createTransport({
    host,
    port,
    secure,
    auth: { user, pass },
  })

  const info = await transport.sendMail({ from, to, subject, html, text })
  return info?.messageId || null
}

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })
  if (req.method !== 'POST') return json({ error: 'method_not_allowed' }, 405)

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // Evita que a function vire relay de spam: exige usuário autenticado.
    const token = (req.headers.get('authorization') || '').replace(/^Bearer\s+/i, '').trim()
    if (!token) return json({ error: 'unauthorized', message: 'Token ausente.' }, 401)

    const { data: authData, error: authError } = await supabase.auth.getUser(token)
    if (authError || !authData?.user) {
      return json({ error: 'unauthorized', message: 'Sessão inválida.' }, 401)
    }

    const body = await req.json().catch(() => ({}))
    const to = String(body?.to || '').trim()
    const template = String(body?.template || 'generic')
    const data = body?.data || {}
    const requestedSubject = body?.subject ? String(body.subject) : ''

    if (!to || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(to)) {
      return json({ error: 'invalid_recipient', message: 'Destinatário inválido.' }, 400)
    }

    const rendered = renderTemplate({ template, data })
    const subject = requestedSubject || rendered.subject
    const from = Deno.env.get('EMAIL_FROM') || DEFAULT_FROM

    const resendKey = Deno.env.get('RESEND_API_KEY')
    const smtpConfigured = Boolean(
      Deno.env.get('SMTP_HOST') && Deno.env.get('SMTP_USER') && Deno.env.get('SMTP_PASS')
    )

    if (!resendKey && !smtpConfigured) {
      return json({
        error: 'not_configured',
        message: 'E-mail não configurado: defina RESEND_API_KEY ou SMTP_HOST/SMTP_USER/SMTP_PASS.',
      }, 503)
    }

    const providerId = resendKey
      ? await sendWithResend({
          apiKey: resendKey,
          from,
          to,
          subject,
          html: rendered.html,
          text: rendered.text,
        })
      : await sendWithSmtp({
          from,
          to,
          subject,
          html: rendered.html,
          text: rendered.text,
        })

    return json({ success: true, id: providerId, provider: resendKey ? 'resend' : 'smtp' })
  } catch (error) {
    console.error('send-email error:', error)
    return json({ error: 'send_failed', message: (error as Error).message }, 502)
  }
})