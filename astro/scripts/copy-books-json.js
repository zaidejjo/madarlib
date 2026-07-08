/**
 * Cross-platform script to copy books.json from workspace root
 * into astro/src/data/books.json before every build/dev run.
 *
 * Usage: node scripts/copy-books-json.js
 * Runs automatically via "prebuild" and "predev" npm scripts.
 */
import { copyFileSync, mkdirSync, existsSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const astroRoot = resolve(__dirname, '..');
const workspaceRoot = resolve(astroRoot, '..');

const source = resolve(workspaceRoot, 'books.json');
const destDir = resolve(astroRoot, 'src', 'data');
const dest = resolve(destDir, 'books.json');

if (!existsSync(source)) {
  console.error(`✗ books.json not found at ${source}`);
  process.exit(1);
}

if (!existsSync(destDir)) {
  mkdirSync(destDir, { recursive: true });
}

copyFileSync(source, dest);
console.log(`✓ books.json copied to src/data/books.json`);
