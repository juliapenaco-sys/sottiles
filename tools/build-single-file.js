/**
 * Gera os arquivos unicos: cada pagina do site num HTML so.
 * -------------------------------------------------------------------
 * CSS, JavaScript, fontes e imagens viram data: URI dentro do proprio HTML.
 * Serve para enviar por e-mail/WhatsApp, abrir com dois cliques ou arquivar.
 * Para publicar de verdade, use os .html + a pasta assets (e mais rapido,
 * porque o navegador consegue cachear cada arquivo separadamente).
 *
 * Uso:  node tools/build-single-file.js
 */

const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const lerTexto = (f) => fs.readFileSync(path.join(ROOT, f), 'utf8');
const lerBin = (f) => fs.readFileSync(path.join(ROOT, f));

/* Cada pagina do site e o nome do arquivo unico correspondente. Os links entre
   paginas sao reescritos para apontar um arquivo para o outro. */
const PAGINAS = [
  { entrada: 'index.html', saida: 'sottiles-site-completo.html' },
  { entrada: 'cardapio.html', saida: 'sottiles-cardapio-completo.html' },
];

const MIME = {
  '.webp': 'image/webp',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.svg': 'image/svg+xml',
  '.woff2': 'font/woff2',
};

const cache = new Map();
function dataURI(rel) {
  if (cache.has(rel)) return cache.get(rel);
  const limpo = rel.split('?')[0].split('#')[0];
  const ext = path.extname(limpo).toLowerCase();
  const abs = path.join(ROOT, limpo);
  if (!MIME[ext] || !fs.existsSync(abs)) return null;
  const uri = `data:${MIME[ext]};base64,${lerBin(limpo).toString('base64')}`;
  cache.set(rel, uri);
  return uri;
}

/* As fotos de sabor do cardapio entram por JavaScript no primeiro toque, entao
   nao aparecem em nenhum src do HTML e o embutidor de imagens nao as alcanca.
   Aqui elas viram data: URI e ficam em window.__FOTOS_SABOR (ver main.js). */
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

let css = lerTexto(path.join('assets', 'css', 'style.css'));
const js = lerTexto(path.join('assets', 'js', 'main.js'));

// fontes referenciadas pelo CSS (../fonts/x.woff2 → assets/fonts/x.woff2)
css = css.replace(/url\(\.\.\/fonts\/([^)]+)\)/g, (m, arq) => {
  const uri = dataURI(path.join('assets', 'fonts', arq).replace(/\\/g, '/'));
  return uri ? `url(${uri})` : m;
});

function montar(pagina) {
  let html = lerTexto(pagina.entrada);

  // 1. o preload de fonte/imagem nao faz sentido num arquivo embutido
  html = html.replace(/\n?\s*<link rel="preload"[\s\S]*?>/g, '');

  // 2. cada imagem fica com UMA versao so. Embutir o srcset inteiro em base64
  //    multiplicaria o arquivo por 3 ou 4 sem ganho nenhum num HTML solto.
  html = html.replace(/<img\b[^>]*>/g, (tag) => {
    const m = tag.match(/srcset="([^"]+)"/);
    if (!m) return tag;
    const candidatos = m[1].split(',').map((p) => {
      const [url, desc] = p.trim().split(/\s+/);
      return { url, w: parseInt(desc, 10) || 0 };
    }).sort((a, b) => a.w - b.w);
    // versao do meio: nitidez suficiente em telas retina sem inflar o arquivo
    const escolhida = candidatos[Math.min(1, candidatos.length - 1)].url;
    return tag
      .replace(/\s*srcset="[^"]+"/, '')
      .replace(/\s*sizes="[^"]+"/, '')
      .replace(/src="[^"]+"/, `src="${escolhida}"`);
  });

  // 3. imagens restantes viram data: URI
  html = html.replace(/(src|href)="(assets\/img\/[^"]+)"/g, (m, attr, rel) => {
    const uri = dataURI(rel);
    return uri ? `${attr}="${uri}"` : m;
  });

  // 4. CSS e JS embutidos.
  //    Atencao: a substituicao TEM que ser por funcao. Numa string de troca o
  //    JavaScript trata "$$" como um "$" literal, e o main.js usa $$ como
  //    atalho de querySelectorAll — em string, o arquivo sairia quebrado.
  html = html.replace(
    /<link rel="stylesheet" href="assets\/css\/style\.css">/,
    () => '<style>\n' + css + '\n</style>'
  );
  html = html.replace(
    /<script src="assets\/js\/main\.js"[^>]*><\/script>/,
    () => fotosDeSabor(html) + '<script>\n' + js + '\n</script>'
  );

  // 5. o manifesto depende de arquivos externos; num HTML solto so daria 404
  html = html.replace(/\n?\s*<link rel="manifest"[^>]*>/, '');

  // 6. links entre paginas apontam para o arquivo unico da outra pagina
  PAGINAS.forEach((p) => {
    html = html.split('href="' + p.entrada + '"').join('href="' + p.saida + '"');
    html = html.split('href="' + p.entrada + '#').join('href="' + p.saida + '#');
  });

  fs.writeFileSync(path.join(ROOT, pagina.saida), html, 'utf8');

  const kb = (fs.statSync(path.join(ROOT, pagina.saida)).size / 1024).toFixed(0);
  // so interessa o que o navegador tenta BAIXAR: src e href de elementos.
  // Caminhos dentro do og:image e do JSON-LD sao metadado, nao recurso.
  const pendentes = (html.match(/(?:src|href)="assets\//g) || []).length;
  console.log(`✓ ${pagina.saida} — ${kb} KB` + (pendentes ? `  ⚠️ ${pendentes} recursos externos` : ''));
}

PAGINAS.forEach(montar);
console.log('\nAbra com dois cliques: sottiles-site-completo.html');
