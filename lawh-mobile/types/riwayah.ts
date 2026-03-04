export type Riwayah = 'hafs' | 'warsh' | 'qalun' | 'ad_duri'

export const RIWAYAT: Record<Riwayah, { label: string; available: boolean }> = {
  hafs:    { label: 'Hafs',    available: true  },
  warsh:   { label: 'Warsh',   available: false },
  qalun:   { label: 'Qalun',   available: false },
  ad_duri: { label: 'Ad-Duri', available: false },
}

export const DEFAULT_RIWAYAH: Riwayah = 'hafs'
