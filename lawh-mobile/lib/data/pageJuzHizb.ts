// Auto-generated from quran-metadata-juz.sqlite, quran-metadata-hizb.sqlite, quran-metadata-rub.sqlite
// Page-to-Juz/Hizb/Quarter mapping for the Madinah Mushaf (604 pages)
// Each juz = 2 hizb, each hizb = 4 rub (quarters)

// Juz start pages (30 entries)
export const JUZ_START_PAGES = [
  1, 22, 42, 62, 82, 102, 121, 142, 162, 182,
  201, 222, 242, 262, 282, 302, 322, 342, 362, 382,
  402, 422, 442, 462, 482, 502, 522, 542, 562, 582,
]

// Hizb start pages (60 entries)
export const HIZB_START_PAGES = [
  1, 11, 22, 32, 42, 51, 62, 72, 82, 92,
  102, 112, 121, 132, 142, 151, 162, 173, 182, 192,
  201, 212, 222, 231, 242, 252, 262, 272, 282, 292,
  302, 312, 322, 332, 342, 352, 362, 371, 382, 392,
  402, 413, 422, 431, 442, 451, 462, 472, 482, 491,
  502, 513, 522, 531, 542, 553, 562, 572, 582, 591,
]

// Rub el-hizb (quarter) start pages (240 entries)
export const RUB_START_PAGES = [
  1, 5, 7, 9, 11, 14, 17, 19, 22, 24, 27, 29, 32, 34, 37, 39,
  42, 44, 46, 49, 51, 54, 56, 59, 62, 64, 67, 69, 72, 74, 77, 79,
  82, 84, 87, 89, 92, 94, 97, 100, 102, 104, 106, 109, 112, 114, 117, 119,
  121, 124, 126, 129, 132, 134, 137, 140, 142, 144, 146, 148, 151, 154, 156, 158,
  162, 164, 167, 170, 173, 175, 177, 179, 182, 184, 187, 189, 192, 194, 196, 199,
  201, 204, 206, 209, 212, 214, 217, 219, 222, 224, 226, 228, 231, 233, 236, 238,
  242, 244, 247, 249, 252, 254, 256, 259, 262, 264, 267, 270, 272, 275, 277, 280,
  282, 284, 287, 289, 292, 295, 297, 299, 302, 304, 306, 309, 312, 315, 317, 319,
  322, 324, 326, 329, 332, 334, 336, 339, 342, 344, 347, 350, 352, 354, 356, 359,
  362, 364, 367, 369, 371, 374, 377, 379, 382, 384, 386, 389, 392, 394, 396, 399,
  402, 404, 407, 410, 413, 415, 418, 420, 422, 425, 426, 429, 431, 433, 436, 439,
  442, 444, 446, 449, 451, 454, 456, 459, 462, 464, 467, 469, 472, 474, 477, 479,
  482, 484, 486, 488, 491, 493, 496, 499, 502, 505, 507, 510, 513, 515, 517, 519,
  522, 524, 526, 529, 531, 534, 536, 539, 542, 544, 547, 550, 553, 554, 558, 560,
  562, 564, 566, 569, 572, 575, 577, 579, 582, 585, 587, 589, 591, 594, 596, 600,
]

export interface PageJuzHizb {
  juz: number
  hizb: number
  quarter: number // 0-3 (how many quarters completed within this hizb)
}

function findIndex(arr: number[], page: number): number {
  for (let i = arr.length - 1; i >= 0; i--) {
    if (page >= arr[i]) return i
  }
  return 0
}

export function getPageJuzHizb(page: number): PageJuzHizb {
  const juz = findIndex(JUZ_START_PAGES, page) + 1
  const hizb = findIndex(HIZB_START_PAGES, page) + 1
  const rubIdx = findIndex(RUB_START_PAGES, page)
  const quarter = rubIdx % 4 // 0=start of hizb, 1=¼, 2=½, 3=¾

  return { juz, hizb, quarter }
}
