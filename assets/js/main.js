/* =============================================================
   SOTTILE'S PIZZARIA — comportamento e motor de movimento
   Vanilla JS, sem dependencias.

   Regras da casa:
   · so animamos transform, opacity e clip-path;
   · um IntersectionObserver para revelar, um rAF para tudo que segue o scroll;
   · o JS nunca e requisito: os links, o cardapio e o conteudo funcionam sem ele;
   · prefers-reduced-motion desliga movimento, nao funcionalidade.
   ============================================================= */
(function () {
  'use strict';

  /* ---------------------------------------------------------
     CONFIGURACAO — ajuste apenas este bloco
     Numeros no formato internacional, so digitos: 55 + DDD + numero.
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

  /* Rede de seguranca. As entradas comecam invisiveis e so aparecem quando o
     observador marca .is-in — se algum erro interrompesse este arquivo, a
     pagina ficaria em branco. Entao qualquer erro revela tudo na hora. */
  window.addEventListener('error', function () {
    $$('[data-rv], .ln-grupo, .assina__f').forEach(function (el) { el.classList.add('is-in'); });
  });
  var raiz = document.documentElement;
  var mqMovimento = window.matchMedia('(prefers-reduced-motion: reduce)');
  var semMovimento = mqMovimento.matches;
  var temIO = 'IntersectionObserver' in window;

  /* =========================================================
     1. LINKS DE WHATSAPP
     Os href ja vem prontos no HTML (funcionam sem JS).
     Aqui so acrescentamos a mensagem pre-preenchida e o tracking.
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
     2. MENU DO CELULAR
     ========================================================= */
  var botaoMenu = $('.topo__menu');
  var menu = $('#menu-mobile');

  function fecharMenu() {
    if (!menu || menu.hidden) return;
    menu.classList.remove('is-on');
    botaoMenu.setAttribute('aria-expanded', 'false');
    botaoMenu.setAttribute('aria-label', 'Abrir menu');
    document.body.style.overflow = '';
    window.setTimeout(function () { menu.hidden = true; }, semMovimento ? 0 : 340);
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
     3. REVELACAO NO SCROLL
     Um observador para tudo que entra em cena. Depois de revelar,
     o elemento sai da observacao — nada fica pendurado.
     ========================================================= */
  var alvos = $$('[data-rv], .ln-grupo, .assina__f');

  if (!temIO || semMovimento) {
    alvos.forEach(function (el) { el.classList.add('is-in'); });
  } else {
    var revelador = new IntersectionObserver(function (entradas, obs) {
      entradas.forEach(function (en) {
        if (!en.isIntersecting) return;
        en.target.classList.add('is-in');
        obs.unobserve(en.target);
      });
    }, { rootMargin: '0px 0px -10% 0px', threshold: 0.06 });
    alvos.forEach(function (el) { revelador.observe(el); });
  }

  /* =========================================================
     4. NUMEROS QUE CONTAM
     data-conta="703"  ·  data-dec="1" para uma casa decimal
     ========================================================= */
  function formatar(valor, dec) {
    return dec ? valor.toFixed(dec).replace('.', ',') : String(Math.round(valor));
  }

  function contar(el) {
    var alvo = parseFloat(el.getAttribute('data-conta'));
    var dec = parseInt(el.getAttribute('data-dec'), 10) || 0;
    if (isNaN(alvo)) return;
    if (semMovimento) { el.textContent = formatar(alvo, dec); return; }

    var inicio = null;
    var duracao = 1400;
    function passo(t) {
      if (inicio === null) inicio = t;
      var p = Math.min((t - inicio) / duracao, 1);
      // expo-out: quase todo o movimento acontece no comeco
      var eased = p === 1 ? 1 : 1 - Math.pow(2, -10 * p);
      el.textContent = formatar(alvo * eased, dec);
      if (p < 1) requestAnimationFrame(passo);
    }
    requestAnimationFrame(passo);
  }

  var contadores = $$('[data-conta]');
  if (contadores.length) {
    if (!temIO) {
      contadores.forEach(contar);
    } else {
      var obsConta = new IntersectionObserver(function (entradas, obs) {
        entradas.forEach(function (en) {
          if (!en.isIntersecting) return;
          contar(en.target);
          obs.unobserve(en.target);
        });
      }, { threshold: 0.5 });
      contadores.forEach(function (el) { obsConta.observe(el); });
    }
  }

  /* =========================================================
     5. MOTOR DE SCROLL
     Um unico rAF cuida de: estado do cabecalho, barra de progresso,
     barra fixa de WhatsApp, parallax e as duas faixas que correm.
     Leituras e escritas ficam separadas para nao forcar reflow.
     ========================================================= */
  var topo = $('.topo');
  var progresso = $('.topo__progresso');
  var barra = $('#barra-zap');
  var hero = $('.hero, .mhero');

  var paralaxe = temIO && !semMovimento ? $$('[data-par]') : [];
  var visiveis = [];
  var faixas = [];

  // as faixas correm em JS para reagir a velocidade do scroll; sem JS o CSS
  // mantem a animacao original (ver .faixa__trilho no style.css)
  if (!semMovimento) {
    $$('.faixa__trilho, .insta__trilho').forEach(function (t) {
      var base = parseFloat(t.getAttribute('data-vel')) || 0.035;
      t.style.animation = 'none';
      faixas.push({ el: t, x: 0, base: base, largura: 0 });
    });
  }

  if (paralaxe.length) {
    var obsPar = new IntersectionObserver(function (entradas) {
      entradas.forEach(function (en) {
        var i = visiveis.indexOf(en.target);
        if (en.isIntersecting && i === -1) visiveis.push(en.target);
        else if (!en.isIntersecting && i !== -1) visiveis.splice(i, 1);
      });
    }, { rootMargin: '20% 0px 20% 0px' });
    paralaxe.forEach(function (el) { obsPar.observe(el); });
  }

  var ultimoY = window.scrollY;
  var direcao = 0;
  var velocidade = 0;
  var rodando = false;
  var alturaJanela = window.innerHeight;

  function medirFaixas() {
    faixas.forEach(function (f) {
      // o trilho tem o conteudo duplicado: metade da largura e um ciclo
      f.largura = f.el.scrollWidth / 2 || 0;
    });
  }
  medirFaixas();

  function quadro() {
    rodando = false;
    var y = window.scrollY;
    var delta = y - ultimoY;
    ultimoY = y;

    // --- leituras ---
    var caixas = visiveis.map(function (el) { return el.getBoundingClientRect(); });
    var alturaDoc = document.body.scrollHeight - alturaJanela;

    // --- escritas ---
    // o cabecalho so troca de fundo; nunca sai da tela (ver .topo no style.css)
    if (topo) topo.classList.toggle('is-fixo', y > 20);
    if (progresso && alturaDoc > 0) {
      raiz.style.setProperty('--lido', Math.min(y / alturaDoc, 1).toFixed(4));
    }
    if (barra) {
      var mostra = y > alturaJanela * 0.6;
      if (mostra && barra.hidden) {
        barra.hidden = false;
        requestAnimationFrame(function () {
          barra.classList.add('is-on');
          raiz.style.setProperty('--barra-h', barra.offsetHeight + 'px');
        });
      } else if (mostra) {
        barra.classList.add('is-on');
      } else if (!barra.hidden) {
        barra.classList.remove('is-on');
        raiz.style.setProperty('--barra-h', '0px');
      }
    }

    visiveis.forEach(function (el, i) {
      var r = caixas[i];
      // -1 quando o elemento entra por baixo, +1 quando sai por cima
      var centro = (r.top + r.height / 2 - alturaJanela / 2) / (alturaJanela / 2 + r.height / 2);
      el.style.setProperty('--par', Math.max(-1, Math.min(1, centro)).toFixed(4));
    });

    // faixas: a velocidade do scroll empurra o trilho um pouco mais
    if (faixas.length) {
      velocidade += (delta - velocidade) * 0.12;
      faixas.forEach(function (f) {
        if (!f.largura) return;
        f.x -= f.base * 16 + velocidade * 0.35;
        if (f.x <= -f.largura) f.x += f.largura;
        if (f.x > 0) f.x -= f.largura;
        f.el.style.transform = 'translate3d(' + f.x.toFixed(2) + 'px,0,0)';
      });
      pedirQuadro();
    }
  }

  function pedirQuadro() {
    if (rodando) return;
    rodando = true;
    requestAnimationFrame(quadro);
  }

  window.addEventListener('scroll', pedirQuadro, { passive: true });
  window.addEventListener('resize', function () {
    alturaJanela = window.innerHeight;
    medirFaixas();
    pedirQuadro();
  }, { passive: true });
  window.addEventListener('load', function () { medirFaixas(); pedirQuadro(); });
  pedirQuadro();

  /* =========================================================
     6. PROFUNDIDADE PELO PONTEIRO (so no desktop com mouse)
     O palco do hero inclina de leve seguindo o cursor.
     ========================================================= */
  var palco = $('[data-ponteiro]');
  if (palco && !semMovimento && window.matchMedia('(hover:hover) and (min-width:900px)').matches) {
    var alvoX = 0, alvoY = 0, atualX = 0, atualY = 0, animando = false;

    function suavizar() {
      atualX += (alvoX - atualX) * 0.08;
      atualY += (alvoY - atualY) * 0.08;
      palco.style.setProperty('--px', atualX.toFixed(3));
      palco.style.setProperty('--py', atualY.toFixed(3));
      if (Math.abs(alvoX - atualX) > 0.001 || Math.abs(alvoY - atualY) > 0.001) {
        requestAnimationFrame(suavizar);
      } else {
        animando = false;
      }
    }

    window.addEventListener('pointermove', function (e) {
      alvoX = (e.clientX / window.innerWidth - 0.5) * 2;
      alvoY = (e.clientY / window.innerHeight - 0.5) * 2;
      if (!animando) { animando = true; requestAnimationFrame(suavizar); }
    }, { passive: true });
  }

  /* =========================================================
     7. CORTINA DE TRANSICAO ENTRE PAGINAS
     Progressive enhancement: se algo falhar, o link navega normal.
     ========================================================= */
  var cortina = $('.cortina');
  if (cortina && !semMovimento) {
    // a ABERTURA e 100% CSS (ver .cortina no style.css). Aqui so tratamos a
    // saida — se este bloco falhar, o link navega normalmente.
    document.addEventListener('click', function (e) {
      if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
      var a = e.target.closest && e.target.closest('a[href]');
      if (!a) return;
      if (a.target === '_blank' || a.hasAttribute('download')) return;

      var destino;
      try { destino = new URL(a.href, location.href); } catch (err) { return; }
      if (destino.origin !== location.origin) return;
      // ancora na propria pagina continua sendo rolagem, nao navegacao
      if (destino.pathname === location.pathname && destino.search === location.search) return;

      e.preventDefault();
      requestAnimationFrame(function () { cortina.classList.add('is-fechando'); });
      window.setTimeout(function () { location.href = destino.href; }, 540);
    });

    // voltar pelo historico nao pode deixar a cortina fechada na tela
    window.addEventListener('pageshow', function (e) {
      if (e.persisted) cortina.classList.remove('is-fechando');
    });
  }

  /* =========================================================
     8. FILTRO DO CARDAPIO (categoria + busca)
     So existe na pagina do cardapio; sai de cena sem erro na home.
     ========================================================= */
  var busca = $('#busca');
  var chips = $$('.chip');
  var itens = $$('.item');
  var grupos = $$('.grupo');
  var aviso = $('#sem-resultado');
  var categoria = 'tudo';

  if (itens.length) {
    var normaliza = function (s) {
      return String(s).toLowerCase().normalize('NFD').replace(/\p{Mn}/gu, '').trim();
    };

    // indice pre-calculado: o filtro nao precisa ler o DOM a cada tecla
    var indice = itens.map(function (el) { return normaliza(el.textContent || ''); });

    /* Listas longas (salgadas tem 58 sabores) empurram a conversao para muito
       longe no celular. Mostramos as primeiras e deixamos o resto a um toque —
       sem tirar nada do HTML, entao o Google continua lendo o cardapio inteiro. */
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

    var filtrar = function () {
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
        var visiveisG = $$('.item', g).filter(function (el) { return !el.hidden; });
        var botao = $('[data-ver-mais]', g);
        // durante a busca o corte nao faz sentido: quem procura quer ver tudo
        var corta = botao && !termo && !expandido[nome] && visiveisG.length > LIMITE;

        if (corta) {
          visiveisG.slice(LIMITE).forEach(function (el) { el.hidden = true; });
        }
        if (botao) {
          botao.hidden = !!termo || visiveisG.length <= LIMITE;
          botao.textContent = expandido[nome]
            ? 'Mostrar menos'
            : 'Ver todos os ' + visiveisG.length + ' sabores';
          botao.setAttribute('aria-expanded', expandido[nome] ? 'true' : 'false');
        }
        g.hidden = visiveisG.length === 0;
        // os ladrilhos de foto acompanham o grupo, mas nao contam como item
        $$('.ladrilho', g).forEach(function (l) { l.hidden = !!termo || categoria !== 'tudo'; });
      });

      if (aviso) aviso.hidden = achou !== 0;
    };

    filtrar();

    chips.forEach(function (chip) {
      chip.addEventListener('click', function () {
        chips.forEach(function (c) { c.classList.remove('is-on'); c.setAttribute('aria-selected', 'false'); });
        chip.classList.add('is-on');
        chip.setAttribute('aria-selected', 'true');
        categoria = chip.getAttribute('data-cat');
        filtrar();
      });
    });

    if (busca) {
      busca.addEventListener('input', filtrar);
      busca.addEventListener('search', filtrar);
    }
  }

  /* =========================================================
     9. DETALHES
     ========================================================= */
  var ano = $('#ano');
  if (ano) ano.textContent = new Date().getFullYear();

  // se a pessoa ligar "reduzir movimento" com o site aberto, recarrega o estado
  if (mqMovimento.addEventListener) {
    mqMovimento.addEventListener('change', function (e) {
      semMovimento = e.matches;
      if (semMovimento) alvos.forEach(function (el) { el.classList.add('is-in'); });
    });
  }
})();
