# Intern Management System — Design System v2.0
**Visual Direction:** Modern SaaS (Stripe / Vercel–inspired)  
**Brand:** Indigo-Blue · **Responsive:** All screen sizes

---

## Before vs. After

| Problem in v1 | Resolution in v2 |
|---|---|
| 4 parallel color systems (HSL vars, hex vars, raw Tailwind, gradients) | Single two-layer token architecture (primitives → semantics) |
| `--primary` and `--brand-primary` were different blues | One authoritative `--color-primary` (indigo-600) |
| 40+ `!important` dark mode overrides | Zero `!important` — dark mode remaps semantic tokens only |
| Glassmorphism + flat SaaS = two competing identities | One identity: Modern SaaS with structured depth |
| `hover-glow` added 40px glow to dashboard rows | Elevation uses box-shadow only; glow removed entirely |
| `--nav-text-muted` on nav background = ~3.8:1 (fails AA) | `--text-nav-muted` on `--surface-nav` = ≥ 4.5:1 WCAG AA |
| Spacing had redundant wrapper classes duplicating Tailwind | Clean 4px-base scale; wrapper classes removed |
| `backdrop-filter` on every card in a data-heavy dashboard | No backdrop-filter on data surfaces; kept only on mobile overlay |
| No consistent border-radius scale | 6-step radius scale (sm → full) used consistently |

---

## Architecture

```
globals.css
│
├── 1. Primitive Tokens    ← raw palette  (never reference in components)
├── 2. Semantic Tokens     ← :root (light) + .dark (dark)
├── 3. @theme inline       ← maps tokens → Tailwind bg-* / text-* / border-*
├── 4. Base / Reset        ← body, focus, scrollbar
├── 5. Component Classes   ← card, btn, input, sidebar, table, badge …
├── 6. Responsive Layout   ← mobile sidebar, breakpoints
└── 7. Animation           ← keyframes + prefers-reduced-motion
```

### Two-Layer Token Rule

**Primitives** (layer 1) — raw color values. Never used directly in components.
```css
--indigo-600: #4f46e5;   ✅ defined in layer 1
```

**Semantics** (layer 2) — meaningful names. Always use these in components.
```css
--color-primary: var(--indigo-600);   ✅ semantic
background: var(--color-primary);     ✅ component
background: var(--indigo-600);        ❌ skip the layer — don't do this
background: #4f46e5;                  ❌ hardcoded — don't do this
```

---

## Color System

### Brand / Primary
| Token | Light | Dark | Usage |
|---|---|---|---|
| `--color-primary` | indigo-600 `#4f46e5` | indigo-400 `#818cf8` | CTA buttons, links, active states |
| `--color-primary-hover` | indigo-700 | indigo-300 | Button hover |
| `--color-primary-subtle` | indigo-50 | indigo/12% alpha | Badge bg, highlight bg |
| `--color-primary-text` | indigo-600 | indigo-400 | Text on subtle bg |

### Neutrals (Slate)
| Token | Light | Dark | Usage |
|---|---|---|---|
| `--surface-app` | slate-50 | #0f172a | Page background |
| `--surface-card` | white | #1e293b | Cards, panels |
| `--surface-muted` | slate-100 | 7% alpha | Disabled, table headers |
| `--text-primary` | slate-900 | slate-100 | Headings, body |
| `--text-secondary` | slate-600 | slate-400 | Labels, subtext |
| `--text-muted` | slate-400 | slate-500 | Placeholders, hints |
| `--border-default` | slate-200 | 14% alpha | Standard borders |

### Status
| State | Token base | Light bg | Dark bg |
|---|---|---|---|
| Success | `--color-success` | emerald-50 | emerald/12% |
| Warning | `--color-warning` | amber-50 | amber/12% |
| Error | `--color-error` | red-50 | red/12% |
| Info | `--color-info` | blue-50 | blue/12% |

---

## Typography Scale

| Token / Class | Size | Weight | Usage |
|---|---|---|---|
| `text-xs` | 12px | — | Timestamps, secondary labels |
| `text-sm` | 14px | — | Body copy, table data, inputs |
| `text-base` | 16px | — | Default body |
| `text-lg` | 18px | 600 | Card titles, section heads |
| `text-xl` | 20px | 600 | Page sub-headings |
| `text-2xl` | 24px | 700 | Page titles |
| `text-3xl` | 30px | 700 | Dashboard KPI numbers |
| `text-4xl` | 36px | 700 | Hero metrics (rarely) |

**Font pairing:** Outfit (display + body) + JetBrains Mono (code, IDs).

---

## Spacing Scale

All spacing is a multiple of 4px. Use Tailwind's `p-*` / `m-*` / `gap-*` utilities.
Custom tokens are available as CSS variables for component definitions only.

| Token | Value | Tailwind |
|---|---|---|
| `--space-1` | 4px | `p-1` |
| `--space-2` | 8px | `p-2` |
| `--space-3` | 12px | `p-3` |
| `--space-4` | 16px | `p-4` |
| `--space-6` | 24px | `p-6` |
| `--space-8` | 32px | `p-8` |
| `--space-12` | 48px | `p-12` |
| `--space-16` | 64px | `p-16` |

---

## Elevation System

| Level | Shadow | Use |
|---|---|---|
| `flat` | none | Inline content, table rows |
| `subtle` | 1px, 5% opacity | Cards, inputs (default) |
| `medium` | 4px, 7% opacity | Hovered cards, dropdowns |
| `high` | 10px, 8% opacity | Sticky headers, sidesheets |
| `overlay` | 20px, 10% opacity | Modals, overlays |

**Rule:** No glow effects, no colored shadows, no multi-shadow stacking beyond these levels.

---

## Component Reference

### Card
```html
<!-- Static content -->
<div class="card p-6"> … </div>

<!-- Clickable / navigable -->
<div class="card card-interactive p-6"> … </div>

<!-- KPI metric -->
<div class="card-stat"> … </div>
```

### Button
```html
<button class="btn btn-primary">Save Changes</button>
<button class="btn btn-secondary">Cancel</button>
<button class="btn btn-ghost">View all</button>
<button class="btn btn-destructive btn-sm">Delete</button>
<button class="btn btn-primary btn-lg">Get Started</button>
<button class="btn btn-ghost btn-icon" aria-label="Settings"> … </button>
```

### Input
```html
<!-- Standard input -->
<div class="form-group">
  <label class="label" for="name">Full Name</label>
  <input class="input" id="name" type="text" placeholder="Jane Smith" />
  <span class="form-hint">As it appears on official documents</span>
</div>

<!-- Error state — no extra class needed, use aria-invalid -->
<input class="input" aria-invalid="true" />
<span class="form-error">This field is required</span>

<!-- Select -->
<select class="select">
  <option>Choose department</option>
</select>
```

### Badge
```html
<span class="badge badge-success">Active</span>
<span class="badge badge-warning">Pending</span>
<span class="badge badge-error">Inactive</span>
<span class="badge badge-neutral">Draft</span>
<span class="badge badge-primary">Admin</span>
```

### Table
```html
<div class="table-container">
  <div class="table-scroll">
    <table class="table">
      <thead>
        <tr>
          <th>Name</th>
          <th>Department</th>
          <th>Status</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td>Jane Smith</td>
          <td>Engineering</td>
          <td><span class="badge badge-success">Active</span></td>
        </tr>
      </tbody>
    </table>
  </div>
</div>
```

### Sidebar (minimal JS required)
```html
<!-- HTML structure -->
<aside class="sidebar" id="sidebar">
  <div class="sidebar-header"> <!-- logo --> </div>
  <nav class="sidebar-body">
    <div class="sidebar-section">
      <p class="sidebar-section-label">Management</p>
      <a href="/interns" class="sidebar-item active">
        <!-- icon -->
        Interns
      </a>
      <a href="/mentors" class="sidebar-item">
        <!-- icon -->
        Mentors
      </a>
    </div>
  </nav>
  <div class="sidebar-footer"> <!-- user profile --> </div>
</aside>

<div class="sidebar-overlay" id="sidebar-overlay"></div>
<main class="page-wrapper">
  <header class="page-header"> … </header>
  <div class="page-content"> … </div>
</main>
```

```js
// Mobile toggle
const sidebar = document.getElementById('sidebar');
const overlay = document.getElementById('sidebar-overlay');
const toggle  = document.getElementById('menu-toggle');

toggle.addEventListener('click', () => {
  sidebar.classList.toggle('open');
  overlay.classList.toggle('open');
});
overlay.addEventListener('click', () => {
  sidebar.classList.remove('open');
  overlay.classList.remove('open');
});
```

---

## Dark Mode

Dark mode is **class-based**. Add `.dark` to `<html>`:

```js
// React example (ThemeProvider pattern)
document.documentElement.classList.toggle('dark', isDark);
```

Because all components reference semantic tokens (e.g. `var(--surface-card)`), and the `.dark` block remaps those tokens, **zero component code changes are needed** when switching themes.

**Rules:**
- Never hardcode light-mode colors in components (`#ffffff`, `slate-900`, etc.)
- Never add `!important` to override Tailwind dark variants
- Never use `dark:bg-*` Tailwind variants alongside token-based components — pick one approach per component

---

## Tailwind Utility Reference

After `@theme inline` registration, you can use these in JSX / HTML:

```
Surfaces:   bg-surface-app  bg-surface-card  bg-surface-muted  bg-surface-nav
Text:       text-content-primary  text-content-secondary  text-content-muted
Borders:    border-border-subtle  border-border-default  border-border-strong
Status bg:  bg-success-subtle  bg-warning-subtle  bg-error-subtle  bg-info-subtle
Status txt: text-success-text  text-warning-text  text-error-text  text-info-text
Brand:      bg-primary  text-primary-text  border-primary-border
Shadows:    shadow-subtle  shadow-medium  shadow-high  shadow-overlay
```

---

## What Was Removed

| Removed | Reason |
|---|---|
| `.glass-surface`, `.glass-card`, `.glass-overlay` | Glassmorphism inappropriate for data-heavy admin tool |
| `.hover-glow` | 40px glow on data rows creates visual fatigue; replaced by `shadow-medium` |
| `.gradient-text-primary` | Gradient text hurts readability in tables / dense UI |
| `.tactile-depth`, `.premium-focus` | Redundant; replaced by `.card-interactive` + `:focus-visible` |
| `.premium-spinner` | Replaced by `.spinner` using border-top trick (no CSS vars dependency) |
| All `--brand-*` variables | Consolidated into `--color-primary` family |
| All `--action-*` background variables | Replaced by `--color-*-subtle` status tokens |
| All `--gradient-*` variables | No gradients in component surfaces |
| `dark-mode-system.css` import | Dark mode handled inline via `.dark` token remaps |
| All `!important` declarations | Dark mode is now proactive, not reactive |

---

## Development Guidelines

1. **Always use semantic tokens** — if you're typing `#4f46e5` or `slate-900`, stop and find the token.
2. **Add new colors to primitives first**, then create a semantic alias — never add a one-off hex.
3. **New status states** (e.g. "on-leave") follow the pattern: add `--color-{name}`, `--color-{name}-subtle`, `--color-{name}-text` in both `:root` and `.dark`.
4. **New components** should be added to Section 5 of globals.css with a header comment block.
5. **No glassmorphism** on surfaces that display text-heavy or tabular data.
6. **Shadows, not glows** — `box-shadow` with RGBA black only. No colored shadows.
7. **Test WCAG AA** for every text/background combination using the semantic tokens.
8. **Sidebar width** is 240px. If you change it, update both `.sidebar { width }` and `.page-wrapper { margin-left }`.
