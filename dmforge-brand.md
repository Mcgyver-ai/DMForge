# DMForge — brand tokens (verified from app/globals.css)

## Colors

| token | hex | use |
|---|---|---|
| primary (coral) | `#FF4D6D` | brand primary, "DM" in wordmark, tile start |
| primary-hover | `#FF6B85` | hover |
| orange | `#FF7A3D` | CTA gradient end, tile end |
| accent (purple) | `#6B5BFF` | secondary accent |
| amber | `#FBBF24` | flame core, warnings |
| ink / bg | `#0B0B1A` | app background |
| surface / surface-2 | `#161630` / `#1F1F42` | cards |
| border | `#2A2A55` | borders |
| text / muted | `#F5F5FA` / `#A0A0C8` | text |

Gradients: none — `.grad-text`/`.grad-bg` removed in the anti-slop pass (2026-07-07); featured surfaces
use `.elevate-coral`/`.elevate-purple` tinted elevation instead. `.btn-primary` is solid coral.
Radius: `12px` (UI). App icon uses a larger ~22% tile radius.

## Type

Display: **Fraunces** (500/600/700) · Body: **IBM Plex Sans** (400/500/600)

## Logo files

- App icon / favicon / LinkedIn: `dmforge-icon-512.png` (square). Sizes 32–1024 + `dmforge-icon.svg`.
- Transparent mark (on light/photos): `dmforge-mark-*.png` / `.svg`
- Wordmark: `dmforge-wordmark-dark.png` (primary, dark UI), `-onlight.png` (light bg), `-white.png` (photos)
- `favicon.ico` (multi-size)

## Token bug — FIXED (2026-07-07)

`globals.css` now defines the full shadcn token set as HSL triples (`--background: 240 41% 7%` etc.),
so `bg-primary`, `bg-card`, `border-border`… resolve correctly. The old hex vars, `.grad-text`,
`.glow-coral`/`.glow-purple` and `.grad-bg` were removed per `.impeccable.md` (anti-slop pass);
featured surfaces use `.elevate-coral`/`.elevate-purple` tinted elevation instead, and `.btn-primary`
is solid coral with near-navy text for WCAG AA.
