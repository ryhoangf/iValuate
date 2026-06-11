# Brand logos

Place one logo file per brand in this folder. Files are served from `/brands/{id}.{ext}`.

These **10 brands** appear in the market header (fixed order):

Apple · Samsung · Sony · SHARP · Google · Xiaomi · OPPO · Huawei · ASUS · Realme

## Filename

Use the brand **`id`** (lowercase slug), for example:

| File | Brand |
|------|-------|
| `apple.webp` | Apple |
| `samsung.webp` | Samsung |
| `sony.webp` | Sony |
| `sharp.webp` | SHARP |
| `google.webp` | Google |
| `xiaomi.webp` | Xiaomi |
| `oppo.webp` | OPPO |
| `huawei.webp` | Huawei |
| `asus.webp` | ASUS |
| `realme.webp` | Realme |

**Recommended format: WebP** (`.webp`). Also supported: `.png`, `.svg` (tried in that order if WebP is missing).

## Image specs (banner style)

| Property | Value |
|----------|-------|
| Recommended canvas | **240×50 px** |
| Retina | **480×100 px** optional |
| Format | **WebP** with **transparent** background (PNG/SVG OK) |
| Aspect ratio | Wide horizontal banner (~**4.8:1**) |

## How it is rendered in the UI

- **Logo only** — no text label; the tile is clickable.
- Layout: **10 columns on desktop**, **5×2 grid on mobile** — full width, **no horizontal scroll**.
- Display height: **28–32 px**; width fills each cell (`object-contain`).
- Missing file: small text fallback until you add the logo.

Do **not** bake extra padding into the artwork; keep the logo centered on the canvas.
