/**
 * Entrypoint de produção para a Hostinger (Application startup file).
 *
 * A Hostinger executa o startup file com `node <arquivo>`, e não com `npm start`.
 * Por isso o build precisa acontecer aqui: este arquivo garante que cada
 * deploy construa o projeto antes de subir o servidor, em vez de servir um
 * /dist velho.
 *
 * Configuração no hPanel:
 *   Application startup file: start.cjs
 */
const { execSync } = require('node:child_process');
const fs = require('node:fs');
const path = require('node:path');

const root = __dirname;

function hasBin(name) {
  return fs.existsSync(path.join(root, 'node_modules', '.bin', name));
}

function run(cmd) {
  execSync(cmd, { cwd: root, stdio: 'inherit', env: process.env });
}

if (!hasBin('turbo') || !hasBin('vite')) {
  console.log('[start] dependências de build ausentes — instalando com devDependencies...');
  run('npm install --include=dev');
}

console.log('[start] construindo o build de produção...');
run('npm run build');

if (!fs.existsSync(path.join(root, 'dist', 'index.html'))) {
  console.error('[start] build não gerou dist/index.html — abortando.');
  process.exit(1);
}

console.log('[start] build pronto, subindo o servidor.');
require('./server.cjs');