import { useEffect, useRef, useState } from 'react';
import { useStore } from '../store/store';
import { renderTile } from '../lib/render';
import { imageRegistry } from '../lib/imageRegistry';

// Renders a 3x3 grid of the tile to verify seamless wrapping. The center
// cell is the "true" tile; surrounding cells are exact copies. If the tile
// is correctly seamless, edges between cells should be invisible.
export function TilePreview() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [displaySize, setDisplaySize] = useState(300);

  const tileSize = useStore((s) => s.tileSize);
  const background = useStore((s) => s.background);
  const patternScale = useStore((s) => s.patternScale);
  const patternTilt = useStore((s) => s.patternTilt);
  const layers = useStore((s) => s.layers);
  const palette = useStore((s) => s.palette);
  const snapToGrid = useStore((s) => s.snapToGrid);
  const gridSize = useStore((s) => s.gridSize);

  const [, setRegistryTick] = useState(0);
  useEffect(() => {
    return imageRegistry.subscribe(() => setRegistryTick((t) => t + 1));
  }, []);

  useEffect(() => {
    const update = () => {
      if (!containerRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      const size = Math.min(rect.width, rect.height);
      setDisplaySize(Math.max(150, size));
    };
    update();
    const ro = new ResizeObserver(update);
    if (containerRef.current) ro.observe(containerRef.current);
    return () => ro.disconnect();
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const offscreen = document.createElement('canvas');
    offscreen.width = tileSize;
    offscreen.height = tileSize;
    const offCtx = offscreen.getContext('2d');
    if (!offCtx) return;

    renderTile(
      offCtx,
      { tileSize, background, patternScale, patternTilt, layers, selectedId: null, palette, snapToGrid, gridSize },
      imageRegistry.getMap(),
    );

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    for (let row = 0; row < 3; row++) {
      for (let col = 0; col < 3; col++) {
        ctx.drawImage(offscreen, col * tileSize, row * tileSize, tileSize, tileSize);
      }
    }
  }, [tileSize, background, patternScale, patternTilt, layers, palette, snapToGrid, gridSize]);

  return (
    <div className="tile-preview-wrapper" ref={containerRef}>
      <div className="tile-preview-label">Tiled preview (3 × 3)</div>
      <div className="tile-preview-frame" style={{ width: displaySize, height: displaySize }}>
        <canvas
          ref={canvasRef}
          width={tileSize * 3}
          height={tileSize * 3}
          style={{ width: displaySize, height: displaySize }}
          className="tile-preview-canvas"
        />
      </div>
    </div>
  );
}
