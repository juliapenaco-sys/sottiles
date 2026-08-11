# Site da Sottile's Pizzaria

Site institucional e de conversão. Uma página só, HTML/CSS/JS puros, sem framework
e sem build obrigatório. Feito primeiro para o celular.

---

## Como abrir

**Modo mais simples:** dê dois cliques em **`sottiles-site-completo.html`**.
É o site inteiro dentro de um arquivo só — imagens, fontes, CSS e JavaScript
embutidos. Abre offline, funciona em qualquer computador ou celular, e dá para
mandar por WhatsApp ou e-mail.

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
| Card da unidade Centro, seção Ambientes, rodapé | **Centro — WhatsApp (24) 98809-1011** |
| Card da unidade Alto da Serra, rodapé | **Alto da Serra — WhatsApp (24) 98836-2272** |
| "Prefere ligar?" no card do Centro, seção Pedidos, rodapé | **Centro — telefone (24) 2242-0053** |
| "Prefere ligar?" no card do Alto da Serra, seção Pedidos, rodapé | **Alto da Serra — telefone (24) 2231-1207** |

A ideia: quem quer **pedir** cai na central; quem quer falar com **uma loja
específica** (reserva, dúvida do salão) tem o contato direto dela.

### Para trocar um número

Ele aparece em dois lugares, de propósito — no HTML para funcionar mesmo sem
JavaScript, e no JS para acrescentar a mensagem pronta:

1. `assets/js/main.js` → bloco `CONFIG`, no topo do arquivo
2. `index.html` → `Ctrl+H` e substitua o número antigo pelo novo

Depois rode `npm run bundle` para atualizar o arquivo único.

---

## Quando tiver domínio

O site foi entregue **sem domínio**, então três coisas ficaram de fora. Quando
o endereço existir, acrescente no `<head>` do `index.html`:

```html
<link rel="canonical" href="https://SEUDOMINIO.com.br/">
<meta property="og:url" content="https://SEUDOMINIO.com.br/">
```

E troque o `og:image` de `assets/img/og-sottiles.jpg` para o endereço completo
`https://SEUDOMINIO.com.br/assets/img/og-sottiles.jpg` — sem isso o WhatsApp e o
Facebook não mostram a imagem de prévia quando alguém compartilha o link.

Crie também um `sitemap.xml` com a URL real e acrescente a linha
`Sitemap: https://SEUDOMINIO.com.br/sitemap.xml` no `robots.txt`
(já tem um comentário no arquivo lembrando disso).

Para publicar, envie: `index.html`, a pasta `assets/`, `robots.txt` e
`site.webmanifest`. Não precisa subir `manual de marca/`, `tools/`,
`node_modules/`, `package.json`, este arquivo nem o HTML único.

---

## Onde mexer em cada coisa

| O que mudar | Arquivo | Onde |
| --- | --- | --- |
| Números de WhatsApp | `assets/js/main.js` + `index.html` | bloco `CONFIG` e busca no HTML |
| Mensagem que abre no WhatsApp | `assets/js/main.js` | campo `texto` |
| Sabores, descrições e preços | `index.html` | seção `<!-- CARDÁPIO -->` |
| Endereços e horários | `index.html` | seção `<!-- UNIDADES -->` e rodapé |
| Perguntas frequentes | `index.html` | seção `<!-- PEDIDO / WHATSAPP -->` |
| Cores e tamanhos | `assets/css/style.css` | bloco `2. TOKENS` |

---

## Imagens

As fotos originais continuam intactas em `manual de marca/`. Nada foi apagado.
O site usa versões otimizadas em `assets/img/` — as originais têm 15 a 20 MB
cada e travariam o carregamento no celular.

```bash
npm run images   # regera as versões otimizadas
npm run bundle   # regera o arquivo único
```

Para incluir fotos novas, edite `tools/build-images.js`.

**As fotos não trazem nome de sabor.** A legenda diz apenas que são pizzas da
casa — assim nenhuma imagem promete um recheio específico. Os sabores ficam na
lista do cardápio, que veio do cardápio impresso.

---

## O que foi medido

Chrome headless simulando 4G lento e processador 4× mais lento:

- **133 KB** no primeiro carregamento, 11 requisições
- **LCP 1,7 s** · **CLS 0** · **FCP 1,7 s**
- Sem rolagem horizontal em 320, 375, 390, 430, 768 e 1440 px
- Cardápio inteiro (83 itens) legível pelo Google mesmo sem JavaScript

---

## Decisões que valem saber

**Sem framework.** React traria 100 KB de JavaScript antes de qualquer pixel
aparecer. Numa página que recebe tráfego pago, isso custa venda.

**Fontes na própria hospedagem.** Bungee e Poppins estão em `assets/fonts/`,
não no Google Fonts. Uma conexão externa a menos antes do primeiro texto.

**Cardápio cortado em 12 itens por categoria.** São 58 sabores salgados; listar
todos empurraria a seção de pedido para muito longe no celular. Os 83 itens
continuam no HTML (o Google lê todos), só ficam escondidos até o toque em
"Ver todos os sabores" — ou até você buscar um ingrediente.

**Botão fixo de WhatsApp só no celular.** Aparece depois que a pessoa passa do
topo e o corpo da página reserva espaço para ele não cobrir conteúdo. No
computador ele não existe: lá o WhatsApp está no cabeçalho.

**Um clique até a conversa.** O botão fixo vai direto para a central, sem
perguntar nada antes. Quem prefere uma loja específica encontra os contatos
diretos na seção de pedidos, nos cards das unidades e no rodapé.

**Rastreamento pronto.** Clique de WhatsApp dispara `clique_whatsapp` e clique
de telefone dispara `clique_telefone`, os dois no `dataLayer` e no `gtag`, com o
destino (`central`, `centro` ou `serra`). Basta instalar o GTM ou o GA4 para
medir conversão de campanha sem tocar no código.
