/* ============================================================
   «почка» — интерактив прототипа портала фонда «Настенька»
   ============================================================ */
(function () {
  'use strict';

  function $$(sel, ctx) {
    return Array.prototype.slice.call((ctx || document).querySelectorAll(sel));
  }

  document.addEventListener('DOMContentLoaded', function () {
    var prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    /* ---------- Верхняя панель фонда (общая для всех страниц) ---------- */
    if (document.querySelector('.site-header') && !document.querySelector('.topbar')) {
      var bar = document.createElement('div');
      bar.className = 'topbar';
      bar.innerHTML =
        '<div class="container topbar-inner">' +
          '<span>Проект фонда «Настенька» — помогаем детям с болезнями почек с 2002 года</span>' +
          '<span class="topbar-links">' +
            '<a href="https://t.me/bf_nastenka" target="_blank" rel="noopener">чат «Пересадка»</a>' +
            '<span class="dot">·</span>' +
            '<a href="tel:+79855501746">+7 985 550-17-46</a>' +
          '</span>' +
        '</div>';
      document.body.insertBefore(bar, document.body.firstChild);
    }

    /* ---------- «Редакционные» номера секций ---------- */
    $$('.section-head').forEach(function (el, i) {
      el.setAttribute('data-num', String(i + 1).padStart(2, '0'));
    });

    /* ---------- Подписи на полароидах: имя героя переезжает на фото ---------- */
    $$('.story-photo').forEach(function (ph) {
      var card = ph.closest('.story-card');
      var h3 = card && card.querySelector('h3');
      if (h3) {
        ph.setAttribute('data-name', h3.textContent);
        h3.parentNode.removeChild(h3);
      }
    });

    /* ---------- Плавное появление блоков ---------- */
    var revealSel = '.sit-card, .clinic-card, .clinic-mini, .route-card, .story-card, .know-card, ' +
      '.passport, .block, .article, .rights-block, .band, .cta-final, .banner, ' +
      '.hero-grid, .metro, .q3-grid, .stats-row, .fact-card, .iceberg, .quiz';
    if (!prefersReduced) {
      var revealEls = $$(revealSel);
      revealEls.forEach(function (el) { el.classList.add('reveal'); });

      var markVisible = function () {
        var vh = window.innerHeight || document.documentElement.clientHeight;
        revealEls.forEach(function (el) {
          if (!el.classList.contains('is-in')) {
            var r = el.getBoundingClientRect();
            /* всё, что оказалось выше нижней границы экрана, — показываем:
               так элементы не «застревают» скрытыми при быстрой прокрутке */
            if (r.top < vh * 0.94) el.classList.add('is-in');
          }
        });
      };

      window.addEventListener('scroll', markVisible, { passive: true });
      window.addEventListener('resize', markVisible, { passive: true });
      window.addEventListener('pageshow', markVisible);

      if ('IntersectionObserver' in window) {
        var io = new IntersectionObserver(function (entries) {
          entries.forEach(function (e) {
            if (e.isIntersecting) {
              e.target.classList.add('is-in');
              io.unobserve(e.target);
            }
          });
        }, { threshold: 0.05 });
        revealEls.forEach(function (el) { io.observe(el); });
      }

      requestAnimationFrame(function () { requestAnimationFrame(markVisible); });
      setTimeout(markVisible, 700); /* страховка: ничего не останется скрытым */
    }

    /* ---------- Мобильное меню ---------- */
    var burger = document.getElementById('burger');
    var nav = document.getElementById('mainNav');
    if (burger && nav) {
      burger.addEventListener('click', function () {
        nav.classList.toggle('is-open');
        burger.classList.toggle('is-open');
      });
    }

    /* ---------- Табы ---------- */
    $$('[data-tabs]').forEach(function (group) {
      var buttons = $$('.tab-btn', group);
      var panelSel = buttons.map(function (b) { return b.getAttribute('data-tab'); }).join(',');
      var panels = document.querySelectorAll(panelSel);
      buttons.forEach(function (btn) {
        btn.addEventListener('click', function () {
          buttons.forEach(function (b) { b.classList.remove('is-active'); });
          panels.forEach(function (p) { p.classList.remove('is-active'); });
          btn.classList.add('is-active');
          var target = document.querySelector(btn.getAttribute('data-tab'));
          if (target) target.classList.add('is-active');
        });
      });
    });

    /* ---------- Шаги маршрута + прогресс ---------- */
    $$('[data-steps]').forEach(function (group) {
      var buttons = $$('.step-btn', group);
      var panels = $$('.step-panel', group);
      var withProgress = group.hasAttribute('data-progress');
      var rpBar = document.getElementById('rpBar');
      var rpText = document.getElementById('rpText');

      var show = function (name) {
        var idx = 0;
        buttons.forEach(function (b, i) {
          var active = b.getAttribute('data-step') === name;
          b.classList.toggle('is-active', active);
          if (active) idx = i;
        });
        panels.forEach(function (p) {
          p.classList.toggle('is-active', p.getAttribute('data-step') === name);
        });
        if (withProgress && rpBar && rpText) {
          rpBar.style.width = ((idx + 1) / buttons.length * 100) + '%';
          rpText.textContent = 'шаг ' + (idx + 1) + ' из ' + buttons.length;
        }
        var panel = group.querySelector('.step-panel[data-step="' + name + '"]');
        if (panel && window.innerWidth < 1080) {
          panel.scrollIntoView({ behavior: prefersReduced ? 'auto' : 'smooth', block: 'start' });
        }
      };

      buttons.forEach(function (btn) {
        btn.addEventListener('click', function () { show(btn.getAttribute('data-step')); });
      });
      $$('[data-go]', group).forEach(function (btn) {
        btn.addEventListener('click', function () { show(btn.getAttribute('data-go')); });
      });
      if (buttons.length) show(buttons[0].getAttribute('data-step'));
    });

    /* ---------- Интерактивный чек-лист перед поездкой ---------- */
    var checklist = document.querySelector('[data-checklist]');
    if (checklist) {
      var KEY = 'pochka-checklist-v1';
      var boxes = $$('input[type="checkbox"]', checklist);
      var countEl = document.getElementById('checkCount');
      var noteEl = document.getElementById('checkNote');
      var saved = {};
      try { saved = JSON.parse(localStorage.getItem(KEY) || '{}'); } catch (e) { saved = {}; }

      var refresh = function () {
        var done = 0;
        boxes.forEach(function (b) {
          b.checked = !!saved[b.getAttribute('data-check')];
          if (b.checked) done++;
        });
        if (countEl) countEl.textContent = done;
        if (noteEl) {
          var total = boxes.length;
          noteEl.textContent =
            done === 0 ? 'начните с вызова из центра' :
            done === total ? 'вы собрались — счастливой дороги!' :
            'вы почти собрались';
        }
      };

      boxes.forEach(function (b) {
        b.addEventListener('change', function () {
          saved[b.getAttribute('data-check')] = b.checked;
          try { localStorage.setItem(KEY, JSON.stringify(saved)); } catch (e) {}
          refresh();
        });
      });
      refresh();
    }

    /* ---------- Мини-тест «проверь себя» ---------- */
    var quiz = document.querySelector('[data-quiz]');
    if (quiz) {
      quiz.addEventListener('click', function (e) {
        var opt = e.target.closest('.quiz-opt');
        if (!opt) return;
        var row = opt.closest('.quiz-q');
        row.querySelectorAll('.quiz-opt').forEach(function (o) { o.classList.remove('is-on'); });
        opt.classList.add('is-on');
      });
      var quizGo = quiz.querySelector('[data-quiz-go]');
      if (quizGo) {
        quizGo.addEventListener('click', function () {
          var yes = 0, answered = 0;
          quiz.querySelectorAll('.quiz-q').forEach(function (row) {
            var on = row.querySelector('.quiz-opt.is-on');
            if (on) { answered++; if (on.getAttribute('data-yes') === '1') yes++; }
          });
          if (answered < quiz.querySelectorAll('.quiz-q').length) return;
          var showWarn = yes >= 2;
          quiz.querySelectorAll('.quiz-result').forEach(function (r) {
            r.classList.toggle('is-visible', r.getAttribute('data-kind') === (showWarn ? 'warn' : 'ok'));
          });
        });
      }
    }

    /* ---------- Фильтр каталога клиник ---------- */
    var grid = document.getElementById('clinicGrid');
    if (grid) {
      var cards = $$('.clinic-card', grid);
      var countEl = document.getElementById('clinicCount');
      var emptyEl = document.getElementById('clinicEmpty');
      var searchInput = document.getElementById('fSearch');
      var selType = document.getElementById('fType');
      var selCity = document.getElementById('fCity');
      var selHelp = document.getElementById('fHelp');
      var selAge = document.getElementById('fAge');
      var chipWrap = document.getElementById('filterChips');
      var resetBtn = document.getElementById('fReset');

      var state = { help: [], consult: false };

      var apply = function () {
        var q = (searchInput.value || '').trim().toLowerCase();
        var type = selType.value;
        var city = selCity.value;
        var help = selHelp.value;
        var age = selAge.value;
        var shown = 0;

        cards.forEach(function (card) {
          var ok = true;
          if (type && card.getAttribute('data-type') !== type) ok = false;
          if (city && card.getAttribute('data-city') !== city) ok = false;
          if (help && card.getAttribute('data-help').split(' ').indexOf(help) === -1) ok = false;
          if (age && card.getAttribute('data-ages').split(' ').indexOf(age) === -1) ok = false;
          state.help.forEach(function (h) {
            if (card.getAttribute('data-help').split(' ').indexOf(h) === -1) ok = false;
          });
          if (state.consult && card.getAttribute('data-consult') !== 'yes') ok = false;
          if (q && card.textContent.toLowerCase().indexOf(q) === -1) ok = false;
          card.hidden = !ok;
          if (ok) shown++;
        });

        if (countEl) countEl.textContent = 'Показано: ' + shown + ' из ' + cards.length;
        if (emptyEl) emptyEl.classList.toggle('is-visible', shown === 0);
      };

      [searchInput, selType, selCity, selHelp, selAge].forEach(function (el) {
        if (el) el.addEventListener('input', apply);
        if (el) el.addEventListener('change', apply);
      });

      if (chipWrap) {
        chipWrap.addEventListener('click', function (e) {
          var chip = e.target.closest('.chip[data-filter]');
          if (!chip) return;
          var key = chip.getAttribute('data-filter');
          var val = chip.getAttribute('data-value');
          if (key === 'help') {
            var i = state.help.indexOf(val);
            if (i > -1) { state.help.splice(i, 1); chip.classList.remove('is-active'); }
            else { state.help.push(val); chip.classList.add('is-active'); }
          } else if (key === 'consult') {
            state.consult = !state.consult;
            chip.classList.toggle('is-active', state.consult);
          }
          apply();
        });
      }

      if (resetBtn) {
        resetBtn.addEventListener('click', function () {
          searchInput.value = '';
          selType.value = ''; selCity.value = ''; selHelp.value = ''; selAge.value = '';
          state.help = []; state.consult = false;
          if (chipWrap) {
            $$('.chip', chipWrap).forEach(function (c) { c.classList.remove('is-active'); });
          }
          apply();
        });
      }

      /* Параметры из ссылок: clinics.html?need=transplant&q=... */
      var params = new URLSearchParams(window.location.search);
      var need = params.get('need');
      var q = params.get('q');
      var pickChip = function (val) {
        var c = chipWrap && chipWrap.querySelector('.chip[data-value="' + val + '"]');
        if (c) { c.classList.add('is-active'); state.help.push(val); }
      };
      if (need === 'transplant') pickChip('transplant');
      if (need === 'dialysis') pickChip('dialysis');
      if (need === 'diagnostic') pickChip('diagnostic');
      if (need === 'followup') pickChip('followup');
      if (need === 'babies') selAge.value = 'small';
      if (need === 'consult') {
        var cc = chipWrap && chipWrap.querySelector('.chip[data-filter="consult"]');
        if (cc) { cc.classList.add('is-active'); state.consult = true; }
      }
      if (need === 'federal') selType.value = 'federal';
      if (q) searchInput.value = q;

      apply();
    }

    /* ---------- Калькулятор СКФ ---------- */
    var calcTabs = document.querySelector('[data-calc-tabs]');
    if (calcTabs) {
      var calcForm = document.querySelector('[data-calc-form]');
      var adultFields = document.querySelector('[data-adult-fields]');
      var childFields = document.querySelector('[data-child-fields]');
      var calcResult = document.querySelector('[data-calc-result]');
      var calcMode = 'adult';
      var calcButtons = $$('button', calcTabs);

      calcButtons.forEach(function (btn) {
        btn.addEventListener('click', function () {
          calcMode = btn.getAttribute('data-mode') || 'adult';
          calcButtons.forEach(function (b) {
            b.classList.toggle('is-active', b === btn);
          });
          if (adultFields) adultFields.hidden = calcMode !== 'adult';
          if (childFields) childFields.hidden = calcMode !== 'child';
          if (calcResult) calcResult.classList.remove('is-visible');
        });
      });

      if (calcForm && calcResult) {
        calcForm.addEventListener('submit', function (e) {
          e.preventDefault();
          var titleEl = calcResult.querySelector('b');
          var textEl = calcResult.querySelector('p');
          var gfr = 0;
          var ok = true;

          if (calcMode === 'adult') {
            var sex = document.getElementById('calcSex').value;
            var age = Number(document.getElementById('calcAge').value);
            var crA = Number(document.getElementById('calcCrA').value);
            var unitA = document.getElementById('calcUnitA').value;
            if (unitA === 'umol') crA = crA / 88.4;
            if (!age || age < 18 || !crA || crA <= 0) ok = false;
            if (ok) {
              var k = sex === 'female' ? 0.7 : 0.9;
              var alpha = sex === 'female' ? -0.241 : -0.302;
              gfr = 142 *
                Math.pow(Math.min(crA / k, 1), alpha) *
                Math.pow(Math.max(crA / k, 1), -1.200) *
                Math.pow(0.9938, age);
              if (sex === 'female') gfr = gfr * 1.012;
            }
          } else {
            var childAge = Number(document.getElementById('calcChildAge').value);
            var childSex = document.getElementById('calcChildSex').value;
            var height = Number(document.getElementById('calcHeight').value);
            var crC = Number(document.getElementById('calcCrC').value);
            var unitC = document.getElementById('calcUnitC').value;
            if (unitC === 'umol') crC = crC / 88.4;
            if (childAge < 0 || !height || height <= 0 || !crC || crC <= 0) ok = false;
            if (ok) {
              var kChild;
              if (childAge < 2) kChild = 0.45;
              else if (childSex === 'female') kChild = 0.55;
              else kChild = 0.70;
              gfr = kChild * height / crC;
            }
          }

          if (!ok || !isFinite(gfr)) {
            calcResult.className = 'calc-result yellow is-visible';
            if (titleEl) titleEl.textContent = 'Проверьте данные';
            if (textEl) textEl.textContent = 'Нужны возраст, рост (для ребёнка) и креатинин больше нуля.';
            return;
          }

          var rounded = Math.round(gfr);
          var cls, title, note;
          if (gfr > 150) {
            cls = 'green';
            title = 'СКФ ≈ 150 или выше';
            note = 'У детей формула часто даёт завышенное значение. Врач смотрит не только на цифру, но и на возраст, анализы мочи и давление.';
          } else if (gfr >= 90) {
            cls = 'green';
            title = 'СКФ ≈ ' + rounded + ' — обычный диапазон';
            note = 'Это ориентир. Почки редко говорят о себе сами, поэтому раз в год всё равно сдавайте мочу и креатинин.';
          } else if (gfr >= 60) {
            cls = 'yellow';
            title = 'СКФ ≈ ' + rounded + ' — чуть ниже 90';
            note = 'Само по себе это не болезнь. Покажите результат врачу: он учтёт анализы мочи, давление и ваш возраст.';
          } else {
            cls = 'red';
            title = 'СКФ ≈ ' + rounded + ' — ниже обычного';
            note = 'Это повод показать результат врачу. Один расчёт не ставит диагноз, но его стоит обсудить.';
          }
          calcResult.className = 'calc-result ' + cls + ' is-visible';
          if (titleEl) titleEl.textContent = title;
          if (textEl) textEl.textContent = note;
        });
      }
    }

    /* ---------- Тест рисков на странице сервисов ---------- */
    var riskQuiz = document.querySelector('[data-riskquiz]');
    if (riskQuiz) {
      var riskHint = riskQuiz.querySelector('[data-riskhint]');
      var plural = function (n) {
        var m10 = n % 10, m100 = n % 100;
        if (m10 === 1 && m100 !== 11) return 'вопрос';
        if (m10 >= 2 && m10 <= 4 && (m100 < 12 || m100 > 14)) return 'вопроса';
        return 'вопросов';
      };

      riskQuiz.addEventListener('click', function (e) {
        var opt = e.target.closest('.quiz-opt');
        if (!opt) return;
        var row = opt.closest('.quiz-q');
        if (!row) return;
        $$('.quiz-opt', row).forEach(function (o) { o.classList.remove('is-on'); });
        opt.classList.add('is-on');
        row.setAttribute('data-answer', opt.getAttribute('data-risk') || '0');
        $$('.quiz-result', riskQuiz).forEach(function (r) { r.classList.remove('is-visible'); });
        if (riskHint) riskHint.textContent = 'Можно менять ответы — результат появится, когда будет готово.';
      });

      var riskGo = riskQuiz.querySelector('[data-riskgo]');
      if (riskGo) {
        riskGo.addEventListener('click', function () {
          var rows = $$('.quiz-q', riskQuiz);
          var left = rows.filter(function (r) { return !r.hasAttribute('data-answer'); }).length;
          if (left) {
            if (riskHint) riskHint.textContent = 'Осталось ответить на ' + left + ' ' + plural(left) + '.';
            return;
          }
          var score = rows.reduce(function (sum, r) {
            return sum + Number(r.getAttribute('data-answer') || 0);
          }, 0);
          var kind = score >= 3 ? 'high' : (score >= 1 ? 'mid' : 'low');
          $$('.quiz-result', riskQuiz).forEach(function (r) {
            r.classList.toggle('is-visible', r.getAttribute('data-riskresult') === kind);
          });
          if (riskHint) riskHint.textContent = 'Это ориентир, а не диагноз — результат лучше обсудить с врачом.';
        });
      }
    }

    /* ---------- Поиск по справочнику продуктов ---------- */
    var productSearch = document.getElementById('productSearch');
    if (productSearch) {
      var productTable = document.getElementById('productTable');
      var productRows = productTable ? $$('.product-row:not(.head)', productTable) : [];
      var productEmpty = document.getElementById('productEmpty');
      var applyProducts = function () {
        var q = (productSearch.value || '').trim().toLowerCase();
        var shown = 0;
        productRows.forEach(function (row) {
          var ok = !q || row.textContent.toLowerCase().indexOf(q) > -1;
          row.hidden = !ok;
          if (ok) shown++;
        });
        if (productEmpty) productEmpty.classList.toggle('is-visible', shown === 0);
      };
      productSearch.addEventListener('input', applyProducts);
      applyProducts();
    }

    /* ---------- Поиск по порталу ---------- */
    var searchForm = document.querySelector('[data-search-form]');
    if (searchForm) {
      var searchInput = document.getElementById('searchInput');
      var searchResults = document.getElementById('searchResults');
      var searchCount = document.getElementById('searchCount');
      var searchIndex = [
        { t: 'Здоровье и профилактика', u: 'health.html', d: 'Как работают почки, анализы, вода, питание и аптечка.', k: 'почки анализы моча креатинин вода соль питание лекарства отёки мифы', p: 1 },
        { t: 'Группы риска', u: 'risk.html', d: 'Давление, диабет и наследственность: что контролировать.', k: 'давление диабет сахар наследственность риск чек-лист', p: 1 },
        { t: 'Навигатор для родителей', u: 'parents.html', d: 'Маршруты, клиники, документы и поддержка семей с детской ХБП.', k: 'ребёнок хбп дети родители маршрут помощь', p: 1 },
        { t: 'Сервисы и тесты', u: 'services.html', d: 'Калькулятор СКФ, тест рисков и справочник продуктов.', k: 'скф калькулятор тест продукты калий фосфор белок', p: 1 },
        { t: 'Каталог учреждений', u: 'clinics.html', d: 'Профильные центры, фильтры по городу, возрасту и помощи.', k: 'клиника центр учреждение город найти трансплантация диализ', p: 1 },
        { t: 'Маршруты получения помощи', u: 'routes.html', d: 'Пошаговые маршруты от диагноза до лечения.', k: 'маршрут этапы диагноз направление лечение', p: 1 },
        { t: 'Права и документы', u: 'rights.html', d: '057/у, ВМП, инвалидность, лекарства, проезд и жильё.', k: '057у справка вмп инвалидность льготы документы проезд', p: 1 },
        { t: 'База знаний', u: 'knowledge.html', d: 'Первые шаги, диагнозы, диализ, трансплантация, питание.', k: 'знания диагноз диализ трансплантация пересадка питание', p: 1 },
        { t: 'Люди и сообщество', u: 'community.html', d: 'Чат «Пересадка», психологи, истории семей и помощь фонда.', k: 'сообщество чат пересадка психолог история фонд', p: 0 },
        { t: 'О проекте', u: 'about.html', d: 'Кто делает портал и как проверяются материалы.', k: 'фонд настенька редакция эксперты доверие', p: 0 },
        { t: 'Что смотреть в анализе мочи и креатинине', u: 'article-analizy.html', d: 'Белок, эритроциты, креатинин и СКФ без латыни.', k: 'анализ мочи креатинин скф белок эритроциты норма', p: 0 },
        { t: 'Сколько воды пить на самом деле', u: 'article-voda.html', d: 'Миф про два литра и понятные ориентиры.', k: 'вода литры жажда моча жидкость', p: 0 },
        { t: 'Соль, белок и повседневная еда', u: 'article-pitanie.html', d: 'Где скрытая соль и почему не нужны жёсткие диеты.', k: 'соль белок диета продукты еда', p: 0 },
        { t: 'Аптечка, которая не вредит почкам', u: 'article-lekarstva.html', d: 'Обезболивающие, травы и БАДы при долгом приёме.', k: 'лекарства аптечка нпвс травы бады безопасность', p: 0 },
        { t: 'Отёки по утрам', u: 'article-oteki.html', d: 'Когда виноваты почки, а когда — соль и недосып.', k: 'отёки под глазами почки сон давление', p: 0 },
        { t: '«Чистка почек» и БАДы', u: 'article-mify.html', d: 'Спокойный разбор популярных обещаний.', k: 'мифы чистка почек бады реклама', p: 0 },
        { t: 'Почему высокое давление бьёт по почкам', u: 'article-davlenie.html', d: 'Связь, которую не чувствуешь годами.', k: 'давление гипертония почки анализы', p: 0 },
        { t: 'Диабет и почки', u: 'article-diabet.html', d: 'Два анализа в год при сахарном диабете.', k: 'диабет сахар микроальбуминурия анализы', p: 0 },
        { t: 'Если у близких были болезни почек', u: 'article-nasledstvo.html', d: 'Наследственность — повод не откладывать чек-ап.', k: 'наследственность семья родственники поликистоз', p: 0 }
      ];

      var renderSearch = function () {
        var q = (searchInput.value || '').trim().toLowerCase();
        var words = q ? q.split(/\s+/) : [];
        var found = searchIndex.filter(function (item) {
          if (!words.length) return !!item.p;
          var hay = (item.t + ' ' + item.d + ' ' + item.k).toLowerCase();
          return words.every(function (w) { return hay.indexOf(w) > -1; });
        });
        if (searchCount) searchCount.textContent = q ? ('Найдено: ' + found.length) : 'Часто ищут:';
        if (!searchResults) return;
        if (!found.length) {
          searchResults.innerHTML = '<div class="product-empty is-visible">Ничего не нашлось. Попробуйте другое слово — например, «анализы», «диализ» или «льготы».</div>';
          return;
        }
        searchResults.innerHTML = found.map(function (item) {
          return '<a class="search-result" href="' + item.u + '">' +
            '<small>' + (item.u.indexOf('article-') === 0 ? 'Материал' : 'Раздел') + '</small>' +
            '<b>' + item.t + '</b><p>' + item.d + '</p></a>';
        }).join('');
      };

      searchForm.addEventListener('submit', function (e) {
        e.preventDefault();
        renderSearch();
      });
      if (searchInput) searchInput.addEventListener('input', renderSearch);
      renderSearch();
    }

  });
})();
