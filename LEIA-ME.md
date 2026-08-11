# Site da Sottile's Pizzaria

Site institucional e de conversão. HTML/CSS/JS puros, sem framework e sem build
obrigatório. Feito primeiro para o celular.

**Duas páginas:**

| Arquivo | O que é |
| --- | --- |
| `index.html` | Home. Vende a experiência da marca: hero, história, fotos, modalidades, ambiente, unidades, pedido. |
| `cardapio.html` | Cardápio completo. Os 83 itens, busca por ingrediente, filtro por categoria e tabela de preços. |

A home **não** tem o cardápio inteiro — ela leva para a página dele. Isso encurta
a home e dá ao cardápio uma página própria, com busca e endereço para compartilhar.

---

## Como abrir

**Modo mais simples:** dê dois cliques em **`sottiles-site-completo.html`**.
É o site inteiro dentro de um arquivo só — imagens, fontes, CSS e JavaScript
embutidos. Abre offline e dá para mandar por WhatsApp ou e-mail. O cardápio vira
o `sottiles-cardapio-completo.html`, e um linka para o outro.

**Modo de desenvolvimento** (para editar e ver as mudanças):

```bash
cd "C:\Users\julia\OneDrive\Área de Trabalho\sottiles - site"
npm start
```

Depois abra <http://localhost:5173>.
Para simular o celular: `F12` no Chrome e clique no ícone de celular.

---

## Telefones e roteamento

| Onde o botão está | Para onde vai |
| --- | --- |
| Cabeçalho, hero, menu, cardápio, barra fixa | **Central — WhatsApp (24) 98844-1010** |
| Seção Ambientes, rodapé, card da unidade Centro | **Centro — WhatsApp (24) 98809-1011** |
| Card da unidade Alto da Serra, rodapé | **Alto da Serra — WhatsApp (24) 98836-2272** |
| "Prefere ligar?" no card do Centro, seção Pedidos, rodapé | **Centro — telefone (24) 2242-0053** |
| "Prefere ligar?" no card do Alto da Serra, seção Pedidos, rodapé | **Alto da Serra — telefone (24) 2231-1207** |

A ideia: quem quer **pedir** cai na central; quem quer falar com **uma loja
específica** (reserva, dúvida do salão) tem o contato direto dela.

### Para trocar um número

Ele aparece em dois lugares, de propósito — no HTML para funcionar mesmo sem
JavaScript, e no JS para acrescentar a mensagem pronta:

1. `assets/js/main.js` → bloco `CONFIG`, no topo do arquivo
2. `index.html` e `cardapio.html` → `Ctrl+H` e substitua o número antigo

Depois rode `npm run bundle` para atualizar os arquivos únicos.

---

## Onde mexer em cada coisa

| O que mudar | Arquivo | Onde |
| --- | --- | --- |
| Números de WhatsApp | `assets/js/main.js` + os dois `.html` | bloco `CONFIG` e busca no HTML |
| Mensagem que abre no WhatsApp | `assets/js/main.js` | campo `texto` |
| Sabores, descrições e preços | `cardapio.html` | seções `<!-- SALGADAS -->`, `<!-- DOCES -->`… |
| Textos da home | `index.html` | cada seção tem um comentário com o nome |
| Endereços e horários | os dois `.html` | seção `<!-- UNIDADES -->` e rodapé |
| Perguntas frequentes | `index.html` | seção `<!-- PEDIDO / WHATSAPP -->` |
| Cores, tipos e tempos de animação | `assets/css/style.css` | bloco `2. TOKENS` |
| Quais fotos o site usa | `tools/build-destaques.js` | lista `DESTAQUES` |

---

## Imagens

Existem **três camadas**, de propósito:

1. **`assets/fotos/`** — banco de 362 fotos do ensaio, em WebP de 480 px e
   1600 px (91 MB). É o acervo consultável, versionado no repositório.
   Os originais de 5 GB ficam no
   [Drive](https://drive.google.com/drive/folders/1pmr8Mp0nNZSvPo_eRdIjTDsgDs-jz_5Z),
   fora do Git.
2. **`assets/img/`** — só as fotos que o site realmente usa, já recortadas na
   proporção de cada composição e em vários tamanhos. É o que o navegador baixa.
3. **`manual de marca/`** — originais da identidade visual. Nada foi apagado.

```bash
npm run fotos      # banco (assets/fotos) a partir dos originais do ensaio
npm run destaques  # recortes do site (assets/img) a partir do banco
npm run images     # imagens do manual de marca (logo, ícones, ambientes)
npm run bundle     # regera os arquivos únicos
```

Para trocar a foto de uma composição, edite a lista `DESTAQUES` em
`tools/build-destaques.js` (cada item tem `src`, `ratio`, `zoom` e `foco`) e
rode `npm run destaques`.

**As fotos de composição não trazem nome de sabor.** As legendas dizem apenas
que são pizzas da casa — assim nenhuma imagem promete um recheio específico.

### Foto de cada sabor no cardápio

No cardápio, tocar no nome de um sabor abre a foto **daquele** sabor. Só entram
os sabores com foto confirmada: uma foto errada faria o site prometer um
recheio que não é o do prato.

São **21 dos 77**. Duas vieram nomeadas pelo fotógrafo (pasta "Ícones iFood");
as outras 19 foram identificadas pela aparência, e cada uma tem um ingrediente
que só existe nela no cardápio — camarão, abacaxi, rúcula, cereja, confete,
granulado. **Peça o aval da cozinha antes de considerar fechado.**

Os 56 restantes ficam sem foto de propósito: boa parte é indistinguível por
fora (uma "4 queijos" e uma "5 queijos" são a mesma imagem branca para quem
não fez a pizza), e uma foto errada faria o site prometer um recheio que não é
o do prato.

**Para acrescentar um sabor:**

```bash
npm run contato      # gera as folhas em tools/contato-sabores/
```

1. Abra as folhas. Cada foto tem o nome do arquivo embaixo.
2. Ache a foto do sabor e anote o nome.
3. Acrescente uma linha na lista `SABORES`, em `tools/build-destaques.js`:
   `{ sabor: 'portuguesa', src: 'pizzas-salgadas/sottiles-salgadas-47' }`
4. No `cardapio.html`, no `<li>` daquele sabor, acrescente `data-foto="portuguesa"`.
5. `npm run destaques` e depois `npm run bundle` / `npm run unico`.

Quem não tem foto continua item comum: sem seta, sem clique. Nada quebra.

---

## Como o movimento funciona

Há uma linguagem de movimento só, descrita no bloco `5. MOVIMENTO` do CSS.
Vale conhecer três regras antes de mexer:

**1. Revelação por atributo.** Qualquer elemento com `data-rv` entra em cena
quando aparece na tela: `sobe`, `desce`, `esq`, `dir`, `escala` e `mascara`.
Um `style="--i:2"` atrasa a entrada em cascata. Um único `IntersectionObserver`
cuida de todos e para de observar depois de revelar.

**2. A máscara vai na imagem, nunca no elemento observado.** O
`IntersectionObserver` considera o `clip-path` do próprio alvo — um elemento
recortado a zero é reportado como fora de tela, nunca é revelado e some para
sempre. Por isso o recorte fica no `> img`.

**3. Cada primitiva desfaz só o que aplicou.** Um `transform: none` geral no
estado revelado apagaria transforms legítimos do layout (a rotação de um cartão,
por exemplo) e o elemento saltaria ao aparecer.

Títulos usam `.ln`/`<i>`, que sobem por trás de uma borda. O deslocamento
inicial fica dentro de `@media (scripting:enabled)`: sem JavaScript ninguém
adiciona `.is-in`, e o título ficaria invisível.

A cortina entre páginas abre por **animação CSS pura**. Se o JavaScript falhar,
travar ou nem carregar, ela sai sozinha — nunca existe risco de tela preta.
O JS só cuida da saída.

Tudo respeita `prefers-reduced-motion`: o movimento desliga, a funcionalidade não.

---

## O que foi medido

Chrome 151, página inicial em 1440 px:

- **156 KB** no primeiro carregamento, 11 requisições
- Sem rolagem horizontal em 320, 390, 768, 1024 e 1440 px
- **Sem JavaScript:** todo o conteúdo visível, cardápio inteiro legível, links
  funcionando — inclusive o título do hero
- **Com "reduzir movimento":** sem animação, sem cortina, tudo visível
- Filtro, busca por ingrediente (funciona sem acento) e "ver todos os sabores"
  testados na página do cardápio

---

## Quando tiver domínio

O site foi entregue **sem domínio**, então três coisas ficaram de fora. Quando
o endereço existir, acrescente no `<head>` das duas páginas:

```html
<link rel="canonical" href="https://SEUDOMINIO.com.br/">
<meta property="og:url" content="https://SEUDOMINIO.com.br/">
```

E troque o `og:image` de `assets/img/og-sottiles.jpg` para o endereço completo
`https://SEUDOMINIO.com.br/assets/img/og-sottiles.jpg` — sem isso o WhatsApp e o
Facebook não mostram a imagem de prévia quando alguém compartilha o link.

Crie também um `sitemap.xml` com as duas URLs e acrescente a linha
`Sitemap: https://SEUDOMINIO.com.br/sitemap.xml` no `robots.txt`
(já tem um comentário no arquivo lembrando disso).

Para publicar, envie: `index.html`, `cardapio.html`, a pasta `assets/`,
`robots.txt` e `site.webmanifest`. Não precisa subir `manual de marca/`,
`assets/fotos/`, `tools/`, `node_modules/`, `package.json`, este arquivo nem os
HTML únicos.

---

## Decisões que valem saber

**Sem framework.** React traria 100 KB de JavaScript antes de qualquer pixel
aparecer. Numa página que recebe tráfego pago, isso custa venda. O movimento
todo é CSS + um `IntersectionObserver` + um `requestAnimationFrame`.

**Site escuro.** As fotos do ensaio são quentes, sobre madeira e fundo escuro.
Num fundo creme elas competiam com a página; num fundo escuro elas brilham. As
seções claras entram como respiro e para marcar mudança de assunto.

**Fontes na própria hospedagem.** Bungee e Poppins estão em `assets/fonts/`,
não no Google Fonts. Uma conexão externa a menos antes do primeiro texto.

**Cardápio cortado em 12 itens por categoria.** São 58 sabores salgados; listar
todos empurraria a conversão para muito longe no celular. Os 83 itens continuam
no HTML (o Google lê todos), só ficam escondidos até o toque em "Ver todos os
sabores" — ou até você buscar um ingrediente.

**Botão fixo de WhatsApp só no celular.** Aparece depois que a pessoa passa do
topo e o corpo da página reserva espaço para ele não cobrir conteúdo. No
computador ele não existe: lá o WhatsApp está no cabeçalho.

**Cabeçalho sempre na tela.** Ele já escondeu ao descer para ganhar área útil,
mas o vai-e-vem incomodava mais do que os 78 px que economizava — e o botão de
pedido precisa estar sempre a um toque. Agora ele só troca de fundo.

**Sem citar o Google no texto.** A prova social continua ("703 avaliações de
clientes, média 4,5"), mas sem atribuir a plataforma. Os links de "Como chegar"
continuam apontando para o Google Maps: ali é navegação, não avaliação.

**Cuidado com `$` em substituição de texto.** No JavaScript, `$&` dentro da
string de troca significa "o trecho encontrado" e `$$` vira um `$` literal.
Os preços do cardápio são escritos como `R$&nbsp;19`, então qualquer
`replace()` com string de troca os corrompe — foi assim que apareceu o
"Rnbsp;19" no site. Nos scripts de build, a troca é **sempre por função**.

**Rastreamento pronto.** Clique de WhatsApp dispara `clique_whatsapp` e clique
de telefone dispara `clique_telefone`, os dois no `dataLayer` e no `gtag`, com o
destino (`central`, `centro` ou `serra`). Basta instalar o GTM ou o GA4 para
medir conversão de campanha sem tocar no código.
