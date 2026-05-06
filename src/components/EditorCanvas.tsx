import { useEffect, useRef, useState } from 'react';
import { useStore } from '../store/store';
import { renderTile, applyPatternScale, getBoundingRadius } from '../lib/render';
import { imageRegistry } from '../lib/imageRegistry';
import type { Layer } from '../types/pattern';

type DragState = {
  layerId: string;
  // Offset in tile space between cursor and the layer's rendered center.
  tileOffsetX: number;
  tileOffsetY: number;
} | null;

export function EditorCanvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [displaySize, setDisplaySize] = useState(600);
  const [drag, setDrag] = useState<DragState>(null);

  const tileSize = useStore((s) => s.tileSize);
  const background = useStore((s) => s.background);
  const patternScale = useStore((s) => s.patternScale);
  const patternTilt = useStore((s) => s.patternTilt);
  const layers = useStore((s) => s.layers);
  const palette = useStore((s) => s.palette);
  const snapToGrid = useStore((s) => s.snapToGrid);
  const gridSize = useStore((s) => s.gridSize);
  const updateLayer = useStore((s) => s.updateLayer);
  const selectLayer = useStore((s) => s.selectLayer);

  const [, setRegistryTick] = useState(0);
  useEffect(() => {
    return imageRegistry.subscribe(() => setRegistryTick((t) => t + 1));
  }, []);

  useEffect(() => {
    const update = () => {
      if (!containerRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      const size = Math.min(rect.width, rect.height);
      setDisplaySize(Math.max(200, size));
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

    renderTile(
      ctx,
      { tileSize, background, patternScale, patternTilt, layers, selectedId: null, palette, snapToGrid, gridSize },
      imageRegistry.getMap(),
    );

    if (snapToGrid && gridSize > 0) {
      // Draw lines at canvas resolution so 1 display-pixel = tileSize/displaySize canvas pixels.
      const px = tileSize / displaySize;
      ctx.save();
      ctx.strokeStyle = 'rgba(80, 80, 80, 0.22)';
      ctx.lineWidth = px;
      ctx.setLineDash([4 * px, 4 * px]);
      for (let x = gridSize; x < tileSize; x += gridSize) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, tileSize);
        ctx.stroke();
      }
      for (let y = gridSize; y < tileSize; y += gridSize) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(tileSize, y);
        ctx.stroke();
      }
      ctx.restore();
    }
  }, [tileSize, background, patternScale, patternTilt, layers, palette, snapToGrid, gridSize, displaySize]);

  // Convert a mouse event's client position to tile coordinates.
  function clientToTile(clientX: number, clientY: number): { tx: number; ty: number } {
    const canvas = canvasRef.current!;
    const rect = canvas.getBoundingClientRect();
    const mx = clientX - rect.left;
    const my = clientY - rect.top;
    const scale = tileSize / displaySize;
    return { tx: mx * scale, ty: my * scale };
  }

  // Find the topmost layer whose bounding circle contains the tile point.
  function hitTest(tx: number, ty: number): Layer | null {
    for (let i = layers.length - 1; i >= 0; i--) {
      const layer = layers[i];
      const { cx, cy, effectiveScale } = applyPatternScale(layer, tileSize, patternScale, patternTilt);
      const br = getBoundingRadius(layer, effectiveScale);
      if (Math.hypot(tx - cx, ty - cy) <= br) return layer;
    }
    return null;
  }

  function snap(v: number): number {
    if (!snapToGrid || gridSize <= 0) return v;
    return Math.round(v / gridSize) * gridSize;
  }

  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const { tx, ty } = clientToTile(e.clientX, e.clientY);
    const layer = hitTest(tx, ty);
    if (layer) {
      selectLayer(layer.id);
      const { cx, cy } = applyPatternScale(layer, tileSize, patternScale, patternTilt);
      setDrag({ layerId: layer.id, tileOffsetX: cx - tx, tileOffsetY: cy - ty });
    } else {
      selectLayer(null);
    }
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!drag) return;
    const { tx, ty } = clientToTile(e.clientX, e.clientY);
    // New tilted center in tile space.
    const newCxTilted = tx + drag.tileOffsetX;
    const newCyTilted = ty + drag.tileOffsetY;
    const center = tileSize / 2;
    // Inverse tilt: rotate by -patternTilt around tile center.
    let newCxScaled = newCxTilted;
    let newCyScaled = newCyTilted;
    if (patternTilt !== 0) {
      const rad = (-patternTilt * Math.PI) / 180;
      const cos = Math.cos(rad);
      const sin = Math.sin(rad);
      const dx = newCxTilted - center;
      const dy = newCyTilted - center;
      newCxScaled = center + dx * cos - dy * sin;
      newCyScaled = center + dx * sin + dy * cos;
    }
    // Inverse scale.
    const rawX = patternScale !== 0 ? center + (newCxScaled - center) / patternScale : newCxScaled;
    const rawY = patternScale !== 0 ? center + (newCyScaled - center) / patternScale : newCyScaled;
    updateLayer(drag.layerId, { x: snap(rawX), y: snap(rawY) });
  };

  const handleMouseUp = () => setDrag(null);
  const handleMouseLeave = () => setDrag(null);

  const cursorStyle = drag ? 'grabbing' : 'grab';

  return (
    <div className="editor-canvas-wrapper" ref={containerRef}>
      <div className="editor-canvas-frame" style={{ width: displaySize, height: displaySize }}>
        <canvas
          ref={canvasRef}
          width={tileSize}
          height={tileSize}
          style={{ width: displaySize, height: displaySize, cursor: cursorStyle }}
          className="editor-canvas"
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseLeave}
        />
      </div>
      <div className="editor-canvas-meta">
        {tileSize} × {tileSize} px
        {snapToGrid && <span className="editor-canvas-snap"> · snap {gridSize}px</span>}
      </div>
    </div>
  );
}
