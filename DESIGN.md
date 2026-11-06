---
name: THEADORO
description: Premium Brazilian gifting marketplace — wine ink and gold metal on layered white plates.
colors:
  wine: "hsl(346 95% 25%)"
  wine-dark: "hsl(346 100% 18%)"
  wine-light: "hsl(346 78% 35%)"
  wine-50: "hsl(346 60% 96%)"
  gold: "hsl(42 60% 36%)"
  gold-soft: "hsl(42 70% 94%)"
  surface: "hsl(0 0% 100%)"
  surface-muted: "hsl(0 0% 98%)"
  surface-sunken: "hsl(0 0% 96%)"
  border: "hsl(0 0% 89%)"
  foreground: "hsl(0 0% 7%)"
  muted-foreground: "hsl(0 0% 42%)"
  inverse: "hsl(0 0% 0%)"
typography:
  display:
    fontFamily: "Playfair Display, Georgia, serif"
    fontSize: "44px"
    fontWeight: 700
    lineHeight: 1.08
    letterSpacing: "-0.02em"
  headline:
    fontFamily: "Playfair Display, Georgia, serif"
    fontSize: "30px"
    fontWeight: 700
    lineHeight: 1.2
    letterSpacing: "0em"
  title:
    fontFamily: "Inter, -apple-system, BlinkMacSystemFont, Segoe UI, sans-serif"
    fontSize: "24px"
    fontWeight: 700
    lineHeight: 1.3
    letterSpacing: "0em"
  body:
    fontFamily: "Inter, -apple-system, BlinkMacSystemFont, Segoe UI, sans-serif"
    fontSize: "16px"
    fontWeight: 400
    lineHeight: 1.625
    letterSpacing: "0em"
  label:
    fontFamily: "Inter, -apple-system, BlinkMacSystemFont, Segoe UI, sans-serif"
    fontSize: "14px"
    fontWeight: 600
    lineHeight: 1.4
    letterSpacing: "0em"
rounded:
  sm: "8px"
  md: "10px"
  lg: "12px"
  xl: "16px"
  full: "9999px"
spacing:
  1: "4px"
  2: "8px"
  3: "12px"
  4: "16px"
  5: "20px"
  6: "24px"
  8: "32px"
  10: "40px"
  16: "64px"
components:
  button-primary:
    backgroundColor: "{colors.wine}"
    textColor: "{colors.surface}"
    typography: "{typography.label}"
    rounded: "{rounded.lg}"
    padding: "12px 24px"
  button-primary-hover:
    backgroundColor: "{colors.wine-dark}"
  button-outline:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.foreground}"
    rounded: "{rounded.lg}"
    padding: "12px 24px"
  search-field:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.foreground}"
    rounded: "{rounded.md}"
    height: "44px"
  offer-plate:
    backgroundColor: "{colors.surface}"
    rounded: "{rounded.xl}"
    padding: "40px"
  promo-plate:
    backgroundColor: "{colors.surface}"
    rounded: "{rounded.xl}"
    padding: "20px"
  action-tile:
    backgroundColor: "{colors.surface}"
    rounded: "{rounded.lg}"
    padding: "12px"
  product-card:
    backgroundColor: "{colors.surface}"
    rounded: "{rounded.lg}"
    padding: "12px"
  seller-card:
    backgroundColor: "{colors.surface}"
    rounded: "{rounded.xl}"
  pill-link:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.foreground}"
    rounded: "{rounded.full}"
    padding: "8px 16px"
---

# Design System: THEADORO

## Overview

**Creative North Star: "The White Counter"**

The home is a counter, not a page. Every section is a white plate — a 1px hairline edge, a soft two-layer shadow tinted with the wine hue — laid on a white floor whose only relief is a `neutral-50` band. Wine is ink and gold is metal: wine appears in the full-bleed header band, in headings, icon strokes, buttons and small chip text, never as a wash over a reading surface; gold appears in single small accents over white. The build retired the ivory/cream ground, the wine→ivory gradient hero and the frosted translucent cards that preceded it. Those definitions still sit in the token file, but the home no longer uses them.

Density is marketplace density — six action tiles, six category tiles, four product cards — while hierarchy is carried by scale and tone rather than color: a 44px Playfair hero, 30px section heads, 24px prices, 14px product names in gray. Depth is real elevation (offset plus soft blur, always at hue 346), never a glass blur. Photography lives inside fixed frames: product images sit on white and are `object-contain`, category images run edge to edge under a bottom-weighted black scrim.

**Key Characteristics:**
- White ground (`hsl(0 0% 100%)`) with `neutral-50` as the single tonal band.
- One solid, full-bleed wine band at the top; wine as ink elsewhere.
- Every plate: 1px `rgb(0 0 0 / 0.07)` hairline plus a two-layer wine-tinted shadow.
- Playfair Display on headings only; Inter carries every other voice, including prices.
- 16px plate radius, 12px control radius, full pills for secondary actions, circles for avatars and the assistant launcher.

## Colors

A two-color brand on a neutral, cool paper scale: deep burgundy as the ink, a dark gold as the only metal, and grays that carry all remaining hierarchy.

### Primary
- **Wine Ink** (`hsl(346 95% 25%)`, roughly `#7D031F`): the header band, the hero headline, action-tile icons, primary buttons, the quick-add button, chip text on the pale wine wash, and the cart count text on its white badge. It is the brand's sole structural color.
- **Wine Deep** (`hsl(346 100% 18%)`): hover state for wine buttons, the full-height mobile drawer, and the footer's gradient hairline.
- **Wine Light** (`hsl(346 78% 35%)`): retained for the legacy wine gradient; on the home it survives only inside the assistant panel header.
- **Wine Wash** (`hsl(346 60% 96%)`): the `wine/[0.07]` chip background behind action-tile CTAs — the tint, not a fill.

### Secondary
- **Gold Metal** (`hsl(42 60% 36%)`): small supporting accents over white only. The shipped gold is deliberately darker than the light champagne-gold the direction contract named (`#C9A35A`); the build chose a value that holds contrast at small sizes on white, and the build wins.
- **Gold Soft** (`hsl(42 70% 94%)`): defined for pale gold grounds; not used on the home.

### Neutral
- **White Plate** (`hsl(0 0% 100%)`): the page ground, card bodies, the hero plate, the promo plates, and the product image field.
- **Neutral Floor** (`hsl(0 0% 98%)`): `--surface-muted` and Tailwind's `neutral-50` are the same value; this is the Featured Products band and the only tonal break on the home.
- **Sunken Surface** (`hsl(0 0% 96%)`): category image placeholders while loading, and muted/accent surfaces in shared UI.
- **Hairline** (`hsl(0 0% 89%)`): body borders and pill-link outlines. Plate edges use `rgb(0 0 0 / 0.07)` instead — a warmer, thinner line.
- **Ink** (`hsl(0 0% 7%)`): body text and headings outside the hero. Product names drop to `neutral-600`; product metadata to `neutral-400/500`.
- **Muted Ink** (`hsl(0 0% 42%)`): section subtitles and supporting copy.
- **Black Inverse** (`hsl(0 0% 0%)`): the footer field only.

### Named Rules
**The White Plate Rule.** The ground and every content plate are white. The only permitted tonal step is `neutral-50`; there is no ivory, cream, champagne or warm cast anywhere on the home.

**The Wine Is Ink Rule.** Wine fills exactly one thing: the header band. Everywhere else it is ink — type, icon strokes, button fills, chip text. A content surface is never washed in wine.

**The Gold Is Metal Rule.** Gold is a rare metallic accent on white. It never fills a surface, never sits on wine, and never sets body copy. If it starts appearing on more than one element per band, it is being used as a palette instead of a metal.

## Typography

**Display Font:** Playfair Display (with Georgia, serif)
**Body Font:** Inter (with system sans)

**Character:** A high-contrast editorial serif for the promise, a neutral UI sans for the transaction. Playfair gives the counter its premium voice in large sizes only; Inter does every piece of reading work, including prices and product names, so the catalog never competes with the brand.

### Hierarchy
- **Display** (700, 28px mobile → 36px → 44px desktop, line-height 1.08, letter-spacing -0.02em): the hero headline only, in wine.
- **Headline** (700, 20px mobile → 30px desktop, line-height 1.2): section titles — "Explore Categorias", "Produtos em Destaque", "Compre de Quem Encanta".
- **Title** (700, 24px desktop / 20px mobile, line-height 1.3): promo prices and seller names, in near-black.
- **Body** (400, 15–16px, line-height 1.625): hero paragraph, plate notes, tile descriptions. Held to a `max-w-md` measure on the hero.
- **Label** (500–600, 14px): navigation links and button labels; 12px semibold for tile and product CTAs.

### Named Rules
**The Playfair Ceiling Rule.** Playfair carries headings only, at 600–700 — its imported weights stop at 700, so heavier requests resolve to 700. Body copy, prices, product names and shipping lines are always Inter.

**The Hierarchy By Scale Rule.** Product cards do not shout. Their names are 14px regular `neutral-600`, the price is 24px regular near-black, and lift comes from size, not weight or color.

## Layout

The container is centered and caps at 1400px; the home applies 12px side padding on mobile and 16px from `sm` up, overriding the shared 32px default. Sections use 40px vertical padding on mobile and 64px from `sm` up, with no decorative separators between them — the plate edges do the dividing.

The first band is the header: a full-bleed wine block with a 44px logo plate, a 44px search field, and a 14px navigation row under a `border-white/15` rule. Below it, a `2fr / 1fr` desktop grid holds the hero plate and a stack of two promo plates; the hero splits internally into `1.15fr / 1fr` copy and photograph, and stacks to copy-then-image on mobile.

Grids grow in column count, not in card size: action tiles run 2 → 3 (`sm`) → 6 (`xl`); categories run 2 → 3 (`sm`) → 6 (`lg`); products run 2 → 4 (`lg`); sellers run 1 → 3 (`sm`). Gaps are 12px on mobile, 16–20px above. Plate padding steps with the surface: 12–16px for tiles, 20px for promo plates, 24–40px for the hero.

### Named Rules
**The Six-Across Rule.** At `xl`, six tiles fit across on 12px gaps. When the grid needs more content, add a row — never shrink the tile until the icon, title and chip stop reading.

## Elevation & Depth

Depth is real and always wine-tinted: every elevated plate stacks a 1px contact shadow with a broad, negative-spread falloff at hue 346, 12% lightness. Plates are elevated at rest — they are objects on a counter, not a flat sheet — and hover adds a 2px lift with a deeper falloff. There is no glass, no backdrop blur on plates, and no single-blur ambient shadow.

The `--shadow-sm/md/lg/wine` custom properties exist in `index.css`, but they are not exposed through the Tailwind theme; the home spells the two-layer values inline on each component. Those inline values are the shipped scale.

### Shadow Vocabulary
- **Contact** (`0 1px 2px hsl(346 25% 12% / 0.05)`): at-rest elevation for action tiles, category tiles, product and seller cards.
- **Plate** (`0 1px 2px hsl(346 25% 12% / 0.06), 0 14px 36px -16px hsl(346 25% 12% / 0.20)`): the hero offer plate.
- **Panel** (`0 1px 2px hsl(346 25% 12% / 0.05), 0 10px 24px -14px hsl(346 25% 12% / 0.18)`): promo plates.
- **Hover lift** (`0 2px 4px hsl(346 25% 12% / 0.06), 0 16px 32px -16px hsl(346 25% 12% / 0.22)`): product and seller cards. Tiles use a 14px/28px falloff at the same alpha.
- **Band** (`0 12px 28px -16px hsl(var(--wine) / 0.65)`): cast downward by the header band onto the white floor.
- **Launcher** (`0 10px 24px -10px hsl(var(--wine) / 0.65)`): the floating assistant button.

### Named Rules
**The Two-Layer Rule.** Every plate carries a hairline contact shadow plus one soft falloff. One blur is not elevation; three are a costume.

**The Wine-Tinted Rule.** Shadow color is always `hsl(346 25% 12%)` at 5–22% alpha. Pure black and neutral-gray shadows belong to no part of this world.

**The Elevated-At-Rest Rule.** Plates sit on the counter with a shadow already present. Hover adds lift; it does not create the elevation.

## Shapes

Form language is rectilinear plates with softly rounded corners. Plates and promo panels are 16px; cards, tiles, hero buttons and search controls are 12px; the search field and product quick-add button use the 10px step; pills are fully round. Tailwind's `lg` radius is retargeted to `var(--radius)` (12px), so `rounded-lg` and `rounded-xl` are the same 12px step in this codebase — reach for `rounded-2xl` when a shape must read as a plate.

Edges come from lines, not from shadow: plates carry a 1px `rgb(0 0 0 / 0.07)` border, category tiles use a `ring-1` at the same alpha, and the wine band's inner elements use `border-white/15–20`. Circles are reserved for identity and floating action: seller avatars (112px, 4px white border) and the 56px assistant launcher.

### Named Rules
**The Hairline Edge Rule.** The 1px line defines the plate edge; the shadow only sets it on the floor. If one has to go, the line stays.

## Components

### Buttons
- **Shape:** 12px radius; 12px × 24px padding; 14px semibold label.
- **Primary:** solid wine with white text. Hover deepens to `wine-dark`; focus-visible uses a 2px wine ring at 40% with a 2px white offset.
- **Secondary:** white fill, 1px `neutral-200` border, `neutral-800` text; hover shifts the border and text to wine. It does not fill with wine.
- **On the wine band:** the search submit is a 10px-radius wine chip with a 12px semibold label. On the drawer and the assistant, the inverted primary is a white fill with wine text.
- **Shared `Button`:** the UI package default is `rounded-xl` (12px) with a 300ms transition. Its `shadow-wine` class is a shadow-*color* utility, so the wine variant reads flat unless a shadow size is also present.

### Search
- **Style:** 44px white field on the wine band, 10px radius, `border-white/20`, 15px text, `neutral-500` placeholder, 60% white at rest.
- **Focus:** the border goes pure white; there is no glow.
- **Mobile:** 36px tall with a 12px radius and a 14px label.

### Plates (offer and promo)
- **Offer plate:** white 16px-radius panel, hairline border, two-layer plate shadow; copy at 24–40px padding on the left, photograph cropped to the right, stacked on mobile with a 180px minimum image height.
- **Promo plates:** 20px padding, 16px radius, panel shadow; a 24px bold near-black figure over a 14px `neutral-600` supporting line.
- **Behavior:** the promo plates do not lift on hover; the hero plate does not either. Only small cards respond.

### Action Tiles
- **Style:** white, 12px radius, 12px/16px padding, contact shadow, near-black 18px semibold title, wine 36px Lucide icon, 14px `neutral-600` description (hidden on mobile).
- **CTA chip:** 10px radius, `wine/[0.07]` ground, 12px semibold wine text.
- **Hover:** `-translate-y-0.5` with a deeper 14px/28px falloff over 300ms.

### Category Tiles
- **Style:** white 16px-radius tile, `ring-1 ring-black/[0.07]`, contact shadow; image container at 112/144/176px by breakpoint (not square on mobile).
- **Scrim:** a permanent bottom-weighted black gradient (`from-black/75 via-black/30 to-transparent`) carrying the white name and a 9–10px white/75 description.
- **Hover:** the image zooms to 1.10 over 700ms inside the fixed frame; the tile itself does not scale.

### Product Cards
- **Style:** white 12px-radius card, hairline border, contact shadow; image field is square, white, `object-contain` with 8px padding.
- **Text:** 14px regular `neutral-600` name (two-line clamp), 10px seller line, 24px regular near-black price, 10–12px installments.
- **Action:** a 32px-tall wine "Adicionar ao carrinho" button at 12px medium, no shadow.
- **Hover:** the card lifts with the 16px/32px falloff; the image zooms to 1.05; the name shifts to `neutral-900`.

### Seller Cards
- **Style:** white 16px-radius card, hairline border, contact shadow; a 128px solid wine banner, optional avatar photograph at 20% opacity over it.
- **Identity:** a 112px circular avatar in solid wine with a 4px white border and Playfair initials; a verified mark is a wine circle with a white Lucide award icon.
- **Type:** 20px bold name (`group-hover:text-primary`), 14px italic muted specialty line.
- **Actions:** wine fill and 2px wine outline, side by side, equal width.

### Navigation
- **Desktop:** wine band, 14px links at `white/90` rising to pure white on hover; no underlines, no pills, no active fill. The cart count is a white badge with wine text.
- **Mobile:** a 36px hamburger chip (`bg-white/10`), a white logo plate, and a 36px search field; the drawer is full-height `wine-dark` at 85vw (max 300px) with `white/10` rows and a white primary button.
- **Footer:** black field, 1px gradient hairline at the top (wine-deep → wine → light neutral → wine), 14px white/60 links.

### tIAdoro Launcher
A 56px wine circle with the Lucide sparkles glyph, a downward wine shadow, and a 1.05 scale plus `wine-dark` on hover. The panel is a 350px card with a `border-wine/20`; user messages are wine bubbles with a squared top-right corner, assistant messages are `neutral-100` bubbles with a squared top-left, and the send control is a wine circle. The panel header still renders the legacy wine→wine-light gradient; the launcher itself is solid.

## Do's and Don'ts

### Do:
- **Do** build every content section as a white plate with a 1px `rgb(0 0 0 / 0.07)` border and a two-layer wine-tinted shadow, per The White Plate Rule and The Two-Layer Rule.
- **Do** keep the header band full-bleed and solid wine with white type at 90–100% opacity, casting the down-tinted band shadow.
- **Do** keep Playfair at 600–700 on h1–h6 only and set everything else in Inter, per The Playfair Ceiling Rule.
- **Do** size hierarchy by scale and tone: 44px hero, 30px section head, 24px price, 14px product name.
- **Do** use 16px radius for plates, 12px for cards and controls, full pills for "see all" links, circles for avatars and the launcher.
- **Do** express hover as a 2px lift plus a deeper falloff at `0 16px 32px -16px`, and as image zoom inside a fixed frame.
- **Do** use `neutral-50` as the single tonal band, separated with `border-y border-black/[0.05]`.
- **Do** keep gold small, on white, and in the shipped dark tone; treat it as metal.
- **Do** keep photography inside frames: `object-contain` on white for products, full-bleed with a bottom-weighted black scrim for categories.

### Don't:
- **Don't** reintroduce the wine→ivory gradient, an ivory/cream/champagne ground, or frosted translucent content panels. Scrims and small `white/10` controls on the wine band are not panels.
- **Don't** wash a content surface in wine; per The Wine Is Ink Rule it fills only the header band.
- **Don't** use pure-black or neutral-gray shadows on plates; all plate shadows are hue 346 at 12% lightness.
- **Don't** use single-blur ambient shadows or hard offset shadows.
- **Don't** set body copy, product names, prices or installments in Playfair.
- **Don't** put gold on wine or use it for body copy.
- **Don't** add a third accent color to a new surface. The green discount and free-shipping text and the blue verification check inside the shipped product card are legacy exceptions, not precedent.
- **Don't** wrap a dense grid in glass, gradients or a tinted ground; six tiles across are still flat white plates.