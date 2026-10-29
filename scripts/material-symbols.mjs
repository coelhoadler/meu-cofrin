// Gera a fonte Material Symbols apenas com os ícones usados no app.
//
//   node scripts/material-symbols.mjs          → baixa a fonte reduzida do Google Fonts
//   node scripts/material-symbols.mjs --check  → falha se algum ícone usado não estiver na fonte
import { mkdirSync, readFileSync, readdirSync, statSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { brotliDecompressSync } from 'node:zlib';

const SRC_DIR = 'src/app';
const FONT_FILE = 'src/fonts/material-symbols-outlined.woff2';
const FONTE_COMPLETA = 'node_modules/material-symbols/material-symbols-outlined.woff2';

// Eixos fixos: a classe .material-symbols-outlined força 24px e peso 400 em todos os ícones
const AXES = 'opsz,wght,FILL,GRAD@24,400,0,0';

// O Google Fonts só entrega woff2 para navegadores modernos
const USER_AGENT =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0 Safari/537.36';

// Tabelas conhecidas do formato WOFF2, na ordem do índice usado no diretório de tabelas
const WOFF2_TAGS = [
  'cmap', 'head', 'hhea', 'hmtx', 'maxp', 'name', 'OS/2', 'post', 'cvt ', 'fpgm', 'glyf', 'loca', 'prep',
  'CFF ', 'VORG', 'EBDT', 'EBLC', 'gasp', 'hdmx', 'kern', 'LTSH', 'PCLT', 'VDMX', 'vhea', 'vmtx', 'BASE',
  'GDEF', 'GPOS', 'GSUB', 'EBSC', 'JSTF', 'MATH', 'CBDT', 'CBLC', 'COLR', 'CPAL', 'SVG ', 'sbix', 'acnt',
  'avar', 'bdat', 'bloc', 'bsln', 'cvar', 'fdsc', 'feat', 'fmtx', 'fvar', 'gvar', 'hsty', 'just', 'lcar',
  'mort', 'morx', 'opbd', 'prop', 'trak', 'Zapf', 'Silf', 'Glat', 'Gloc', 'Feat', 'Sill',
];

function tabelasWoff2(fonte) {
  if (fonte.toString('latin1', 0, 4) !== 'wOF2') throw new Error('A fonte não está no formato WOFF2');
  const numTabelas = fonte.readUInt16BE(12);
  const tamanhoComprimido = fonte.readUInt32BE(20);
  let pos = 48;
  const lerUIntBase128 = () => {
    let valor = 0;
    for (let i = 0; i < 5; i++) {
      const byte = fonte[pos++];
      valor = valor * 128 + (byte & 0x7f);
      if (!(byte & 0x80)) return valor;
    }
    throw new Error('UIntBase128 inválido');
  };

  const entradas = [];
  for (let i = 0; i < numTabelas; i++) {
    const flags = fonte[pos++];
    let tag = WOFF2_TAGS[flags & 0x3f];
    if ((flags & 0x3f) === 63) {
      tag = fonte.toString('latin1', pos, pos + 4);
      pos += 4;
    }
    const tamanhoOriginal = lerUIntBase128();
    // glyf/loca usam a versão 0 para "transformada"; as demais tabelas, o contrário
    const versao = flags >> 6;
    const transformada = tag === 'glyf' || tag === 'loca' ? versao === 0 : versao !== 0;
    entradas.push({ tag, tamanho: transformada ? lerUIntBase128() : tamanhoOriginal });
  }

  const dados = brotliDecompressSync(fonte.subarray(pos, pos + tamanhoComprimido));
  const tabelas = {};
  let inicio = 0;
  for (const { tag, tamanho } of entradas) {
    tabelas[tag] = dados.subarray(inicio, inicio + tamanho);
    inicio += tamanho;
  }
  return tabelas;
}

// Mapa glifo → caractere, só para ASCII (as letras que formam os nomes dos ícones)
function caracteresPorGlifo(cmap) {
  const mapa = new Map();
  const numSubtabelas = cmap.readUInt16BE(2);
  for (let i = 0; i < numSubtabelas; i++) {
    const sub = cmap.readUInt32BE(4 + i * 8 + 4);
    const formato = cmap.readUInt16BE(sub);
    if (formato === 4) {
      const segmentos = cmap.readUInt16BE(sub + 6) / 2;
      const fins = sub + 14;
      const inicios = fins + segmentos * 2 + 2;
      const deltas = inicios + segmentos * 2;
      const offsetsRange = deltas + segmentos * 2;
      for (let s = 0; s < segmentos; s++) {
        const ini = cmap.readUInt16BE(inicios + s * 2);
        const fim = Math.min(cmap.readUInt16BE(fins + s * 2), 127);
        const delta = cmap.readUInt16BE(deltas + s * 2);
        const offsetRange = cmap.readUInt16BE(offsetsRange + s * 2);
        for (let c = ini; c <= fim; c++) {
          let glifo;
          if (offsetRange === 0) {
            glifo = (c + delta) & 0xffff;
          } else {
            glifo = cmap.readUInt16BE(offsetsRange + s * 2 + offsetRange + (c - ini) * 2);
            if (glifo !== 0) glifo = (glifo + delta) & 0xffff;
          }
          if (glifo !== 0) mapa.set(glifo, String.fromCharCode(c));
        }
      }
    } else if (formato === 12) {
      const grupos = cmap.readUInt32BE(sub + 12);
      for (let g = 0; g < grupos; g++) {
        const grupo = sub + 16 + g * 12;
        const ini = cmap.readUInt32BE(grupo);
        const fim = Math.min(cmap.readUInt32BE(grupo + 4), 127);
        const primeiroGlifo = cmap.readUInt32BE(grupo + 8);
        for (let c = ini; c <= fim; c++) mapa.set(primeiroGlifo + (c - ini), String.fromCharCode(c));
      }
    }
  }
  return mapa;
}

function glifosCobertura(gsub, offset) {
  const formato = gsub.readUInt16BE(offset);
  const quantidade = gsub.readUInt16BE(offset + 2);
  const glifos = [];
  for (let i = 0; i < quantidade; i++) {
    if (formato === 1) {
      glifos.push(gsub.readUInt16BE(offset + 4 + i * 2));
    } else {
      const faixa = offset + 4 + i * 6;
      for (let g = gsub.readUInt16BE(faixa); g <= gsub.readUInt16BE(faixa + 2); g++) glifos.push(g);
    }
  }
  return glifos;
}

// Nomes de ícone que a fonte reconhece: as ligaduras da tabela GSUB (ex.: d-e-l-e-t-e → ícone delete).
// Inclui os apelidos de ícones renomeados (ex.: smartphone, hoje chamado mobile).
function ligaduras(fonte) {
  const { cmap, GSUB: gsub } = tabelasWoff2(fonte);
  const caracteres = caracteresPorGlifo(cmap);
  const nomes = new Set();
  const lookupList = gsub.readUInt16BE(8);
  const numLookups = gsub.readUInt16BE(lookupList);
  for (let i = 0; i < numLookups; i++) {
    const lookup = lookupList + gsub.readUInt16BE(lookupList + 2 + i * 2);
    const tipoLookup = gsub.readUInt16BE(lookup);
    const numSubtabelas = gsub.readUInt16BE(lookup + 4);
    for (let j = 0; j < numSubtabelas; j++) {
      let sub = lookup + gsub.readUInt16BE(lookup + 6 + j * 2);
      let tipo = tipoLookup;
      if (tipo === 7) {
        tipo = gsub.readUInt16BE(sub + 2);
        sub += gsub.readUInt32BE(sub + 4);
      }
      if (tipo !== 4) continue;

      const primeiros = glifosCobertura(gsub, sub + gsub.readUInt16BE(sub + 2));
      const numConjuntos = gsub.readUInt16BE(sub + 4);
      for (let k = 0; k < numConjuntos; k++) {
        const conjunto = sub + gsub.readUInt16BE(sub + 6 + k * 2);
        const numLigaduras = gsub.readUInt16BE(conjunto);
        for (let l = 0; l < numLigaduras; l++) {
          const ligadura = conjunto + gsub.readUInt16BE(conjunto + 2 + l * 2);
          const numComponentes = gsub.readUInt16BE(ligadura + 2);
          const glifos = [primeiros[k]];
          for (let m = 1; m < numComponentes; m++) glifos.push(gsub.readUInt16BE(ligadura + 4 + (m - 1) * 2));
          const letras = glifos.map(g => caracteres.get(g));
          if (letras.every(Boolean)) nomes.add(letras.join(''));
        }
      }
    }
  }
  return nomes;
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
  const validos = ligaduras(readFileSync(FONTE_COMPLETA));
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

function faltandoNaFonte(usados, fonte) {
  const naFonte = ligaduras(fonte);
  return usados.filter(nome => !naFonte.has(nome));
}

async function baixar(url, headers = {}) {
  const resposta = await fetch(url, { headers });
  if (!resposta.ok) throw new Error(`Falha ao baixar ${url}: HTTP ${resposta.status}`);
  return resposta;
}

const usados = iconesUsados();

if (process.argv.includes('--check')) {
  const faltando = faltandoNaFonte(usados, readFileSync(FONT_FILE));
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
  const faltando = faltandoNaFonte(usados, fonte);
  if (faltando.length) throw new Error(`O Google Fonts não incluiu os ícones: ${faltando.join(', ')}`);

  mkdirSync(dirname(FONT_FILE), { recursive: true });
  writeFileSync(FONT_FILE, fonte);
  console.log(`${usados.length} ícones → ${FONT_FILE} (${(fonte.length / 1024).toFixed(1)} kB)`);
}
