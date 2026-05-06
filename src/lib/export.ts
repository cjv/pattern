import type { PatternState } from '../types/pattern';
import { renderTile } from './render';
import { imageRegistry } from './imageRegistry';

// Renders the current state onto a fresh full-resolution canvas and triggers
// a PNG download. Always renders at tileSize regardless of display canvas
// scaling, so the export is lossless.
export async function exportPNG(state: PatternState): Promise<void> {
  const canvas = document.createElement('canvas');
  canvas.width = state.tileSize;
  canvas.height = state.tileSize;

  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Could not get 2D context for export');

  renderTile(ctx, state, imageRegistry.getMap());

  const blob = await new Promise<Blob>((resolve, reject) => {
    canvas.toBlob((b) => {
      if (b) resolve(b);
      else reject(new Error('toBlob failed'));
    }, 'image/png');
  });

  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `pattern-${state.tileSize}x${state.tileSize}.png`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
