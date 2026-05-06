import { useRef, useState } from 'react';
import { useStore } from '../store/store';
import { exportPNG } from '../lib/export';
import { loadImageFile } from '../lib/imageRegistry';
import { PALETTE_PRESETS } from '../lib/palettes';
import type { Layer, ShapeKind } from '../types/pattern';

const SHAPE_KINDS: ShapeKind[] = ['circle', 'rectangle', 'triangle', 'star', 'heart'];

export function Sidebar() {
  const state = useStore();
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Layer drag-to-reorder state
  const [dragLayerIndex, setDragLayerIndex] = useState<number | null>(null);
  const [dropLayerIndex, setDropLayerIndex] = useState<number | null>(null);

  // Palette preset selection
  const [selectedPreset, setSelectedPreset] = useState('Default');

  const selectedLayer = state.layers.find((l) => l.id === state.selectedId);

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const { id, width, height } = await loadImageFile(file);
      state.addImageLayer(id, width, height);
    } catch (err) {
      console.error('Failed to load image', err);
    }
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleLayerDragStart = (i: number) => {
    setDragLayerIndex(i);
  };

  const handleLayerDragOver = (e: React.DragEvent, i: number) => {
    e.preventDefault();
    if (dragLayerIndex !== null && i !== dragLayerIndex) {
      setDropLayerIndex(i);
    }
  };

  const handleLayerDrop = (e: React.DragEvent, i: number) => {
    e.preventDefault();
    if (dragLayerIndex !== null && dragLayerIndex !== i) {
      state.reorderLayers(dragLayerIndex, i);
    }
    setDragLayerIndex(null);
    setDropLayerIndex(null);
  };

  const handleLayerDragEnd = () => {
    setDragLayerIndex(null);
    setDropLayerIndex(null);
  };

  return (
    <aside className="sidebar">
      <header className="sidebar-header">
        <h1 className="sidebar-title">Pattern Studio</h1>
      </header>

      <Section title="Canvas">
        <Field label="Tile size (px)">
          <input
            type="number"
            min={500}
            max={6000}
            step={100}
            value={state.tileSize}
            onChange={(e) => state.setTileSize(Number(e.target.value) || 2000)}
            className="input"
          />
        </Field>
        <Field label="Background">
          <ColorInput
            value={state.background}
            onChange={(c) => state.setBackground(c)}
          />
        </Field>
        <Field label={`Pattern scale (${state.patternScale.toFixed(2)}×)`}>
          <input
            type="range"
            min={0.25}
            max={3}
            step={0.05}
            value={state.patternScale}
            onChange={(e) => state.setPatternScale(Number(e.target.value))}
            className="slider"
          />
        </Field>
        <Field label={`Pattern tilt (${state.patternTilt}°)`}>
          <input
            type="range"
            min={0}
            max={360}
            step={1}
            value={state.patternTilt}
            onChange={(e) => state.setPatternTilt(Number(e.target.value))}
            className="slider"
          />
        </Field>
        <div className="snap-row">
          <label className="snap-label">
            <input
              type="checkbox"
              checked={state.snapToGrid}
              onChange={(e) => state.setSnapToGrid(e.target.checked)}
              className="snap-checkbox"
            />
            Snap to grid
          </label>
          {state.snapToGrid && (
            <input
              type="number"
              value={state.gridSize}
              min={10}
              max={500}
              step={10}
              onChange={(e) => state.setGridSize(Number(e.target.value) || 50)}
              className="input snap-grid-size"
              title="Grid size (tile px)"
            />
          )}
        </div>
      </Section>

      <Section title="Palette">
        <Field label="Preset">
          <select
            value={selectedPreset}
            onChange={(e) => {
              const name = e.target.value;
              if (name === 'custom') return;
              setSelectedPreset(name);
              const preset = PALETTE_PRESETS.find((p) => p.name === name)!;
              preset.colors.forEach((color, i) => state.setPaletteColor(i, color));
            }}
            className="input"
          >
            {selectedPreset === 'custom' && <option value="custom">— Custom —</option>}
            {PALETTE_PRESETS.map((p) => (
              <option key={p.name} value={p.name}>{p.name}</option>
            ))}
          </select>
        </Field>
        <div className="palette-fixed-row">
          <div className="palette-fixed-swatch" style={{ background: '#000000' }} title="Black" />
          <div className="palette-fixed-swatch" style={{ background: '#ffffff' }} title="White" />
          <span className="palette-fixed-label">Always included</span>
        </div>
        {state.palette.map((color, i) => (
          <div key={i} className="palette-edit-row">
            <span className="palette-edit-index">{i + 1}</span>
            <input
              type="color"
              value={color}
              onChange={(e) => { state.setPaletteColor(i, e.target.value); setSelectedPreset('custom'); }}
              className="color-picker"
            />
            <input
              type="text"
              value={color}
              onChange={(e) => { state.setPaletteColor(i, e.target.value); setSelectedPreset('custom'); }}
              className="input color-hex"
            />
          </div>
        ))}
      </Section>

      <Section title="Add">
        <div className="button-grid">
          {SHAPE_KINDS.map((kind) => (
            <button
              key={kind}
              className="add-button"
              onClick={() => state.addShape(kind)}
            >
              {kind}
            </button>
          ))}
        </div>
        <button
          className="add-button add-button--full"
          onClick={() => fileInputRef.current?.click()}
        >
          upload image
        </button>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/png,image/svg+xml"
          onChange={handleUpload}
          style={{ display: 'none' }}
        />
      </Section>

      <Section title={`Layers (${state.layers.length})`}>
        {state.layers.length === 0 ? (
          <div className="hint">No layers yet. Add a shape above.</div>
        ) : (
          <ul className="layer-list">
            {state.layers.map((layer, i) => {
              const isDragging = dragLayerIndex === i;
              const isDropTarget = dropLayerIndex === i && dragLayerIndex !== null && dragLayerIndex !== i;
              const dropAbove = isDropTarget && dragLayerIndex !== null && dragLayerIndex > i;
              const dropBelow = isDropTarget && dragLayerIndex !== null && dragLayerIndex < i;
              return (
                <li
                  key={layer.id}
                  className={
                    'layer-row' +
                    (layer.id === state.selectedId ? ' layer-row--active' : '') +
                    (isDragging ? ' layer-row--dragging' : '') +
                    (dropAbove ? ' layer-row--drop-above' : '') +
                    (dropBelow ? ' layer-row--drop-below' : '')
                  }
                  draggable
                  onDragStart={() => handleLayerDragStart(i)}
                  onDragOver={(e) => handleLayerDragOver(e, i)}
                  onDrop={(e) => handleLayerDrop(e, i)}
                  onDragEnd={handleLayerDragEnd}
                  onClick={() => state.selectLayer(layer.id)}
                >
                  <span className="layer-drag-handle" title="Drag to reorder">⠿</span>
                  <span className="layer-row-index">{i + 1}</span>
                  <span className="layer-row-kind">{layer.kind}</span>
                  <button
                    className="layer-row-delete"
                    onClick={(e) => {
                      e.stopPropagation();
                      state.deleteLayer(layer.id);
                    }}
                    aria-label="Delete layer"
                  >
                    ×
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </Section>

      {selectedLayer && (
        <Section title="Selected layer">
          <LayerInspector layer={selectedLayer} />
        </Section>
      )}

      <div className="sidebar-footer">
        <button
          className="export-button"
          onClick={() => exportPNG(state)}
          disabled={state.layers.length === 0}
        >
          Export PNG
        </button>
      </div>
    </aside>
  );
}

function Section({
  title,
  children,
  defaultOpen = true,
}: {
  title: string;
  children: React.ReactNode;
  defaultOpen?: boolean;
}) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <section className="section">
      <button className="section-header" onClick={() => setOpen((o) => !o)}>
        <span className="section-title">{title}</span>
        <span className={'section-chevron' + (open ? ' section-chevron--open' : '')} />
      </button>
      {open && <div className="section-body">{children}</div>}
    </section>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="field">
      <span className="field-label">{label}</span>
      {children}
    </label>
  );
}

function ColorInput({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const palette = useStore((s) => s.palette);
  const swatches = ['#000000', '#ffffff', ...palette];

  return (
    <div className="color-input-wrap">
      <div className="color-input">
        <input
          type="color"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="color-picker"
        />
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="input color-hex"
        />
      </div>
      <div className="palette-swatches">
        {swatches.map((c) => (
          <button
            key={c}
            className={
              'palette-swatch' +
              (c.toLowerCase() === value.toLowerCase() ? ' palette-swatch--active' : '')
            }
            style={{ background: c }}
            onClick={() => onChange(c)}
            title={c}
            type="button"
          />
        ))}
      </div>
    </div>
  );
}

function LayerInspector({ layer }: { layer: Layer }) {
  const updateLayer = useStore((s) => s.updateLayer);
  const tileSize = useStore((s) => s.tileSize);

  const update = (patch: Partial<Layer>) => updateLayer(layer.id, patch);

  return (
    <>
      <div className="field-row">
        <Field label="X">
          <input
            type="number"
            value={Math.round(layer.x)}
            min={-tileSize}
            max={tileSize * 2}
            onChange={(e) => update({ x: Number(e.target.value) })}
            className="input"
          />
        </Field>
        <Field label="Y">
          <input
            type="number"
            value={Math.round(layer.y)}
            min={-tileSize}
            max={tileSize * 2}
            onChange={(e) => update({ y: Number(e.target.value) })}
            className="input"
          />
        </Field>
      </div>
      <div className="field-row">
        <Field label="Rotation°">
          <input
            type="number"
            value={Math.round(layer.rotation)}
            onChange={(e) => update({ rotation: Number(e.target.value) })}
            className="input"
          />
        </Field>
        <Field label="Scale">
          <input
            type="number"
            step={0.1}
            min={0.1}
            value={layer.scale}
            onChange={(e) => update({ scale: Number(e.target.value) || 1 })}
            className="input"
          />
        </Field>
      </div>

      {layer.kind === 'circle' && (
        <Field label="Radius">
          <input
            type="number"
            value={Math.round(layer.radius)}
            onChange={(e) => update({ radius: Number(e.target.value) })}
            className="input"
          />
        </Field>
      )}
      {layer.kind === 'rectangle' && (
        <div className="field-row">
          <Field label="Width">
            <input
              type="number"
              value={Math.round(layer.width)}
              onChange={(e) => update({ width: Number(e.target.value) })}
              className="input"
            />
          </Field>
          <Field label="Height">
            <input
              type="number"
              value={Math.round(layer.height)}
              onChange={(e) => update({ height: Number(e.target.value) })}
              className="input"
            />
          </Field>
        </div>
      )}
      {layer.kind === 'triangle' && (
        <Field label="Radius">
          <input
            type="number"
            value={Math.round(layer.radius)}
            onChange={(e) => update({ radius: Number(e.target.value) })}
            className="input"
          />
        </Field>
      )}
      {layer.kind === 'star' && (
        <>
          <div className="field-row">
            <Field label="Points">
              <input
                type="number"
                min={3}
                max={20}
                value={layer.points}
                onChange={(e) => update({ points: Number(e.target.value) || 5 })}
                className="input"
              />
            </Field>
          </div>
          <div className="field-row">
            <Field label="Outer R">
              <input
                type="number"
                value={Math.round(layer.outerRadius)}
                onChange={(e) => update({ outerRadius: Number(e.target.value) })}
                className="input"
              />
            </Field>
            <Field label="Inner R">
              <input
                type="number"
                value={Math.round(layer.innerRadius)}
                onChange={(e) => update({ innerRadius: Number(e.target.value) })}
                className="input"
              />
            </Field>
          </div>
        </>
      )}
      {layer.kind === 'heart' && (
        <Field label="Radius">
          <input
            type="number"
            value={Math.round(layer.radius)}
            onChange={(e) => update({ radius: Number(e.target.value) })}
            className="input"
          />
        </Field>
      )}
      {layer.kind === 'image' && (
        <div className="field-row">
          <Field label="Width">
            <input
              type="number"
              value={Math.round(layer.width)}
              onChange={(e) => update({ width: Number(e.target.value) })}
              className="input"
            />
          </Field>
          <Field label="Height">
            <input
              type="number"
              value={Math.round(layer.height)}
              onChange={(e) => update({ height: Number(e.target.value) })}
              className="input"
            />
          </Field>
        </div>
      )}

      {layer.kind !== 'image' && (
        <Field label="Fill">
          <ColorInput
            value={layer.fill}
            onChange={(c) => update({ fill: c } as Partial<Layer>)}
          />
        </Field>
      )}
    </>
  );
}
