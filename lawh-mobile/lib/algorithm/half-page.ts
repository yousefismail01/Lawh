/**
 * Half-page memorization unit calculator.
 *
 * Splits a mushaf page into two ayah-bounded memorization units
 * of ~7-8 lines, snapped to ayah boundaries in the 15-line
 * Madinah mushaf grid.
 *
 * Pure TypeScript — synchronous, no DB, no async.
 * Receives PageAyahLayout as input (pre-computed).
 */

import type {
  PageAyahLayout,
  AyahLineRange,
  MemorizationUnit,
  AyahBoundaryMode,
} from './types';
import { chapters } from '@/lib/data/mushafData';

/**
 * Look up surah name from the chapters data.
 */
function getSurahName(surahId: number): string {
  const ch = chapters[surahId];
  return ch?.nameSimple ?? `Surah ${surahId}`;
}

/**
 * Calculate a half-page memorization unit.
 *
 * @param layout - Pre-computed page layout with ayah positions
 * @param halfIndex - 0 for first half, 1 for second half
 * @param mode - 'round_down' snaps to last complete ayah before midpoint;
 *               'round_up' includes the ayah spanning the midpoint
 * @returns MemorizationUnit with concrete ayah boundaries
 */
export function calculateHalfPage(
  layout: PageAyahLayout,
  halfIndex: 0 | 1,
  mode: AyahBoundaryMode,
): MemorizationUnit {
  const { ayahs, headerLines, contentLines, page } = layout;

  // Edge case: no ayahs on page
  if (ayahs.length === 0) {
    return {
      surahId: 0,
      surahName: 'Unknown',
      startAyah: 0,
      endAyah: 0,
      mushafPage: page,
      halfIndex,
      lineCount: 0,
      isLongAyah: false,
    };
  }

  // Edge case: single ayah on the page (long ayah)
  if (ayahs.length === 1) {
    const ayah = ayahs[0];
    return {
      surahId: ayah.surahId,
      surahName: getSurahName(ayah.surahId),
      startAyah: ayah.ayahNumber,
      endAyah: ayah.ayahNumber,
      mushafPage: page,
      halfIndex,
      lineCount: ayah.lineCount,
      isLongAyah: ayah.lineCount > 10,
    };
  }

  // Edge case: short surah that fits entirely in <8 lines
  // (all ayahs belong to same surah and total content lines < 8)
  const allSameSurah = ayahs.every((a) => a.surahId === ayahs[0].surahId);
  if (allSameSurah && contentLines <= 8) {
    const totalLineCount = ayahs.reduce((sum, a) => sum + a.lineCount, 0);
    return {
      surahId: ayahs[0].surahId,
      surahName: getSurahName(ayahs[0].surahId),
      startAyah: ayahs[0].ayahNumber,
      endAyah: ayahs[ayahs.length - 1].ayahNumber,
      mushafPage: page,
      halfIndex,
      lineCount: totalLineCount,
      isLongAyah: false,
    };
  }

  // Compute midpoint line (absolute line number on the page)
  // The midpoint is half of contentLines, offset by headerLines
  const midpointLine = headerLines + Math.ceil(contentLines / 2);

  // Partition ayahs into first half and second half
  let splitIndex: number;

  if (mode === 'round_down') {
    // Include only ayahs whose lineEnd <= midpointLine
    splitIndex = 0;
    for (let i = 0; i < ayahs.length; i++) {
      if (ayahs[i].lineEnd <= midpointLine) {
        splitIndex = i + 1;
      }
    }
    // Ensure at least 1 ayah in each half if possible
    if (splitIndex === 0 && ayahs.length > 1) splitIndex = 1;
    if (splitIndex === ayahs.length && ayahs.length > 1) splitIndex = ayahs.length - 1;
  } else {
    // round_up: include ayahs whose lineStart <= midpointLine
    splitIndex = 0;
    for (let i = 0; i < ayahs.length; i++) {
      if (ayahs[i].lineStart <= midpointLine) {
        splitIndex = i + 1;
      }
    }
    // Ensure at least 1 ayah in each half if possible
    if (splitIndex === 0 && ayahs.length > 1) splitIndex = 1;
    if (splitIndex === ayahs.length && ayahs.length > 1) splitIndex = ayahs.length - 1;
  }

  // Select the relevant half
  const halfAyahs: AyahLineRange[] =
    halfIndex === 0 ? ayahs.slice(0, splitIndex) : ayahs.slice(splitIndex);

  // Build the memorization unit from the half's ayahs
  if (halfAyahs.length === 0) {
    // Fallback: shouldn't happen given the guards above
    const fallback = ayahs[halfIndex === 0 ? 0 : ayahs.length - 1];
    return {
      surahId: fallback.surahId,
      surahName: getSurahName(fallback.surahId),
      startAyah: fallback.ayahNumber,
      endAyah: fallback.ayahNumber,
      mushafPage: page,
      halfIndex,
      lineCount: fallback.lineCount,
      isLongAyah: fallback.lineCount > 10,
    };
  }

  const firstAyah = halfAyahs[0];
  const lastAyah = halfAyahs[halfAyahs.length - 1];
  const lineCount = halfAyahs.reduce((sum, a) => sum + a.lineCount, 0);

  // Use the first surah in the half for the unit's identity
  // (cross-surah pages use the first surah)
  return {
    surahId: firstAyah.surahId,
    surahName: getSurahName(firstAyah.surahId),
    startAyah: firstAyah.ayahNumber,
    endAyah: lastAyah.ayahNumber,
    mushafPage: page,
    halfIndex,
    lineCount,
    isLongAyah: ayahs.length === 1 && lineCount > 10,
  };
}
