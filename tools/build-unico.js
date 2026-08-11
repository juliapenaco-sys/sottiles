/**
 * Gera "sottiles-site-unico.html": o site INTEIRO num arquivo so.
 * -------------------------------------------------------------------
 * Diferente do build-single-file.js, que gera um arquivo por pagina, aqui as
 * duas paginas entram no MESMO documento e a navegacao acontece por hash
 * (#cardapio / #inicio). E o formato para publicar arrastando um arquivo unico,
 * ou para mandar por WhatsApp: nao existe link para arquivo externo.
 *
 * CSS, JavaScript, fontes e imagens viram data: URI dentro do proprio HTML.
 *
 * Uso:  node tools/build-unico.js
 */

const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const SAIDA = path.join('entregas', 'sottiles-site-unico.html');
const lerTexto = (f) => fs.readFileSync(path.join(ROOT, f), 'utf8');
const lerBin = (f) => fs.readFileSync(path.join(ROOT, f));

const MIME = {
  '.webp': 'image/webp', '.png': 'image/png', '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg', '.svg': 'image/svg+xml', '.woff2': 'font/woff2',
};

const cache = new Map();
function dataURI(rel) {
  if (cache.has(rel)) return cache.get(rel);
  const limpo = rel.split('?')[0].split('#')[0];
  const ext = path.extname(limpo).toLowerCase();
  if (!MIME[ext] || !fs.existsSync(path.join(ROOT, limpo))) return null;
  const uri = `data:${MIME[ext]};base64,${lerBin(limpo).toString('base64')}`;
  cache.set(rel, uri);
  return uri;
}

/* As fotos de sabor do cardapio entram por JavaScript no primeiro toque, entao
   nao aparecem em nenhum src do HTML e o embutidor de imagens nao as alcanca.
   Aqui elas viram data: URI e ficam em window.__FOTOS_SABOR (ver main.js).
   Sem isto, a foto quebraria justamente no arquivo que abre com dois cliques. */
function fotosDeSabor(html) {
  const usados = Array.from(new Set(
    Array.from(html.matchAll(/data-foto="([^"]+)"/g)).map((m) => m[1])
  ));
  if (!usados.length) return '';
  const mapa = {};
  const faltando = [];
  usados.forEach((s) => {
    const uri = dataURI('assets/img/sabor-' + s + '-380.webp');
    if (uri) mapa[s] = uri; else faltando.push(s);
  });
  if (faltando.length) console.error('  ⚠️ sem imagem: ' + faltando.join(', '));
  return '<script>window.__FOTOS_SABOR=' + JSON.stringify(mapa) + ';</script>\n';
}

/* ---------- 1. junta as duas paginas num documento so ---------- */

let html = lerTexto('index.html');
const cardapio = lerTexto('cardapio.html');

const mainCardapio = cardapio.match(/<main id="conteudo">([\s\S]*?)<\/main>/);
if (!mainCardapio) throw new Error('nao achei o <main> do cardapio.html');

// ids duplicados quebrariam o documento: o cardapio entra com os seus proprios
let corpoCardapio = mainCardapio[1]
  .replace(/id="h1"/, 'id="h1-cardapio"')
  .replace(/aria-labelledby="h1"/, 'aria-labelledby="h1-cardapio"');

/* ATENCAO: a substituicao TEM que ser por funcao.
   Numa string de troca, o JavaScript trata "$&" como "o trecho encontrado".
   O cardapio tem precos escritos como R$&nbsp;19 — em string, cada um viraria
   "R</main>nbsp;19", quebrando o preco E injetando tags </main> falsas.
   Foi exatamente esse o bug do "Rnbsp;" que apareceu no site. */
html = html.replace(
  '</main>',
  () => '</main>\n\n<!-- ══════════ CARDÁPIO (mesma página, mostrado pelo #cardapio) ══════════ -->\n' +
        '<main id="pagina-cardapio" hidden>' + corpoCardapio + '</main>'
);

// links entre paginas viram ancoras internas
html = html
  .split('href="cardapio.html"').join('href="#cardapio"')
  .split('href="index.html#').join('href="#')
  .split('href="index.html"').join('href="#inicio"');

/* ---------- 2. embute CSS, JS, fontes e imagens ---------- */

let css = lerTexto(path.join('assets', 'css', 'style.css'));
css = css.replace(/url\(\.\.\/fonts\/([^)]+)\)/g, (m, arq) => {
  const uri = dataURI(path.join('assets', 'fonts', arq).replace(/\\/g, '/'));
  return uri ? `url(${uri})` : m;
});
const js = lerTexto(path.join('assets', 'js', 'main.js'));

// o preload nao faz sentido num arquivo embutido
html = html.replace(/\n?\s*<link rel="preload"[\s\S]*?>/g, '');

// cada imagem fica com UMA versao. Embutir o srcset inteiro multiplicaria o
// arquivo por 3 ou 4 sem ganho nenhum num HTML solto.
html = html.replace(/<img\b[^>]*>/g, (tag) => {
  const m = tag.match(/srcset="([^"]+)"/);
  if (!m) return tag;
  const cand = m[1].split(',').map((p) => {
    const [url, desc] = p.trim().split(/\s+/);
    return { url, w: parseInt(desc, 10) || 0 };
  }).sort((a, b) => a.w - b.w);
  return tag
    .replace(/\s*srcset="[^"]+"/, '')
    .replace(/\s*sizes="[^"]+"/, '')
    .replace(/src="[^"]+"/, `src="${cand[Math.min(1, cand.length - 1)].url}"`);
});

html = html.replace(/(src|href)="(assets\/img\/[^"]+)"/g, (m, attr, rel) => {
  const uri = dataURI(rel);
  return uri ? `${attr}="${uri}"` : m;
});

/* ---------- 3. roteador de hash ----------
   Precisa rodar DEPOIS do main.js: o filtro do cardapio ja indexou os itens
   e a barra fixa ja esta ligada quando trocamos de pagina. */
const roteador = `
/* Navegacao entre as duas paginas dentro do mesmo arquivo. */
(function () {
  'use strict';
  var inicio = document.getElementById('conteudo');
  var cardapio = document.getElementById('pagina-cardapio');
  if (!inicio || !cardapio) return;

  var TITULOS = {
    inicio: "Sottile's Pizzaria | Rodízio, delivery e pizza em Petrópolis",
    cardapio: "Cardápio | Sottile's Pizzaria — Petrópolis"
  };
  var semMovimento = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  function trocar(paraCardapio, rolar) {
    inicio.hidden = paraCardapio;
    cardapio.hidden = !paraCardapio;
    document.title = paraCardapio ? TITULOS.cardapio : TITULOS.inicio;

    document.querySelectorAll('.topo__links a').forEach(function (a) {
      var ehCardapio = a.getAttribute('href') === '#cardapio';
      if (ehCardapio && paraCardapio) a.setAttribute('aria-current', 'page');
      else a.removeAttribute('aria-current');
    });

    if (rolar) window.scrollTo({ top: 0, behavior: semMovimento ? 'auto' : 'smooth' });
    // a pagina que acabou de aparecer precisa revelar o que estava escondido
    window.dispatchEvent(new Event('resize'));
  }

  function daHash(rolar) {
    var h = (location.hash || '').replace('#', '');
    if (h === 'cardapio') { trocar(true, rolar); return; }
    var eraCardapio = !cardapio.hidden;
    trocar(false, rolar && eraCardapio);
    // ancora da propria home (#unidades, #pedir…) continua funcionando
    if (h && h !== 'inicio' && !rolar) {
      var alvo = document.getElementById(h);
      if (alvo) alvo.scrollIntoView({ behavior: semMovimento ? 'auto' : 'smooth' });
    }
  }

  window.addEventListener('hashchange', function () { daHash(true); });
  daHash(false);
})();
`;

html = html.replace(
  /<link rel="stylesheet" href="assets\/css\/style\.css">/,
  () => '<style>\n' + css + '\n</style>'
);
html = html.replace(
  /<script src="assets\/js\/main\.js"[^>]*><\/script>/,
  () => fotosDeSabor(html) + '<script>\n' + js + '\n' + roteador + '\n</script>'
);

// o manifesto depende de arquivo externo; num HTML solto so daria 404
html = html.replace(/\n?\s*<link rel="manifest"[^>]*>/, '');

fs.mkdirSync(path.join(ROOT, 'entregas'), { recursive: true });
fs.writeFileSync(path.join(ROOT, SAIDA), html, 'utf8');

const mb = (fs.statSync(path.join(ROOT, SAIDA)).size / 1024 / 1024).toFixed(2);
const pendentes = (html.match(/(?:src|href)="assets\//g) || []).length;
const itens = (html.match(/class="item"/g) || []).length;
console.log(`✓ ${SAIDA} — ${mb} MB`);
console.log(`  ${itens} itens de cardápio embutidos`);
console.log(pendentes
  ? `  ⚠️ ainda restam ${pendentes} recursos externos`
  : '  ✓ nenhum recurso externo: abre offline, com dois cliques');
