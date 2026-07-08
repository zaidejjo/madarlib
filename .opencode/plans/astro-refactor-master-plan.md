# Master Execution Plan: Astro Refactor of MadarLib

**Date:** 2026-07-08
**Author:** Frontend Architect
**Status:** Plan — Ready for Execution

---

## Table of Contents

1. [Phase 1: Data Architecture & JSON Refactoring](#phase-1-data-architecture--json-refactoring)
2. [Phase 2: Project Initialization & Directory Layout](#phase-2-project-initialization--directory-layout)
3. [Phase 3: Dynamic Routing & Data Fetching](#phase-3-dynamic-routing--data-fetching)
4. [Phase 4: Component Engineering & Tailwind UI](#phase-4-component-engineering--tailwind-ui)
5. [Phase 5: Search Index Implementation](#phase-5-search-index-implementation)
6. [Phase 6: SEO, Sitemap & LLM Accessibility](#phase-6-seo-sitemap--llm-accessibility)
7. [Appendix: JSON Schema Maintenance Guide](#appendix-json-schema-maintenance-guide)

---

## Phase 1: Data Architecture & JSON Refactoring

### 1.1 — Expand `semesters` to Support Dual Book Types

Each semester entry currently holds a single `url`. We need to split into `studentBook` and `activityBook` objects so each carries its own URL and optional metadata.

**New schema blueprint (`books.json`):**

```jsonc
{
  "grades": [
    {
      // ── Grade-level styling (unchanged) ──
      "number": 9,
      "nameArabic": "التاسع",
      "nameEnglish": "Grade 9",
      "accentColor": "indigo",
      "cardBg": "linear-gradient(135deg, #0f172a 0%, #1e1b4b 50%, #0f172a 100%)",
      "iconGradient": "linear-gradient(135deg, #818cf8, #7c3aed)",
      "badgeClass": "bg-indigo-500/10 border-indigo-500/20 text-indigo-300",
      "arrowCSS": "#818cf8",

      // ── Books array ──
      "books": [
        {
          // Subject metadata (unchanged)
          "subject": "اللغة العربية",
          "code": "ar",
          "icon": "fa-book-quran",
          "coverGradient": "from-emerald-600/40 via-emerald-800/30 to-slate-900",

          // ── NEW: semester with dual book types ──
          "semesters": [
            {
              "term": 1,
              "label": "الفصل الأول",
              "studentBook": {
                "url": "https://github.com/zaidejjo/madarlib/releases/download/v1.0.0/9_ar_1.pdf",
                "pages": 128,
                "sizeMB": 4.2
              },
              "activityBook": {
                "url": "https://github.com/zaidejjo/madarlib/releases/download/v1.0.0/9_ar_1_activity.pdf",
                "pages": 64,
                "sizeMB": 2.1
              }
            },
            {
              "term": 2,
              "label": "الفصل الثاني",
              "studentBook": {
                "url": "https://github.com/zaidejjo/madarlib/releases/download/v1.0.0/9_ar_2.pdf",
                "pages": 120,
                "sizeMB": 3.9
              },
              "activityBook": {
                "url": "https://github.com/zaidejjo/madarlib/releases/download/v1.0.0/9_ar_2_activity.pdf",
                "pages": 60,
                "sizeMB": 1.9
              }
            }
          ]
        }
      ]
    }
  ]
}
```

### 1.2 — Key Structural Changes

| Change | Rationale |
|--------|-----------|
| `semesters[].url` → `semesters[].studentBook.url` | Separates student book from activity book |
| `semesters[].activityBook` (new) | Dedicated entry for كراس التمارين |
| `studentBook.pages`, `studentBook.sizeMB` (optional) | Rich metadata for UI display |
| `activityBook.pages`, `activityBook.sizeMB` (optional) | Same for activity books |

### 1.3 — Backward Compatibility & Migration

- Grades 9, 10, 11 currently have `url` directly on semester objects.
- For each existing `semesters[]` entry where `url` exists, move it to `studentBook.url` and leave `activityBook` as `null` (UI will show "غير متوفر" for missing activity books).
- Grades 1–8 and 12 have empty `books` arrays — they remain empty until data is provided.

### 1.4 — Data Count After Full Population

| Grade | Subjects | Books per Subject | Total Entries |
|-------|----------|-------------------|---------------|
| 1–8   | TBD      | 2 semesters × 2 types = 4 | TBD |
| 9–11  | 5        | 4 | 20 per grade |
| 12    | TBD      | 4 | TBD |

---

## Phase 2: Project Initialization & Directory Layout

### 2.1 — Strict `/astro` Isolation

All Astro-related files live inside `/astro/`. The root workspace contains only `books.json` (shared data source), legacy files, and supporting files.

```
/ (workspace root)
├── books.json                 # Shared data source (used by Astro)
├── index.html                 # Legacy homepage
├── book.html                  # Legacy dynamic grade page
├── logo.webp
├── robots.txt
├── googlee14860c9c412bf1f.html
├── AGENTS.md
├── .gitignore
├── .opencode/
│   ├── plans/                 # Planning documents
│   └── node_modules/
│
└── astro/                     # ← ALL Astro code lives here
    ├── astro.config.mjs
    ├── tailwind.config.mjs
    ├── tsconfig.json
    ├── package.json
    ├── scripts/
    │   └── copy-books-json.js     # Cross-platform copy script
    ├── public/
    │   ├── favicon.ico
    │   ├── logo.webp              # copied from root
    │   └── llm.txt                # LLM metadata file (NEW)
    └── src/
        ├── layouts/
        │   └── BaseLayout.astro   # Shared HTML shell (head, nav, footer, SEO)
        ├── pages/
        │   ├── index.astro        # Homepage — grade grid + search
        │   └── grade/
        │       ├── [grade].astro  # Grade detail page
        │       └── [grade]/
        │           └── [bookCode].astro  # Book detail page
        ├── components/
        │   ├── GradeCard.astro
        │   ├── BookCard.astro
        │   ├── BookDetailBlock.astro    # Dual-action buttons (NEW)
        │   ├── SearchBar.astro
        │   ├── Navbar.astro
        │   ├── Footer.astro
        │   ├── FloatingOrbs.astro
        │   └── SkeletonCard.astro
        ├── data/
        │   └── books.json        # COPY of root books.json (auto-generated by script)
        ├── lib/
        │   ├── searchIndex.js    # Client-side search index builder
        │   └── helpers.js        # Shared utility functions
        └── styles/
            └── global.css        # Any global styles not covered by Tailwind
```

### 2.2 — Cross-Platform `books.json` Copy Script (Replaces Symlink)

**File: `astro/scripts/copy-books-json.js`**

A Bun-compatible script that copies `/books.json` → `/astro/src/data/books.json`. Idempotent — creates the target directory if it doesn't exist.

```js
import { copyFileSync, mkdirSync, existsSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = resolve(__dirname, '..', '..');       // workspace root
const dest = resolve(__dirname, '..', 'src', 'data', 'books.json');

if (!existsSync(dirname(dest))) {
  mkdirSync(dirname(dest), { recursive: true });
}

copyFileSync(resolve(root, 'books.json'), dest);
console.log('✓ books.json copied to src/data/');
```

### 2.3 — Bun Package Manager

**Use `bun` exclusively** — not `npm`, not `pnpm`, not `yarn`.

```bash
# Install all commands use bun
bun install

# Run scripts
bun run dev
bun run build
bun run prebuild    # copies books.json
```

**package.json Scripts:**

```jsonc
{
  "scripts": {
    "prebuild": "bun run scripts/copy-books-json.js",
    "predev": "bun run scripts/copy-books-json.js",
    "dev": "astro dev",
    "build": "astro build",
    "preview": "astro preview"
  }
}
```

- `prebuild` / `predev` hooks ensure `books.json` is always fresh before any Astro operation.
- Compatible with Windows, Linux, and macOS (pure `node:fs` — no shell commands).
- `bun run build` triggers `prebuild` → `astro build` sequentially.

### 2.4 — Bun Init (Package Manager)

In the `/astro` directory:
```bash
bun create astro@latest . -- --template minimal --yes --no-install
bun add astro @astrojs/sitemap tailwindcss@3 postcss autoprefixer
```

Tailwind v3 is used deliberately (not v4) for compatibility with `@tailwind` directives and `tailwind.config.mjs`.

### 2.5 — Tailwind v3 via PostCSS (not @astrojs/tailwind)

`@astrojs/tailwind` is deprecated for Astro v7. Instead, use Tailwind v3 via PostCSS, which Vite auto-detects via `postcss.config.cjs`:

**`astro/postcss.config.cjs`:**
```js
module.exports = {
  plugins: {
    tailwindcss: {},
    autoprefixer: {},
  },
};
```

**`astro/tailwind.config.mjs`:**
```js
/** @type {import('tailwindcss').Config} */
export default {
  content: ['./src/**/*.{astro,html,js,jsx,ts,tsx}'],
  safelist: [
    'text-sky-300', 'bg-sky-500/10', 'border-sky-500/20',
    'text-amber-300', 'bg-amber-500/10', 'border-amber-500/20',
    // ... all 11 accent colors + cover gradient fragments
  ],
  theme: {
    extend: {
      screens: { xs: '420px' },
      fontFamily: { sans: ['"Tajawal"', '"Segoe UI"', 'system-ui', 'sans-serif'] },
      animation: {
        float: 'float 7s ease-in-out infinite',
        'float-delayed': 'float 7s ease-in-out 3.5s infinite',
        'slide-up': 'slide-up 0.7s ease-out forwards',
        shimmer: 'shimmer 3s linear infinite',
      },
      keyframes: { /* ... */ },
    },
  },
};
```

**`astro/src/styles/global.css` — Tailwind directives:**
```css
@tailwind base;
@tailwind components;
@tailwind utilities;
/* Custom styles follow */
```

### 2.6 — `astro.config.mjs` (with sitemap & production URL)

```js
import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';

export default defineConfig({
  site: 'https://madarlib.pages.dev/',
  integrations: [
    tailwind(),
    sitemap(),
  ],
  output: 'static',
});
```

### 2.6 — `tailwind.config.mjs` (with safelist)

```js
/** @type {import('tailwindcss').Config} */
export default {
  content: ['./src/**/*.{astro,js,jsx}'],
  safelist: [
    // Accent color classes (dynamically set from JSON)
    'text-sky-300', 'bg-sky-500/10', 'border-sky-500/20',
    'text-amber-300', 'bg-amber-500/10', 'border-amber-500/20',
    'text-teal-300', 'bg-teal-500/10', 'border-teal-500/20',
    'text-pink-300', 'bg-pink-500/10', 'border-pink-500/20',
    'text-orange-300', 'bg-orange-500/10', 'border-orange-500/20',
    'text-indigo-300', 'bg-indigo-500/10', 'border-indigo-500/20',
    'text-cyan-300', 'bg-cyan-500/10', 'border-cyan-500/20',
    'text-blue-300', 'bg-blue-500/10', 'border-blue-500/20',
    'text-emerald-300', 'bg-emerald-500/10', 'border-emerald-500/20',
    'text-violet-300', 'bg-violet-500/10', 'border-violet-500/20',
    'text-fuchsia-300', 'bg-fuchsia-500/10', 'border-fuchsia-500/20',
    // Cover gradients
    'from-emerald-600/40', 'via-emerald-800/30', 'to-slate-900',
    'from-blue-600/40', 'via-blue-800/30',
    'from-cyan-600/40', 'via-cyan-800/30',
    'from-purple-600/40', 'via-purple-800/30',
    'from-amber-600/40', 'via-amber-800/30',
  ],
  theme: {
    extend: {
      screens: { xs: '420px' },
      fontFamily: {
        sans: ['"Tajawal"', '"Segoe UI"', 'system-ui', 'sans-serif'],
      },
      animation: {
        float: 'float 7s ease-in-out infinite',
        'float-delayed': 'float 7s ease-in-out 3.5s infinite',
        'slide-up': 'slide-up 0.7s ease-out forwards',
        shimmer: 'shimmer 3s linear infinite',
      },
      keyframes: {
        float: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-24px)' },
        },
        'slide-up': {
          '0%': { opacity: '0', transform: 'translateY(36px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        shimmer: {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
      },
    },
  },
  plugins: [],
};
```

---

## Phase 3: Dynamic Routing & Data Fetching

### 3.1 — Route Structure

| URL Pattern | Page File | Purpose |
|-------------|-----------|---------|
| `/` | `src/pages/index.astro` | Grade grid + search |
| `/grade/[grade]` | `src/pages/grade/[grade].astro` | Books in a grade |
| `/grade/[grade]/[bookCode]` | `src/pages/grade/[grade]/[bookCode].astro` | Single book detail |

### 3.2 — `getStaticPaths` Strategy

All three routes are **static** (pre-rendered at build time):

**`index.astro`** — No dynamic params; imports all grades from JSON and renders them.

**`/grade/[grade].astro`** — `getStaticPaths` returns one path per grade entry:
```js
export async function getStaticPaths() {
  const { grades } = await import('../../data/books.json');
  return grades.map(g => ({
    params: { grade: String(g.number) },
    props: { grade: g },
  }));
}
```

**`/grade/[grade]/[bookCode].astro`** — `getStaticPaths` returns one path per (grade, book) combination:
```js
export async function getStaticPaths() {
  const { grades } = await import('../../../data/books.json');
  const paths = [];
  for (const grade of grades) {
    for (const book of grade.books) {
      paths.push({
        params: { grade: String(grade.number), bookCode: book.code },
        props: { grade, book },
      });
    }
  }
  return paths;
}
```

### 3.3 — Data Flow Diagram

```
books.json (root)
    │
    ▼  (prebuild: copy script)
astro/src/data/books.json
    │
    ▼  (Astro build: getStaticPaths)
┌──────────────────────────────────────────┐
│     Astro Build (getStaticPaths)         │
│                                          │
│  index.astro                             │
│    └─ props: { grades[] }                │
│                                          │
│  [grade].astro                           │
│    └─ props: { grade }                   │
│       └─ renders BookCard for each book  │
│                                          │
│  [bookCode].astro                        │
│    └─ props: { grade, book }             │
│       └─ renders BookDetailBlock         │
└──────────────────────────────────────────┘
    │
    ▼
  Static HTML files (dist/)
    │
    ▼  (sitemap integration)
  dist/sitemap-index.xml
  dist/sitemap-0.xml
```

---

## Phase 4: Component Engineering & Tailwind UI

### 4.1 — Design Language (Preserved from Legacy)

The existing `index.html` establishes a **dark, glass-morphism, cyber-neon** design:

| Element | Style |
|---------|-------|
| Background | `#020617` (slate-950) with radial gradient orbs |
| Cards | Glass with `backdrop-filter: blur(20px)`, subtle border |
| Accent colors | Per-grade gradients (cyan, indigo, emerald, fuchsia, etc.) |
| Typography | Tajawal font, gradient text via `gradient-text` class |
| Animations | `float`, `slide-up`, `shimmer` keyframes |
| Scrollbar | Custom cyan-indigo gradient |

All of this must be replicated in Astro's Tailwind config and component styles.

### 4.2 — Component Tree & Layouts

```
BaseLayout.astro
├── <head> (SEO meta, OpenGraph, fonts, Tailwind)
├── Navbar.astro
├── <slot/> (page content)
└── Footer.astro

index.astro (uses BaseLayout)
├── Hero section (gradient text, stats counts)
├── SearchBar.astro (with dropdown overlay)
└── Grid of GradeCard.astro (12 cards)

[grade].astro (uses BaseLayout)
├── Grade header (title, back button, stats)
├── SearchBar.astro (filtered to current grade)
└── Grid of BookCard.astro

[bookCode].astro (uses BaseLayout)
├── Breadcrumb (Home > Grade N > Subject)
├── Book header / cover area
├── Semester 1 block:
│   ├── BookDetailBlock (studentBook) — dual buttons
│   └── BookDetailBlock (activityBook) — dual buttons or "غير متوفر"
└── Semester 2 block:
    ├── BookDetailBlock (studentBook) — dual buttons
    └── BookDetailBlock (activityBook) — dual buttons or "غير متوفر"
```

### 4.3 — Page-by-Page UI Spec

#### 4.3.1 — Home Page (`index.astro`)

**Layout:**
- Full-dark background with floating orbs (same as legacy `index.html`)
- Glass navbar at top (logo + nav links)
- Hero section:
  - Badge pill: "المكتبة الرقمية للكتب المدرسية"
  - H1: "مكتبة مدار" (gradient text) + "الرقمية"
  - Subtitle paragraph
  - CTA buttons: "تصفح الكتب" (gradient), "المميزات" (outline)
  - Stats row: 12 صف دراسي | +١٢٠ كتاب | ٥ مواد
- **SearchBar.astro**: Prominent search input with icon, below hero
- Grade grid: 4-column responsive grid (1→2→4 columns)
  - Each `GradeCard.astro` receives: `grade` object
  - Cards link to `/grade/{number}`

#### 4.3.2 — Grade Page (`[grade].astro`)

**Layout:**
- Navbar (same as home)
- Breadcrumb: الرئيسية > {grade.nameArabic}
- Grade title with accent underline
- Filter pills row: "الكل" + each unique subject from the grade's books
- Book grid: responsive grid of `BookCard.astro` components
  - Each card shows subject icon, name, semester badges
  - Click navigates to `/grade/{num}/{book.code}`

#### 4.3.3 — Book Detail Page (`[bookCode].astro`) — Dual-Action Buttons

**Layout:**
- Navbar
- Breadcrumb: الرئيسية > {grade.nameArabic} > {book.subject}
- Large header area with book icon and metadata

**Each semester section** has two `BookDetailBlock` components side-by-side:

```
┌───────────────────────────────────────────────────┐
│  📖 الفصل الأول                                    │
│                                                   │
│  ┌─────────────────────┐  ┌─────────────────────┐ │
│  │  كتــاب الطــالب      │  │  كتــاب التمــارين    │ │
│  │                     │  │                     │ │
│  │  📄 128 صفحة         │  │  📄 64 صفحة          │ │
│  │  💾 4.2 MB           │  │  💾 2.1 MB           │ │
│  │                     │  │                     │ │
│  │  [👁 فتح الكتاب]     │  │  [👁 فتح الكتاب]     │ │
│  │  [⬇ تنزيل الكتاب]   │  │  [⬇ تنزيل الكتاب]   │ │
│  └─────────────────────┘  └─────────────────────┘ │
└───────────────────────────────────────────────────┘
```

**Dual-Action Button Spec:**
- **Open/View (فتح الكتاب)**: `<a href="{url}" target="_blank" rel="noopener noreferrer">` — opens PDF in new tab. Uses a bordered/outline button style.
- **Download (تنزيل الكتاب)**: `<a href="{url}" download>` — triggers download. Uses a filled gradient button style (grade's accent color).

**If activityBook is `null`:**
- Show a muted, grayed-out placeholder block
- Text: "كتاب التمارين غير متوفر حالياً"
- No buttons rendered

### 4.4 — CSS & Animation Classes to Replicate

From the legacy codebase, these custom classes must be ported:

| Class | Definition |
|-------|-----------|
| `.glass` | `background: rgba(15,23,42,0.6); backdrop-filter: blur(20px); border: 1px solid rgba(148,163,184,0.08)` |
| `.glass-strong` | `background: rgba(15,23,42,0.85); backdrop-filter: blur(24px); border: 1px solid rgba(148,163,184,0.1)` |
| `.grade-card` | Hover lift + glow border via `::before` pseudo-element |
| `.gradient-text` | `background: linear-gradient(135deg, #22d3ee 0%, #818cf8 50%, #a78bfa 100%); -webkit-background-clip: text; -webkit-text-fill-color: transparent` |
| `.entrance-1` through `.entrance-5` | Staggered slide-up animations |
| `.nav-safe` | `padding-top: env(safe-area-inset-top, 0px)` |
| Grid background pattern | `body::before` with repeating linear gradients |
| Floating orbs | Absolute-positioned blurred circles with `animate-float` |
| Custom scrollbar | `::-webkit-scrollbar` styling |

---

## Phase 5: Search Index Implementation

### 5.1 — Architecture

Client-side, no-dependency search. The index is built once at page load from the same `books.json` data.

**No external library** — pure JavaScript `Array.filter()` + `String.includes()` for Arabic-aware matching.

### 5.2 — Search Index Data Structure

```js
const searchIndex = [
  {
    id: '9-ar',
    gradeNumber: 9,
    gradeNameAr: 'التاسع',
    gradeNameEn: 'Grade 9',
    subjectAr: 'اللغة العربية',
    subjectCode: 'ar',
    url: '/grade/9/ar',
    icon: 'fa-book-quran',
    coverGradient: 'from-emerald-600/40...',
    semesterLabels: ['الفصل الأول', 'الفصل الثاني'],
  },
  // ... one entry per (grade × book)
];
```

### 5.3 — SearchBar Component (Uses `define:vars`)

**Location:** `SearchBar.astro` — renders HTML shell + client-side `<script>`.

**CRITICAL — Data Passing via `define:vars`:**

Do NOT embed JSON in a `<script type="application/json">` tag and call `JSON.parse()`. This causes `Uncaught SyntaxError: Expected property name or '}' in JSON at position 1` due to encoding/escaping mismatches with Arabic characters.

Instead, use Astro's `define:vars` directive which safely serializes frontmatter data into the client script scope:

```astro
---
const { grades } = Astro.props;
const clientGrades = grades.map(g => ({ /* ... */ }));
---
<script define:vars={{ clientGrades }}>
  // clientGrades is a plain JS object — no JSON.parse needed!
  const index = clientGrades.flatMap(grade => /* ... */);
</script>
```

**HTML structure:**
```html
<div class="relative max-w-2xl mx-auto" id="searchWidget">
  <div class="relative glass rounded-2xl flex items-center px-4 py-3">
    <i class="fa-solid fa-search text-slate-500 ml-3"></i>
    <input id="globalSearch" type="text" placeholder="ابحث عن كتاب..." autocomplete="off" />
    <kbd class="hidden sm:inline-flex ...">⌘K</kbd>
  </div>
  <div id="searchResults" class="hidden ..."></div>
</div>
```

### 5.4 — Search Logic

```js
// clientGrades is injected by define:vars
const index = clientGrades.flatMap(grade =>
  (grade.books || []).map(book => ({
    id: `${grade.number}-${book.code}`,
    gradeNumber: grade.number,
    gradeNameAr: grade.nameArabic,
    gradeNameEn: grade.nameEnglish,
    subjectAr: book.subject,
    subjectCode: book.code,
    url: `/grade/${grade.number}/${book.code}`,
    icon: book.icon || 'fa-book',
    coverGradient: book.coverGradient || 'from-slate-700 to-slate-900',
    semesterLabels: (book.semesters || []).map(s => s.label),
  }))
);

function search(query) {
  const q = query.trim().toLowerCase();
  if (!q) return [];
  return index.filter(item =>
    item.subjectAr.includes(q) ||
    item.subjectCode.includes(q) ||
    item.gradeNameAr.includes(q) ||
    String(item.gradeNumber).includes(q)
  );
}
```

- Debounced input handler (300ms)
- Renders results as `<a>` tags linking to `item.url`
- Keyboard: arrow keys navigate, Enter selects, Escape closes
- ⌘K / CtrlK focuses the input

### 5.5 — Search Results Rendering

```html
<a href="/grade/9/ar" class="flex items-center gap-3 px-4 py-3 hover:bg-white/5 transition-colors border-b border-slate-800 last:border-0">
  <div class="w-10 h-10 rounded-xl bg-gradient-to-br {{coverGradient}} flex items-center justify-center">
    <i class="fa-solid {{icon}} text-white text-sm"></i>
  </div>
  <div class="flex-1 min-w-0">
    <div class="text-white text-sm font-medium truncate">{{subjectAr}}</div>
    <div class="text-slate-400 text-xs">{{gradeNameAr}} • {{semesterLabels.join('، ')}}</div>
  </div>
  <i class="fa-solid fa-arrow-left text-slate-600 text-xs"></i>
</a>
```

### 5.6 — Empty / No Results State

```html
<div class="p-8 text-center">
  <i class="fa-solid fa-book-open text-slate-700 text-4xl mb-3"></i>
  <p class="text-slate-500 text-sm">لا توجد نتائج لبحثك</p>
  <p class="text-slate-600 text-xs mt-1">حاول بكلمات مختلفة</p>
</div>
```

### 5.7 — Performance Notes

- Index size: ~12 grades × ~5 books = ~60 entries. Sub-millisecond filtering.
- Debounce: 300ms.
- `__GRADES_DATA__` global populated via Astro inline `<script>` tag at build time.

---

## Phase 6: SEO, Sitemap & LLM Accessibility

### 6.1 — Production URL Configuration

`astro.config.mjs` sets `site: 'https://madarlib.pages.dev/'`. This enables:
- `@astrojs/sitemap` to generate correct absolute URLs
- Canonical URLs in meta tags
- OpenGraph image URLs

### 6.2 — BaseLayout SEO Props Interface

`BaseLayout.astro` accepts a `seo` object via `Astro.props`:

```ts
interface SEOProps {
  title: string;          // Page title (e.g., "مكتبة مدار | الصف التاسع")
  description: string;    // Meta description
  image?: string;         // OpenGraph image URL (defaults to /logo.webp)
}
```

**BaseLayout renders the following meta tags dynamically:**

```html
<!-- Primary Meta -->
<title>{seo.title}</title>
<meta name="description" content={seo.description} />
<link rel="canonical" href={canonicalUrl} />

<!-- OpenGraph -->
<meta property="og:title" content={seo.title} />
<meta property="og:description" content={seo.description} />
<meta property="og:image" content={seo.image || '/logo.webp'} />
<meta property="og:type" content="website" />
<meta property="og:url" content={canonicalUrl} />

<!-- Twitter Card -->
<meta name="twitter:card" content="summary_large_image" />
<meta name="twitter:title" content={seo.title} />
<meta name="twitter:description" content={seo.description} />
<meta name="twitter:image" content={seo.image || '/logo.webp'} />
```

### 6.3 — Per-Page SEO Data

| Page | `title` | `description` |
|------|---------|---------------|
| `/` (index) | "مكتبة مدار | المكتبة الرقمية للكتب المدرسية" | "حمل جميع كتبك المدرسية من الصف الأول إلى الصف الثاني عشر بضغطة زر واحدة" |
| `/grade/{n}` | "مكتبة مدار \| الصف {nameArabic}" | "جميع كتب الصف {nameArabic} — تحميل كتب الطالب وكراسات التمارين" |
| `/grade/{n}/{code}` | "مكتبة مدار \| {subject} — الصف {nameArabic}" | "تحميل كتاب {subject} للصف {nameArabic} — كتاب الطالب وكتاب التمارين للفصلين" |

### 6.4 — Automated Sitemap

- `@astrojs/sitemap` generates `sitemap-index.xml` and `sitemap-0.xml` at build time.
- All 3 route levels (home, 12 grade pages, ~60 book detail pages) are included automatically.
- No manual configuration needed beyond `site` URL + integration.

### 6.5 — LLM Accessibility (`llm.txt`)

**File: `/astro/public/llm.txt`**

A static file served at `https://madarlib.pages.dev/llm.txt`. Contains metadata for LLM crawlers:

```
# MadarLib - المكتبة الرقمية للكتب المدرسية
# https://madarlib.pages.dev/

## Overview
MadarLib is a digital library for Arabic school textbooks (Grades 1–12). 
It provides free PDF downloads of Student Books (كتاب الطالب) and Activity Books (كتاب التمارين) 
for both semesters.

## Site Structure
- / — Browse all 12 grades in a grid layout
- /grade/{number} — View all subjects available for that grade
- /grade/{number}/{subject-code} — Download page for a specific subject

## Subject Codes
- ar: اللغة العربية (Arabic)
- math: الرياضيات (Mathematics)
- en: اللغة الانجليزية (English)
- ch: الكيمياء (Chemistry)
- ph: الفيزياء (Physics)
- hist: تاريخ الأردن (Jordan History)
- islam: التربية الاسلامية (Islamic Education)

## Grades Available
1 (الأول) through 12 (الثاني عشر)

## Data Source
books.json at project root contains all grade/subject/book metadata.
```

---

## Appendix: JSON Schema Maintenance Guide

### A.1 — Adding a New Grade

Copy the grade-level styling block from any existing grade. Adjust:
- `number`: sequential (e.g., `13` if adding above 12)
- `nameArabic`, `nameEnglish`: display names
- `accentColor`: any Tailwind color name (must match one of the safelisted classes)
- `cardBg`, `iconGradient`, `badgeClass`, `arrowCSS`: custom styles
- `books`: start as empty array `[]`

### A.2 — Adding a New Subject to a Grade

Add an object to the grade's `books` array:
```jsonc
{
  "subject": "اسم المادة",        // Arabic display name
  "code": "code",                 // short unique code (e.g., "bio", "geo")
  "icon": "fa-*",                 // Font Awesome 6 icon class
  "coverGradient": "from-*-600/40 via-*-800/30 to-slate-900",  // Tailwind gradient
  "semesters": [
    {
      "term": 1,
      "label": "الفصل الأول",
      "studentBook": {
        "url": "https://...pdf",   // Direct download URL
        "pages": 128,              // optional: page count
        "sizeMB": 4.2              // optional: file size
      },
      "activityBook": {
        "url": "https://...pdf",
        "pages": 64,
        "sizeMB": 2.1
      }
    },
    {
      "term": 2,
      "label": "الفصل الثاني",
      "studentBook": { ... },
      "activityBook": { ... }
    }
  ]
}
```

### A.3 — Adding a New Semester Entry

Duplicate the semester block above and change:
- `term`: `1` or `2`
- `label`: "الفصل الأول" or "الفصل الثاني"
- `studentBook.url` and `activityBook.url`: the actual PDF URLs

### A.4 — When Activity Book Is Not Available

Set `activityBook` to `null`:
```jsonc
"semesters": [
  {
    "term": 1,
    "label": "الفصل الأول",
    "studentBook": { "url": "...", "pages": 128, "sizeMB": 4.2 },
    "activityBook": null
  }
]
```
The UI will automatically render a muted "غير متوفر" placeholder.

### A.5 — Adding PDFs to GitHub Releases

1. Name PDFs following the convention: `{grade}_{code}_{semester}.pdf`
   - Student's book: `9_ar_1.pdf`
   - Activity book: `9_ar_1_activity.pdf`
2. Upload to a GitHub Release under the `madarlib` repo.
3. Copy the raw download URL into the `studentBook.url` or `activityBook.url` field.

### A.6 — Required Tailwind Safelist (already in tailwind.config.mjs)

See Phase 2.6 above — all accent colors and cover gradients are safelisted.

---

---

## Phase 7: Premium UX & Fluid SPA Refinements

### 7.1 — Astro View Transitions (SPA Navigation)

Enable Astro's native `<ViewTransitions />` in `BaseLayout.astro` to orchestrate fluid page transitions across all routes:

```astro
---
import { ViewTransitions } from 'astro:transitions';
---
<head>
  <ViewTransitions />
</head>
```

This enables the browser's native View Transition API — navigation between pages becomes a smooth fade animation instead of a hard refresh. Zero JavaScript overhead; the browser handles the morphing.

**Custom transition styles** (in `global.css`):
```css
/* Fade transition for all navigations */
html::view-transition-old(root),
html::view-transition-new(root) {
  animation-duration: 300ms;
}
```

### 7.2 — Astro Prefetching (Zero-Lag Navigation)

Add `data-astro-prefetch` on all navigable cards and links. Astro ships a built-in prefetch service (no extra package needed):

- `GradeCard.astro`: `<a href="/grade/{n}" data-astro-prefetch>`
- `BookCard.astro`: `<a href="/grade/{n}/{code}" data-astro-prefetch>`
- Breadcrumb and back links on detail pages

Prefetch behavior: when the user hovers over a link, the next page's HTML is fetched in the background. By the time they click, the content is already in the browser cache — zero perceived load time.

**Configuration** (in `astro.config.mjs`):
```js
prefetch: {
  prefetchAll: true,
  defaultStrategy: 'hover',
},
```

### 7.3 — PDF Preview Modal (GitHub Content-Disposition Bypass)

**Problem:** GitHub Releases serve PDFs with `Content-Disposition: attachment`, forcing downloads even with `target="_blank"`.

**Solution:** A premium inline modal using **Google Docs Viewer** to render the PDF inside an iframe:

```
https://docs.google.com/gview?url={PDF_URL}&embedded=true
```

Google's viewer ignores the `Content-Disposition` header and renders the PDF inline — users can scroll, zoom, and read without leaving the site.

**Component: `PdfPreviewModal.astro`**

```
┌─────────────────────────────────────────────────────────────┐
│  (glass backdrop, covers entire viewport)                    │
│  ┌─────────────────────────────────────────────────────────┐ │
│  │  [Close X]  📖 معاينة الكتاب                            │ │
│  │                                                         │ │
│  │  ┌───────────────────────────────────────────────────┐  │ │
│  │  │                                                   │  │ │
│  │  │   Google Docs Viewer iframe                       │  │ │
│  │  │   (100% width, 90vh height)                       │  │ │
│  │  │                                                   │  │ │
│  │  └───────────────────────────────────────────────────┘  │ │
│  │                                                         │ │
│  │  [فتح في علامة تبويب جديدة]  [تنزيل الكتاب]               │ │
│  └─────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────┘
```

**Features:**
- Opens when user clicks "فتح الكتاب" on any BookDetailBlock
- Glass backdrop with `backdrop-blur-xl`
- Centered glass panel with entrance scale animation
- Close on: X button, Escape key, backdrop click
- Footer buttons: open in new tab (falls back) + download
- Responsive: full-width on mobile, max-w-5xl on desktop

**BookDetailBlock changes:**
- Replace the direct `<a href={url} target="_blank">` with a `<button>` that dispatches a custom event
- The parent `[bookCode].astro` listens for the event and opens the modal with the appropriate PDF URL

### 7.4 — Premium Shadcn/Radix-Style UI Refinements

| Element | Enhancement |
|---------|-------------|
| Cards | Add `backdrop-blur-md`, tighter border with `border-white/5`, hover `shadow-2xl` with accent glow |
| Buttons | Smoother `active:scale-[0.98]`, `transition-all duration-200`, accent border glow on focus |
| Modal | Glass panel with `backdrop-filter: blur(32px)`, border gradient, scale entrance animation |
| Scrollbar | Match the existing cyan/indigo gradient but thinner (4px) |
| Micro-interactions | Button press scale, card lift on hover, instant backdrop blur |

### 7.5 — Files Changed for This Phase

| File | Change |
|------|--------|
| `astro/astro.config.mjs` | Add `prefetch` config |
| `astro/src/layouts/BaseLayout.astro` | Add `<ViewTransitions />`, transition styles |
| `astro/src/components/GradeCard.astro` | Add `data-astro-prefetch` |
| `astro/src/components/BookCard.astro` | Add `data-astro-prefetch` |
| `astro/src/components/BookDetailBlock.astro` | Replace direct link with modal-triggering button |
| `astro/src/components/PdfPreviewModal.astro` | **NEW** — premium PDF preview modal |
| `astro/src/pages/grade/[grade]/[bookCode].astro` | Integrate modal, wire events |
| `astro/src/styles/global.css` | Transition animations, premium refinements |

---

---

## Phase 8: Premium Visual Overhaul — Shadcn/Radix Standards, Premium Arabic Typography, High-Fidelity Layouts

### 8.1 — Premium Arabic Typography

**Migration:** Drop `Tajawal` in favor of `Cairo`, a superfamily designed specifically for the Arabic script with a modern, editorial aesthetic. Cairo offers weights 200–1000, excellent readability at body sizes, and striking presence at display sizes.

**Font loading strategy:**
```html
<link rel="preconnect" href="https://fonts.googleapis.com" />
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
<link href="https://fonts.googleapis.com/css2?family=Cairo:wght@400;500;600;700;800;900&display=swap" rel="stylesheet" />
```

**Typographic scale (global.css):**
```css
body {
  font-family: 'Cairo', 'Segoe UI', system-ui, sans-serif;
  font-weight: 400;
  letter-spacing: 0.01em;
  line-height: 1.8;
}

h1, h2, h3, h4 { letter-spacing: -0.02em; }
```

| Element | Family | Weight | Leading |
|---------|--------|--------|---------|
| Hero heading (h1) | Cairo | 900 (black) | 1.1 |
| Section heading (h2) | Cairo | 800 (extra-bold) | 1.2 |
| Card title | Cairo | 700 (bold) | 1.3 |
| Body | Cairo | 500 (medium) | 1.8 |
| Small/meta | Cairo | 400 (regular) | 1.6 |

### 8.2 — Immersive Homepage (`index.astro`)

Completely rebuilt from scratch with a luxury dashboard aesthetic:

**Hero Section:**
- Massive gradient headline "مكتبة مدار الرقمية" in Cairo Black (900) with optional `background-clip` gradient
- Subtle parallax ambient glow orbs (cyan/indigo/violet) with `backdrop-blur-3xl`
- Premium badge "المكتبة الرقمية للكتب المدرسية" with subtle glass + border
- CTA buttons as Shadcn-style primary (gradient fill) + secondary (ghost/outline)
- Stats grid as glass metric tiles with icon + number + label, separated by delicate dividers

**Search Section:**
- Prominent centered search bar with glass effect, icon prefix, ⌘K badge
- Animated dropdown results with icons, subject name, grade badge

**Grade Grid:**
- 4-column responsive grid of luxury dashboard tiles
- Each tile: gradient background, large grade number, "الصف" label, book count badge, subtle arrow indicator on hover
- Tiles glow with accent gradient border on hover, using the grade's unique accent
- Entrance staggered animations matching Radix timing

### 8.3 — Luxury Grade Cards (`GradeCard.astro`)

Each card is a dashboard tile with:
- Full-bleed gradient background from `books.json`
- Glass overlay with `backdrop-blur-md`
- Grade number displayed as a large, bold numeral in premium stacking
- "الصف" label in subtle muted text
- Book count badge (pill, glass + border)
- Hover: `translateY(-8px)`, `shadow-2xl` with accent glow, gradient border via `::before`
- Active press: `scale(0.98)` per Radix interaction spec

### 8.4 — Premium Book Detail View (`[bookCode].astro`)

**Layout:**
- Top breadcrumb with `data-astro-prefetch`
- Glowing hero card: book icon in multi-layered gradient square, subject name + grade + semester tags
- Dynamic accent color derived from `grade.accentColor` applied to glow/shadow of hero icon

**Semester Sections:**
- Each semester is a 2-column grid (student book + activity book)
- Each book is rendered by `BookDetailBlock.astro` as a premium card

**BookDetailBlock Shadcn-style cards:**
- Glass card with subtle `border-white/5`
- Header: icon (gradient bg) + label + semester label
- If available: metadata row (pages, size) in muted text with icons
- Dual actions matching Shadcn button variants:
  - **فتح الكتاب (Open/View)**: `outline` variant — border-only, subtle hover fill, launches PDF modal
  - **تنزيل الكتاب (Download)**: `default` variant — filled gradient bg, white text, downloads directly
- Each button has: `focus-visible:ring-2`, `active:scale-[0.97]`, smooth `transition-all`

### 8.5 — Motion & Micro-interactions (Radix-Level)

| Element | Interaction | Duration | Easing |
|---------|-------------|----------|--------|
| Grade card hover | translateY(-8px) + shadow glow | 400ms | cubic-bezier(0.34, 1.56, 0.64, 1) |
| Grade card active | scale(0.98) | 100ms | ease |
| Book card hover | translateY(-4px) + border glow | 300ms | ease-out |
| Button hover | bg shift, border glow | 200ms | ease |
| Button active | scale(0.97) | 100ms | ease |
| Focus ring | ring-2 + ring-offset-2 | 150ms | ease |
| Modal enter | scale(0.92 → 1) + fade | 300ms | cubic-bezier(0.34, 1.56, 0.64, 1) |
| Page transition | vt-fade-out 250ms + vt-fade-in 300ms | 300ms | ease-out / ease-in |

### 8.6 — Files Changed

| File | Change |
|------|--------|
| `.opencode/plans/astro-refactor-master-plan.md` | Append Phase 8 |
| `astro/src/layouts/BaseLayout.astro` | Cairo font, refined navbar |
| `astro/src/styles/global.css` | Premium typography, shadcn animations, refined modal |
| `astro/src/pages/index.astro` | Complete rebuild — immersive hero, stats, grid |
| `astro/src/components/GradeCard.astro` | Luxury dashboard tile |
| `astro/src/components/BookCard.astro` | Premium media card |
| `astro/src/pages/grade/[grade].astro` | Refined header + grid |
| `astro/src/components/BookDetailBlock.astro` | Shadcn-style card + buttons |
| `astro/src/pages/grade/[grade]/[bookCode].astro` | Refined hero + semester layout |
| `astro/src/components/SearchBar.astro` | Premium search refinements |
| `astro/src/components/PdfPreviewModal.astro` | Premium modal with Cairo font |

---

## Implementation Sequence (Updated)

| Step | Action | Risk | Commit Message |
|------|--------|------|----------------|
| 1 | Scaffold Astro project | Low | `feat: scaffold astro project` |
| 2 | Build all pages + components + search | Medium | `feat: implement all pages, routing, components, and search` |
| 3 | Fix bugs | Medium | `fix: convert to bun, fix tailwind and searchbar` |
| 4 | Add View Transitions, Prefetching, PDF Modal, Premium UX | Medium | `feat: add view transitions, prefetching, preview modal, premium ux` |
| 5 | Premium visual overhaul — Cairo typography, Shadcn layouts, immersive pages | Medium | `style: complete premium visual overhaul with shadcn standards, gorgeous arabic typography, and high-fidelity layouts` |

---

*End of master execution plan.*
