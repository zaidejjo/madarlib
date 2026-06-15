# GitHub Books Repository — Agent Guide

Static HTML/CSS/JS website for downloading Arabic school textbooks (grades 1–12). No build system, tests, or backend.

## View the site locally

Open any HTML file directly in a browser:
- **Homepage:** `index.html`
- **Grade pages:** `1_book.html` … `12_book.html`

## Adding a new grade page

1. Copy the template: `cp book_template.html {n}_book.html`
2. Edit only the `GRADE_CONFIG` JavaScript object near the top of the new file:
   - `number`, `nameArabic`, `nameEnglish`, `slug`, `accentColor`
   - Expand the `books` array if needed
3. Place PDFs in `books/grades/{n}/` following the path pattern: `books/grades/{grade}/{grade}_{subjectCode}_{semester}.pdf`
   - Subject codes: `ar` (Arabic), `math`, `en` (English), `ch` (Chemistry), `ph` (Physics)
   - Semester: `1` (الفصل الأول) or `2` (الفصل الثاني)
   - Example: `books/grades/9/9_ar_1.pdf`
4. Update the grade card count badge on `index.html` (the `<span>` showing "١٠ كتب") if the book count changed.

## Adding books to an existing grade

- Place the PDF in `books/grades/{n}/` using the naming convention above.
- The grade page auto-discovers books from its `GRADE_CONFIG.books` array. If the subject+semester combination doesn't exist in the config, add it there.
- No need to edit the HTML body — the JavaScript engine renders cards dynamically.

## Architecture notes

- **Two eras:** The site was rewritten. `style.css` at root is **legacy** (old fire/neon theme) and is not linked from any current HTML file. All current pages use CDN Tailwind and inline `<style>` blocks.
- **Universal template:** All 12 grade pages (`{n}_book.html`) derive from `book_template.html`. They share identical structure — only the `GRADE_CONFIG` JS object differs.
- **Tailwind via CDN** (`https://cdn.tailwindcss.com`), configured via inline `tailwind.config` in `<script>`.
- **Font Awesome 6.5.1** via CDN for icons.
- **RTL layout:** All pages have `<html lang="ar" dir="rtl">`.
- **No external CSS file is linked** in any current page.
- **JavaScript** drives card rendering, filtering, entrance animations, and the mobile menu. The `.js-hidden` class prevents FOUC (flash of unstyled content) until JS loads.
- **Download links** use both `download="{path}"` and `target="_blank"`.

## Gotchas

- `accentColor` in `GRADE_CONFIG` only maps to `cyan`, `blue`, `emerald`, `violet` in the JS engine. Grades 1 (uses `sky`) and 12 (uses `fuchsia`) use values outside the map, which fall back to `text-blue-400` silently — check the download button hover colors if adding new accent values.
- The `book_template.html` header comment still says "cp book_template.html 8_book.html" — it now covers grades 1–12.
- When updating the book count badge on `index.html`, the number uses Arabic-Indic digits (١٢٣ not 123).
- The `books/` (flat) directory is also legacy — only `books/grades/{n}/` is actively used.
