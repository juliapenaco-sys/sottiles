/**
 * Pipeline de imagens da Sottile's
 * -------------------------------------------------------------
 * Le os arquivos originais de "manual de marca/" (que nao sao alterados)
 * e gera versoes WebP responsivas em assets/img/.
 *
 * Uso:  node tools/build-images.js
 * Requer: npm i sharp   (ver package.json)
 */

const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const SRC = path.join(ROOT, 'manual de marca');
const OUT = path.join(ROOT, 'assets', 'img');
const OPT = { limitInputPixels: false };

fs.mkdirSync(OUT, { recursive: true });

const src = (f) => path.join(SRC, f);
const out = (f) => path.join(OUT, f);

/**
 * Recorte quadrado centralizado (cards de pizza / máscara circular).
 * `zoom` < 1 aproxima o corte: 0.86 corta 14% das bordas, tirando sobra de mesa.
 */
function squareCrop(image, meta, { yShift = 0, zoom = 1 } = {}) {
  const size = Math.round(Math.min(meta.width, meta.height) * zoom);
  return image.extract({
    left: Math.round((meta.width - size) / 2),
    top: Math.max(0, Math.round((meta.height - size) / 2 + yShift * meta.height)),
    width: size,
    height: size,
  });
}

/** Gera um conjunto responsivo em WebP. */
async function responsive(file, base, widths, { square = false, yShift = 0, zoom = 1, quality = 72, ratio = null } = {}) {
  const meta = await sharp(src(file), OPT).metadata();
  for (const w of widths) {
    let img = sharp(src(file), OPT).rotate();
    if (square) {
      img = squareCrop(img, meta, { yShift, zoom });
      img = img.resize({ width: w, height: w, fit: 'cover' });
    } else if (ratio) {
      img = img.resize({ width: w, height: Math.round(w / ratio), fit: 'cover', position: 'centre' });
    } else {
      img = img.resize({ width: w, withoutEnlargement: true });
    }
    await img.webp({ quality, effort: 6 }).toFile(out(`${base}-${w}.webp`));
  }
  console.log('  ✓', base, widths.join('/'));
}

const PHOTOS = [
  // Pizzas salgadas  ------------------------------------------------------
  { file: 'Sottiles salgadas-3.jpg', base: 'pizza-pepperoni', square: true },
  { file: 'Sottiles salgadas-9.jpg', base: 'pizza-calabresa', square: true },
  { file: 'Sottiles salgadas-34.jpg', base: 'pizza-marguerita', square: true },
  { file: 'Sottiles salgadas-31.jpg', base: 'pizza-catubeleza', square: true },
  { file: 'Sottiles salgadas-30.jpg', base: 'pizza-porquinhos', square: true },
  { file: 'Sottiles salgadas-20.jpg', base: 'pizza-queijos', square: true },
  // Pizzas doces / sobremesa ---------------------------------------------
  { file: 'Pizzaria Sottiles -81.jpg', base: 'pizza-biscoito', square: true },
  { file: 'Pizzaria Sottiles -98.jpg', base: 'pizza-banoffe', square: true },
  { file: 'Pizzaria Sottiles -177.jpg', base: 'sobremesa-brownie', square: true },
];

const AMBIENTES = [
  { file: 'IMG_3539.jpg', base: 'unidade-fachada' },
  { file: 'IMG_3543.jpg', base: 'salao-mesas' },
  { file: 'IMG_3546.jpg', base: 'salao-amplo' },
  { file: 'IMG_3552.jpg', base: 'area-kids' },
  { file: 'IMG_3554.jpg', base: 'sorvettiles' },
];

(async () => {
  console.log('› Fotos de produto (quadradas)');
  for (const p of PHOTOS) {
    await responsive(p.file, p.base, [400, 640, 900], { square: true, zoom: 0.94, quality: 74 });
  }

  console.log('› Hero (corte fechado na pizza, para caber no círculo)');
  await responsive('Sottiles salgadas-3.jpg', 'hero-pizza', [400, 600, 800, 1100], { square: true, zoom: 0.88, quality: 74 });

  console.log('› Ambientes (3:2)');
  for (const a of AMBIENTES) {
    await responsive(a.file, a.base, [560, 860, 1280], { ratio: 3 / 2, quality: 70 });
  }

  console.log('› Logotipo');
  const logo = sharp(src('LOGO 3D - VETORIZADA.png'), OPT).trim({ threshold: 5 });
  const logoBuf = await logo.toBuffer();
  for (const w of [200, 320, 440]) {
    await sharp(logoBuf).resize({ width: w }).webp({ quality: 88, effort: 6 }).toFile(out(`logo-${w}.webp`));
  }
  await sharp(logoBuf).resize({ width: 560 }).png({ compressionLevel: 9 }).toFile(out('logo.png'));

  console.log('› Mascote / icones');
  const lm = await sharp(logoBuf).metadata();
  const mascotBuf = await sharp(logoBuf)
    .extract({ left: 0, top: 0, width: Math.round(lm.width * 0.3), height: lm.height })
    .flatten({ background: '#226D2C' })
    .toBuffer();
  await sharp(mascotBuf).resize({ width: 480, height: 480, fit: 'contain', background: '#226D2C' })
    .webp({ quality: 86 }).toFile(out('mascote-480.webp'));

  for (const s of [32, 180, 192, 512]) {
    await sharp(mascotBuf)
      .resize({ width: Math.round(s * 0.92), height: Math.round(s * 0.92), fit: 'contain', background: '#226D2C' })
      .extend({
        top: Math.round(s * 0.04), bottom: Math.round(s * 0.04),
        left: Math.round(s * 0.04), right: Math.round(s * 0.04),
        background: '#226D2C',
      })
      .resize(s, s)
      .png({ compressionLevel: 9, palette: true, quality: 90 })
      .toFile(out(`icon-${s}.png`));
  }

  console.log('› Open Graph 1200x630');
  await sharp(src('Sottiles salgadas-3.jpg'), OPT)
    .resize({ width: 1200, height: 630, fit: 'cover', position: 'centre' })
    .jpeg({ quality: 82, mozjpeg: true })
    .toFile(out('og-sottiles.jpg'));

  const total = fs.readdirSync(OUT).reduce((a, f) => a + fs.statSync(out(f)).size, 0);
  console.log(`\nPronto. ${fs.readdirSync(OUT).length} arquivos, ${(total / 1024 / 1024).toFixed(2)} MB no total.`);
})();
