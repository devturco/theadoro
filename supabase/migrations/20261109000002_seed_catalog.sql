-- ============================================================================
-- Seed essencial para uma instalação nova.
--
-- Categorias, planos de assinatura, embalagens e configurações públicas da
-- loja. Nenhum segredo (Pagar.me, Uber, Gemini) entra aqui — isso é feito em
-- Admin → Configurações ou por `supabase secrets set`.
--
-- Idempotente: só insere o que ainda não existe.
-- ============================================================================

-- ─────────────────────────────────────────────────────────────
-- Categorias
-- ─────────────────────────────────────────────────────────────
insert into public.categories (id, name, slug, description, image_url, is_active, parent_id)
select
  v.id, v.name, v.slug, v.description, v.image_url, true, v.parent_id
from (values
  ('cab614cf-3d58-4186-ab69-36640d59e1e7'::uuid, 'Moda', 'moda', 'Trendy apparel and accessories', null::text, null::uuid),
  ('e14e19b3-71dd-4b56-aba1-00a6c571299e'::uuid, 'Beleza', 'beleza', 'Skincare and beauty products', null::text, null::uuid),
  ('798e2a15-9264-4e62-93f3-aaf73356a790'::uuid, 'Experiências', 'experiencias', 'Unforgettable memories', null::text, null::uuid),
  ('60c7dd22-ed64-4848-be03-ffb79fb451c0'::uuid, 'Decoração', 'decoracao', 'Home decor items', null::text, null::uuid),
  ('21a4976c-2f6b-426c-9d65-1ab2fa1281c6'::uuid, 'Presentes', 'presentes', 'Curated gifts for all occasions', null::text, null::uuid),
  ('8e09ae3a-5af7-43a2-8f17-1e53b5a21da7'::uuid, 'Flores', 'flores', 'Fresh bouquets and arrangements', null::text, null::uuid),
  ('f1fb3868-44ea-4ed0-9873-813092bd82ab'::uuid, 'Maquiagem', 'maquiagem', '', '', 'e14e19b3-71dd-4b56-aba1-00a6c571299e'::uuid)
) as v(id, name, slug, description, image_url, parent_id)
where not exists (
  select 1 from public.categories c where c.slug = v.slug
);

-- ─────────────────────────────────────────────────────────────
-- Planos de assinatura
-- ─────────────────────────────────────────────────────────────
insert into public.subscription_plans (id, name, description, price, features, limits, is_active)
select
  v.id, v.name, v.description, v.price, v.features::jsonb, v.limits::jsonb, true
from (values
  (
    '6b2c5e69-d009-4a67-a9da-618dd46a181e'::uuid,
    'Start',
    'Para quem está começando a vender online.',
    29.90,
    '["Até 15 produtos ativos","Taxa de venda: 12%","Painel de vendas básico","Suporte por e-mail"]',
    '{"products":15}'
  ),
  (
    '54ac38f1-a050-4fba-bca8-75ec7997dd11'::uuid,
    'Scale',
    'Ideal para lojas em crescimento.',
    79.90,
    '["Até 100 produtos ativos","Taxa de venda: 9%","Relatórios de desempenho","Embalagens personalizadas","Suporte via Chat"]',
    '{"products":100}'
  ),
  (
    '18c4949c-9c8a-4080-b5ef-3ce20d4b0e0c'::uuid,
    'TheAdoro Pro',
    'Poder máximo com Inteligência Artificial.',
    149.90,
    '["Produtos Ilimitados","Taxa de venda: 6%","IA para descrições e títulos","Destaque na Home e Busca","Gerente de conta dedicado"]',
    '{"products":-1}'
  )
) as v(id, name, description, price, features, limits)
where not exists (
  select 1 from public.subscription_plans p where p.name = v.name
);

-- ─────────────────────────────────────────────────────────────
-- Embalagens de presente
-- ─────────────────────────────────────────────────────────────
insert into public.gift_wraps (id, name, description, price, image_url, is_active)
select v.id, v.name, v.description, v.price, v.image_url, true
from (values
  (
    'c2c864fd-82dd-4260-b38f-259b68e1e2b7'::uuid,
    'Clássico Vermelho',
    'Papel de presente vermelho clássico com laço dourado.',
    5.90,
    'https://images.unsplash.com/photo-1549465220-1a8b9238cd48?q=80&w=300&auto=format&fit=crop'
  ),
  (
    '37d573f8-a477-47bf-8620-a62b51475f59'::uuid,
    'Caixa Premium',
    'Caixa rígida preta com logo em hot stamping dourado e laço de cetim.',
    15.90,
    'https://pfpbaepzvgovqheeqxlg.supabase.co/storage/v1/object/public/gift-wraps/uploads/1768537690732.jpg'
  ),
  (
    'ec485baa-0edf-4a3d-8162-efee4aa65aa6'::uuid,
    'Infantil Colorido',
    'Papel colorido com estampas de bichinhos e laço colorido.',
    6.90,
    'https://pfpbaepzvgovqheeqxlg.supabase.co/storage/v1/object/public/gift-wraps/uploads/1768537767456.jpg'
  ),
  (
    'daa9bfbe-8d52-4d75-b884-d14f195d5a19'::uuid,
    'Kraft & Flores',
    'Papel kraft ecológico com barbante rústico e ramo de flores secas.',
    3.90,
    'https://pfpbaepzvgovqheeqxlg.supabase.co/storage/v1/object/public/gift-wraps/uploads/1768537830236.jpg'
  )
) as v(id, name, description, price, image_url)
where not exists (
  select 1 from public.gift_wraps g where g.name = v.name
);

-- ─────────────────────────────────────────────────────────────
-- Configurações públicas da loja (sem segredos)
-- ─────────────────────────────────────────────────────────────
insert into public.site_settings (section, key, value, label, type)
select v.section, v.key, v.value, v.label, v.type
from (values
  ('general', 'store_name',        to_jsonb('Theodoro'::text),              'Nome da Loja',            'text'),
  ('general', 'store_cep',         to_jsonb('78048-906'::text),             'CEP da Loja',             'text'),
  ('general', 'store_city',        to_jsonb('Cuiabá'::text),                'Cidade',                  'text'),
  ('general', 'store_state',       to_jsonb('MT'::text),                    'UF',                      'text'),
  ('general', 'store_address',     to_jsonb('Avenida dos Florais'::text),   'Endereço',                'text'),
  ('general', 'store_number',      to_jsonb('27'::text),                    'Número',                  'text'),
  ('general', 'store_neighborhood',to_jsonb('Ribeirão do Lipa'::text),      'Bairro',                  'text'),
  ('general', 'store_complement',  to_jsonb(''::text),                      'Complemento',             'text'),
  ('general', 'maintenance_mode',  to_jsonb(false),                         'Modo Manutenção',         'boolean'),
  ('integrations', 'shipping_correios_enabled', to_jsonb(false),            'Correios habilitado',     'boolean'),
  ('integrations', 'shipping_uber_enabled',     to_jsonb(false),            'Uber Direct habilitado',  'boolean'),
  ('integrations', 'shipping_express_tariff',   to_jsonb(0),                'Tarifa do Express (%)',   'number'),
  ('integrations', 'payment_pagarme_enabled',   to_jsonb(false),            'Pagar.me habilitado',     'boolean'),
  ('integrations', 'payment_pagarme_test_mode', to_jsonb(true),             'Pagar.me modo teste',     'boolean'),
  ('ai', 'ai_assistant_enabled',                to_jsonb(false),            'Assistente IA habilitado','boolean')
) as v(section, key, value, label, type)
where not exists (
  select 1 from public.site_settings s where s.key = v.key
);