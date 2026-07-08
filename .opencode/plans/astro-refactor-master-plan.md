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
6. [Appendix: JSON Schema Maintenance Guide](#appendix-json-schema-maintenance-guide)

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
- **Migration script concept**: For each existing `semesters[]` entry where `url` exists, move it to `studentBook.url` and leave `activityBook` as `null` (UI will show "غير متوفر" for missing activity books).
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

All Astro-related files live inside `/astro/`. The root workspace contains only `books.json` (shared data source), legacy `index.html`, `book.html`, and supporting files.

```
/ (workspace root)
├── books.json                 # Shared data source (used by Astro)
├── index.html                 # Legacy homepage (may be replaced by Astro later)
├── book.html                  # Legacy dynamic grade page (optional, may be removed)
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
    ├── public/
    │   ├── favicon.ico
    │   └── logo.webp          # copy from root
    └── src/
        ├── layouts/
        │   └── BaseLayout.astro    # Shared HTML shell (head, nav, footer)
        ├── pages/
        │   ├── index.astro         # Homepage — grade grid + search
        │   └── grade/
        │       ├── [grade].astro   # Grade detail page
        │       └── [grade]/
        │           └── [bookCode].astro  # Book detail page
        ├── components/
        │   ├── GradeCard.astro
        │   ├── BookCard.astro
        │   ├── BookDetailBlock.astro
        │   ├── SearchBar.astro
        │   ├── SearchResults.astro   # (if using a dropdown overlay)
        │   ├── Navbar.astro
        │   ├── Footer.astro
        │   ├── FloatingOrbs.astro
        │   └── SkeletonCard.astro
        ├── data/
        │   └── books.json       # Symlink or copy of root books.json
        ├── lib/
        │   ├── searchIndex.js   # Client-side search index builder
        │   └── helpers.js       # Shared utility functions
        └── styles/
            └── global.css       # Any global styles not covered by Tailwind
```

### 2.2 — Init Commands (Conceptual)

In the `/astro` directory:
```bash
npm create astro@latest . -- --template minimal --no-install
npm install astro tailwindcss @astrojs/tailwind
npx tailwindcss init -p
```

Configure `astro.config.mjs`:
```js
import { defineConfig } from 'astro/config';
import tailwind from '@astrojs/tailwind';

export default defineConfig({
  integrations: [tailwind()],
  output: 'static',
  // Base path if deploying to a subdirectory
  // site: 'https://example.com',
  // base: '/madarlib',
});
```

Configure `tailwind.config.mjs`:
```js
/** @type {import('tailwindcss').Config} */
export default {
  content: ['./src/**/*.{astro,js,jsx}'],
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

### 2.3 — Data File Strategy

The Astro site needs access to `books.json`. Two options:
- **Option A (Recommended)**: Create `astro/src/data/books.json` as a symlink to `../../books.json` (relative to `/astro/src/data/`). This keeps one source of truth.
- **Option B**: Copy the file at build time via a script.

Option A is simpler. The symlink command:
```bash
ln -s ../../books.json src/data/books.json
```
(run from inside `/astro`)

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
  const grades = (await import('../data/books.json')).grades;
  return grades.map(g => ({
    params: { grade: String(g.number) },
    props: { grade: g },
  }));
}
```

**`/grade/[grade]/[bookCode].astro`** — `getStaticPaths` returns one path per (grade, book) combination:
```js
export async function getStaticPaths() {
  const grades = (await import('../data/books.json')).grades;
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
books.json
    │
    ▼
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
```

### 3.4 — Client-Side Enhancements

The search feature requires client-side JavaScript (not pre-rendered). The search index is built at page load from an inline JSON script tag (see Phase 5).

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
├── <head> (meta, title, fonts, Tailwind CDN or built CSS)
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
│   ├── BookDetailBlock (studentBook)
│   └── BookDetailBlock (activityBook) or "غير متوفر"
└── Semester 2 block:
    ├── BookDetailBlock (studentBook)
    └── BookDetailBlock (activityBook) or "غير متوفر"
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
  - Each `GradeCard.astro` receives: `grade` object (number, nameArabic, cardBg, iconGradient, badgeClass, arrowCSS, bookCount)
  - Card design (matches legacy):
    - Gradient background from `cardBg`
    - Top row: subject icon in gradient circle + book count badge
    - Bottom row: grade name + arrow icon colored via `arrowCSS`
  - Cards link to `/grade/{number}`

**Tailwind classes used (must be in safelist):**
- All accent color variants: `text-sky-300`, `bg-sky-500/10`, `border-sky-500/20`, etc.

#### 4.3.2 — Grade Page (`[grade].astro`)

**Layout:**
- Navbar (same as home)
- Breadcrumb: الرئيسية > {grade.nameArabic}
- Grade title with accent underline
- Filter pills row: "الكل" + each unique subject from the grade's books
- Book grid:
  - Each `BookCard.astro` receives: `book`, `gradeNumber`, accent color
  - Card design:
    - Cover gradient from `book.coverGradient`
    - Subject icon (Font Awesome class)
    - Subject name (Arabic)
    - Semester badges: "الفصل الأول", "الفصل الثاني"
    - Each badge links to `/grade/{num}/{book.code}?term=1` or `?term=2`
  - Clicking the card body navigates to `/grade/{num}/{book.code}`

#### 4.3.3 — Book Detail Page (`[bookCode].astro`)

**Layout:**
- Navbar
- Breadcrumb: الرئيسية > {grade.nameArabic} > {book.subject}
- Large header area:
  - Book icon (large, with cover gradient background)
  - Subject name (large text)
  - Grade and semester info
- **Two semester sections** (each a visually distinct card block):

**Semester 1 Section:**
```
┌──────────────────────────────────────────────┐
│  📖 الفصل الأول                               │
│                                              │
│  ┌──────────────────┐  ┌──────────────────┐ │
│  │ كتــاب الطــالب    │  │ كتــاب التمــارين  │ │
│  │ [download btn]    │  │ [download btn]    │ │
│  │ الصفحات: 128      │  │ الصفحات: 64       │ │
│  │ الحجم: 4.2 MB     │  │ الحجم: 2.1 MB     │ │
│  └──────────────────┘  └──────────────────┘ │
└──────────────────────────────────────────────┘
```

**Semester 2 Section:**
```
(identical structure, different data)
```

- Each `BookDetailBlock` component receives:
  - `bookType`: 'studentBook' | 'activityBook'
  - `data`: { url, pages?, sizeMB? }
  - `accentColor`: grade's accent
  - `label`: "كتاب الطالب" or "كتاب التمارين"
  - `icon`: appropriate Font Awesome icon
- If activityBook is `null`, show a disabled/muted block with "غير متوفر"

### 4.4 — CSS & Animation Classes to Replicate

From the legacy codebase, these custom classes must be ported into Tailwind's `@layer components` or inline `<style>` in `BaseLayout.astro`:

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

**No external library** — pure JavaScript `Array.filter()` + `String.includes()` or `Intl.Collator` for Arabic-aware matching.

### 5.2 — Search Index Data Structure

```js
// Built from books.json at page load
const searchIndex = [
  {
    id: '9-ar',
    gradeNumber: 9,
    gradeNameAr: 'التاسع',
    gradeNameEn: 'Grade 9',
    subjectAr: 'اللغة العربية',
    subjectEn: 'Arabic',
    subjectCode: 'ar',
    url: '/grade/9/ar',
    icon: 'fa-book-quran',
    coverGradient: 'from-emerald-600/40...',
    semesterLabels: ['الفصل الأول', 'الفصل الثاني'],
  },
  // ... one entry per (grade × book)
];
```

### 5.3 — SearchBar Component

**Location:** `SearchBar.astro` — renders the HTML shell. All logic is in a client-side `<script>`.

**HTML structure:**
```html
<div class="relative max-w-2xl mx-auto">
  <div class="relative glass rounded-2xl flex items-center px-4 py-3">
    <i class="fa-solid fa-search text-slate-500 ml-3"></i>
    <input
      id="globalSearch"
      type="text"
      placeholder="ابحث عن كتاب (اسم المادة، رقم الصف...)"
      class="w-full bg-transparent text-white placeholder-slate-500 outline-none"
      autocomplete="off"
    />
    <kbd class="hidden sm:inline-flex text-xs text-slate-600 bg-slate-800 px-2 py-0.5 rounded">⌘K</kbd>
  </div>
  <div id="searchResults" class="absolute top-full mt-2 w-full glass-strong rounded-2xl overflow-hidden max-h-96 overflow-y-auto hidden">
    <!-- Results injected by JS -->
  </div>
</div>
```

### 5.4 — Search Logic (client-side script)

```js
// Embedded in SearchBar.astro as a <script> tag
const allGrades = window.__GRADES_DATA__; // set via JSON.parse of inline script

const index = allGrades.flatMap(grade =>
  grade.books.map(book => ({
    id: `${grade.number}-${book.code}`,
    gradeNumber: grade.number,
    gradeNameAr: grade.nameArabic,
    gradeNameEn: grade.nameEnglish,
    subjectAr: book.subject,
    subjectCode: book.code,
    url: `/grade/${grade.number}/${book.code}`,
    icon: book.icon,
    coverGradient: book.coverGradient,
    semesterLabels: book.semesters.map(s => s.label),
  }))
);

function search(query) {
  const q = query.trim().toLowerCase();
  if (!q) return [];
  return index.filter(item =>
    item.subjectAr.includes(q) ||
    item.subjectCode.includes(q) ||
    item.gradeNameAr.includes(q) ||
    item.gradeNameEn.toLowerCase().includes(q) ||
    String(item.gradeNumber).includes(q)
  );
}

// Debounced input handler (300ms)
// Renders results as <a> tags linking to item.url
// Keyboard: arrow keys navigate results, Enter goes to selected
// Escape closes dropdown
// ⌘K / CtrlK focuses the input
```

### 5.5 — Search Results Rendering

Each result item:
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

When search yields zero results:
```html
<div class="p-8 text-center">
  <i class="fa-solid fa-book-open text-slate-700 text-4xl mb-3"></i>
  <p class="text-slate-500 text-sm">لا توجد نتائج لبحثك</p>
  <p class="text-slate-600 text-xs mt-1">حاول بكلمات مختلفة</p>
</div>
```

### 5.7 — Performance Notes

- Index size: ~12 grades × ~5 books = ~60 entries. `filter()` on 60 items is sub-millisecond — no need for trie or lunr.js.
- Debounce: 300ms to avoid filtering on every keystroke.
- The `__GRADES_DATA__` global is populated via an Astro inline `<script>` tag during build, so no additional fetch is needed.

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

### A.6 — Required Tailwind Safelist

Because accent colors are dynamically set from JSON (not statically in templates), the following classes must be explicitly listed in `tailwind.config.mjs` under `safelist` to prevent Tailwind JIT from purging them:

- `text-sky-300`, `bg-sky-500/10`, `border-sky-500/20`
- `text-amber-300`, `bg-amber-500/10`, `border-amber-500/20`
- `text-teal-300`, `bg-teal-500/10`, `border-teal-500/20`
- `text-pink-300`, `bg-pink-500/10`, `border-pink-500/20`
- `text-orange-300`, `bg-orange-500/10`, `border-orange-500/20`
- `text-indigo-300`, `bg-indigo-500/10`, `border-indigo-500/20`
- `text-cyan-300`, `bg-cyan-500/10`, `border-cyan-500/20`
- `text-blue-300`, `bg-blue-500/10`, `border-blue-500/20`
- `text-emerald-300`, `bg-emerald-500/10`, `border-emerald-500/20`
- `text-violet-300`, `bg-violet-500/10`, `border-violet-500/20`
- `text-fuchsia-300`, `bg-fuchsia-500/10`, `border-fuchsia-500/20`

Additionally, all `coverGradient` values used in `books[].coverGradient` must appear in at least one template to avoid purging:
- `from-emerald-600/40 via-emerald-800/30 to-slate-900`
- `from-blue-600/40 via-blue-800/30 to-slate-900`
- `from-cyan-600/40 via-cyan-800/30 to-slate-900`
- `from-purple-600/40 via-purple-800/30 to-slate-900`
- `from-amber-600/40 via-amber-800/30 to-slate-900`

---

## Implementation Sequence (Recommended Build Order)

| Step | Action | Risk |
|------|--------|------|
| 1 | **Initialize `/astro` project** — `npm create astro`, install Tailwind, configure `astro.config.mjs` and `tailwind.config.mjs`, set up safelist. | Low |
| 2 | **Refactor `books.json`** — expand semester schema to `studentBook`/`activityBook`. Create the symlink at `astro/src/data/books.json`. | Low |
| 3 | **Create `BaseLayout.astro`** — port all global styles, glass classes, Tailwind config, fonts, orbs, navbar, footer from legacy. | Medium |
| 4 | **Create `index.astro`** — import grades data, render hero + grade grid with `GradeCard.astro`. | Medium |
| 5 | **Create `[grade].astro`** — dynamic route, render book cards with `BookCard.astro`. | Medium |
| 6 | **Create `[bookCode].astro`** — book detail page with dual `BookDetailBlock` per semester. | Medium |
| 7 | **Build `SearchBar.astro`** — client-side search index, input, dropdown, keyboard nav. | Medium |
| 8 | **Polish & animation** — entrance stagger, shimmer skeletons, floating orbs. | Low |
| 9 | **Build & test** — run `npm run build`, verify all pages render, check search works, confirm no broken links. | Low |
| 10 | **Deploy** — static files in `/astro/dist/` are ready for any static host. | Low |

---

*End of master execution plan.*
