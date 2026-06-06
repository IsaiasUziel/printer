# Print Layout Builder

A web app for composing multi-page print documents where each page tiles a single image N times across a letter, A4, or Legal sheet — ready to export as PDF via the browser print dialog.

**Live demo → [printer-lovat.vercel.app](https://printer-lovat.vercel.app)**

---

## What it does

- **Add pages** — each page holds one image repeated a configurable number of times
- **Auto grid** — the optimal column × row layout is calculated automatically to maximize image size for the given paper format and aspect ratio
- **Upload methods** — drag & drop, file picker, or paste from clipboard (`Cmd/Ctrl+V`)
- **Paper formats** — Carta (Letter 8.5×11″), A4 (210×297 mm), Legal (8.5×14″)
- **Configurable margin** — global margin in mm applied to all pages
- **Image fit** — *contain* (full image visible) or *cover* (fills cell, crops if needed)
- **Live size info** — shows the exact printed dimensions of each image in cm
- **Export to PDF** — uses the browser print dialog; set margins to *None* for best results

## Usage

1. Open the app and click **+ New page**
2. Upload an image (drag, click, or paste)
3. Set how many copies per page with the `−` / `+` controls
4. Adjust the margin and paper format from the header
5. Repeat for as many pages as needed
6. Click the **floating printer button** (bottom-right) → *Save to PDF* in the print dialog

> **Tip:** In the browser print dialog, select **Margins → None** to let the app control all spacing.

## Local development

```bash
# Install dependencies
npm install

# Start dev server at http://localhost:4321
npm run dev

# Build for production
npm run build
```

## Stack

| Layer | Technology |
|---|---|
| Framework | [Astro 5](https://astro.build) |
| UI | [React 18](https://react.dev) + TypeScript |
| Styling | Plain CSS with `@media print` |
| PDF export | Browser Print API (`window.print()`) |
| Deploy | [Vercel](https://vercel.com) |

## How the grid algorithm works

Given `count` images and an image aspect ratio, the algorithm tests every possible column count (1 → count) and picks the layout that maximizes the ratio of fitted-image area to cell area:

```
score = min(cellAR / imgAR, imgAR / cellAR)  →  1.0 = perfect fit
```

The winning `cols` value determines `rows = ceil(count / cols)`.
