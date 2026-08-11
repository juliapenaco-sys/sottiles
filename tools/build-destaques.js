/**
 * Fotos de destaque do site
 * -------------------------------------------------------------
 * O banco em assets/fotos/ tem 362 fotos a 1600px (~300 KB cada). Bom para
 * consultar, pesado demais para o site. Aqui escolhemos as fotos que a direcao
 * de arte usa e geramos os recortes e tamanhos exatos de cada composicao.
 *
 * Origem: assets/fotos/<categoria>/<base>-1600.webp   (versionado no repo)
 * Saida:  assets/img/<nome>-<largura>.webp
 *
 * Uso:  node tools/build-destaques.js
 * Requer: npm i sharp
 */

const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const SRC = path.join(ROOT, 'assets', 'fotos');
const OUT = path.join(ROOT, 'assets', 'img');
const OPT = { limitInputPixels: false };

fs.mkdirSync(OUT, { recursive: true });

/* =============================================================
   FOTO DE CADA SABOR (cardápio)
   -------------------------------------------------------------
   No cardápio, tocar no nome de um sabor abre a foto dele. Só entram nesta
   lista os sabores cuja foto é CERTA — uma foto errada faria o site prometer
   um recheio que não é o do prato.

   Hoje só duas são confirmadas, porque vieram nomeadas pelo fotógrafo na
   pasta "Icones iFood". As outras 360 fotos do acervo têm nome genérico
   (sottiles-salgadas-47), e adivinhar o sabor pela aparência não é seguro.

   PARA ACRESCENTAR UM SABOR:
   1. abra as folhas de contato em tools/contato-sabores/ (numeradas)
   2. ache a foto do sabor e anote o número
   3. acrescente uma linha aqui:  { sabor: 'portuguesa', src: 'pizzas-salgadas/sottiles-salgadas-47' }
   4. no cardapio.html, no <li> do sabor, acrescente:  data-foto="portuguesa"
   5. rode  npm run destaques
   ============================================================= */
const SABORES = [
  { sabor: 'mussarela', src: 'icones-ifood/mussarela', zoom: 0.9, foco: 0.02 },
  // a pizza fica na metade esquerda do quadro; a garrafa sai no recorte
  { sabor: 'calabresa', src: 'icones-ifood/calabresa-e-coca-de-600', zoom: 0.78, focoX: -0.17, foco: 0.01 },
];

/**
 * ratio:  proporcao final (largura/altura). null mantem a original.
 * foco:   deslocamento vertical do recorte, -0.5 a 0.5. Negativo sobe.
 * focoX:  deslocamento horizontal. Negativo vai para a esquerda.
 * zoom:   <1 fecha o enquadramento (corta as bordas).
 */
const DESTAQUES = [
  // ---- HOME · hero ----------------------------------------------------
  // fatia erguida com o queijo esticando: a foto mais forte do acervo
  { nome: 'fatia-hero', src: 'icones-ifood/mussarela', ratio: 1, zoom: 0.9, foco: 0.02,
    larguras: [420, 620, 840, 1120], q: 72 },
  // disco redondo do hero: pizza centralizada, sobra de mesa cortada
  { nome: 'disco-hero', src: 'pizzas-salgadas/sottiles-salgadas-112', ratio: 1, zoom: 0.82,
    larguras: [360, 520, 720, 980], q: 72 },

  // ---- HOME · manifesto -----------------------------------------------
  // macro da massa: textura, vapor e queijo derretido bem de perto
  { nome: 'macro-massa', src: 'pizzas-salgadas/sottiles-salgadas-171', ratio: 16 / 9,
    larguras: [640, 1000, 1440, 1920], q: 74 },

  // ---- HOME · assinaturas (grade assimetrica) --------------------------
  { nome: 'assina-1', src: 'pizzas-salgadas/sottiles-salgadas-30', ratio: 3 / 4, zoom: 0.94,
    larguras: [380, 560, 780], q: 76 },
  { nome: 'assina-2', src: 'pizzas-salgadas/sottiles-salgadas-62', ratio: 1, zoom: 0.9,
    larguras: [380, 560, 780], q: 76 },
  { nome: 'assina-3', src: 'pizzas-salgadas/sottiles-salgadas-71', ratio: 4 / 3,
    larguras: [420, 620, 860], q: 76 },
  { nome: 'assina-4', src: 'pizzas-doces/pizzaria-sottiles-82', ratio: 1, zoom: 0.9,
    larguras: [380, 560, 780], q: 76 },
  { nome: 'assina-5', src: 'pizzas-doces/pizzaria-sottiles-92', ratio: 3 / 4, zoom: 0.94,
    larguras: [380, 560, 780], q: 76 },
  { nome: 'assina-6', src: 'pizzas-salgadas/sottiles-salgadas-53', ratio: 4 / 3,
    larguras: [420, 620, 860], q: 76 },

  // ---- HOME · modalidades ---------------------------------------------
  { nome: 'modo-rodizio', src: 'combos/pizzaria-sottiles-65', ratio: 1, zoom: 0.92,
    larguras: [340, 500, 700], q: 76 },
  { nome: 'modo-carte', src: 'combos/pizzaria-sottiles-46', ratio: 1, zoom: 0.92,
    larguras: [340, 500, 700], q: 76 },
  { nome: 'modo-delivery', src: 'combos/pizzaria-sottiles-53', ratio: 1, zoom: 0.92,
    larguras: [340, 500, 700], q: 76 },

  // ---- HOME · faixa larga antes do CTA ---------------------------------
  { nome: 'faixa-mesa', src: 'combos/pizzaria-sottiles-67', ratio: 21 / 9, foco: 0.02,
    larguras: [760, 1200, 1680, 2100], q: 72 },

  // ---- CARDÁPIO · ladrilhos dentro da grade ----------------------------
  { nome: 'menu-salgada', src: 'pizzas-salgadas/sottiles-salgadas-35', ratio: 1, zoom: 0.9,
    larguras: [380, 560, 780], q: 76 },
  { nome: 'menu-doce', src: 'pizzas-doces/pizzaria-sottiles-128', ratio: 1, zoom: 0.9,
    larguras: [380, 560, 780], q: 76 },
  { nome: 'menu-sobremesa', src: 'sobremesas/pizzaria-sottiles-175', ratio: 1, zoom: 0.96,
    larguras: [380, 560, 780], q: 76 },
  { nome: 'menu-borda', src: 'pizzas-salgadas/sottiles-salgadas-149', ratio: 1, zoom: 0.9,
    larguras: [380, 560, 780], q: 76 },
  { nome: 'menu-hero', src: 'pizzas-salgadas/sottiles-salgadas-121', ratio: 21 / 9, foco: 0.03,
    larguras: [760, 1200, 1680, 2100], q: 72 },
  { nome: 'menu-taca', src: 'sobremesas/pizzaria-sottiles-181', ratio: 3 / 4, zoom: 0.96,
    larguras: [340, 500, 700], q: 76 },
];

/** Recorte central com proporcao alvo, com zoom e deslocamento vertical. */
function recortar(img, meta, { ratio, zoom = 1, foco = 0, focoX = 0 }) {
  if (!ratio) return img;
  let w = meta.width;
  let h = Math.round(w / ratio);
  if (h > meta.height) { h = meta.height; w = Math.round(h * ratio); }
  w = Math.round(w * zoom); h = Math.round(h * zoom);

  const esqIdeal = Math.round((meta.width - w) / 2 + focoX * meta.width);
  const left = Math.max(0, Math.min(meta.width - w, esqIdeal));
  const topIdeal = Math.round((meta.height - h) / 2 + foco * meta.height);
  const top = Math.max(0, Math.min(meta.height - h, topIdeal));
  return img.extract({ left, top, width: w, height: h });
}

(async () => {
  let gerados = 0;
  for (const d of DESTAQUES) {
    const origem = path.join(SRC, `${d.src}-1600.webp`);
    if (!fs.existsSync(origem)) {
      console.error(`  ✗ nao encontrei ${d.src}`);
      continue;
    }
    const meta = await sharp(origem, OPT).metadata();
    for (const w of d.larguras) {
      let img = sharp(origem, OPT).rotate();
      img = recortar(img, meta, d);
      await img
        .resize({ width: w, withoutEnlargement: true })
        .webp({ quality: d.q || 76, effort: 6 })
        .toFile(path.join(OUT, `${d.nome}-${w}.webp`));
      gerados++;
    }
    console.log('  ✓', d.nome, d.larguras.join('/'));
  }

  console.log('\n› Fotos de sabor do cardápio');
  for (const s of SABORES) {
    const origem = path.join(SRC, `${s.src}-1600.webp`);
    if (!fs.existsSync(origem)) { console.error(`  ✗ nao encontrei ${s.src}`); continue; }
    const meta = await sharp(origem, OPT).metadata();
    for (const w of [380, 560, 780]) {
      await recortar(sharp(origem, OPT).rotate(), meta, { ratio: 1, ...s })
        .resize({ width: w, withoutEnlargement: true })
        .webp({ quality: 76, effort: 6 })
        .toFile(path.join(OUT, `sabor-${s.sabor}-${w}.webp`));
      gerados++;
    }
    console.log('  ✓', s.sabor);
  }
  console.log(`  ${SABORES.length} sabores com foto — os outros não abrem foto até serem mapeados`);

  const total = fs.readdirSync(OUT).reduce((a, f) => a + fs.statSync(path.join(OUT, f)).size, 0);
  console.log(`\n${gerados} arquivos gerados. assets/img/: ${(total / 1024 / 1024).toFixed(2)} MB`);
})();
