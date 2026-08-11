/**
 * Banco de fotos da Sottile's
 * -------------------------------------------------------------
 * Le o ensaio fotografico original (JPGs em tamanho cheio, ~3 GB, que ficam
 * fora do repositorio) e gera versoes WebP leves em assets/fotos/.
 *
 * Só as versoes geradas entram no Git. Os originais continuam no Drive:
 * https://drive.google.com/drive/folders/1pmr8Mp0nNZSvPo_eRdIjTDsgDs-jz_5Z
 *
 * Uso:  node tools/build-fotos.js <pasta-com-os-originais>
 * Requer: npm i sharp   (ver package.json)
 */

const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const OUT = path.join(ROOT, 'assets', 'fotos');
const OPT = { limitInputPixels: false };

// thumb para grade/listagem, full para visualizacao
const SIZES = [
  { w: 480, quality: 70 },
  { w: 1600, quality: 72 },
];

const SRC = process.argv[2];
if (!SRC || !fs.existsSync(SRC)) {
  console.error('Informe a pasta com os originais:  node tools/build-fotos.js <pasta>');
  process.exit(1);
}

/** Nomes das pastas do fotografo -> nomes curtos usados no site. */
const CATEGORIAS = [
  { match: /cardápio para impressão/i, slug: 'cardapio-impressao', nome: 'Cardápio para impressão' },
  { match: /diária 1|pizzas salgadas/i, slug: 'pizzas-salgadas', nome: 'Pizzas salgadas' },
  { match: /bebida/i, slug: 'bebidas', nome: 'Bebidas' },
  { match: /combos extras/i, slug: 'combos', nome: 'Combos' },
  { match: /icones ifood/i, slug: 'icones-ifood', nome: 'Ícones iFood' },
  { match: /pizza doce/i, slug: 'pizzas-doces', nome: 'Pizzas doces' },
  { match: /sobremesas/i, slug: 'sobremesas', nome: 'Sobremesas' },
];

/** Remove acentos e caracteres que atrapalham em URL/Git. */
function slugify(s) {
  return s
    .normalize('NFD').replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

/** Descobre a categoria pelo caminho relativo (a subpasta mais especifica vence). */
function categoriaDe(rel) {
  const partes = rel.split(path.sep).slice(0, -1);
  for (const parte of [...partes].reverse()) {
    const hit = CATEGORIAS.find((c) => c.match.test(parte));
    if (hit) return hit;
  }
  return { slug: 'outros', nome: 'Outros' };
}

/** Lista todos os JPGs recursivamente. */
function listarJpgs(dir, base = dir) {
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((e) => {
    const full = path.join(dir, e.name);
    if (e.isDirectory()) return listarJpgs(full, base);
    if (/\.jpe?g$/i.test(e.name)) return [{ full, rel: path.relative(base, full) }];
    return [];
  });
}

/** Roda tarefas com paralelismo limitado (sharp ja usa varias threads por imagem). */
async function comLimite(itens, limite, fn) {
  const fila = [...itens.entries()];
  const resultados = [];
  await Promise.all(
    Array.from({ length: Math.min(limite, fila.length) }, async () => {
      for (;;) {
        const proximo = fila.shift();
        if (!proximo) return;
        const [i, item] = proximo;
        resultados[i] = await fn(item, i);
      }
    })
  );
  return resultados;
}

(async () => {
  const fotos = listarJpgs(SRC);
  console.log(`› ${fotos.length} fotos encontradas em ${SRC}\n`);

  let feitas = 0;
  const registros = await comLimite(fotos, 4, async (foto) => {
    const cat = categoriaDe(foto.rel);
    const base = slugify(path.basename(foto.rel, path.extname(foto.rel)));
    const destino = path.join(OUT, cat.slug);
    fs.mkdirSync(destino, { recursive: true });

    const meta = await sharp(foto.full, OPT).metadata();
    const geradas = [];
    for (const { w, quality } of SIZES) {
      const nome = `${base}-${w}.webp`;
      await sharp(foto.full, OPT)
        .rotate()
        .resize({ width: w, withoutEnlargement: true })
        .webp({ quality, effort: 6 })
        .toFile(path.join(destino, nome));
      geradas.push(nome);
    }

    feitas++;
    if (feitas % 20 === 0) console.log(`  ${feitas}/${fotos.length}`);
    return {
      categoria: cat.slug,
      base,
      original: path.basename(foto.rel),
      largura: meta.width,
      altura: meta.height,
      arquivos: geradas,
    };
  });

  // Manifesto: permite montar galerias sem precisar varrer a pasta no navegador.
  const porCategoria = {};
  for (const r of registros) (porCategoria[r.categoria] ||= []).push(r);
  const manifesto = CATEGORIAS.concat([{ slug: 'outros', nome: 'Outros' }])
    .filter((c) => porCategoria[c.slug])
    .map((c) => ({
      slug: c.slug,
      nome: c.nome,
      fotos: porCategoria[c.slug].sort((a, b) => a.base.localeCompare(b.base)),
    }));
  fs.writeFileSync(path.join(OUT, 'index.json'), JSON.stringify(manifesto, null, 2) + '\n');

  const tamanho = (function soma(dir) {
    return fs.readdirSync(dir, { withFileTypes: true }).reduce((a, e) => {
      const full = path.join(dir, e.name);
      return a + (e.isDirectory() ? soma(full) : fs.statSync(full).size);
    }, 0);
  })(OUT);

  console.log(`\nPronto. ${registros.length} fotos -> ${registros.length * SIZES.length} arquivos WebP`);
  console.log(`assets/fotos/: ${(tamanho / 1024 / 1024).toFixed(1)} MB`);
})();
