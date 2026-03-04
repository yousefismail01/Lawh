export const TAJWEED_COLORS = {
  madd_tabii:          '#aef',
  madd_wajib:          '#88f',
  madd_jaiz:           '#acf',
  madd_lazim:          '#66f',
  ghunnah:             '#fa8',
  idgham_ghunnah:      '#8f8',
  idgham_bila_ghunnah: '#6d6',
  iqlab:               '#f88',
  ikhfa:               '#fc8',
  qalqalah_sughra:     '#fd8',
  qalqalah_kubra:      '#fa0',
  tafkhim:             '#f68',
  waqf:                '#bbb',
} as const

export type TajweedRule = keyof typeof TAJWEED_COLORS
