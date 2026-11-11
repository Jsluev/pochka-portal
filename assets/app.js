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
      '.hero-grid, .metro, .q3-grid, .stats-row';
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

  });
})();
