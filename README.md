# Immaterial Design System

A small, framework-free UI kit: one stylesheet, one optional behaviour script. Material-role colour system computed from a few seed colours, with light + dark support. Every visual element is plain CSS you apply with BEM-style classes; a ~5 KB vanilla-JS file adds the few behaviours CSS can't do (dialogs, toasts, sliders, tabs, menus).

```
theme.css        — colour tokens — THE file a designer edits to rebrand
immaterial.css     — all component styles (references the tokens, no hardcoded colours)
immaterial.js      — optional behaviour layer (window.Immaterial)
showcase.html    — live reference of every component
```

---

## 1. Setup

The system uses two typefaces, which it assumes are **already installed / self-hosted** in your app: **Roboto Flex** (UI text) and **Material Symbols Rounded** (icons). Make them available under those exact `font-family` names — e.g. via your own `@font-face` rules pointing at local files:

```css
/* your app's font setup — serve the files from your own assets */
@font-face {
  font-family: 'Roboto Flex';
  src: url('/fonts/RobotoFlex.woff2') format('woff2');
  font-weight: 100 1000;
  font-display: swap;
}
@font-face {
  font-family: 'Material Symbols Rounded';
  src: url('/fonts/MaterialSymbolsRounded.woff2') format('woff2');
  font-weight: 100 700;
  font-display: swap;
}
```

Then load the stylesheets (fonts must resolve to the names above) and, optionally, the script:

```html
<link rel="stylesheet" href="theme.css">     <!-- tokens first -->
<link rel="stylesheet" href="immaterial.css">  <!-- then components -->
<!-- before </body> -->
<script src="immaterial.js"></script>
```

> **Load order matters:** `theme.css` must come **before** `immaterial.css`, because every colour in the components references a token defined in `theme.css`.

**Icons.** Anywhere the docs show `<span class="icon">name</span>`, `name` is a Material Symbols Rounded ligature (e.g. `search`, `delete`, `arrow_drop_down`). The `.icon` helper class only sets `font-family: 'Material Symbols Rounded'` — it does not fetch the font, so make sure that family is available locally.

If you inject markup dynamically after load, call `Immaterial.init()` to wire any new sliders/tabs inside it.

---

## 2. Theming

Colour lives in **`theme.css`** — a dedicated designer-input file. It follows the **Material Design role naming** (`primary` / `secondary` / `tertiary` / `surface` / `on-*` / `*-container`), and almost every token is **calculated** from a handful of seed colours using relative colour syntax (`oklch(from …)`) and `light-dark()`:

```css
/* rebrand = change the seeds */
:root {
  --seed-primary: #2563EB;
  /* --seed-secondary / --seed-tertiary default to derivations
     of primary; set your own hexes to break the link */
  --seed-error:   #B3261E;
}
```

From `--seed-primary` the system derives the full role set — containers, on-colours, hover/strong variants, hue-tinted surfaces and text, rows, track, chart bars, focus ring, shadows — for **both light and dark** (each token carries both values via `light-dark()`; no duplicated dark block).

**Escape hatch:** every computed token can still be overridden with a literal colour in your own stylesheet. Derived on-colours are close to Material's tonal contrast but not guaranteed for extreme seeds (e.g. neon yellow) — spot-check and pin any offender:

```css
:root { --on-primary-container: #1A1400; }
```

**Light / dark.** Three modes:

| Goal | How |
| --- | --- |
| Follow the OS | do nothing (default) |
| Force light | `<html data-theme="light">` |
| Force dark | `<html data-theme="dark">` |

`Immaterial.setTheme('light' \| 'dark' \| 'auto')` sets this at runtime and remembers the choice in `localStorage`.

Token roles (see `theme.css` for the formulas):

- Brand — `--primary` `--primary-hover` `--primary-strong` `--on-primary` `--primary-container` `--on-primary-container` (same set for `secondary` and `tertiary`)
- Surfaces — `--surface`, `--surface-dim` (page bg), `--surface-container`, `--surface-container-high`, `--outline`, `--outline-variant` (borders), `--divider`
- Text — `--on-surface`, `--on-surface-variant`, `--on-surface-faint`
- Semantic — `--error` `--error-hover` `--on-error` `--error-text` `--error-container` `--on-error-container` · `--success(-container)` · `--warning-container`
- Component — `--track`, `--row-hover`, `--row-selected`, `--chart-bar`, `--ring`, `--scrim`, `--snackbar-*`, `--disabled-*`

Non-colour values (radii, spacing, shadows) are intentionally baked into the component rules to keep the token surface small. Radii in use: **16px** cards, **10px** controls, **999px** pills.

---

## 3. Typography

The system is dashboard-scaled — components carry their own type, so these five roles are for **free-standing text** only (section headers, card labels, indicators). Apply the class to any element; heading tags carry no styling of their own.

| Role | Class | Spec | Use for |
| --- | --- | --- | --- |
| Value | `.text-value` | 28px / 700 | KPIs, indicators |
| Title | `.text-title` | 16px / 650 | section & card headers |
| Body | `.text-body` | 14px / 400 | default copy |
| Label | `.text-label` | 13px / 500, muted | card labels, form context |
| Overline | `.text-overline` | 11px / 700, caps, letterspaced | group headers |

```html
<span class="text-overline">Facilities — Zone 4</span>
<h2 class="text-title">Maintenance queue</h2>
<div class="text-value">1,284</div>
<span class="text-label">Open work orders</span>
```

---

## 4. Simple components

These need only classes — no JS.

### Buttons
```html
<button class="btn btn--filled">Filled</button>
<button class="btn btn--tonal">Tonal</button>
<button class="btn btn--outlined">Outlined</button>
<button class="btn btn--text">Text</button>
<button class="btn btn--danger">Danger</button>
<button class="btn btn--filled" disabled>Disabled</button>

<button class="btn btn--filled"><span class="icon">add</span> With icon</button>
```
Sizes: add `btn--sm` or `btn--lg`.

### Icon buttons
```html
<button class="icon-btn"><span class="icon">notifications</span></button>
<button class="icon-btn icon-btn--filled"><span class="icon">search</span></button>
<button class="icon-btn icon-btn--selected"><span class="icon">favorite</span></button>
<button class="icon-btn icon-btn--sm"><span class="icon">more_vert</span></button>
```

### Segmented buttons — *pure CSS*
Radio inputs drive selection; the selected option reveals a leading check automatically. No JS.
```html
<div class="segmented" role="radiogroup" aria-label="Range">
  <label class="segmented__option">
    <input type="radio" name="range" checked>
    <span class="icon segmented__check">check</span>
    <span class="icon">calendar_view_week</span>Week
  </label>
  <label class="segmented__option">
    <input type="radio" name="range">
    <span class="icon segmented__check">check</span>
    <span class="icon">calendar_view_month</span>Month
  </label>
</div>
```

### Connected button group
```html
<div class="button-group button-group--icons">
  <button class="is-active"><span class="icon">density_medium</span></button>
  <button><span class="icon">density_small</span></button>
</div>
```
Move the `is-active` class to the chosen segment (one line of JS, or a radio pattern like the segmented control).

### Chips
```html
<!-- filter chip: toggle .is-selected -->
<button class="chip is-selected"><span class="icon">check</span>HVAC</button>
<button class="chip"><span class="icon">add</span>Electrical</button>
<!-- assist chip: static -->
<span class="chip chip--assist"><span class="icon">schedule</span>Due today</span>
```

### Switch & checkbox — *pure CSS, native inputs*
```html
<label class="switch">
  <input type="checkbox" checked>
  <span class="switch__track"><span class="switch__thumb"></span></span>
</label>

<input class="checkbox" type="checkbox">   <!-- check glyph drawn by CSS -->
```

### Badges & priority
Badges carry a 1px border derived from their text colour (30% mix) so they hold up on any surface.
```html
<span class="badge badge--primary">In progress</span>
<span class="badge badge--warning">Queued</span>
<span class="badge badge--success">Done</span>
<span class="badge badge--neutral">Draft</span>

<span class="priority priority--high">High</span>
<span class="priority priority--medium">Medium</span>
<span class="priority priority--low">Low</span>
```

### Radio buttons — *pure CSS, native inputs*
```html
<div class="radio-group">
  <label class="radio-group__option"><input class="radio" type="radio" name="poll" checked> Every hour</label>
  <label class="radio-group__option"><input class="radio" type="radio" name="poll"> Daily</label>
</div>
```
For 2–4 short, always-visible options prefer the segmented control; use radios for longer lists or longer labels.

### Alerts / banners
Persistent inline messaging — for transient feedback use the toast instead.
```html
<div class="alert alert--warning">
  <span class="icon">warning</span>
  <div class="alert__content">
    <span class="alert__title">Optional title</span>
    <span>3 sensors have not reported in over an hour.</span>
  </div>
  <button class="icon-btn icon-btn--sm"><span class="icon">close</span></button>  <!-- optional dismiss; wire the click yourself -->
</div>
```
Variants: `--info` `--success` `--warning` `--error`.

### Breadcrumbs
```html
<nav class="breadcrumbs">
  <a href="#">Dashboard</a>
  <span class="icon">chevron_right</span>
  <a href="#">Facilities</a>
  <span class="icon">chevron_right</span>
  <span class="breadcrumbs__current">Zone 4</span>
</nav>
```

### List
Icon + content + trailing rows, for items where fields are descriptive rather than compared column-to-column (if column headers would help, use the table). Add `list--interactive` for hover states.
```html
<div class="card">
  <div class="list list--interactive">
    <div class="list__item">
      <span class="icon">build</span>
      <div class="list__content">
        <span class="list__title">Work order #4211 closed</span>
        <span class="list__meta">Compressor A-12 · J. Moreno</span>
      </div>
      <span class="list__trailing">12m ago</span>
    </div>
  </div>
</div>
```

### Progress
```html
<div class="progress"><div class="progress__bar" style="width:68%"></div></div>
<div class="spinner"></div>          <!-- also --sm / --lg -->
```

### Stat card & sidebar nav
```html
<div class="stat-card">
  <div class="stat-card__label"><span class="icon">bolt</span>Active jobs</div>
  <div class="stat-card__value">128</div>
  <div class="stat-card__delta stat-card__delta--up">▲ 12% this week</div>
</div>
<!-- accent variant: add stat-card--accent -->

<nav class="sidebar">
  <div class="nav-section">Overview</div>
  <a class="nav-item is-active"><span class="icon">dashboard</span>Dashboard</a>
  <a class="nav-item"><span class="icon">monitoring</span>Reports</a>
  <div class="nav-section">Operations</div>
  <a class="nav-item"><span class="icon">task_alt</span>Tasks</a>
</nav>
```
`.nav-section` is an optional overline-style group header.

---

## 5. Cards & header treatments

Base card:
```html
<div class="card">
  <div class="card__body">…</div>
</div>
```

The title sits **inside** the card, anchored one of two ways:

**1a — Inside, with divider** (the default)
```html
<div class="card">
  <div class="card__header card__header--divider">
    <span class="card__title"><span class="icon">ecg_heart</span>Asset health</span>
  </div>
  <div class="card__body">…</div>
</div>
```

**1b — Inside, filled tonal bar** *(wrap in `card--clip` so the bar honours the radius)*
```html
<div class="card card--clip">
  <div class="card__header card__header--filled">
    <span class="card__title" style="color:inherit"><span class="icon">ecg_heart</span>Asset health</span>
  </div>
  <div class="card__body">…</div>
</div>
```

---

## 6. Components that use JS

`immaterial.js` auto-initialises on load and exposes `window.Immaterial`.

### Dialog
Markup lives in the page, hidden. A trigger opens it by id.
```html
<button class="btn btn--danger" data-dialog-open="del-dialog">Delete</button>

<div class="dialog-scrim" id="del-dialog" hidden>
  <div class="dialog">
    <div class="dialog__icon dialog__icon--error"><span class="icon">delete_forever</span></div>
    <div class="dialog__title">Delete 3 tasks?</div>
    <div class="dialog__text">This can't be undone.</div>
    <div class="dialog__actions">
      <button class="btn btn--outlined" data-dialog-close>Cancel</button>
      <button class="btn btn--danger" data-dialog-close>Delete</button>
    </div>
  </div>
</div>
```
- Opens via `data-dialog-open="ID"`, closes via `data-dialog-close`, a click on the scrim, or **Esc**.
- Programmatic: `Immaterial.openDialog('del-dialog')` / `Immaterial.closeDialog('del-dialog')`.

### Toast / snackbar
No markup needed — call it:
```js
Immaterial.toast('Task created and added to the queue');

Immaterial.toast('Task deleted', {
  actionLabel: 'Undo',
  onAction() { restore(); },
  duration: 6000        // ms; 0 = sticky
});
```
Returns a `dismiss()` function. Toasts stack in a bottom-centre host that's created on first use.

### Menu / split button
Wrap a trigger and a `.menu` in a positioned `[data-menu-wrap]`. The trigger carries `data-menu-toggle`.
```html
<div class="split-button" data-menu-wrap>
  <button class="btn btn--filled split-button__main">Create task</button>
  <button class="btn btn--filled split-button__arrow" data-menu-toggle aria-label="More">
    <span class="icon">arrow_drop_down</span>
  </button>
  <div class="menu menu--right" hidden>
    <button class="menu__item">Create &amp; assign…</button>
    <button class="menu__item">Save as draft</button>
  </div>
</div>
```
Opens on trigger click; closes on item click, outside click, or Esc. The same pattern works for any dropdown — the trigger doesn't have to be a split-button arrow.

### Slider
```html
<div class="slider" data-slider
     data-min="1" data-max="8" data-step="1" data-value="3"
     data-output="#dur" data-suffix=" hours" aria-label="Duration">
  <div class="slider__track"></div>
  <div class="slider__fill"></div>
  <div class="slider__thumb"></div>
</div>
<span id="dur">3 hours</span>
```
- `data-output` (optional) is a selector whose text is updated with `value + data-suffix`.
- Supports pointer drag and keyboard (arrows / Home / End).
- Listen for changes: `slider.addEventListener('change', e => console.log(e.detail.value))`.

### Tabs
```html
<div data-tabs-scope>
  <div class="tabs" data-tabs>
    <button class="tab is-active" data-tab="all">All <span class="tab__count">9</span></button>
    <button class="tab" data-tab="queued">Queued <span class="tab__count">4</span></button>
  </div>
  <div class="tab-panel" data-tab-panel="all">…</div>
  <div class="tab-panel" data-tab-panel="queued" hidden>…</div>
</div>
```
- Clicking a tab activates it and shows the matching `[data-tab-panel]`.
- Panels are optional — a filter bar can have tabs with no panels; listen for `tabchange` (`e.detail.tab`) and filter your data yourself.
- Wrap tabs + panels in `[data-tabs-scope]` so panel switching stays scoped when a page has several tab groups.

---

## 7. Constructing a data table

The table is a native `<table>` with the `table` class. It fills its container (`width: 100%`); columns size to content by default, or pin widths with a `<colgroup>`.

```html
<div class="card" style="overflow:hidden">
  <table class="table">
    <colgroup><col style="width:44px"><col><col><col><col></colgroup>
    <thead>
      <tr>
        <th><input class="checkbox" type="checkbox"></th>
        <th><span class="table__sort is-active">Task <span class="icon">arrow_upward</span></span></th>
        <th>Category</th>
        <th><span class="table__sort">Priority <span class="icon">unfold_more</span></span></th>
        <th><span class="table__sort">Status <span class="icon">unfold_more</span></span></th>
      </tr>
    </thead>
    <tbody>
      <tr>
        <td><input class="checkbox" type="checkbox"></td>
        <td style="font-weight:550">Compressor A-12 — quarterly service</td>
        <td style="color:var(--on-surface-variant)">HVAC</td>
        <td><span class="priority priority--medium">Medium</span></td>
        <td><span class="badge badge--primary">In progress</span></td>
      </tr>
      <!-- …more rows… -->
    </tbody>
  </table>
  <div class="pagination">
    <span style="margin-right:8px">1–3 of 9</span>
    <button class="icon-btn icon-btn--sm"><span class="icon">chevron_left</span></button>
    <button class="icon-btn icon-btn--sm"><span class="icon">chevron_right</span></button>
  </div>
</div>
```

**Rules of thumb**
- **Column widths:** optional — leave them to the browser, or pin specific columns via `<col style="width:44px">` in a `<colgroup>`. Add `style="table-layout:fixed"` on the table if you want strict widths regardless of content.
- **Column visibility:** toggle `is-hidden` on the column's `th` + `td` cells — the remaining columns reflow automatically:
  ```js
  // hide/show column index i
  table.querySelectorAll('tr').forEach(r => r.cells[i].classList.toggle('is-hidden'));
  ```
- **Standalone (no card):** add `table--standalone` to the `<table>` — it gets its own border, rounded corners, and surface background. Note: no footer slot; put `.pagination` outside it if needed.
- **Density:** add `table--dense` to the `<table>` to tighten row padding (wire it to a `.button-group--icons` toggle).
- **Selected row:** add `is-selected` to a `<tr>`.
- **Sortable header:** wrap the label in `.table__sort`; add `is-active` and swap the icon (`arrow_upward` / `arrow_downward` / `unfold_more`) to show sort state.
- **Toolbar** above the table:
  ```html
  <div class="toolbar">
    <span style="font-size:16px;font-weight:650">Maintenance queue</span>
    <span class="toolbar__spacer"></span>
    <div class="button-group button-group--icons">…density…</div>
    <span class="toolbar__divider"></span>
    <button class="icon-btn icon-btn--sm"><span class="icon">refresh</span></button>
  </div>
  ```

**Behaviour is yours to wire.** Sorting, filtering, select-all and pagination are application logic — the design system only provides the visual states above. A select-all checkbox, for example:
```js
selectAll.addEventListener('change', e => {
  table.querySelectorAll('tbody .checkbox').forEach(cb => {
    cb.checked = e.target.checked;
    cb.closest('tr').classList.toggle('is-selected', e.target.checked);
  });
});
```

---

## 8. Constructing a bar chart

Flex row of bars; each bar's **height is a percentage set inline** (0–100 % of the chart height). Labels are a matching flex row beneath.

```html
<div class="bar-chart">
  <div class="bar-chart__bar" style="height:46%"></div>
  <div class="bar-chart__bar" style="height:62%"></div>
  <div class="bar-chart__bar" style="height:88%"></div>
</div>
<div class="bar-chart__labels">
  <span class="bar-chart__label">Mon</span>
  <span class="bar-chart__label">Tue</span>
  <span class="bar-chart__label">Wed</span>
</div>
```

- Chart height is fixed by `.bar-chart` (96px by default; override with an inline `height`).
- Convert data to a percentage yourself: `height = value / max * 100`.
- Keep the label count equal to the bar count so columns line up (both use `flex:1`).
- Bars use `--chart-bar` and brighten to `--primary-hover` on hover.

For anything beyond simple bars (axes, lines, stacks) reach for `<svg>` or `<canvas>` — Immaterial doesn't ship a charting engine.

---

## 9. Text fields — a note on the notch

The floating label (`.field__label`) and the card notch (`.card__notch`) use the same trick: a small element positioned over the container's top border, filled with the **background colour behind it**, so the border appears to break around the text.

- `.field__label` defaults to `background: var(--surface)` — correct when the field is inside a card.
- If a field sits directly on the page, override to `var(--surface-dim)`.
- Get this colour wrong and you'll see a stripe of border passing through the label.

---

## 10. Browser support

Uses modern CSS: custom properties, `:has()`, `color-mix()`, relative colour syntax (`oklch(from …)`), and `light-dark()`. Targets evergreen Chrome / Edge / Firefox / Safari (2024+). No build step, no polyfills, no dependencies.

## 11. Class index

| Area | Classes |
| --- | --- |
| Typography | `.text-value` (28/700) `.text-title` (16/650) `.text-body` (14/400) `.text-label` (13/500 muted) `.text-overline` (11/700 caps) |
| Buttons | `.btn` · `--filled` `--tonal` `--outlined` `--text` `--danger` · `--sm` `--lg` |
| Icon buttons | `.icon-btn` · `--filled` `--selected` `--sm` |
| Split button | `.split-button` `.split-button__main` `.split-button__arrow` |
| Menu | `.menu` `--left` `--right` · `.menu__item` `--selected` |
| Segmented | `.segmented` `.segmented__option` `.segmented__check` |
| Button group | `.button-group` `--icons` · `.is-active` |
| Chips | `.chip` `--selected`/`.is-selected` `--assist` |
| Fields | `.field` `--block` `--pill` `--error` `--select` `--area` · `.field__label` `__input` `__leading` `__trailing` `__caret` `__error` |
| Slider | `.slider` `.slider__track` `__fill` `__thumb` `__scale` |
| Switch / checkbox | `.switch` `.switch__track` `__thumb` · `.checkbox` |
| Cards | `.card` `--clip` · `.card__header` `--divider` `--filled` · `.card__body` `__title` |
| Badges | `.badge` `--primary` `--success` `--warning` `--neutral` · `.priority` `--high` `--medium` `--low` |
| Tabs | `.tabs` `.tab` `.is-active` `.tab__count` `.tab-panel` |
| Toolbar | `.toolbar` `.toolbar__spacer` `.toolbar__divider` |
| Dialog | `.dialog-scrim` `.dialog` `.dialog__icon` `--error` `__title` `__text` `__actions` |
| Snackbar | `.snackbar-host` `.snackbar` `.snackbar__action` |
| Progress | `.progress` `--tall` `.progress__bar` · `.spinner` `--sm` `--lg` |
| Table | `.table` (on `<table>`) `--dense` `--standalone` · `tr.is-selected` · `th/td.is-hidden` · `.table__sort` `.is-active` · `.pagination` |
| Radio | `.radio` · `.radio-group` `.radio-group__option` |
| Alert | `.alert` `--info` `--success` `--warning` `--error` · `.alert__content` `__title` |
| Breadcrumbs | `.breadcrumbs` `.breadcrumbs__current` |
| List | `.list` `--interactive` · `.list__item` `__content` `__title` `__meta` `__trailing` |
| Chart | `.bar-chart` `.bar-chart__bar` `.bar-chart__labels` `.bar-chart__label` |
| Nav / stats | `.sidebar` `.nav-section` `.nav-item` `--active`/`.is-active` · `.stat-card` `--accent` `.stat-card__label` `__value` `__delta` `--up` `--down` |

| JS API | |
| --- | --- |
| `Immaterial.toast(msg, opts)` | show a snackbar → returns `dismiss()` |
| `Immaterial.openDialog(id)` / `closeDialog(id)` | control dialogs |
| `Immaterial.setTheme('light'\|'dark'\|'auto')` | switch theme |
| `Immaterial.init(root?)` | wire sliders/tabs in newly-added markup |
