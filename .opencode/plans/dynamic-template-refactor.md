# Refactoring Plan: Dynamic Single-Template Architecture

**Date:** 2026-07-02
**Author:** Senior Frontend Architect
**Status:** Proposal — Awaiting Review

---

## Executive Summary

Consolidate 12 duplicate grade HTML files into a single dynamic template (`book.html`), driven entirely by a centralized `books.json` data source containing direct GitHub Release PDF URLs. Preserve 100% of the current visual design.

---

## Current State Inventory

| File | Role | Problem |
|---|---|---|
| `index.html` | Dashboard (Alpine.js SPA) | Contains inline `GRADES_DATA` + `COMMON_BOOKS` — hardcoded. Grade cards link to `{n}_book.html` pages. |
| `book_template.html` | Template for grade pages | Vanilla JS engine, owns its own `GRADE_CONFIG`, builds paths from local PDFs. |
| `1_book.html` … `12_book.html` | 12 duplicated grade pages | Each is a copy of `book_template.html` with only `GRADE_CONFIG` differing. Massive duplication (~7000+ lines of identical HTML/CSS). |
| `style.css` | Legacy stylesheet | Not linked from any current page. Fire/neon theme from the old era. |
| `books.json` | Partial data file | Contains only grades 9, 10, 11 (incomplete), with direct GitHub Release URLs. |
| `books/grades/{1..12}/` | Local PDF directories | Contains the actual PDF files. Will be obsolete after migration to GitHub Release URLs. |

### Key Observations

1. **`index.html` uses Alpine.js** — a lightweight SPA framework. The dashboard is already an SPA with view-switching (`currentView: 'dashboard'` / `'grade'`). Currently, grade view data is inlined in `GRADES_DATA`.
2. **Grade pages (`{n}_book.html`) use vanilla JS** — a completely separate engine from `index.html`. They are standalone HTML files, not part of the SPA.
3. **The `books.json` structure** maps grade numbers to flat arrays of `{title, url}` objects. No subject metadata, no semester metadata — the title strings encode this (e.g., `"الكيمياء - الفصل الأول"`). This needs enrichment or the grades must derive subject/semester from the URL pattern (`{grade}_{code}_{term}.pdf`).
4. **`index.html` grade cards** currently link to `{n}_book.html` — after refactoring, they will link to `book.html?grade={n}`.

---

## Phase 1: Architecture & Cleanup

### Files to DELETE (13 files)

| File | Reason |
|---|---|
| `book_template.html` | No longer needed — becomes the base for the new `book.html`. |
| `1_book.html` … `12_book.html` | All replaced by `book.html?grade={n}`. |
| `style.css` | Legacy fire/neon theme, not linked anywhere. Dead code. |

### Files to KEEP (2 files)

| File | What happens to it |
|---|---|
| `index.html` | **Refactored** — strip out inline `COMMON_BOOKS` / `GRADES_DATA` / `SUBJECT_HOVER`. Instead, fetch `books.json` at boot. Grade card links change from `9_book.html` to `book.html?grade=9`. |
| `books.json` | **Expanded** — add all 12 grades with complete data. Enrich each entry with structured metadata (`subject`, `code`, `semester`, `icon`, `coverGradient`, `badgeClass`) instead of flat `title`/`url` only. |

### File to CREATE (1 file)

| File | Purpose |
|---|---|
| `book.html` | The single dynamic grade page. Reads `?grade=N` from the URL, fetches `books.json`, renders everything. **Must be a standalone page** (not an SPA fragment), because it can be linked directly and bookmarked. |

### Directory that becomes OBSOLETE

| Directory | Fate |
|---|---|
| `books/grades/*/` | PDFs are now hosted on GitHub Releases. These local PDFs can remain during transition but are no longer referenced by any code. Once the JSON is fully populated, this directory can be deleted entirely. |

### Structural Diff (Before → After)

```
Before:
  index.html           (Alpine SPA, inline GRADES_DATA)
  1_book.html          (vanilla JS, inline GRADE_CONFIG)
  2_book.html          (vanilla JS, inline GRADE_CONFIG)
  ...
  12_book.html         (vanilla JS, inline GRADE_CONFIG)
  book_template.html   (template for above)
  style.css            (legacy, unused)
  books.json           (partial, grades 9-11 only)
  books/grades/1/..12/ (local PDFs)

After:
  index.html           (Alpine SPA, fetches books.json at boot)
  book.html            (dynamic, ?grade=N, fetches books.json)
  books.json           (complete, all 12 grades, structured metadata)
  books/grades/        (optional — phased out later)
```

---

## Phase 2: Data Schema Design

### Proposed `books.json` Structure

The current schema is too flat. We need structured metadata for the rendering engine:

```jsonc
{
  "grades": [
    {
      "number": 9,
      "nameArabic": "التاسع",
      "nameEnglish": "Grade 9",
      "accentColor": "indigo",
      "cardBg": "linear-gradient(135deg, #0f172a 0%, #1e1b4b 50%, #0f172a 100%)",
      "iconGradient": "linear-gradient(135deg, #818cf8, #7c3aed)",
      "badgeClass": "bg-indigo-500/10 border-indigo-500/20 text-indigo-300",
      "arrowCSS": "#818cf8",
      "books": [
        {
          "subject": "اللغة العربية",
          "code": "ar",
          "icon": "fa-book-quran",
          "coverGradient": "from-emerald-600/40 via-emerald-800/30 to-slate-900",
          "semesters": [
            { "term": 1, "label": "الفصل الأول", "url": "https://github.com/.../9_ar_1.pdf" },
            { "term": 2, "label": "الفصل الثاني", "url": "https://github.com/.../9_ar_2.pdf" }
          ]
        }
      ]
    }
  ]
}
```

### Data Flow Diagram

```
                ┌─────────────┐
                │  books.json │  (hosted alongside HTML files)
                └──────┬──────┘
                       │ fetch()
          ┌────────────┼────────────┐
          ▼                         ▼
   ┌──────────────┐        ┌──────────────────┐
   │  index.html  │        │  book.html       │
   │  (Alpine.js) │        │  (?grade=9)      │
   │              │        │  (vanilla JS)     │
   │ fetches full │        │ fetches full     │
   │ grades array │        │ grades array     │
   │ renders       │        │ finds grade N   │
   │ dashboard     │        │ renders books   │
   │ + grade view  │        │ + filters       │
   │ inline        │        └──────────────────┘
   └──────────────┘
```

### Why NOT put the grade view inside index.html as an SPA route?

- **Deep-linking**: Users bookmark `book.html?grade=9`. It must work as a standalone page.
- **SEO**: Each grade has its own URL, title, and meta description.
- **Simplicity**: Avoids Alpine.js router complexity. Each file has one clear job.

---

## Phase 3: JavaScript Logic Blueprint

### `index.html` — Refactored Engine

**Current state:** Alpine.js app with inline `GRADES_DATA` (12 hardcoded grade objects), `COMMON_BOOKS` (7 shared subject templates), `SUBJECT_HOVER`, `SEMESTER_STYLES`.

**After refactoring:**

1. **Remove** all inline data constants (`GRADES_DATA`, `COMMON_BOOKS`, `SUBJECT_HOVER`, `SEMESTER_STYLES`).
2. **Add** a `fetchBooks()` function that loads `books.json` and stores the parsed array into Alpine's reactive state.
3. **Loading state** while fetching: the Alpine SPA shows a shimmer/skeleton while the grade grid is empty.
4. **Grade cards in dashboard** — their `onclick` changes from `window.location = '9_book.html'` to `window.location = 'book.html?grade=' + grade.number`.
5. **Grade view inside `index.html`** (the SPA's `currentView === 'grade'` mode) — this already exists. Keep it, but now `filteredBookItems` derives `path`/`href` from the JSON `url` field instead of constructing local paths.
6. The `selectGrade()` method also updates the URL with `history.pushState({}, '', '?grade=' + grade.number)` so the back button works within the SPA.

### `book.html` — New Dynamic Engine

**Design approach:** Use vanilla JS (matching the current template's approach, NOT Alpine) for simplicity and zero dependency beyond Tailwind CDN + Font Awesome. No framework needed — this is a single-purpose page.

**Lifecycle:**

```
┌──────────────────────────────────────────────────────────┐
│  1. PARSE QUERY: const grade = new URLSearchParams(       │
│     location.search).get('grade');                        │
│                                                          │
│  2. VALIDATE: if (!grade || grade < 1 || grade > 12) →   │
│     show elegant error fallback (Phase 4).               │
│                                                          │
│  3. FETCH: load books.json via fetch().                   │
│     Show animated skeleton cards while loading.          │
│                                                          │
│  4. FIND: locate grade.grades.find(g => g.number == N)   │
│                                                          │
│  5. RENDER:                                               │
│     - Populate <title>, meta description                 │
│     - Render filter pills from books[].code              │
│     - Render book cards from books[].semesters[]         │
│     - Wire filter click handlers                         │
│     - Wire mobile menu                                   │
│     - Remove skeleton loader, show real cards            │
│                                                          │
│  6. ERROR: if grade not found in data, show specific     │
│     "no books for this grade" fallback (Phase 4).        │
└──────────────────────────────────────────────────────────┘
```

### Rendering Strategy for `book.html`

Instead of the current `book_template.html` approach of `innerHTML` string concatenation (which works but is messy), use a **`renderBookCard(item)` function** that returns a DOM element and appends it. This gives cleaner code and makes the skeleton/animation swap trivial:

```javascript
// Conceptual pseudocode:
function renderBookCard(book, semester, entranceIndex) {
  const card = document.createElement('div');
  // Apply all the existing book-card classes, cover gradients,
  // badge colors, download button with shimmer, entrance stagger
  card.className = 'book-card ... entrance-' + entranceIndex;
  card.dataset.subject = book.code;
  // ... build inner DOM structure matching current visual design exactly
  card.querySelector('a.btn-download').href = semester.url;
  return card;
}
```

The HTML body of `book.html` will be a **copy of `book_template.html`'s body** — stripped of the `GRADE_CONFIG` script but retaining all `<style>` blocks, Tailwind config, decorative orbs, navbar, filter section shell, books grid shell (empty `<div id="booksGrid">`), footer, and mobile menu. The JS engine will inject content into these shells.

---

## Phase 4: Edge Cases & Robustness

### 4.1 — Invalid Grade Parameter

**Triggers:**
- `?grade=99`
- `?grade=0`
- `?grade=-5`
- `?grade=abc`
- No `?grade` at all

**Handling:**
Show a styled error card centered on the page, matching the glass-morphism design language:

```
┌─────────────────────────────────────────┐
│  [⚠️ Icon — fa-circle-exclamation]      │
│                                         │
│  الصف غير موجود                         │
│  الرجاء اختيار صف من 1 إلى 12           │
│                                         │
│  [⬅️ العودة إلى الصفحة الرئيسية]        │
│      (glass button → index.html)        │
└─────────────────────────────────────────┘
```

Implementation: Before any fetch, validate `grade` with `parseInt()` + range check. If invalid, inject the error card into `#booksSection` and hide the filter bar. The navbar stays visible (branding + back-to-index link).

### 4.2 — Loading State (Fetch in Progress)

**Problem:** `index.html` loads books.json and renders the dashboard. `book.html` loads books.json and renders books. Both involve an async fetch. Without a loading state, the user sees an empty grid for 200-800ms — feels broken.

**Solution: Skeleton Loader Cards**

Render 8 placeholder "shimmer" cards immediately on page load, before the fetch fires. These are visually identical to real book cards but using pulse-animated gray gradients:

```
Real card: gradient cover, subject label, semester badge, download button
Skeleton: gray shimmer bars for cover area, text lines, button shape
```

The skeleton uses the existing `animate-shimmer` keyframe (already defined in Tailwind config). When the fetch resolves, replace skeletons with real cards using the entrance stagger animation (`.entrance-b-*` classes).

### 4.3 — Empty Grade (Valid grade number, but no books in JSON)

**Handling:**
If `grade.grades.find(g => g.number == N)` exists but `grade.books.length === 0`, show the existing empty-state design (already in `book_template.html` at line 502-509):

```
┌────────────────────────────────────────┐
│  [fa-book-open icon, 64px, muted]      │
│                                        │
│  لا توجد كتب متاحة لهذا الصف حالياً      │
│  يرجى التحقق لاحقاً                      │
└────────────────────────────────────────┘
```

### 4.4 — Fetch Failure (Network Error / 404 on books.json)

**Handling:**
Show a distinct error state with a retry button:

```
┌────────────────────────────────────────┐
│  [fa-cloud-bolt icon]                  │
│                                        │
│  حدث خطأ أثناء تحميل البيانات            │
│                                        │
│  [🔄 إعادة المحاولة]  ← refetches JSON  │
│  [⬅️ العودة للرئيسية]  → index.html     │
└────────────────────────────────────────┘
```

Implementation: `try/catch` around fetch, with an exponential-backoff retry (max 3 attempts, 1s/2s/4s delays) before showing the error state.

### 4.5 — URL Pattern for Data Derivation (Temporary)

Until `books.json` is fully enriched with per-semester `url` fields, the rendering engine can derive data from the flat entry's `title` string + `url` pattern:

- Parse `title`: split on ` - ` → `[subjectArabic, semesterArabic]`
- Parse `url`: match `/(\d+)_(\w+)_(\d+)\.pdf$/` → grade number, subject code, semester number
- Map subject code → icon, cover gradient, etc. using a static lookup table within the JS engine

This is a **transitional strategy** only. The long-term solution is enriching books.json.

### 4.6 — Browser Back/Forward Button

**`book.html`:** Already works — it's a standalone page with `?grade=N`. Browser history works natively.

**`index.html` SPA grade view:** Currently uses Alpine view-switching without URL updating. Should add `history.pushState` on `selectGrade()` to make browser back/forward work within the SPA. On `goToDashboard()`, use `history.pushState({}, '', window.location.pathname)` to clean the URL.

### 4.7 — Performance Optimization

- **`books.json` caching:** Use `sessionStorage` as a cache layer. On first fetch, store `JSON.stringify(data)` + timestamp. Subsequent loads (e.g., back/forward navigation) read from cache first, then revalidate with a stale-while-revalidate pattern.
- **`books.json` size:** Current payload is small (~3KB for 3 grades). Full 12 grades will be ~12KB. This is negligible — no pagination or lazy-loading needed.
- **Tailwind CDN purging:** The hidden `<div>` with pre-declared classes (lines 776-804 in `index.html`) must be replicated in `book.html` to ensure Tailwind's JIT compiler sees all dynamic color combinations (12 accent colors × shadow variants × badge variants).

---

## Phase 5: Implementation Sequence (Recommended Order)

This is the safe, rollback-friendly order of operations:

| Step | Action | Risk |
|---|---|---|
| 1 | **Enrich `books.json`** — add all 12 grades with structured metadata (subjects, codes, icons, gradients, badge classes, accent data, GitHub Release URLs per semester). This is the foundation. | Low — just data editing. |
| 2 | **Create `book.html`** — build the full dynamic template with skeleton loading, error handling, filter logic, mobile menu. **Test with `?grade=9`** against the enriched JSON. | Medium — net-new file, no existing pages broken. |
| 3 | **Refactor `index.html`** — replace inline `GRADES_DATA` with fetch from `books.json`. Change grade card links to `book.html?grade=N`. Add skeleton loading for dashboard. Keep the in-SPA grade view working. | Medium — the homepage is critical. Do NOT delete old grade files yet. |
| 4 | **QA all 12 grades** — test every `book.html?grade=1..12`, verify every download link resolves to a valid GitHub Release URL. | Low. |
| 5 | **Delete old files** — `1_book.html`…`12_book.html`, `book_template.html`, `style.css`. | Low — already unreferenced. |
| 6 | **Delete `books/grades/`** — optional cleanup. Only do this once all PDFs are confirmed hosted and accessible via GitHub Releases. | Low — but check GitHub Release links are live. |
| 7 | **Update `index.html` grade card counts** — verify the `+١٢٠` stat badge matches the actual total across all grades in `books.json`. | Low. |

---

## Phase 6: Verification Checklist

After implementation, verify:

- [ ] `index.html` loads without console errors
- [ ] Dashboard grade grid shows all 12 cards with correct colors, icons, counts
- [ ] Clicking any grade card navigates to `book.html?grade=N`
- [ ] `book.html?grade=5` renders correct books, correct accent color on download buttons
- [ ] `book.html?grade=abc` shows elegant error fallback
- [ ] `book.html?grade=99` shows elegant error fallback
- [ ] `book.html?grade=` (empty) shows elegant error fallback
- [ ] During fetches, skeleton shimmer cards appear
- [ ] Filter pills work (All / Arabic / Math / English / Chemistry / Physics / Islamic / History)
- [ ] Empty filter shows "no books" state
- [ ] Mobile hamburger menu works, includes filter shortcuts
- [ ] Browser back/forward works correctly
- [ ] Every download link resolves to a real downloadable PDF
- [ ] No 404 errors, no undefined links
- [ ] RTL layout, glass navbar, floating orbs, gradient text, shimmer buttons — all visually preserved
- [ ] All 12 accent colors render correctly across grades
- [ ] `books/grades/` local PDF directory is no longer accessed by any code

---

## Architectural Decisions Summary

| Decision | Rationale |
|---|---|
| Keep `index.html` as Alpine.js SPA | Already built, already works, already has in-SPA grade view. Minimal refactor — just replace inline data with fetch. |
| Make `book.html` a standalone vanilla JS page | Must be deep-linkable/bookmarkable. Vanilla JS avoids framework overhead for a single-purpose page. Matches the existing template's approach. |
| Enrich `books.json` with full structured metadata | Avoids fragile string-parsing at runtime. Single source of truth. Easy to edit/add grades. |
| Use `sessionStorage` cache for `books.json` | Both `index.html` and `book.html` fetch the same file. Cache avoids double-fetch when navigating between them. |
| NOT use a build system / bundler | Project is static HTML/CSS/JS. Adding a build step adds complexity with no benefit for this scale. |
| Preserve all CSS classes and inline `<style>` blocks exactly | Requirement: do not modify visual design. The `<style>` blocks, Tailwind config, entrance animations, glass classes, accent CSS custom properties, shimmer keyframes — all copied verbatim. |