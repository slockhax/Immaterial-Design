/* ============================================================
   IMMATERIAL DESIGN SYSTEM — behaviour layer
   Vanilla JS. No dependencies. ~5 KB.
   Auto-initialises on DOMContentLoaded and exposes `window.Immaterial`.
   Only covers behaviours that pure CSS cannot express:
     · menus (dropdowns / deferred filter popovers) · dialogs
     · toasts (snackbars)                  · sliders
     · tabs (panel switching)              · theme + intensity control
     · comboboxes (filter, keyboard, chips)
     · inline edit (table cells, props)  · property panel show-more
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
    var clear = e.target.closest('[data-menu-clear]');
    if (clear) {
      $$('input[type="checkbox"]', clear.closest('.menu')).forEach(function (c) { c.checked = false; });
      return;
    }
    var apply = e.target.closest('[data-menu-apply]');
    if (apply) {
      var dMenu = apply.closest('.menu');
      var values = $$('input[type="checkbox"]:checked', dMenu).map(function (c) { return c.value; });
      dMenu.setAttribute('hidden', '');
      dMenu.dispatchEvent(new CustomEvent('menuapply', { detail: { values: values }, bubbles: true }));
      return;
    }
    /* deferred menus stay open on inner clicks — commit only via Apply */
    if (e.target.closest('.menu--deferred')) return;
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
     COMBOBOX  —  <div class="combobox [combobox--multi]" data-combobox>
                    <div class="field field--block combobox__field">
                      <input class="field__input combobox__input">
                      <span class="icon combobox__caret">arrow_drop_down</span>
                    </div>
                    <div class="combobox__list" hidden>
                      <div class="combobox__option" data-value="a">
                        <span class="combobox__label">Alpha</span></div>
                      …
                    </div>
                  </div>
     Type to filter (matches highlighted), arrows + Enter to pick, Esc to
     close. Single: picking fills the input and closes. Multi: picking
     toggles a chip in the field and keeps the list open; Backspace on an
     empty input removes the last chip. Options marked aria-selected="true"
     start selected. Optional [data-combobox-create] row offers the query
     as a new option. Fires 'comboboxchange' (detail: {value,label} or
     {values}) and 'comboboxcreate' (detail: {value, option}).
     ======================================================== */
  var cbSeq = 0;
  function initCombobox(el) {
    var multi = el.classList.contains('combobox--multi');
    var input = $('.combobox__input', el);
    var list  = $('.combobox__list', el);
    if (!input || !list) return;
    var field     = $('.combobox__field', el) || input.parentElement;
    var clearBtn  = $('.combobox__clear', el);
    var createRow = $('[data-combobox-create]', list);
    var divider   = $('.combobox__divider', list);
    var empty     = $('.combobox__empty', list);
    var active = null, typed = false;

    if (!list.id) list.id = 'im-cb-' + (++cbSeq);
    input.setAttribute('role', 'combobox');
    input.setAttribute('aria-autocomplete', 'list');
    input.setAttribute('aria-controls', list.id);
    input.setAttribute('aria-expanded', 'false');
    input.setAttribute('autocomplete', 'off');
    list.setAttribute('role', 'listbox');
    if (multi) list.setAttribute('aria-multiselectable', 'true');
    list.hidden = true;

    function options() { return $$('.combobox__option', list); }
    function labelOf(o) {
      if (o._imLabel == null) o._imLabel = ($('.combobox__label', o) || o).textContent.trim();
      return o._imLabel;
    }
    function valueOf(o) { return o.hasAttribute('data-value') ? o.getAttribute('data-value') : labelOf(o); }
    function isSel(o) { return o.getAttribute('aria-selected') === 'true'; }
    function prep(o) {
      if (!o.id) o.id = list.id + '-o' + (++cbSeq);
      o.setAttribute('role', 'option');
      if (o !== createRow && !o.hasAttribute('aria-selected')) o.setAttribute('aria-selected', 'false');
      if (o !== createRow) labelOf(o);
    }
    function highlight(o, q) {
      var l = $('.combobox__label', o);
      if (!l) return;
      var text = labelOf(o), i = q ? text.toLowerCase().indexOf(q.toLowerCase()) : -1;
      l.textContent = '';
      if (i < 0) { l.textContent = text; return; }
      var m = document.createElement('mark');
      m.className = 'combobox__match';
      m.textContent = text.slice(i, i + q.length);
      l.appendChild(document.createTextNode(text.slice(0, i)));
      l.appendChild(m);
      l.appendChild(document.createTextNode(text.slice(i + q.length)));
    }
    function visible() {
      var v = options().filter(function (o) { return !o.hidden; });
      if (createRow && !createRow.hidden) v.push(createRow);
      return v;
    }
    function setActive(o, scroll) {
      if (active) active.classList.remove('is-active');
      active = o || null;
      if (active) {
        active.classList.add('is-active');
        input.setAttribute('aria-activedescendant', active.id);
        if (scroll) active.scrollIntoView({ block: 'nearest' });
      } else input.removeAttribute('aria-activedescendant');
    }
    function filter() {
      var q = typed ? input.value.trim() : '', ql = q.toLowerCase(), any = false, exact = false;
      options().forEach(function (o) {
        var t = labelOf(o).toLowerCase(), show = !ql || t.indexOf(ql) > -1;
        o.hidden = !show;
        if (show) any = true;
        if (ql && t === ql) exact = true;
        highlight(o, show ? q : '');
      });
      if (createRow) {
        createRow.hidden = !q || exact;
        var cl = $('.combobox__create-label', createRow);
        if (cl) cl.textContent = q;
      }
      if (divider) divider.hidden = !createRow || createRow.hidden || !any;
      if (empty) empty.hidden = any || !!(createRow && !createRow.hidden);
      var vis = visible();
      setActive(vis.indexOf(active) > -1 ? active : (typed ? vis[0] : null));
    }
    function syncClear() { if (clearBtn) clearBtn.hidden = !input.value; }
    function syncInput() {
      var s = options().filter(isSel)[0];
      input.value = s ? labelOf(s) : '';
      syncClear();
    }
    function open() {
      if (!list.hidden) return;
      list.hidden = false;
      el.classList.add('is-open');
      input.setAttribute('aria-expanded', 'true');
      filter();
    }
    function close() {
      list.hidden = true;
      el.classList.remove('is-open');
      input.setAttribute('aria-expanded', 'false');
      setActive(null);
      typed = false;
      if (multi) input.value = ''; else syncInput();
    }
    function emit() {
      var sel = options().filter(isSel);
      var detail = multi
        ? { values: sel.map(valueOf) }
        : { value: sel[0] ? valueOf(sel[0]) : null, label: sel[0] ? labelOf(sel[0]) : '' };
      el.dispatchEvent(new CustomEvent('comboboxchange', { detail: detail, bubbles: true }));
    }
    function chipFor(o) {
      var c = document.createElement('span');
      c.className = 'chip chip--input';
      c._imOption = o;
      c.appendChild(document.createTextNode(labelOf(o)));
      var b = document.createElement('button');
      b.type = 'button';
      b.className = 'chip__remove';
      b.tabIndex = -1;
      b.setAttribute('aria-label', 'Remove ' + labelOf(o));
      var i = document.createElement('span');
      i.className = 'icon';
      i.textContent = 'close';
      b.appendChild(i);
      c.appendChild(b);
      field.insertBefore(c, input);
      return c;
    }
    function setSel(o, on) {
      o.setAttribute('aria-selected', on ? 'true' : 'false');
      if (!multi) return;
      if (on && !o._imChip) o._imChip = chipFor(o);
      if (!on && o._imChip) { o._imChip.remove(); o._imChip = null; }
    }
    function createOption(q) {
      var o = document.createElement('div');
      o.className = 'combobox__option';
      o.setAttribute('data-value', q);
      var l = document.createElement('span');
      l.className = 'combobox__label';
      l.textContent = q;
      o.appendChild(l);
      list.insertBefore(o, divider || createRow);
      prep(o);
      return o;
    }
    function choose(o) {
      if (o === createRow) {
        o = createOption(input.value.trim());
        el.dispatchEvent(new CustomEvent('comboboxcreate', { detail: { value: valueOf(o), option: o }, bubbles: true }));
      }
      if (multi) {
        setSel(o, !isSel(o));
        input.value = '';
        typed = false;
        filter();
        input.focus();
      } else {
        options().forEach(function (x) { if (x !== o) setSel(x, false); });
        setSel(o, true);
        close();
      }
      emit();
    }

    options().forEach(prep);
    if (createRow) prep(createRow);
    var initial = options().filter(isSel);
    if (!multi) initial = initial.slice(0, 1);
    options().forEach(function (o) { setSel(o, initial.indexOf(o) > -1); });
    if (!multi) syncInput();

    input.addEventListener('input', function () { typed = true; open(); filter(); syncClear(); });
    input.addEventListener('keydown', function (e) {
      var vis = visible(), i = vis.indexOf(active);
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        if (list.hidden) open(); else setActive(vis[Math.min(i + 1, vis.length - 1)], true);
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        if (!list.hidden) setActive(vis[Math.max(i - 1, 0)], true);
      } else if (e.key === 'Enter') {
        if (!list.hidden && active) { e.preventDefault(); choose(active); }
      } else if (e.key === 'Escape') {
        if (!list.hidden) { e.stopPropagation(); close(); }
      } else if (e.key === 'Backspace' && multi && !input.value) {
        var chips = $$('.chip--input', field), last = chips[chips.length - 1];
        if (last && last._imOption) { setSel(last._imOption, false); filter(); emit(); }
      }
    });
    field.addEventListener('click', function (e) {
      var rm = e.target.closest('.chip__remove');
      if (rm) {
        var chip = rm.closest('.chip--input');
        if (chip && chip._imOption) { setSel(chip._imOption, false); filter(); emit(); }
        input.focus();
        return;
      }
      if (e.target.closest('.combobox__clear')) {
        options().forEach(function (o) { setSel(o, false); });
        input.value = '';
        typed = false;
        syncClear();
        filter();
        emit();
        input.focus();
        return;
      }
      if (e.target.closest('.combobox__caret') && !list.hidden) { close(); return; }
      input.focus();
      open();
    });
    field.addEventListener('mousedown', function (e) { if (e.target !== input) e.preventDefault(); });
    list.addEventListener('mousedown', function (e) { e.preventDefault(); });   // keep focus in the input
    list.addEventListener('mousemove', function (e) {
      var o = e.target.closest('.combobox__option, [data-combobox-create]');
      if (o && o !== active) setActive(o);
    });
    list.addEventListener('click', function (e) {
      var o = e.target.closest('.combobox__option, [data-combobox-create]');
      if (o) choose(o);
    });
    el.addEventListener('focusout', function (e) {
      if (!el.contains(e.relatedTarget) && !list.hidden) close();
    });
  }

  /* ========================================================
     INLINE EDIT  —  delegated, no init. Works in table cells and
     property panels:
       <div class="inline-edit" data-inline-edit>
         <button class="inline-edit__display" type="button">
           <span class="inline-edit__value">12</span><span class="icon">edit</span></button>
         <input class="inline-edit__input" type="number" min="0" aria-label="Hours" hidden>
       </div>
     Click (or Enter on the focused value) to edit; Enter / blur saves,
     Esc cancels. A <select> editor saves on change. Native validation
     (required, min, pattern…) runs first; data-error overrides the
     message. Optional data-value holds the raw value when the shown
     text differs (e.g. a select's option value).
     Fires 'inlineedit' (detail: {value, previous, element, waitUntil}).
     Pass a promise to waitUntil() to show Saving… → Saved; reject it
     (with a message or Error) to restore the old value and show the
     error in the cell. Without waitUntil the edit counts as saved.
     ======================================================== */
  function ieParts(w) {
    return { display: $('.inline-edit__display', w), value: $('.inline-edit__value', w), input: $('.inline-edit__input', w) };
  }
  function ieRaw(w, p) { return w.hasAttribute('data-value') ? w.getAttribute('data-value') : p.value.textContent.trim(); }
  function ieText(input) {
    if (input.tagName === 'SELECT') { var o = input.options[input.selectedIndex]; return o ? o.text : ''; }
    return input.value.trim();
  }
  function ieSetStatus(w, kind) {
    var p = ieParts(w), old = $('.inline-edit__status', p.display);
    w.classList.remove('is-saving', 'is-saved');
    if (old) old.remove();
    if (!kind) return;
    var s = document.createElement('span');
    s.className = 'inline-edit__status';
    if (kind === 'saving') {
      var sp = document.createElement('span');
      sp.className = 'inline-edit__spinner';
      s.appendChild(sp);
      s.setAttribute('aria-label', 'Saving');
    } else {
      var ic = document.createElement('span');
      ic.className = 'icon';
      ic.textContent = 'check';
      s.appendChild(ic);
      s.appendChild(document.createTextNode('Saved'));
    }
    p.display.insertBefore(s, p.value.nextSibling);
    w.classList.add(kind === 'saving' ? 'is-saving' : 'is-saved');
  }
  function ieHideError(w) {
    var e = $('.inline-edit__error', w), i = $('.inline-edit__input', w);
    if (e) e.hidden = true;
    if (i) i.removeAttribute('aria-invalid');
    w.classList.remove('is-error');
  }
  function ieShowError(w, msg, focus) {
    var p = ieParts(w), e = $('.inline-edit__error', w);
    ieSetStatus(w, null);
    w.classList.add('is-editing', 'is-error');
    p.input.hidden = false;
    p.input.setAttribute('aria-invalid', 'true');
    if (!e) { e = document.createElement('span'); e.className = 'inline-edit__error'; e.setAttribute('role', 'alert'); w.appendChild(e); }
    e.textContent = msg || 'Invalid value';
    e.hidden = false;
    if (focus) p.input.focus();
  }
  function ieStart(w) {
    var p = ieParts(w);
    if (!p.input || !p.display || w.classList.contains('is-saving') || w.classList.contains('is-editing')) return;
    clearTimeout(w._imSavedTimer);
    ieSetStatus(w, null);
    ieHideError(w);
    w._imPrev = ieRaw(w, p);
    p.input.value = w._imPrev;
    w.classList.add('is-editing');
    p.input.hidden = false;
    p.input.focus();
    if (p.input.tagName === 'INPUT') p.input.select();
  }
  function ieEnd(w) {
    var p = ieParts(w);
    w.classList.remove('is-editing');
    ieHideError(w);
    p.input.hidden = true;
  }
  function ieCommit(w, fromKey) {
    if (!w.classList.contains('is-editing')) return;
    var p = ieParts(w), input = p.input;
    var raw = input.tagName === 'SELECT' ? input.value : input.value.trim();
    if (input.checkValidity && !input.checkValidity()) {
      ieShowError(w, w.getAttribute('data-error') || input.validationMessage, fromKey);
      return;
    }
    if (raw === w._imPrev) { ieEnd(w); return; }
    var prevRaw = w._imPrev, prevText = p.value.textContent, pending = null;
    p.value.textContent = ieText(input);
    if (w.hasAttribute('data-value')) w.setAttribute('data-value', raw);
    ieEnd(w);
    w.dispatchEvent(new CustomEvent('inlineedit', {
      bubbles: true,
      detail: { value: raw, previous: prevRaw, element: w, waitUntil: function (pr) { pending = pr; } }
    }));
    function saved() {
      ieSetStatus(w, 'saved');
      w._imSavedTimer = setTimeout(function () { if (w.classList.contains('is-saved')) ieSetStatus(w, null); }, 1600);
    }
    if (!pending) { saved(); return; }
    ieSetStatus(w, 'saving');
    Promise.resolve(pending).then(saved, function (err) {
      p.value.textContent = prevText;
      if (w.hasAttribute('data-value')) w.setAttribute('data-value', prevRaw);
      w._imPrev = prevRaw;
      input.value = raw;                       // keep what they typed so it can be fixed
      ieShowError(w, err && err.message ? err.message : (typeof err === 'string' ? err : "Couldn't save"), false);
    });
  }

  document.addEventListener('click', function (e) {
    var d = e.target.closest('.inline-edit__display');
    var w = d && d.closest('[data-inline-edit]');
    if (w) ieStart(w);
  });
  /* capture phase so Esc doesn't also close a surrounding dialog */
  document.addEventListener('keydown', function (e) {
    var i = e.target.closest && e.target.closest('.inline-edit__input');
    var w = i && i.closest('[data-inline-edit]');
    if (!w) return;
    if (e.key === 'Enter') {
      e.preventDefault();
      ieCommit(w, true);
      if (!w.classList.contains('is-editing')) ieParts(w).display.focus();
    } else if (e.key === 'Escape') {
      e.preventDefault();
      e.stopPropagation();
      ieEnd(w);
      ieParts(w).display.focus();
    }
  }, true);
  document.addEventListener('focusout', function (e) {
    var i = e.target.closest && e.target.closest('.inline-edit__input');
    var w = i && i.closest('[data-inline-edit]');
    if (w && w.classList.contains('is-editing')) ieCommit(w, false);   // errors on blur don't steal focus back
  });
  document.addEventListener('change', function (e) {
    if (!e.target.matches || !e.target.matches('select.inline-edit__input')) return;
    var w = e.target.closest('[data-inline-edit]');
    if (w) { ieCommit(w, true); if (!w.classList.contains('is-editing')) ieParts(w).display.focus(); }
  });

  /* ========================================================
     PROPERTY PANEL "SHOW MORE"  —  delegated, no init.
     <dl class="props" id="wo-props">… .props__row--more rows …</dl>
     <button class="props__more" data-props-more="wo-props" aria-expanded="false">
       <span class="icon">expand_more</span><span class="props__more-label">Show 4 more</span></button>
     data-props-more names the panel's id (or leave it empty when the
     button directly follows the <dl>). data-less-label sets the
     collapsed text (default "Show fewer").
     ======================================================== */
  document.addEventListener('click', function (e) {
    var b = e.target.closest('[data-props-more]');
    if (!b) return;
    var id = b.getAttribute('data-props-more');
    var panel = id ? document.getElementById(id) : b.previousElementSibling;
    if (!panel || !panel.classList.contains('props')) return;
    var open = panel.classList.toggle('is-expanded');
    b.setAttribute('aria-expanded', open ? 'true' : 'false');
    var lbl = $('.props__more-label', b);
    if (lbl) {
      if (b._imMoreText == null) b._imMoreText = lbl.textContent;
      lbl.textContent = open ? (b.getAttribute('data-less-label') || 'Show fewer') : b._imMoreText;
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
    var saved, intensity;
    try { saved = localStorage.getItem('im-theme'); intensity = localStorage.getItem('im-intensity'); } catch (e) {}
    if (saved && saved !== 'auto') document.documentElement.setAttribute('data-theme', saved);
    if (intensity && intensity !== 'muted') document.documentElement.setAttribute('data-intensity', intensity);
  }

  /* ========================================================
     INTENSITY  —  Immaterial.setIntensity('muted' | 'balanced' | 'vibrant' [, element])
     Without an element: sets the page (<html>) and remembers the
     choice in localStorage ('muted' removes the attribute — it's the
     default). With an element: sets just that section, not remembered.
     ======================================================== */
  function setIntensity(mode, el) {
    if (el) { el.setAttribute('data-intensity', mode); return; }
    var root = document.documentElement;
    if (mode === 'muted') root.removeAttribute('data-intensity');
    else root.setAttribute('data-intensity', mode);
    try { localStorage.setItem('im-intensity', mode); } catch (e) {}
  }

  /* ---------- global Esc handler ---------- */
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape') { closeAllMenus(); closeAllDialogs(); }
  });

  /* ---------- auto-init ---------- */
  function init(root) {
    $$('[data-slider]', root || document).forEach(function (el) { if (!el._imSlider) initSlider(el); });
    $$('[data-tabs]',   root || document).forEach(function (el) { if (!el._imTabs)   { el._imTabs = true; initTabs(el); } });
    $$('[data-combobox]', root || document).forEach(function (el) { if (!el._imCombobox) { el._imCombobox = true; initCombobox(el); } });
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', function () { initTheme(); init(); });
  else { initTheme(); init(); }

  /* ---------- public API ---------- */
  global.Immaterial = {
    toast: toast,
    openDialog: openDialog,
    closeDialog: closeDialog,
    setTheme: setTheme,
    setIntensity: setIntensity,
    init: init            // call after injecting markup dynamically (sliders, tabs, comboboxes)
  };
})(window);
