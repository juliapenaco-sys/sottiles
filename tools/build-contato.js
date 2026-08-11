/**
 * Folhas de contato do acervo
 * -------------------------------------------------------------
 * Junta as fotos de pizza numa imagem só, cada uma com o nome do arquivo por
 * baixo. Serve para a pizzaria apontar qual foto é qual sabor sem precisar
 * abrir 234 arquivos.
 *
 * Uso:  node tools/build-contato.js
 * Saída: tools/contato-sabores/*.jpg
 */

const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const SRC = path.join(ROOT, 'assets', 'fotos');
const OUT = path.join(__dirname, 'contato-sabores');

const CATEGORIAS = ['pizzas-salgadas', 'pizzas-doces'];
const CELULA = 300;   // lado da miniatura
const ROTULO = 26;    // faixa preta com o nome
const COLUNAS = 5;
const POR_FOLHA = 30;

fs.mkdirSync(OUT, { recursive: true });

function escapar(s) {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

(async () => {
  for (const cat of CATEGORIAS) {
    const dir = path.join(SRC, cat);
    if (!fs.existsSync(dir)) continue;
    const fotos = fs.readdirSync(dir).filter((f) => f.endsWith('-480.webp')).sort();

    for (let folha = 0; folha * POR_FOLHA < fotos.length; folha++) {
      const lote = fotos.slice(folha * POR_FOLHA, (folha + 1) * POR_FOLHA);
      const linhas = Math.ceil(lote.length / COLUNAS);
      const W = COLUNAS * CELULA;
      const H = linhas * (CELULA + ROTULO);

      const camadas = [];
      for (let i = 0; i < lote.length; i++) {
        const x = (i % COLUNAS) * CELULA;
        const y = Math.floor(i / COLUNAS) * (CELULA + ROTULO);
        const mini = await sharp(path.join(dir, lote[i]))
          .resize(CELULA - 6, CELULA - 6, { fit: 'cover' })
          .toBuffer();
        camadas.push({ input: mini, left: x + 3, top: y + 3 });

        const nome = escapar(lote[i].replace('-480.webp', ''));
        const svg = Buffer.from(
          `<svg width="${CELULA}" height="${ROTULO}">` +
          `<rect width="${CELULA}" height="${ROTULO}" fill="#0b0b0b"/>` +
          `<text x="6" y="18" font-family="monospace" font-size="14" fill="#f2b25c">${nome}</text></svg>`
        );
        camadas.push({ input: svg, left: x, top: y + CELULA - 3 });
      }

      const saida = path.join(OUT, `${cat}-folha-${folha + 1}.jpg`);
      await sharp({ create: { width: W, height: H, channels: 3, background: '#0b0b0b' } })
        .composite(camadas)
        .jpeg({ quality: 76 })
        .toFile(saida);
      console.log(`  ✓ ${path.basename(saida)} — ${lote.length} fotos`);
    }
  }

  console.log('\nAbra as folhas em tools/contato-sabores/.');
  console.log('Para cada sabor, anote o nome que aparece embaixo da foto e');
  console.log('acrescente na lista SABORES de tools/build-destaques.js.');
})();
