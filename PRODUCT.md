# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

**Primário: comprador presenteando.** Consumidor brasileiro que precisa escolher um presente — para uma pessoa e uma ocasião — e comprar com entrega. Chega pela home, navega por categorias e ofertas, e decide entre produto físico e experiência agendável.

**Secundários:** vendedor (entra por `/seller/onboarding`, não pela home) e administrador (back-office). A home serve o comprador; vendedor e admin têm portas próprias.

## Product Purpose

Marketplace multi-vendedor de presentes, produtos físicos e serviços agendáveis. Existe para transformar "preciso presentear alguém" em um pedido entregue. Sucesso na home é um mix de **levar ao produto** (visualização → carrinho) e **gerar descoberta** (explorar categorias, ofertas e cupons).

## Positioning

Quatro diferenciais confirmados, todos simultâneos:

1. **Curadoria premium** — não é catálogo infinito de atacado; é seleção.
2. **Experiências agendáveis** — jantar, beleza e experiências vendidas junto com produtos físicos.
3. **Assistente de IA (tIAdoro)** — sugere presente por ocasião e perfil.
4. **Preço e oferta** — frete grátis, cupons e ofertas são parte da proposta, não um aparte.

## Operating Context

- Compra por ocasião (aniversário, namoro, casamento, datas comerciais), frequentemente com prazo.
- Navegação por categorias, busca, ofertas (`/offers`) e cupons (`/coupons`).
- Pagamento via Pagar.me: PIX, cartão de crédito e boleto.
- Entrega via Correios, com cálculo por CEP.
- Três papéis na mesma base de usuários: `admin`, `seller`, `buyer`.

## Capabilities and Constraints

- Catálogo: produtos, variações, categorias, avaliações, listas de desejos, listas de presentes.
- Pedidos, cupons, assinaturas de vendedor, faturamento, campanhas, embalagens de presente.
- Agendamentos: serviços com data e horário.
- Uploads de imagem e assistente de IA para sugestão de presentes.
- Front em React + Vite + Tailwind + shadcn/ui, com TanStack Query.
- Backend na versão atual do repositório: Supabase (Auth, Postgres, Edge Functions, Storage).
- **Decisão em aberto:** existe uma migração para Better-Auth + Elysia + Drizzle + oRPC preservada em `.bkp/theadoro-new-stack.zip`, ainda não commitada. O produto não decidiu se ela avança.

## Brand Commitments

- Nome: **THEADORO** (também grafado theAdoro).
- Paleta proprietária: vinho/bordô como primária, com dourado/champagne como apoio. Definida nos tokens em `apps/web/src/index.css`.
- Ativos de marca: `apps/web/public/logo-colors.png`, `icon.png`, `placeholder.svg`, e o conjunto fotográfico de categorias em `apps/web/src/assets/`.
- **Referência visual vinculante dada pelo produto:** estrutura de home inspirada no Mercado Livre (faixa promocional, linhas de cards, grade densa de produtos), com superfícies brancas e profundidade real — **sem** o degradê pastel/creme atual. A paleta do projeto permanece; a estrutura é referência de layout, não de cor.

## Evidence on Hand

- Fotografia real de produto e de categoria em `apps/web/src/assets/`.
- Catálogo e usuários reais no projeto Supabase `pfpbaepzvgovqheeqxlg` (admin `devturco@gmail.com`, 5 usuários).
- Manuais e decisões: `README.md`, `MANUAL.md`, `.memory/decisions.md`, `.github/copilot-instructions.md`.
- **Não fabricar:** depoimentos, número de clientes, benchmarks, prêmios, prazos de entrega ou políticas de troca que não estejam no repositório.

## Product Principles

1. **O presente é o herói.** Toda decisão de layout serve a "qual presente eu levo", não à densidade de catálogo.
2. **Preço é argumento, não rodapé.** Oferta, cupom e frete grátis aparecem no corpo da home, com o mesmo peso da curadoria.
3. **Curadoria se vê.** Seleção exige menos ruído por tela do que um marketplace de volume; densidade sem hierarquia destrói o posicionamento premium.
4. **Descoberta e conversão convivem.** A home não escolhe entre explorar e comprar: ela encaminha para ambos.
5. **A marca veste a interface.** Vinho e dourado são estrutura, não enfeite; nenhuma superfície neutra pode apagar a identidade.