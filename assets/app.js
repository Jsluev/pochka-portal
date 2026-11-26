/* ============================================================
   «почка» — интерактив портала фонда «Настенька»
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

    /* ---------- Мобильное меню: пункты подраздела внутри бургера ---------- */
    var burger = document.getElementById('burger');
    var nav = document.getElementById('mainNav');
    if (burger && nav) {
      burger.setAttribute('aria-expanded', 'false');
      burger.setAttribute('aria-controls', 'mainNav');
      var burgerLabel = document.getElementById('burgerLabel');
      if (burgerLabel) {
        burgerLabel.addEventListener('click', function () { burger.click(); });
      }

      var subnav = document.querySelector('.subnav');
      if (subnav) {
        var label = subnav.querySelector('.subnav-label');
        var group = document.createElement('div');
        group.className = 'nav-subgroup';
        var groupLabel = document.createElement('div');
        groupLabel.className = 'nav-sublabel';
        groupLabel.textContent = label ? label.textContent : 'Разделы';
        group.appendChild(groupLabel);
        $$('.subnav-inner a', subnav).forEach(function (link) {
          group.appendChild(link.cloneNode(true));
        });
        nav.appendChild(group);
      }

      var setMenu = function (open) {
        nav.classList.toggle('is-open', open);
        burger.classList.toggle('is-open', open);
        burger.setAttribute('aria-expanded', open ? 'true' : 'false');
        burger.setAttribute('aria-label', open ? 'Закрыть меню' : 'Открыть меню');
      };

      burger.addEventListener('click', function () {
        setMenu(!nav.classList.contains('is-open'));
      });
      nav.addEventListener('click', function (e) {
        if (e.target.closest('a')) setMenu(false);
      });
      document.addEventListener('keydown', function (e) {
        if (e.key === 'Escape' && nav.classList.contains('is-open')) {
          setMenu(false);
          burger.focus();
        }
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

      var show = function (name, initial) {
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
        if (panel && !initial && window.innerWidth < 1080) {
          panel.scrollIntoView({ behavior: prefersReduced ? 'auto' : 'smooth', block: 'start' });
        }
      };

      buttons.forEach(function (btn) {
        btn.addEventListener('click', function () { show(btn.getAttribute('data-step')); });
      });
      $$('[data-go]', group).forEach(function (btn) {
        btn.addEventListener('click', function () { show(btn.getAttribute('data-go')); });
      });
      if (buttons.length) show(buttons[0].getAttribute('data-step'), true);
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
      var emptyDefault = emptyEl ? emptyEl.innerHTML : '';
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
        if (emptyEl) {
          emptyEl.classList.toggle('is-visible', shown === 0);
          if (shown === 0 && q && /057|направлен|инвалид/i.test(q)) {
            emptyEl.innerHTML = '<b>По этому запросу клиник нет.</b><br>' +
              'Откройте памятку по направлению 057/у: ' +
              '<a href="rights.html#057">что это и как получить</a>.';
          } else {
            emptyEl.innerHTML = emptyDefault;
          }
        }
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

    /* ---------- Карточка центра: подставляем сведения из каталога ---------- */
    var centerKey = new URLSearchParams(window.location.search).get('center');
    if (centerKey && document.getElementById('clinicTitle')) {
      var helpLabels = {
        diagnostic: 'Диагностика', dialysis: 'Диализ',
        transplant: 'Трансплантация', followup: 'Наблюдение'
      };
      var centers = {
        shumakov: {
          crumb: 'НМИЦ им. Шумакова',
          type: 'Федеральный центр', city: 'Москва',
          title: 'НМИЦ трансплантологии и искусственных органов им. акад. В. И. Шумакова',
          short: 'Один из центров, где выполняют пересадку почки детям: родственная и посмертная пересадка, лист ожидания, ведение после операции.',
          who: 'Дети с ХПН 4–5 стадии (трансплантация от 10 кг — уточняется)',
          regions: 'Вся Россия — по направлению (ОМС/ВМП)',
          consult: 'Есть: документы по почте, через сайт центра или через телемедицину «врач–врач».',
          help: ['diagnostic', 'transplant', 'followup'], moscow: true
        },
        nczd: {
          crumb: 'НМИЦ здоровья детей',
          type: 'Федеральный центр', city: 'Москва',
          title: 'НМИЦ здоровья детей',
          short: 'Диагностика редких заболеваний почек, диализ — в том числе детям от 3 кг, пересадка — включая детей массой менее 10 кг по показаниям.',
          who: 'Дети любого возраста, в том числе с массой тела от 3 кг',
          regions: 'Все регионы России',
          consult: 'Есть. Уточните способ подачи документов в центре.',
          help: ['diagnostic', 'dialysis', 'transplant', 'followup'], moscow: true
        },
        rdkb: {
          crumb: 'РДКБ им. Дмитрия Рогачёва',
          type: 'Федеральный центр', city: 'Москва',
          title: 'РДКБ — филиал НМИЦ ДГОИ им. Дмитрия Рогачёва',
          short: 'Нефрологическое отделение: ведение ХПН, диализ, подготовка к трансплантации и сопровождение после неё.',
          who: 'Дети всех возрастов',
          regions: 'Вся Россия — по направлению',
          consult: 'Есть. Уточните способ подачи документов в центре.',
          help: ['diagnostic', 'dialysis', 'transplant', 'followup'], moscow: true
        },
        filatov: {
          crumb: 'ДГКБ им. Н. Ф. Филатова',
          type: 'Городская больница', city: 'Москва',
          title: 'ДГКБ им. Н. Ф. Филатова',
          short: 'Детская клиника Москвы с отделением диализа: ведение детей с ХПН и подготовка к трансплантации.',
          who: 'Дети всех возрастов',
          regions: 'Москва; иногородние — по направлению',
          consult: 'Есть. Уточните способ подачи документов в центре.',
          help: ['diagnostic', 'dialysis', 'followup'], moscow: true
        },
        spb: {
          crumb: 'СПбГПМУ',
          type: 'Федеральный центр', city: 'Санкт-Петербург',
          title: 'СПбГПМУ (Педиатрический университет)',
          short: 'Детская нефрология, диализ и трансплантация почки. Один из шести центров детской трансплантации в России.',
          who: 'Дети всех возрастов',
          regions: 'СЗФО и вся Россия — по направлению',
          consult: 'Есть. Уточните способ подачи документов в центре.',
          help: ['diagnostic', 'dialysis', 'transplant', 'followup'], moscow: false
        },
        ekb: {
          crumb: 'ОДКБ № 1, Екатеринбург',
          type: 'Региональный центр', city: 'Екатеринбург',
          title: 'ОДКБ № 1, Екатеринбург',
          short: 'Нефрологическое отделение и гемодиализ детям в регионе. Наблюдение и подготовка к трансплантации — совместно с федеральными центрами.',
          who: 'Дети от 3 лет',
          regions: 'Уральский федеральный округ',
          consult: 'Уточняется.',
          help: ['diagnostic', 'dialysis', 'followup'], moscow: false
        }
      };
      var c = centers[centerKey];
      if (c) {
        var setText = function (id, text) {
          var el = document.getElementById(id);
          if (el) el.textContent = text;
        };
        setText('clinicCrumb', c.crumb);
        setText('clinicEyebrow', c.type + ' · ' + c.city);
        setText('clinicTitle', c.title);
        setText('clinicSub', c.short);
        setText('clinicWho', c.who);
        setText('clinicRegions', c.regions);
        setText('clinicConsult', c.consult);
        setText('clinicContactsLine', 'Вы смотрите: ' + c.title + '. Сведения карточки приведены по каталогу центров портала.');
        var chips = document.getElementById('clinicChips');
        if (chips) {
          chips.innerHTML = '<span class="tag">' + c.type + '</span>' +
            c.help.map(function (h) { return '<span class="tag tag-blue">' + helpLabels[h] + '</span>'; }).join('');
        }
        var helpEl = document.getElementById('clinicHelp');
        if (helpEl) {
          helpEl.innerHTML = c.help.map(function (h) { return '<span class="chip">' + helpLabels[h] + '</span>'; }).join('');
        }
        if (!c.moscow) {
          $$('[data-local="moscow"]').forEach(function (el) { el.hidden = true; });
          var quote = document.getElementById('clinicQuote');
          if (quote) quote.hidden = true;
          var localNote = document.getElementById('clinicLocalNote');
          if (localNote) localNote.hidden = false;
        }
      }
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
            var height = Number(document.getElementById('calcHeight').value);
            var crC = Number(document.getElementById('calcCrC').value);
            var unitC = document.getElementById('calcUnitC').value;
            if (unitC === 'umol') crC = crC / 88.4;
            if (childAge < 0 || !height || height <= 0 || !crC || crC <= 0) ok = false;
            if (ok) {
              gfr = 0.413 * height / crC;
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
          var code = rounded >= 90 ? 'G1' : rounded >= 60 ? 'G2' : rounded >= 45 ? 'G3a' :
                     rounded >= 30 ? 'G3b' : rounded >= 15 ? 'G4' : 'G5';
          var gLabel = calcMode === 'adult' ? code + ', ' : '';
          if (rounded > 150) {
            cls = 'green';
            title = 'СКФ ≈ 150 или выше' + (calcMode === 'adult' ? ' · ' + code : '');
            note = 'У детей результат особенно ориентировочный: врач смотрит не только на цифру, но и на рост, анализы мочи и давление.';
          } else if (rounded >= 90) {
            cls = 'green';
            title = 'СКФ ≈ ' + rounded + ' — ' + gLabel + 'обычный диапазон';
            note = 'Это ориентир. Если есть факторы риска, обсудите с врачом, какие анализы и как часто сдавать.';
          } else if (rounded >= 60) {
            cls = 'yellow';
            title = 'СКФ ≈ ' + rounded + ' — ' + gLabel + 'лёгкое снижение';
            note = 'Само по себе это не болезнь. Контроль не реже 1 раза в год: моча, креатинин с СКФ и давление; при диабете — микроальбуминурия. Покажите результат врачу.';
          } else if (rounded >= 45) {
            cls = 'yellow';
            title = 'СКФ ≈ ' + rounded + ' — ' + gLabel + 'умеренное снижение';
            note = 'Покажите результат врачу и обсудите план наблюдения: при G3a его обычно проверяют около 2 раз в год.';
          } else if (rounded >= 30) {
            cls = 'yellow';
            title = 'СКФ ≈ ' + rounded + ' — ' + gLabel + 'выраженное снижение';
            note = 'Нужен план ведения с врачом: при G3b контроль обычно около 3 раз в год.';
          } else if (rounded >= 15) {
            cls = 'red';
            title = 'СКФ ≈ ' + rounded + ' — ' + gLabel + 'тяжёлое снижение';
            note = 'Обсудите с врачом план лечения: при G4 контроль обычно около 4 раз в год.';
          } else {
            cls = 'red';
            title = 'СКФ ≈ ' + rounded + ' — ' + gLabel + 'терминальная стадия';
            note = 'Один расчёт не ставит диагноз, но такой результат стоит обсудить с врачом как можно скорее.';
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
        if (riskHint) riskHint.textContent = 'Можно менять ответы — результат появится после нажатия кнопки.';
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
          if (riskHint) riskHint.textContent = 'Баллы: ' + score + ' из 7. 3 и более — повод обсудить анализы с врачом. Это ориентир, а не диагноз.';
        });
      }
    }

    /* ---------- Архив материалов: темы и поиск по названию ---------- */
    var archive = document.querySelector('[data-archive]');
    if (archive) {
      var archItems = $$('[data-archive-item]', archive);
      var archChips = $$('[data-archive-tag]', archive);
      var archInput = archive.querySelector('[data-archive-search]');
      var archCount = archive.querySelector('[data-archive-count]');
      var archEmpty = archive.querySelector('[data-archive-empty]');
      var archReset = archive.querySelector('[data-archive-reset]');
      var activeTag = 'all';
      var applyArchive = function () {
        var q = (archInput ? archInput.value : '').trim().toLowerCase();
        var shown = 0;
        archItems.forEach(function (item) {
          var tags = (item.getAttribute('data-tags') || '').split(' ');
          var text = (item.textContent || '').toLowerCase();
          var byTag = activeTag === 'all' || tags.indexOf(activeTag) !== -1;
          var byText = !q || text.indexOf(q) !== -1;
          var visible = byTag && byText;
          item.hidden = !visible;
          if (visible) shown++;
        });
        if (archCount) archCount.textContent = 'Показано: ' + shown + ' из ' + archItems.length;
        if (archEmpty) archEmpty.hidden = shown !== 0;
      };
      archChips.forEach(function (chip) {
        chip.addEventListener('click', function () {
          activeTag = chip.getAttribute('data-archive-tag') || 'all';
          archChips.forEach(function (c) {
            var on = c === chip;
            c.classList.toggle('is-active', on);
            c.setAttribute('aria-pressed', on ? 'true' : 'false');
          });
          applyArchive();
        });
      });
      if (archInput) archInput.addEventListener('input', applyArchive);
      if (archReset) {
        archReset.addEventListener('click', function () {
          if (archInput) archInput.value = '';
          activeTag = 'all';
          archChips.forEach(function (chip) {
            var on = chip.getAttribute('data-archive-tag') === 'all';
            chip.classList.toggle('is-active', on);
            chip.setAttribute('aria-pressed', on ? 'true' : 'false');
          });
          applyArchive();
        });
      }
      applyArchive();
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
        { t: 'Ребёнок с ХПН', u: 'parents.html', d: 'Маршруты, клиники, документы и поддержка семей, где ребёнок с ХПН.', k: 'ребёнок хпн дети родители маршрут помощь', p: 1 },
        { t: 'Сервисы', u: 'services.html', d: 'Калькулятор СКФ, тест рисков и справочник продуктов.', k: 'скф калькулятор тест продукты калий фосфор белок сервисы', p: 1 },
        { t: 'Каталог учреждений', u: 'clinics.html', d: 'Профильные центры, фильтры по городу, возрасту и помощи.', k: 'клиника центр учреждение город найти трансплантация диализ', p: 1 },
        { t: 'Маршруты получения помощи', u: 'routes.html', d: 'Пошаговые маршруты от диагноза до лечения.', k: 'маршрут этапы диагноз направление лечение', p: 1 },
        { t: 'Права и документы', u: 'rights.html', d: '057/у, ВМП, инвалидность, лекарства, проезд и жильё.', k: '057у справка вмп инвалидность льготы документы проезд', p: 1 },
        { t: 'Знания: обзор', u: 'knowledge.html', d: 'Указатель справочных страниц о здоровье почек.', k: 'знания справочник почки', p: 1 },
        { t: 'Диагнозы и состояния', u: 'knowledge-diagnoses.html', d: 'ХПН, острые состояния, гломерулярные болезни, аномалии.', k: 'диагноз хпн нефрит поликистоз рефлюкс', p: 0 },
        { t: 'Стадии ХПН', u: 'knowledge-stages.html', d: 'Категории СКФ и альбуминурии.', k: 'стадии скф альбуминурия г стадия обе цифры две цифры вторая цифра', p: 0 },
        { t: 'Питание при ХПН', u: 'knowledge-nutrition.html', d: 'Соль, белок, калий и фосфор без жёстких диет без врача.', k: 'питание соль белок калий фосфор диета', p: 0 },
        { t: 'Образ жизни', u: 'knowledge-lifestyle.html', d: 'Давление, вода, сон, лекарства и нагрузка.', k: 'вода давление сон лекарства нагрузка привычки', p: 0 },
        { t: 'Диализ', u: 'knowledge-dialysis.html', d: 'Гемодиализ и перитонеальный диализ, подготовка и жизнь на лечении.', k: 'диализ гемодиализ перитонеальный фистула катетер', p: 0 },
        { t: 'Трансплантация почки', u: 'knowledge-transplant.html', d: 'Обследование, лист ожидания, операция и наблюдение после.', k: 'трансплантация пересадка донор иммуносупрессия отторжение', p: 0 },
        { t: 'Как мы проверяем данные', u: 'knowledge-checks.html', d: 'Редакционный процесс и обновление материалов.', k: 'проверка редакция врач источники дата', p: 0 },
        { t: 'Врачам', u: 'doctors.html', d: 'Справочники, чек-листы и памятки для нефрологов и педиатров.', k: 'врач нефролог педиатр чек-лист справочник', p: 1 },
        { t: 'Врачам: справочник', u: 'doctors-reference.html', d: 'Стадии, альбуминурия, критерии направления и базовые ориентиры.', k: 'скф альбуминурия направление врач референс', p: 0 },
        { t: 'Врачам: мониторинг', u: 'doctors-monitoring.html', d: 'Частота наблюдения и перечень контроля.', k: 'мониторинг анализы частота наблюдение', p: 0 },
        { t: 'Врачам: дети', u: 'doctors-pediatric.html', d: 'Рост, питание, врождённые аномалии и подготовка к переходу.', k: 'дети рост питание аномалии педиатрия', p: 0 },
        { t: 'Врачам: неотложные состояния', u: 'doctors-urgent.html', d: 'Красные флаги и порядок действий.', k: 'неотложные красные флаги калий отёк', p: 0 },
        { t: 'Врачам: переход', u: 'doctors-transition.html', d: 'Перевод пациента из педиатрии во взрослую сеть.', k: 'переход преемственность взрослая сеть 18 взрослый пациент', p: 0 },
        { t: 'Врачам: памятки', u: 'doctors-tools.html', d: 'Шаблоны и чек-листы для приёма и сопровождения.', k: 'памятка чек-лист шаблон анкета', p: 0 },
        { t: 'Материалы', u: 'materials.html', d: 'Свежие материалы проекта с датами и темами.', k: 'материалы лента заметки свежее', p: 1 },
        { t: 'Материалы: архив', u: 'materials-archive.html', d: 'Все материалы с фильтром по темам и поиском.', k: 'архив материалы теги тема поиск', p: 0 },
        { t: 'Сообщество', u: 'community.html', d: 'Чат «Пересадка», психологи, истории семей и помощь фонда.', k: 'сообщество чат пересадка психолог история фонд', p: 0 },
        { t: 'О проекте', u: 'about.html', d: 'Кто делает портал и как проверяются материалы.', k: 'фонд настенька редакция эксперты доверие', p: 0 },
        { t: 'Что смотреть в анализе мочи и креатинине', u: 'article-analizy.html', d: 'Белок, эритроциты, креатинин и СКФ без латыни.', k: 'анализ мочи креатинин скф белок эритроциты норма белок в моче протеинурия микроальбуминурия взрослый', p: 0 },
        { t: 'Сколько воды пить на самом деле', u: 'article-voda.html', d: 'Миф про два литра и понятные ориентиры.', k: 'вода литры жажда моча жидкость', p: 0 },
        { t: 'Соль, белок и повседневная еда', u: 'article-pitanie.html', d: 'Где скрытая соль и почему не нужны жёсткие диеты.', k: 'соль белок диета продукты еда питание', p: 0 },
        { t: 'Аптечка, которая не вредит почкам', u: 'article-lekarstva.html', d: 'Обезболивающие, травы и БАДы при долгом приёме.', k: 'лекарства аптечка нпвс травы бады безопасность', p: 0 },
        { t: 'Отёки по утрам', u: 'article-oteki.html', d: 'Когда виноваты почки, а когда — соль и недосып.', k: 'отёки под глазами почки сон давление', p: 0 },
        { t: '«Чистка почек» и БАДы', u: 'article-mify.html', d: 'Спокойный разбор популярных обещаний.', k: 'мифы чистка почек бады реклама', p: 0 },
        { t: 'Почему высокое давление бьёт по почкам', u: 'article-davlenie.html', d: 'Связь, которую не чувствуешь годами.', k: 'давление гипертония почки анализы', p: 0 },
        { t: 'Диабет и почки', u: 'article-diabet.html', d: 'Два анализа в год при сахарном диабете.', k: 'диабет сахар микроальбуминурия анализы', p: 0 },
        { t: 'Если у близких были болезни почек', u: 'article-nasledstvo.html', d: 'Наследственность — повод не откладывать чек-ап.', k: 'наследственность семья родственники поликистоз', p: 0 }
      ];

      var stem = function (w) {
        w = w.toLowerCase().replace(/ё/g, 'е');
        if (w.length > 3) w = w.replace(/(ами|ями|ов|ев|ом|ем|ах|ях|у|ю|а|я|и|е|ы|ь)$/, '');
        return w;
      };
      var stopWords = { 'в': 1, 'и': 1, 'на': 1, 'с': 1, 'по': 1, 'для': 1, 'как': 1, 'что': 1, 'или': 1, 'из': 1, 'у': 1, 'же': 1 };
      var tokens = function (text) {
        return (text || '').toLowerCase().replace(/ё/g, 'е')
          .replace(/[\/\\.,;:()\-+]+/g, ' ')
          .split(/\s+/).map(stem)
          .filter(function (w) { return w.length > 1 && !stopWords[w]; });
      };
      searchIndex.forEach(function (item) {
        item._words = tokens(item.t + ' ' + item.d + ' ' + item.k);
      });

      var renderSearch = function () {
        var q = (searchInput.value || '').trim();
        var words = tokens(q);
        var found = searchIndex.filter(function (item) {
          if (!words.length) return !!item.p;
          return words.every(function (w) { return item._words.indexOf(w) > -1; });
        });
        found.sort(function (a, b) {
          var score = function (item) {
            var s = item.p === 0 ? 2 : 0;
            if (item.u.indexOf('article-') === 0 ||
                (item.u.indexOf('knowledge-') === 0 && item.u !== 'knowledge.html')) s += 1;
            if (words.length && tokens(item.t).indexOf(words[0]) > -1) s += 3;
            return s;
          };
          return score(b) - score(a);
        });
        if (searchCount) searchCount.textContent = q ? ('Найдено: ' + found.length) : 'Часто ищут:';
        if (!searchResults) return;
        if (!found.length) {
          searchResults.innerHTML = '<div class="product-empty is-visible">Ничего не нашлось. ' +
            'Попробуйте другое слово — например, «анализы», «диализ» или «льготы». ' +
            'Если ищете направление 057/у, откройте <a href="rights.html#057">памятку по 057/у</a>.</div>';
          return;
        }
        searchResults.innerHTML = found.map(function (item) {
          var isMaterial = item.u.indexOf('article-') === 0 ||
            (item.u.indexOf('knowledge-') === 0 && item.u !== 'knowledge.html');
          return '<a class="search-result" href="' + item.u + '">' +
            '<small>' + (isMaterial ? 'Материал' : 'Раздел') + '</small>' +
            '<b>' + item.t + '</b><p>' + item.d + '</p></a>';
        }).join('');
      };

      var fromUrl = new URLSearchParams(window.location.search).get('q');
      if (fromUrl && searchInput) searchInput.value = fromUrl;
      searchForm.addEventListener('submit', function (e) {
        e.preventDefault();
        var q = (searchInput.value || '').trim();
        if (window.history && window.history.replaceState) {
          window.history.replaceState(null, '', window.location.pathname + (q ? '?q=' + encodeURIComponent(q) : ''));
        }
        renderSearch();
      });
      if (searchInput) searchInput.addEventListener('input', renderSearch);
      renderSearch();
    }

  });
})();
