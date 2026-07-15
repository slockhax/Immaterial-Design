/* ============================================================
   IMMATERIAL DESIGN SYSTEM — behaviour layer
   Vanilla JS. No dependencies. ~5 KB.
   Auto-initialises on DOMContentLoaded and exposes `window.Immaterial`.
   Only covers behaviours that pure CSS cannot express:
     · menus (split button / dropdowns)   · dialogs
     · toasts (snackbars)                  · sliders
     · tabs (panel switching)              · theme control
   ============================================================ */
(function (global) {
  'use strict';

  /* ---------- helpers ---------- */
  var $  = function (sel, root) { return (root || document).querySelector(sel); };
  var $$ = function (sel, root) { return Array.prototype.slice.call((root || document).querySelectorAll(sel)); };

  /* ========================================================
     MENUS  —  <div data-menu-wrap>
                 <button data-menu-toggle>…</button>
                 <div class="menu" hidden>…</div>
               </div>
     The toggle opens the sibling .menu inside [data-menu-wrap].
     Clicking a .menu__item, clicking outside, or Esc closes it.
     ======================================================== */
  function closeAllMenus() { $$('.menu').forEach(function (m) { m.setAttribute('hidden', ''); }); }

  document.addEventListener('click', function (e) {
    var toggle = e.target.closest('[data-menu-toggle]');
    if (toggle) {
      var wrap = toggle.closest('[data-menu-wrap]') || toggle.parentElement;
      var menu = wrap && wrap.querySelector('.menu');
      if (menu) {
        var willOpen = menu.hasAttribute('hidden');
        closeAllMenus();
        if (willOpen) menu.removeAttribute('hidden');
        e.stopPropagation();
        return;
      }
    }
    if (e.target.closest('.menu__item')) { closeAllMenus(); return; }
    if (!e.target.closest('.menu')) closeAllMenus();
  });

  /* ========================================================
     DIALOGS  —  trigger:  [data-dialog-open="ID"]
                 dialog:   <div class="dialog-scrim" id="ID" hidden>…</div>
                 close:    [data-dialog-close] · click scrim · Esc
     ======================================================== */
  function openDialog(id) {
    var el = typeof id === 'string' ? document.getElementById(id) : id;
    if (el) el.removeAttribute('hidden');
    return el;
  }
  function closeDialog(el) {
    if (typeof el === 'string') el = document.getElementById(el);
    if (el) el.setAttribute('hidden', '');
  }
  function closeAllDialogs() { $$('.dialog-scrim:not([hidden])').forEach(function (d) { d.setAttribute('hidden', ''); }); }

  document.addEventListener('click', function (e) {
    var opener = e.target.closest('[data-dialog-open]');
    if (opener) { openDialog(opener.getAttribute('data-dialog-open')); return; }

    if (e.target.closest('[data-dialog-close]')) {
      var scrim = e.target.closest('.dialog-scrim');
      if (scrim) closeDialog(scrim);
      return;
    }
    /* click on the scrim itself (not the dialog card) closes */
    if (e.target.classList.contains('dialog-scrim')) closeDialog(e.target);
  });

  /* ========================================================
     TOASTS  —  Immaterial.toast(message, { actionLabel, onAction, duration })
                Returns a dismiss() function. Duration 0 = sticky.
     ======================================================== */
  function ensureHost() {
    var host = $('.snackbar-host');
    if (!host) { host = document.createElement('div'); host.className = 'snackbar-host'; document.body.appendChild(host); }
    return host;
  }
  function toast(message, opts) {
    opts = opts || {};
    var host = ensureHost();
    var bar = document.createElement('div');
    bar.className = 'snackbar';
    var text = document.createElement('span');
    text.textContent = message;
    bar.appendChild(text);

    function dismiss() {
      if (!bar.parentNode) return;
      bar.classList.add('is-leaving');
      bar.addEventListener('animationend', function () { if (bar.parentNode) bar.parentNode.removeChild(bar); }, { once: true });
    }

    if (opts.actionLabel) {
      var btn = document.createElement('button');
      btn.className = 'snackbar__action';
      btn.textContent = opts.actionLabel;
      btn.addEventListener('click', function () { if (opts.onAction) opts.onAction(); dismiss(); });
      bar.appendChild(btn);
    }
    host.appendChild(bar);

    var ms = opts.duration === undefined ? 4500 : opts.duration;
    if (ms > 0) setTimeout(dismiss, ms);
    return dismiss;
  }

  /* ========================================================
     SLIDERS  —  <div class="slider" data-slider
                      data-min="1" data-max="8" data-step="1" data-value="3"
                      data-output="#dur" data-suffix=" h">
                   <div class="slider__track"></div>
                   <div class="slider__fill"></div>
                   <div class="slider__thumb"></div>
                 </div>
     Fires a 'change' CustomEvent (detail:{value}) on the .slider element.
     Optional data-output = selector whose textContent shows the value.
     ======================================================== */
  function initSlider(el) {
    var min  = parseFloat(el.dataset.min  || '0');
    var max  = parseFloat(el.dataset.max  || '100');
    var step = parseFloat(el.dataset.step || '1');
    var value = clamp(parseFloat(el.dataset.value || min), min, max);
    var fill  = el.querySelector('.slider__fill');
    var thumb = el.querySelector('.slider__thumb');
    var output = el.dataset.output ? $(el.dataset.output) : null;
    var suffix = el.dataset.suffix || '';

    el.setAttribute('tabindex', '0');
    el.setAttribute('role', 'slider');

    function clamp(v, lo, hi) { return Math.min(hi, Math.max(lo, v)); }
    function render() {
      var pct = (value - min) / (max - min) * 100;
      if (fill)  fill.style.width = pct + '%';
      if (thumb) thumb.style.left = pct + '%';
      el.setAttribute('aria-valuemin', min);
      el.setAttribute('aria-valuemax', max);
      el.setAttribute('aria-valuenow', value);
      if (output) output.textContent = value + suffix;
    }
    function set(v) {
      v = clamp(Math.round((v - min) / step) * step + min, min, max);
      if (v !== value) { value = v; render(); el.dispatchEvent(new CustomEvent('change', { detail: { value: value } })); }
      else { render(); }
    }
    function fromX(clientX) {
      var r = el.getBoundingClientRect();
      set(min + clamp((clientX - r.left) / r.width, 0, 1) * (max - min));
    }

    el.addEventListener('pointerdown', function (e) {
      fromX(e.clientX);
      function move(ev) { fromX(ev.clientX); }
      function up() { window.removeEventListener('pointermove', move); window.removeEventListener('pointerup', up); }
      window.addEventListener('pointermove', move);
      window.addEventListener('pointerup', up);
    });
    el.addEventListener('keydown', function (e) {
      if (e.key === 'ArrowRight' || e.key === 'ArrowUp')   { set(value + step); e.preventDefault(); }
      if (e.key === 'ArrowLeft'  || e.key === 'ArrowDown') { set(value - step); e.preventDefault(); }
      if (e.key === 'Home') { set(min); e.preventDefault(); }
      if (e.key === 'End')  { set(max); e.preventDefault(); }
    });

    render();
    el._imSlider = { get: function () { return value; }, set: set };
  }
  // clamp used inside initSlider is a nested declaration; expose top-level too
  function clamp(v, lo, hi) { return Math.min(hi, Math.max(lo, v)); }

  /* ========================================================
     TABS  —  <div class="tabs" data-tabs>
                <button class="tab is-active" data-tab="a">One</button>
                <button class="tab"           data-tab="b">Two</button>
              </div>
              <div class="tab-panel" data-tab-panel="a">…</div>
              <div class="tab-panel" data-tab-panel="b" hidden>…</div>
     Panels are optional (a filter bar can have none).
     Fires 'tabchange' (detail:{tab}) on the [data-tabs] element.
     ======================================================== */
  function initTabs(group) {
    var tabs = $$('.tab', group);
    tabs.forEach(function (tab) {
      tab.addEventListener('click', function () {
        tabs.forEach(function (t) { t.classList.remove('is-active'); });
        tab.classList.add('is-active');
        var name = tab.getAttribute('data-tab');
        // scope panels to the nearest common ancestor if present
        var scope = group.closest('[data-tabs-scope]') || document;
        $$('[data-tab-panel]', scope).forEach(function (p) {
          p.hidden = p.getAttribute('data-tab-panel') !== name;
        });
        group.dispatchEvent(new CustomEvent('tabchange', { detail: { tab: name } }));
      });
    });
  }

  /* ========================================================
     TABLE GROUPS  —  collapsible group rows (delegated, no init)
     <tr class="table__group table__group--collapsible">
       <th colspan="N"><button class="table__group-toggle">
         <span class="icon">expand_more</span>Label</button></th></tr>
     Toggling hides following rows until the next .table__group.
     ======================================================== */
  document.addEventListener('click', function (e) {
    var btn = e.target.closest('.table__group-toggle');
    if (!btn) return;
    var groupRow = btn.closest('tr');
    if (!groupRow) return;
    var collapsed = groupRow.classList.toggle('is-collapsed');
    var r = groupRow.nextElementSibling;
    while (r && !r.classList.contains('table__group')) {
      r.classList.toggle('is-hidden-by-group', collapsed);
      r = r.nextElementSibling;
    }
  });

  /* ========================================================
     THEME  —  Immaterial.setTheme('light' | 'dark' | 'auto')
     ======================================================== */
  function setTheme(mode) {
    var root = document.documentElement;
    if (mode === 'auto') root.removeAttribute('data-theme');
    else root.setAttribute('data-theme', mode);
    try { localStorage.setItem('im-theme', mode); } catch (e) {}
  }
  function initTheme() {
    var saved;
    try { saved = localStorage.getItem('im-theme'); } catch (e) {}
    if (saved && saved !== 'auto') document.documentElement.setAttribute('data-theme', saved);
  }

  /* ---------- global Esc handler ---------- */
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape') { closeAllMenus(); closeAllDialogs(); }
  });

  /* ---------- auto-init ---------- */
  function init(root) {
    $$('[data-slider]', root || document).forEach(function (el) { if (!el._imSlider) initSlider(el); });
    $$('[data-tabs]',   root || document).forEach(function (el) { if (!el._imTabs)   { el._imTabs = true; initTabs(el); } });
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', function () { initTheme(); init(); });
  else { initTheme(); init(); }

  /* ---------- public API ---------- */
  global.Immaterial = {
    toast: toast,
    openDialog: openDialog,
    closeDialog: closeDialog,
    setTheme: setTheme,
    init: init            // call after injecting markup dynamically
  };
})(window);
