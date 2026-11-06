/**
 * Servidor de produção do theAdoro (SPA estática servida por Node).
 *
 * Uso: node server.cjs
 * Serve a pasta /dist gerada por `npm run build` (turbo build + sync-dist),
 * com fallback de SPA para que rotas do React Router funcionem no reload.
 *
 * Sem dependências: usa apenas módulos nativos, para o deploy na Hostinger
 * não depender de nada além do `npm install` do workspace.
 */
const http = require('node:http');
const fs = require('node:fs');
const path = require('node:path');

const PORT = Number(process.env.PORT) || 3000;
const HOST = process.env.HOST || '0.0.0.0';
const ROOT = path.resolve(__dirname, 'dist');
const INDEX = path.join(ROOT, 'index.html');

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.mjs': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.map': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.webp': 'image/webp',
  '.avif': 'image/avif',
  '.ico': 'image/x-icon',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
  '.txt': 'text/plain; charset=utf-8',
  '.xml': 'application/xml; charset=utf-8',
  '.webmanifest': 'application/manifest+json',
};

function cacheControl(filePath) {
  const rel = path.relative(ROOT, filePath).split(path.sep).join('/');
  if (rel.startsWith('assets/')) return 'public, max-age=31536000, immutable';
  if (rel.endsWith('.html')) return 'no-cache';
  return 'public, max-age=3600';
}

function sendFile(req, res, filePath, status = 200) {
  fs.stat(filePath, (err, stat) => {
    if (err || !stat.isFile()) return sendIndex(req, res, 503);
    res.writeHead(status, {
      'Content-Type': MIME[path.extname(filePath).toLowerCase()] || 'application/octet-stream',
      'Content-Length': stat.size,
      'Cache-Control': cacheControl(filePath),
      'X-Content-Type-Options': 'nosniff',
    });
    if (req.method === 'HEAD') return res.end();
    fs.createReadStream(filePath).pipe(res);
  });
}

function sendIndex(req, res, status = 200) {
  if (!fs.existsSync(INDEX)) {
    res.writeHead(503, { 'Content-Type': 'text/plain; charset=utf-8' });
    return res.end('Build ausente: rode `npm run build` antes de iniciar o servidor.');
  }
  return sendFile(req, res, INDEX, status);
}

const server = http.createServer((req, res) => {
  if (req.method !== 'GET' && req.method !== 'HEAD') {
    res.writeHead(405, { Allow: 'GET, HEAD' });
    return res.end();
  }

  const urlPath = decodeURIComponent((req.url || '/').split('?')[0]);
  const resolved = path.resolve(ROOT, '.' + urlPath);

  // Impede path traversal para fora do diretório de build.
  if (resolved !== ROOT && !resolved.startsWith(ROOT + path.sep)) {
    res.writeHead(403, { 'Content-Type': 'text/plain; charset=utf-8' });
    return res.end('Forbidden');
  }

  fs.stat(resolved, (err, stat) => {
    if (!err && stat.isFile()) return sendFile(req, res, resolved);
    if (!err && stat.isDirectory()) {
      const dirIndex = path.join(resolved, 'index.html');
      if (fs.existsSync(dirIndex)) return sendFile(req, res, dirIndex);
    }
    // Rota do SPA: entrega o index e deixa o cliente resolver.
    if (path.extname(urlPath)) {
      res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
      return res.end('Not found');
    }
    return sendIndex(req, res);
  });
});

server.listen(PORT, HOST, () => {
  console.log(`[theadoro] servindo ${ROOT} em http://${HOST}:${PORT}`);
});