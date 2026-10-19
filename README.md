# Ashraful Kabir Alif — portfolio v3

Personal site of Ashraful Kabir Alif, AI researcher and ML engineer in Dhaka.
The theme is **signal from noise**: a dark "observatory" look, halftone dot fields, and one accent colour (Bangladesh-flag red).

## Stack

- React 18 + Vite 6 + TypeScript
- Tailwind CSS v4. The design tokens live in `src/styles/index.css`.
- `motion` for animation, `lenis` for smooth scrolling, `cmdk` for the ⌘K palette
- Fonts are self-hosted with Fontsource: Bricolage Grotesque, Geist, Geist Mono, Instrument Serif and Anek Bangla.
- The build prerenders the page to static HTML (`scripts/prerender.mjs`), so content and SEO work before JavaScript loads.

## Editing content

All text, numbers, links, projects and papers are in **`src/content/site.ts`**. Edit that file; the components only handle layout.

## Commands

```bash
pnpm install
pnpm dev          # http://localhost:5173
pnpm build        # client build + SSR prerender → dist/
pnpm preview      # serve dist/
pnpm typecheck
```

Dev-only URL flags:

- `?only=research` renders one section by itself
- `&nointro` skips the intro
- `&theme=light` forces the light theme

## Deploy

On Vercel, use the Vite preset: build command `pnpm build`, output directory `dist`.

## Structure

```
src/
  content/site.ts        all copy and data
  styles/index.css       tokens, utilities, fonts
  lib/                   hooks, scroll bus, theme, intro, motion pause
  components/
    primitives/          Reveal, SectionHeader, Magnetic, ScrambleText, Ticker, Bits
    chrome/              Nav, CommandPalette (+ lazy dialog), ThemeToggle, CursorLabel, SmoothScroll, Intro, Footer
    sections/            Hero, FocusTicker, Research, Builds, Papers, Path, About, Contact
    hero/ research/ builds/ papers/ path/ about/ contact/
public/                  favicon, og.jpg, llms.txt, robots.txt
design-references/       inspiration images (not shipped)
```

## Bangla font subset

`src/assets/fonts/anek-bangla-sub.woff2` is Anek Bangla cut down to the Bengali letters the site actually uses, which brings it to about 6 KB. If you add Bengali text with new letters, the build fails and tells you which ones are missing. To fix it, regenerate the subset with [fonttools](https://github.com/fonttools/fonttools) (`pip install fonttools brotli`):

```bash
pyftsubset node_modules/@fontsource-variable/anek-bangla/files/anek-bangla-bengali-wght-normal.woff2 --text="$(cat src/assets/fonts/anek-bangla-sub.chars.txt)NEW_LETTERS" --unicodes="U+200C-200D,U+25CC" --layout-features='*' --flavor=woff2 --output-file=src/assets/fonts/anek-bangla-sub.woff2
```

Then add the new letters to `anek-bangla-sub.chars.txt`.
