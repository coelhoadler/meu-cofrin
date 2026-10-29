// Gera a fonte Material Symbols apenas com os ícones usados no app.
//
//   node scripts/material-symbols.mjs          → baixa a fonte reduzida do Google Fonts
//   node scripts/material-symbols.mjs --check  → falha se algum ícone usado não estiver na fonte
import { mkdirSync, readFileSync, readdirSync, statSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';

const SRC_DIR = 'src/app';
const FONT_FILE = 'src/fonts/material-symbols-outlined.woff2';
const ICONS_FILE = 'src/fonts/material-symbols-outlined.json';

// Eixos fixos: a classe .material-symbols-outlined força 24px e peso 400 em todos os ícones
const AXES = 'opsz,wght,FILL,GRAD@24,400,0,0';

// O Google Fonts só entrega woff2 para navegadores modernos
const USER_AGENT =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0 Safari/537.36';

function nomesValidos() {
  const dts = readFileSync('node_modules/material-symbols/index.d.ts', 'utf8');
  return new Set(dts.slice(0, dts.indexOf('];')).match(/"[^"]+"/g).map(s => s.slice(1, -1)));
}

function arquivosFonte(dir) {
  return readdirSync(dir).flatMap(nome => {
    const caminho = join(dir, nome);
    if (statSync(caminho).isDirectory()) return arquivosFonte(caminho);
    return /\.(ts|html)$/.test(nome) && !nome.endsWith('.spec.ts') ? [caminho] : [];
  });
}

// Candidatos: strings entre aspas e textos soltos entre tags que sejam nomes de ícone válidos.
// Pode incluir alguns falsos positivos, que só custam alguns bytes na fonte.
function iconesUsados() {
  const validos = nomesValidos();
  const usados = new Set();
  for (const arquivo of arquivosFonte(SRC_DIR)) {
    const texto = readFileSync(arquivo, 'utf8');
    const candidatos = [...texto.matchAll(/['"`]([a-z0-9_]+)['"`]/g), ...texto.matchAll(/>\s*([a-z0-9_]+)\s*</g)];
    for (const [, nome] of candidatos) {
      if (validos.has(nome)) usados.add(nome);
    }
  }
  return [...usados].sort();
}

async function baixar(url, headers = {}) {
  const resposta = await fetch(url, { headers });
  if (!resposta.ok) throw new Error(`Falha ao baixar ${url}: HTTP ${resposta.status}`);
  return resposta;
}

const usados = iconesUsados();

if (process.argv.includes('--check')) {
  const naFonte = new Set(JSON.parse(readFileSync(ICONS_FILE, 'utf8')));
  const faltando = usados.filter(nome => !naFonte.has(nome));
  if (faltando.length) {
    console.error(`Ícones usados que não estão na fonte: ${faltando.join(', ')}`);
    console.error('Rode "npm run icons" para regenerar a fonte.');
    process.exit(1);
  }
  console.log(`Fonte de ícones em dia (${usados.length} ícones).`);
} else {
  // O Google Fonts exige icon_names em ordem alfabética
  const cssUrl =
    `https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:${AXES}` +
    `&icon_names=${usados.join(',')}&display=block`;
  const css = await (await baixar(cssUrl, { 'User-Agent': USER_AGENT })).text();
  const fonteUrl = css.match(/url\((https:[^)]+)\) format\('woff2'\)/)?.[1];
  if (!fonteUrl) throw new Error(`woff2 não encontrado na resposta do Google Fonts:\n${css}`);

  const fonte = Buffer.from(await (await baixar(fonteUrl)).arrayBuffer());
  mkdirSync(dirname(FONT_FILE), { recursive: true });
  writeFileSync(FONT_FILE, fonte);
  writeFileSync(ICONS_FILE, JSON.stringify(usados, null, 2) + '\n');
  console.log(`${usados.length} ícones → ${FONT_FILE} (${(fonte.length / 1024).toFixed(1)} kB)`);
}
