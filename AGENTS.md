# GitHub Books Repository - Agent Guide

## Overview
Static HTML/CSS website for downloading Arabic school textbooks (grades 8-11). No build system, tests, or backend.

## Common Commands

### View the site locally
Open any HTML file directly in a browser:
- Homepage: `index.html`
- Grade pages: `8_book.html`, `9_book.html`, `10_book.html`, `11_book.html`

### Adding new books
1. Place PDF files in `/books/` directory following naming convention: `{grade}_{subject}_{term}.pdf`
   - Example: `9_math_1.pdf` (grade 9, math, term 1)
2. Update corresponding grade HTML file with new book card:
   ```html
   <div class="book-card">
     <div class="book-content">
       <h3>Arabic Grade 9 Term 1</h3>
       <a download="books/9_ar_1.pdf" class="download-btn" href="books/9_ar_1.pdf" target="_blank">Download Book</a>
     </div>
   </div>
   ```

## Conventions
- All HTML files link to `style.css` in the same directory
- Navigation: Use `index.html` for home, grade pages link back with left arrow SVG
- Download links use `download` attribute and `target="_blank"`
- Book cards follow consistent structure in HTML files
- No JavaScript or frameworks used

## File Organization
- Root: HTML files, CSS, logo image
- `/books/`: PDF textbooks organized by grade and subject
- No build artifacts, dependencies, or configuration files