import { create } from 'zustand';
import type { Layer, PatternState, ShapeKind } from '../types/pattern';

interface Actions {
  setTileSize: (size: number) => void;
  setBackground: (color: string) => void;
  setPatternScale: (scale: number) => void;
  addShape: (kind: ShapeKind) => void;
  addImageLayer: (imageId: string, width: number, height: number) => void;
  updateLayer: (id: string, updates: Partial<Layer>) => void;
  deleteLayer: (id: string) => void;
  selectLayer: (id: string | null) => void;
  setPaletteColor: (index: number, color: string) => void;
  setPatternTilt: (tilt: number) => void;
  setSnapToGrid: (snap: boolean) => void;
  setGridSize: (size: number) => void;
  reorderLayers: (fromIndex: number, toIndex: number) => void;
}

export type Store = PatternState & Actions;

function uid() {
  return `layer_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

// Default size for new shapes — sized as a fraction of the tile so a 2000px
// tile gets ~200px shapes, and a 4000px tile gets ~400px shapes. Looks
// proportional regardless of canvas size.
function defaultShapeSize(tileSize: number) {
  return tileSize * 0.1;
}

export const useStore = create<Store>((set, get) => ({
  tileSize: 2000,
  background: '#f4ede4',
  patternScale: 1,
  layers: [],
  selectedId: null,
  palette: ['#b14444', '#2a7848', '#1c4880', '#d4941c'],
  patternTilt: 0,
  snapToGrid: false,
  gridSize: 50,

  setTileSize: (size) => set({ tileSize: size }),
  setBackground: (color) => set({ background: color }),
  setPatternScale: (scale) => set({ patternScale: scale }),
  setPaletteColor: (index, color) =>
    set({ palette: get().palette.map((c, i) => (i === index ? color : c)) }),
  setPatternTilt: (tilt) => set({ patternTilt: tilt }),
  setSnapToGrid: (snap) => set({ snapToGrid: snap }),
  setGridSize: (size) => set({ gridSize: size }),
  reorderLayers: (fromIndex, toIndex) => {
    const layers = [...get().layers];
    const [moved] = layers.splice(fromIndex, 1);
    layers.splice(toIndex, 0, moved);
    set({ layers });
  },

  addShape: (kind) => {
    const { tileSize, layers } = get();
    const size = defaultShapeSize(tileSize);
    const center = tileSize / 2;
    const id = uid();

    let layer: Layer;
    const base = {
      id,
      x: center,
      y: center,
      rotation: 0,
      scale: 1,
    };

    switch (kind) {
      case 'circle':
        layer = { ...base, kind: 'circle', radius: size, fill: '#2a2520' };
        break;
      case 'rectangle':
        layer = {
          ...base,
          kind: 'rectangle',
          width: size * 2,
          height: size * 2,
          fill: '#2a2520',
        };
        break;
      case 'triangle':
        layer = { ...base, kind: 'triangle', radius: size, fill: '#2a2520' };
        break;
      case 'star':
        layer = {
          ...base,
          kind: 'star',
          points: 5,
          outerRadius: size,
          innerRadius: size * 0.4,
          fill: '#2a2520',
        };
        break;
      case 'heart':
        layer = { ...base, kind: 'heart', radius: size, fill: '#b14444' };
        break;
      case 'flower':
        layer = {
          ...base,
          kind: 'flower',
          petals: 6,
          petalRadius: size,
          coreRadius: 0,
          fill: '#e87c9e',
        };
        break;
    }

    set({ layers: [...layers, layer], selectedId: id });
  },

  addImageLayer: (imageId, width, height) => {
    const { tileSize, layers } = get();
    const center = tileSize / 2;
    const id = uid();
    // Scale image down if larger than ~30% of tile.
    const maxDim = tileSize * 0.3;
    const naturalScale = Math.min(1, maxDim / Math.max(width, height));
    const layer: Layer = {
      id,
      kind: 'image',
      x: center,
      y: center,
      rotation: 0,
      scale: 1,
      imageId,
      width: width * naturalScale,
      height: height * naturalScale,
    };
    set({ layers: [...layers, layer], selectedId: id });
  },

  updateLayer: (id, updates) => {
    set({
      layers: get().layers.map((l) =>
        l.id === id ? ({ ...l, ...updates } as Layer) : l,
      ),
    });
  },

  deleteLayer: (id) => {
    const { layers, selectedId } = get();
    set({
      layers: layers.filter((l) => l.id !== id),
      selectedId: selectedId === id ? null : selectedId,
    });
  },

  selectLayer: (id) => set({ selectedId: id }),
}));
