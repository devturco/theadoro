#!/usr/bin/env node
/**
 * Gera `docs/THEADORO-documentacao.pdf` a partir do README.md.
 *
 * Uso:
 *   node scripts/build-readme-pdf.mjs
 *
 * Requisitos:
 *   - Google Chrome instalado (o script procura nos caminhos padrão do Windows/macOS/Linux)
 *   - `npm i --no-save --package-lock=false puppeteer-core` (só para gerar o PDF;
 *     não é dependência do app)
 *
 * O documento é pensado para ser lido fora do repositório: capa, resumo em uma
 * página, sumário navegável e tipografia de leitura — sem depender de nada além
 * do próprio arquivo.
 */

import { readFileSync, writeFileSync, mkdirSync, existsSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { marked } from 'marked';
import puppeteer from 'puppeteer-core';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const README = resolve(ROOT, 'README.md');
const OUT_DIR = resolve(ROOT, 'docs');
const OUT_PDF = resolve(OUT_DIR, 'THEADORO-documentacao.pdf');

const CHROME_CANDIDATES = [
  'C:/Program Files/Google/Chrome/Application/chrome.exe',
  'C:/Program Files (x86)/Google/Chrome/Application/chrome.exe',
  '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
  '/usr/bin/google-chrome',
  '/usr/bin/chromium',
  '/usr/bin/chromium-browser',
];

const chromePath = CHROME_CANDIDATES.find((p) => existsSync(p));
if (!chromePath) {
  console.error('Chrome não encontrado. Instale o Google Chrome ou ajuste CHROME_CANDIDATES.');
  process.exit(1);
}

// ───────────────────────────── Markdown → HTML ─────────────────────────────

const slug = (text) =>
  text
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');

// Normaliza CRLF: no Windows o repositório é clonado com autocrlf.
const markdown = readFileSync(README, 'utf-8').replace(/\r\n/g, '\n');

// O README abre com o título do produto; a capa assume esse papel.
let body = markdown.replace(/^# .*\n+/, '');

// O sumário do README é substituído pelo sumário navegável do PDF.
body = body.replace(/## Sumário\n[\s\S]*?(?=\n## )/, '');

// A abertura do README (parágrafo + aviso) já aparece na capa e no resumo:
// o corpo começa direto na primeira seção.
body = body.replace(/^[\s\S]*?(?=## )/, '');

let html = marked.parse(body, { mangle: false, headerIds: false });

// Ids + numeração das seções de nível 2
const sections = [];
html = html.replace(/<h2>([\s\S]*?)<\/h2>/g, (_match, inner) => {
  const title = inner.replace(/<[^>]+>/g, '').trim();
  const id = slug(title);
  sections.push({ id, title });
  return `<h2 id="${id}" class="chapter"><span class="chapter-mark"></span>${inner}</h2>`;
});

// Checklists viram caixas de marcar visuais
html = html.replace(/\[ \]/g, '<span class="checkbox"></span>');

const toc = sections
  .map(
    (s, i) =>
      `<li><a href="#${s.id}"><span class="toc-num">${String(i + 1).padStart(2, '0')}</span><span class="toc-title">${s.title}</span></a></li>`,
  )
  .join('');

const today = new Intl.DateTimeFormat('pt-BR', { month: 'long', year: 'numeric' }).format(new Date());

// Citação solta (blockquote) com emoji de alerta vira "aviso"
const css = `
  :root {
    --wine: #5c1b2a;
    --wine-deep: #2b1116;
    --gold: #a98545;
    --gold-soft: #d9c39a;
    --cream: #fbf8f3;
    --ink: #241a1c;
    --muted: #6d5f61;
    --line: #e6ddd1;
  }

  * { box-sizing: border-box; }

  html, body {
    margin: 0;
    padding: 0;
    color: var(--ink);
    font-family: "Segoe UI", "Helvetica Neue", Arial, sans-serif;
    font-size: 10.5pt;
    line-height: 1.65;
    -webkit-print-color-adjust: exact;
    print-color-adjust: exact;
  }

  h1, h2, h3, h4 {
    font-family: Georgia, "Times New Roman", serif;
    color: var(--wine-deep);
    font-weight: 700;
    letter-spacing: -0.01em;
  }

  p { margin: 0 0 0.85em; }

  a { color: var(--wine); text-decoration: none; border-bottom: 0.5pt solid var(--gold-soft); }

  strong { color: var(--wine-deep); }

  /* ── Capa ───────────────────────────────────────────────────────────── */
  .cover {
    position: relative;
    height: 100vh;
    background: var(--wine);
    color: #fff;
    padding: 28mm 24mm;
    display: flex;
    flex-direction: column;
    justify-content: space-between;
    overflow: hidden;
    break-after: page;
  }
  .cover::before {
    content: "";
    position: absolute;
    inset: 0;
    background:
      radial-gradient(120% 80% at 85% 0%, rgba(169,133,69,0.30) 0%, rgba(169,133,69,0) 60%),
      radial-gradient(90% 60% at 0% 100%, rgba(255,255,255,0.06) 0%, rgba(255,255,255,0) 70%);
  }
  .cover > * { position: relative; }

  .cover-brand { display: flex; align-items: center; gap: 10px; font-size: 9pt; letter-spacing: 0.32em; text-transform: uppercase; color: var(--gold-soft); }
  .cover-brand .dot { width: 6px; height: 6px; border-radius: 50%; background: var(--gold); display: inline-block; }

  .cover-main { flex: 1; display: flex; flex-direction: column; justify-content: center; padding-bottom: 10mm; }
  .cover-kicker { font-size: 9pt; letter-spacing: 0.28em; text-transform: uppercase; color: var(--gold-soft); margin-bottom: 10mm; }
  .cover h1 {
    color: #fff;
    font-size: 42pt;
    line-height: 1.02;
    margin: 0 0 8mm;
    letter-spacing: -0.025em;
  }
  .cover h1 em { font-style: normal; color: var(--gold-soft); display: block; font-size: 24pt; letter-spacing: -0.01em; margin-top: 4mm; }
  .cover-lead { font-size: 12pt; line-height: 1.6; max-width: 128mm; color: rgba(255,255,255,0.88); }
  .cover-rule { width: 34mm; height: 2px; background: var(--gold); margin: 12mm 0; }

  .cover-meta { display: flex; gap: 14mm; font-size: 9pt; color: rgba(255,255,255,0.75); border-top: 0.5pt solid rgba(255,255,255,0.22); padding-top: 6mm; }
  .cover-meta div span { display: block; font-size: 7.5pt; letter-spacing: 0.18em; text-transform: uppercase; color: var(--gold-soft); margin-bottom: 1.5mm; }

  /* ── Página de resumo ───────────────────────────────────────────────── */
  .overview { break-after: page; padding-top: 6mm; }
  .eyebrow { font-size: 8pt; letter-spacing: 0.26em; text-transform: uppercase; color: var(--gold); margin-bottom: 4mm; font-weight: 600; }
  .overview h2 { font-size: 26pt; margin: 0 0 6mm; line-height: 1.15; }
  .overview-lead { font-size: 11.5pt; color: var(--muted); max-width: 150mm; margin-bottom: 12mm; }

  .cards { display: grid; grid-template-columns: repeat(3, 1fr); gap: 6mm; margin-bottom: 12mm; }
  .card {
    border: 0.5pt solid var(--line);
    border-top: 2.5pt solid var(--wine);
    border-radius: 2mm;
    padding: 6mm 5mm;
    background: #fff;
    break-inside: avoid;
  }
  .card h3 { font-size: 13pt; margin: 0 0 2mm; }
  .card p { font-size: 9.5pt; color: var(--muted); margin: 0; line-height: 1.5; }

  .facts { width: 100%; border-collapse: collapse; margin-top: 4mm; }
  .facts td { padding: 4mm 3mm; border-top: 0.5pt solid var(--line); font-size: 10pt; vertical-align: top; }
  .facts td:first-child { width: 34mm; color: var(--gold); font-size: 8pt; letter-spacing: 0.18em; text-transform: uppercase; padding-top: 4.6mm; }

  /* ── Sumário ────────────────────────────────────────────────────────── */
  .toc-page { break-after: page; padding-top: 6mm; }
  .toc-page h2 { font-size: 26pt; margin: 0 0 8mm; }
  .toc { list-style: none; margin: 0; padding: 0; columns: 2; column-gap: 12mm; }
  .toc li { break-inside: avoid; margin-bottom: 3.2mm; }
  .toc a { display: flex; gap: 4mm; align-items: baseline; border: 0; color: var(--ink); }
  .toc-num { color: var(--gold); font-size: 8pt; letter-spacing: 0.1em; font-variant-numeric: tabular-nums; width: 7mm; flex: none; }
  .toc-title { border-bottom: 0.5pt dotted var(--gold-soft); flex: 1; padding-bottom: 1mm; }

  /* ── Corpo ──────────────────────────────────────────────────────────── */
  .body-wrap { padding-top: 2mm; }

  h2.chapter {
    font-size: 21pt;
    margin: 0 0 6mm;
    padding-top: 2mm;
    line-height: 1.2;
    break-before: page;
    break-after: avoid;
  }
  h2.chapter .chapter-mark {
    display: block;
    width: 22mm;
    height: 2px;
    background: var(--gold);
    margin-bottom: 5mm;
  }

  h3 { font-size: 13.5pt; margin: 9mm 0 3mm; break-after: avoid; }
  h4 { font-size: 11pt; margin: 6mm 0 2mm; color: var(--wine); break-after: avoid; }

  ul, ol { margin: 0 0 0.9em; padding-left: 6mm; }
  li { margin-bottom: 1.6mm; break-inside: avoid; }
  li::marker { color: var(--gold); }

  table {
    width: 100%;
    border-collapse: collapse;
    margin: 4mm 0 6mm;
    font-size: 9pt;
    break-inside: avoid;
  }
  thead th {
    background: var(--cream);
    color: var(--wine-deep);
    text-align: left;
    font-family: Georgia, "Times New Roman", serif;
    font-size: 9pt;
    padding: 3mm 3mm;
    border-bottom: 1.2pt solid var(--gold-soft);
  }
  tbody td { padding: 2.8mm 3mm; border-bottom: 0.5pt solid var(--line); vertical-align: top; }
  tbody tr:nth-child(even) td { background: #fcfaf6; }

  pre {
    background: var(--cream);
    border: 0.5pt solid var(--line);
    border-left: 2.5pt solid var(--gold);
    border-radius: 1.5mm;
    padding: 4mm 4.5mm;
    margin: 3mm 0 5mm;
    font-size: 8pt;
    line-height: 1.55;
    white-space: pre-wrap;
    word-break: break-word;
    break-inside: avoid;
  }
  code {
    font-family: "Cascadia Mono", Consolas, "SFMono-Regular", Menlo, monospace;
    font-size: 0.92em;
    color: var(--wine-deep);
  }
  p code, li code, td code {
    background: #f6f1e8;
    padding: 0.3mm 1mm;
    border-radius: 0.8mm;
    color: #4a2b33;
    font-size: 0.88em;
  }

  blockquote {
    margin: 4mm 0 6mm;
    padding: 3.5mm 5mm;
    background: #fdfaf4;
    border-left: 2.5pt solid var(--gold);
    color: var(--muted);
    font-size: 9.5pt;
    break-inside: avoid;
  }
  blockquote p:last-child { margin-bottom: 0; }

  hr { display: none; }

  .checkbox {
    display: inline-block;
    width: 3mm;
    height: 3mm;
    border: 0.8pt solid var(--gold);
    border-radius: 0.6mm;
    margin-right: 2mm;
    vertical-align: -0.4mm;
  }

  h2.chapter + p, h2.chapter + blockquote { margin-top: 0; }
`;

const htmlDoc = `<!doctype html>
<html lang="pt-BR">
<head>
<meta charset="utf-8" />
<title>THEADORO — Documentação do produto</title>
<meta name="author" content="THEADORO" />
<meta name="description" content="Marketplace de presentes: visão do produto, arquitetura, integrações, operação e implantação." />
<style>${css}</style>
</head>
<body>

  <section class="cover">
    <div class="cover-brand"><span class="dot"></span> THEADORO <span class="dot"></span></div>

    <div class="cover-main">
      <div class="cover-kicker">Documentação do produto</div>
      <h1>THEADORO<em>Marketplace de presentes</em></h1>
      <div class="cover-rule"></div>
      <p class="cover-lead">
        Como a plataforma funciona, o que já está pronto, quais integrações estão
        ativas e o que a equipe precisa fazer para colocá-la no ar.
      </p>
    </div>

    <div class="cover-meta">
      <div><span>Versão</span>1.0</div>
      <div><span>Atualizado em</span>${today}</div>
      <div><span>Escopo</span>Produto · Operação · Tecnologia</div>
    </div>
  </section>

  <section class="overview" id="resumo">
    <div class="eyebrow">Em uma página</div>
    <h2>Um marketplace de presentes,<br/>com três papéis e entrega local</h2>
    <p class="overview-lead">
      A THEADORO conecta quem quer presentear com vendedores de presentes, produtos
      físicos e serviços agendáveis. A operação acontece em um só lugar — catálogo,
      pedidos, pagamentos e entrega — e a entrega é feita na região de Cuiabá/MT.
    </p>

    <div class="cards">
      <div class="card">
        <h3>Comprador</h3>
        <p>Navega, monta o carrinho, paga com cartão, PIX ou boleto, acompanha o pedido e guarda favoritos.</p>
      </div>
      <div class="card">
        <h3>Vendedor</h3>
        <p>Cadastra produtos, gerencia vendas, cupons, campanhas e a própria assinatura na plataforma.</p>
      </div>
      <div class="card">
        <h3>Administrador</h3>
        <p>Aprova vendedores, cuida do catálogo, dos pedidos, do conteúdo e das integrações.</p>
      </div>
    </div>

    <table class="facts">
      <tr><td>Integrações</td><td>Pagar.me (pagamentos), Uber Direct (entrega), Gemini (sugestão de presentes com IA) e ViaCEP (endereços).</td></tr>
      <tr><td>Pagamento</td><td>Cartão de crédito, PIX e boleto. A confirmação chega automaticamente ao sistema, sem intervenção manual.</td></tr>
      <tr><td>Entrega</td><td>Cotação e despacho reais pela Uber Direct, restritos a Cuiabá/MT. O código de rastreio fica no pedido.</td></tr>
      <tr><td>Administração</td><td>Um painel único para usuários, vendedores, pedidos, catálogo, relatórios e configurações.</td></tr>
      <tr><td>Escopo</td><td>Segue o README do projeto. As seções finais são técnicas e servem à equipe que for manter o sistema.</td></tr>
    </table>
  </section>

  <section class="toc-page" id="sumario">
    <div class="eyebrow">Neste documento</div>
    <h2>Sumário</h2>
    <ul class="toc">${toc}</ul>
  </section>

  <main class="body-wrap">
    ${html}
  </main>

</body>
</html>`;

mkdirSync(OUT_DIR, { recursive: true });
// O HTML intermediário fica no diretório temporário do sistema — só o PDF
// entra no repositório.
const htmlPath = join(tmpdir(), 'theadoro-readme-preview.html');
writeFileSync(htmlPath, htmlDoc, 'utf-8');

// ─────────────────────────────── PDF ───────────────────────────────────────

const browser = await puppeteer.launch({
  executablePath: chromePath,
  headless: 'new',
  args: ['--no-sandbox', '--disable-dev-shm-usage', '--font-render-hinting=none'],
});

const page = await browser.newPage();
await page.goto('file://' + htmlPath.replace(/\\/g, '/'), { waitUntil: 'networkidle0' });

await page.pdf({
  path: OUT_PDF,
  format: 'A4',
  printBackground: true,
  displayHeaderFooter: true,
  margin: { top: '16mm', bottom: '18mm', left: '18mm', right: '18mm' },
  headerTemplate: '<div></div>',
  footerTemplate: `
    <div style="width:100%;padding:0 18mm;font-family:'Segoe UI',Arial,sans-serif;font-size:7.5pt;color:#a98545;display:flex;justify-content:space-between;align-items:center;">
      <span style="letter-spacing:0.18em;text-transform:uppercase;">THEADORO · Documentação</span>
      <span>página <span class="pageNumber"></span> de <span class="totalPages"></span></span>
    </div>`,
});

await browser.close();
rmSync(htmlPath, { force: true });

console.log(`PDF gerado: ${OUT_PDF}`);