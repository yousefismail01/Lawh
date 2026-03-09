/**
 * Ayah-to-line mapping for mushaf pages.
 *
 * Derives AyahLineRange data from the existing QPC V4 layout DB
 * and words JSON, enabling the half-page calculator to work with
 * concrete ayah positions on each page's 15-line grid.
 *
 * Pure TypeScript — no UI dependencies.
 */

import type { AyahLineRange, PageAyahLayout } from './types';

// --- Words JSON lookup (lazy, shared with quranService) ---

// eslint-disable-next-line @typescript-eslint/no-require-imports
const wordsJson = require('@/assets/qpc-v4-words.json');

interface WordEntry {
  id: number;
  surah: string;
  ayah: string;
  word: string;
  location: string;
  text: string;
}

let _wordById: Map<number, WordEntry> | null = null;

function getWordById(): Map<number, WordEntry> {
  if (_wordById) return _wordById;
  _wordById = new Map<number, WordEntry>();
  for (const entry of Object.values(wordsJson as Record<string, WordEntry>)) {
    _wordById.set(entry.id, entry);
  }
  return _wordById;
}

// --- Line data types (matches layout DB schema) ---

export interface LayoutLine {
  line_number: number;
  line_type: string;       // 'ayah' | 'surah_name' | 'basmallah'
  first_word_id: number;
  surah_number?: number;   // only set for surah_name lines
}

/**
 * Build PageAyahLayout from pre-fetched line data (synchronous).
 * This is the primary function used by the half-page calculator and tests.
 *
 * @param page - Mushaf page number (1-604)
 * @param lines - Line data from the layout DB for this page
 */
export function buildPageAyahLayoutFromLines(
  page: number,
  lines: LayoutLine[],
): PageAyahLayout {
  const wordMap = getWordById();
  const ayahs: AyahLineRange[] = [];
  let headerLines = 0;

  // Sort by line number
  const sorted = [...lines].sort((a, b) => a.line_number - b.line_number);

  for (const line of sorted) {
    if (line.line_type === 'surah_name' || line.line_type === 'basmallah') {
      headerLines++;
      continue;
    }

    if (line.line_type !== 'ayah') continue;

    // Look up the word to get surah:ayah
    const word = wordMap.get(line.first_word_id);
    if (!word) continue;

    const surahId = Number(word.surah);
    const ayahNumber = Number(word.ayah);

    // Check if this line continues the previous ayah
    const last = ayahs.length > 0 ? ayahs[ayahs.length - 1] : null;
    if (last && last.surahId === surahId && last.ayahNumber === ayahNumber) {
      // Extend the existing range
      last.lineEnd = line.line_number;
      last.lineCount = last.lineEnd - last.lineStart + 1;
    } else {
      // New ayah range
      ayahs.push({
        surahId,
        ayahNumber,
        lineStart: line.line_number,
        lineEnd: line.line_number,
        lineCount: 1,
      });
    }
  }

  const contentLines = 15 - headerLines;

  return { page, ayahs, headerLines, contentLines };
}

/**
 * Build PageAyahLayout by querying the layout DB (async).
 * Uses the same DB access pattern as quranService.ts.
 *
 * @param page - Mushaf page number (1-604)
 */
export async function buildPageAyahLayout(page: number): Promise<PageAyahLayout> {
  // Dynamic import to avoid circular dependency with quranService
  const { openDatabaseSync, importDatabaseFromAssetAsync } = await import('expo-sqlite');

  const LAYOUT_DB_NAME = 'qpc-v4-layout.db';
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const LAYOUT_DB_ASSET = require('@/assets/qpc-v4-layout.db');

  await importDatabaseFromAssetAsync(LAYOUT_DB_NAME, {
    assetId: LAYOUT_DB_ASSET,
    forceOverwrite: false,
  });

  const db = openDatabaseSync(LAYOUT_DB_NAME);
  const rows = db.getAllSync<{
    line_number: number;
    line_type: string;
    first_word_id: number;
    surah_number: number | null;
  }>(
    'SELECT line_number, line_type, first_word_id, surah_number FROM pages WHERE page_number = ? ORDER BY line_number',
    [page],
  );

  const lines: LayoutLine[] = rows.map((row) => ({
    line_number: row.line_number,
    line_type: row.line_type,
    first_word_id: row.first_word_id,
    surah_number: row.surah_number ?? undefined,
  }));

  return buildPageAyahLayoutFromLines(page, lines);
}

/**
 * Batch-load page layouts for multiple pages.
 *
 * @param pages - Array of mushaf page numbers
 * @returns Map from page number to PageAyahLayout
 */
export async function preloadPageLayouts(
  pages: number[],
): Promise<Map<number, PageAyahLayout>> {
  const result = new Map<number, PageAyahLayout>();
  // Load sequentially to reuse DB connection
  for (const page of pages) {
    const layout = await buildPageAyahLayout(page);
    result.set(page, layout);
  }
  return result;
}
