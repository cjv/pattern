# Pattern Studio

Local-only seamless pattern generator. Square tiles (default 2000×2000), configurable canvas size, exports to PNG ready for Spoonflower or Printful.

## Run

```
npm install
npm run dev
```

Open the URL Vite prints (usually `http://localhost:5173`).

## Architecture

- **`src/lib/render.ts`** — Core render logic and the seamless wrap utility (`getWrapOffsets`). Every shape and image goes through `renderLayer`, which redraws the shape at offset positions whenever it crosses a tile edge. This is the load-bearing piece.
- **`src/types/pattern.ts`** — Discriminated union of layer types.
- **`src/store/store.ts`** — Zustand store. The export function (`exportPNG`) is a pure function of state, so multi-colorway export in V3 will be straightforward.
- **`src/lib/imageRegistry.ts`** — HTMLImageElements held outside the serializable store.
- **`src/lib/export.ts`** — PNG export at full resolution.
- **`src/components/`** — React UI: Sidebar, EditorCanvas, TilePreview.

## Notes for V2/V3

- Pattern scale is applied at render time, not stored on layers. Layer transforms remain "natural" — easy to swap palettes (V3) without recomputing geometry.
- Fill colors are stored as hex strings on layers. For V3 colorways, you'll want to refactor to named palette refs (e.g. `fill: 'primary'`) before things get scattered.
- Export is `exportPNG(state)`. Multi-colorway export in V3: `palettes.map(p => exportPNG({...state, palette: p}))`.

## Print service notes

Both Spoonflower and Printful work from pixel dimensions, not embedded PNG DPI metadata, so no `pHYs` chunk is needed.

- 2000×2000 px → 13.3" repeat at Spoonflower (they enforce 150 DPI on upload)
- 2000×2000 px → 6.67" at 300 DPI for Printful phone cases / stickers
- For wallpaper, set the canvas to 3600×3600 (Spoonflower wallpaper width is 24" × 150 DPI = 3600 px)
