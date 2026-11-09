-- Colunas de despacho (Uber Direct) no pedido.
-- shipping_provider  : quem entrega ('uber' | 'correios' | ...)
-- shipping_quote_id  : id da cotação usada no checkout (obrigatório para /deliveries)
-- uber_delivery_id   : id da entrega na Uber (idempotência do despacho)
-- tracking_url       : link de rastreio devolvido pela Uber

ALTER TABLE public.orders
  ADD COLUMN IF NOT EXISTS shipping_provider TEXT,
  ADD COLUMN IF NOT EXISTS shipping_quote_id TEXT,
  ADD COLUMN IF NOT EXISTS uber_delivery_id TEXT,
  ADD COLUMN IF NOT EXISTS tracking_url TEXT;

CREATE INDEX IF NOT EXISTS orders_uber_delivery_id_idx
  ON public.orders (uber_delivery_id);