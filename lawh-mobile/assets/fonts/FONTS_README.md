# Required Font Files

This directory must contain the following font files before the app can render Arabic Quran text:

## KFGQPCHafs.ttf (Primary Uthmanic Script)

- **Source:** https://quran.gov.sa or KFGQPC website
- **License:** Free for Quran applications
- **Purpose:** Primary font for rendering Uthmanic Quran text with full tashkeel

## AmiriQuran.ttf (Fallback)

- **Source:** https://github.com/aliftype/amiri
- **License:** OFL (Open Font License)
- **Purpose:** Fallback Arabic font optimized for Quran text rendering

## Setup

1. Download both font files from the sources above
2. Place them in this directory (`assets/fonts/`)
3. Uncomment the `useFonts` call in `app/_layout.tsx`
4. Remove the `const fontsLoaded = true` placeholder line
