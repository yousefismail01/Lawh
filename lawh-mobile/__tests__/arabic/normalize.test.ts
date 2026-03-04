import { normalizeArabic } from '@/lib/arabic/normalize'

describe('normalizeArabic', () => {
  it('strips tashkeel diacritics', () => {
    expect(normalizeArabic('بِسْمِ')).toBe('بسم')
  })
  it('normalizes أ (alef with hamza above) → ا', () => {
    expect(normalizeArabic('أَهْل')).toBe('اهل')
  })
  it('normalizes إ (alef with hamza below) → ا', () => {
    expect(normalizeArabic('إِبْرَاهِيم')).toBe('ابراهيم')
  })
  it('normalizes آ (alef with madda) → ا', () => {
    expect(normalizeArabic('آمَنُوا')).toBe('امنوا')
  })
  it('normalizes ٱ (alef wasla) → ا', () => {
    // ٱلرَّحْمَٰن — alef wasla + shadda + kasra + other tashkeel
    expect(normalizeArabic('ٱلرَّحْمَٰن')).toBe('الرحمن')
  })
  it('normalizes ؤ → و', () => {
    expect(normalizeArabic('مُؤْمِن')).toBe('مومن')
  })
  it('normalizes ئ → ي', () => {
    expect(normalizeArabic('بِئْس')).toBe('بيس')
  })
  it('normalizes ة (ta marbuta) → ه', () => {
    expect(normalizeArabic('رَحْمَة')).toBe('رحمه')
  })
  it('normalizes ى (alef maqsura) → ي', () => {
    expect(normalizeArabic('هُدَى')).toBe('هدي')
  })
  it('strips tatweel (kashida elongation)', () => {
    expect(normalizeArabic('ر\u0640ب')).toBe('رب')
  })
  it('handles empty string safely', () => {
    expect(normalizeArabic('')).toBe('')
  })
  it('applies NFC normalization', () => {
    // Input already normalized — output should equal NFC form
    const input = 'الله'
    expect(normalizeArabic(input)).toBe(input.normalize('NFC'))
  })
})
