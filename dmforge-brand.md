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

Gradients: CTA/flame `linear-gradient(135deg,#FF4D6D,#FF7A3D)` · hero text `#FF4D6D → #FFB347 → #6B5BFF`
Radius: `12px` (UI). App icon uses a larger ~22% tile radius.

## Type

Display: **Space Grotesk** (500/600/700, letter-spacing -0.02em) · Body: **Inter**

## Logo files

- App icon / favicon / LinkedIn: `dmforge-icon-512.png` (square). Sizes 32–1024 + `dmforge-icon.svg`.
- Transparent mark (on light/photos): `dmforge-mark-*.png` / `.svg`
- Wordmark: `dmforge-wordmark-dark.png` (primary, dark UI), `-onlight.png` (light bg), `-white.png` (photos)
- `favicon.ico` (multi-size)

## Fix before /design-sync (token bug found in repo)

`tailwind.config.js` maps `hsl(var(--primary))` etc., but `globals.css` defines `--primary` as a **hex**
and uses `--bg` (not `--background`), so shadcn color utilities (`bg-primary`, `bg-background`…) resolve to
invalid CSS and don't work. Either (a) convert the `:root` vars to HSL triples the shadcn config expects,
or (b) drop the `hsl()` wrapper and reference the hex vars directly. The live site works only via the
hand-rolled `.btn-primary` / `.grad-text` classes and inline `bg-[#0B0B1A]`.
