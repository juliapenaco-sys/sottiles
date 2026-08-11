/* =============================================================
   SOTTILE'S PIZZARIA — comportamento do site
   Vanilla JS, sem dependências. ~5 KB.
   Todo movimento respeita prefers-reduced-motion.
   ============================================================= */
(function () {
  'use strict';

  /* ---------------------------------------------------------
     ⚠️ CONFIGURAÇÃO — ajuste apenas este bloco
     Números no formato internacional, só dígitos: 55 + DDD + número.
     --------------------------------------------------------- */
  var CONFIG = {
    central: {
      nome: 'Central de atendimento',
      whatsapp: '5524988441010',
      texto: 'Olá! Vim pelo site e quero fazer um pedido.'
    },
    centro: {
      nome: 'Centro',
      whatsapp: '5524988091011',
      texto: 'Olá! Vim pelo site e quero falar com a unidade Centro.'
    },
    serra: {
      nome: 'Alto da Serra',
      whatsapp: '5524988362272',
      texto: 'Olá! Vim pelo site e quero falar com a unidade Alto da Serra.'
    }
  };

  var $ = function (s, c) { return (c || document).querySelector(s); };
  var $$ = function (s, c) { return Array.prototype.slice.call((c || document).querySelectorAll(s)); };
  var semMovimento = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* =========================================================
     1. LINKS DE WHATSAPP
     Os href já vêm prontos no HTML (funcionam sem JS).
     Aqui só acrescentamos a mensagem pré-preenchida e o tracking.
     ========================================================= */
  function linkDe(chave) {
    var u = CONFIG[chave];
    if (!u) return null;
    return 'https://wa.me/' + u.whatsapp + '?text=' + encodeURIComponent(u.texto);
  }

  function marcarConversao(evento, destino) {
    window.dataLayer = window.dataLayer || [];
    window.dataLayer.push({ event: evento, destino: destino || 'indefinido' });
    if (typeof window.gtag === 'function') {
      window.gtag('event', evento, { destino: destino || 'indefinido' });
    }
  }

  $$('[data-zap]').forEach(function (el) {
    var chave = el.getAttribute('data-zap');
    var url = linkDe(chave);
    if (!url) return;
    el.href = url;
    el.target = '_blank';
    el.rel = 'noopener';
    el.addEventListener('click', function () { marcarConversao('clique_whatsapp', chave); });
  });

  $$('[data-tel]').forEach(function (el) {
    var chave = el.getAttribute('data-tel');
    el.addEventListener('click', function () { marcarConversao('clique_telefone', chave); });
  });

  /* =========================================================
     2. MENU MOBILE
     ========================================================= */
  var botaoMenu = $('.topo__menu');
  var menu = $('#menu-mobile');

  function fecharMenu() {
    if (!menu || menu.hidden) return;
    menu.classList.remove('is-on');
    botaoMenu.setAttribute('aria-expanded', 'false');
    botaoMenu.setAttribute('aria-label', 'Abrir menu');
    document.body.style.overflow = '';
    window.setTimeout(function () { menu.hidden = true; }, semMovimento ? 0 : 280);
  }

  if (botaoMenu && menu) {
    botaoMenu.addEventListener('click', function () {
      if (botaoMenu.getAttribute('aria-expanded') === 'true') { fecharMenu(); return; }
      menu.hidden = false;
      requestAnimationFrame(function () { menu.classList.add('is-on'); });
      botaoMenu.setAttribute('aria-expanded', 'true');
      botaoMenu.setAttribute('aria-label', 'Fechar menu');
      document.body.style.overflow = 'hidden';
    });
    $$('a', menu).forEach(function (a) { a.addEventListener('click', fecharMenu); });
  }

  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape') fecharMenu();
  });

  /* =========================================================
     3. CABEÇALHO + BARRA FIXA DE WHATSAPP
     Um único IntersectionObserver. Nenhum listener de scroll.
     ========================================================= */
  var topo = $('.topo');
  var barra = $('#barra-zap');
  var hero = $('.hero');

  function ajustarAlturaBarra() {
    if (!barra || barra.hidden) return;
    document.documentElement.style.setProperty('--barra-h', barra.offsetHeight + 'px');
  }

  if (hero && 'IntersectionObserver' in window) {
    new IntersectionObserver(function (entradas) {
      var visivel = entradas[0].isIntersecting;
      if (topo) topo.classList.toggle('is-fixo', !visivel);
      if (!barra) return;
      if (!visivel) {
        barra.hidden = false;
        requestAnimationFrame(function () {
          barra.classList.add('is-on');
          ajustarAlturaBarra();
        });
      } else {
        barra.classList.remove('is-on');
        document.documentElement.style.setProperty('--barra-h', '0px');
      }
    }, { rootMargin: '-45% 0px 0px 0px', threshold: 0 }).observe(hero);
  }

  window.addEventListener('resize', ajustarAlturaBarra, { passive: true });

  /* =========================================================
     4. REVELAÇÃO NO SCROLL
     ========================================================= */
  var alvos = $$('.rv');
  if (!('IntersectionObserver' in window) || semMovimento) {
    alvos.forEach(function (el) { el.classList.add('is-in'); });
  } else {
    var revelador = new IntersectionObserver(function (entradas, obs) {
      entradas.forEach(function (en) {
        if (!en.isIntersecting) return;
        en.target.classList.add('is-in');
        obs.unobserve(en.target);
      });
    }, { rootMargin: '0px 0px -8% 0px', threshold: 0.08 });
    alvos.forEach(function (el) { revelador.observe(el); });
  }

  /* =========================================================
     5. FILTRO DO CARDÁPIO (categoria + busca)
     ========================================================= */
  var busca = $('#busca');
  var chips = $$('.chip');
  var itens = $$('.item');
  var grupos = $$('.grupo');
  var aviso = $('#sem-resultado');
  var categoria = 'tudo';

  function normaliza(s) {
    return String(s).toLowerCase().normalize('NFD').replace(/\p{Mn}/gu, '').trim();
  }

  // índice pré-calculado: o filtro não precisa ler o DOM a cada tecla
  var indice = itens.map(function (el) { return normaliza(el.textContent || ''); });

  /* Listas longas (salgadas tem 59 sabores) empurram a conversão para muito
     longe no mobile. Mostramos as primeiras e deixamos o resto a um toque —
     sem tirar nada do HTML, então o Google continua lendo o cardápio inteiro. */
  var LIMITE = 12;
  var expandido = {};

  grupos.forEach(function (g) {
    var nome = g.getAttribute('data-grupo');
    var total = $$('.item', g).length;
    if (total <= LIMITE) return;

    var botao = document.createElement('button');
    botao.type = 'button';
    botao.className = 'ver-mais';
    botao.setAttribute('data-ver-mais', nome);
    botao.addEventListener('click', function () {
      expandido[nome] = !expandido[nome];
      filtrar();
      if (!expandido[nome]) {
        g.scrollIntoView({ block: 'start', behavior: semMovimento ? 'auto' : 'smooth' });
      }
    });
    g.appendChild(botao);
  });

  function filtrar() {
    var termo = busca ? normaliza(busca.value) : '';
    var achou = 0;

    itens.forEach(function (el, i) {
      var okCat = categoria === 'tudo' || el.getAttribute('data-cat') === categoria;
      var okBusca = !termo || indice[i].indexOf(termo) !== -1;
      var mostra = okCat && okBusca;
      el.hidden = !mostra;
      if (mostra) achou++;
    });

    grupos.forEach(function (g) {
      var nome = g.getAttribute('data-grupo');
      var visiveis = $$('.item', g).filter(function (el) { return !el.hidden; });
      var botao = $('[data-ver-mais]', g);
      // durante a busca o corte não faz sentido: quem procura quer ver tudo
      var corta = botao && !termo && !expandido[nome] && visiveis.length > LIMITE;

      if (corta) {
        visiveis.slice(LIMITE).forEach(function (el) { el.hidden = true; });
      }
      if (botao) {
        botao.hidden = !!termo || visiveis.length <= LIMITE;
        botao.textContent = expandido[nome]
          ? 'Mostrar menos'
          : 'Ver todos os ' + visiveis.length + ' sabores';
        botao.setAttribute('aria-expanded', expandido[nome] ? 'true' : 'false');
      }
      g.hidden = visiveis.length === 0;
    });

    if (aviso) aviso.hidden = achou !== 0;
  }

  filtrar();

  chips.forEach(function (chip) {
    chip.addEventListener('click', function () {
      chips.forEach(function (c) { c.classList.remove('is-on'); });
      chip.classList.add('is-on');
      categoria = chip.getAttribute('data-cat');
      filtrar();
    });
  });

  if (busca) {
    busca.addEventListener('input', filtrar);
    busca.addEventListener('search', filtrar);
  }

  /* =========================================================
     6. DETALHES
     ========================================================= */
  var ano = $('#ano');
  if (ano) ano.textContent = new Date().getFullYear();
})();
