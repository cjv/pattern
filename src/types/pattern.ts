// Core data model.
// Every layer has a common transform; the `kind` discriminates shape-specific data.
// Pattern scale is intentionally NOT stored on layers — it's applied at render time
// so it can be toggled cleanly without mutating layer data.

export type ShapeKind = 'circle' | 'rectangle' | 'triangle' | 'star' | 'heart';
export type LayerKind = ShapeKind | 'image';

interface BaseLayer {
  id: string;
  // Position in tile coordinates (0,0 to tileSize, tileSize). Center of the shape.
  x: number;
  y: number;
  // Rotation in degrees, clockwise.
  rotation: number;
  // Per-layer scale multiplier. The "natural" size (radius/width/height) is
  // multiplied by this AND by the global patternScale at render time.
  scale: number;
}

export interface CircleLayer extends BaseLayer {
  kind: 'circle';
  radius: number;
  fill: string;
}

export interface RectangleLayer extends BaseLayer {
  kind: 'rectangle';
  width: number;
  height: number;
  fill: string;
}

export interface TriangleLayer extends BaseLayer {
  kind: 'triangle';
  // Equilateral triangle defined by the radius of its circumscribed circle.
  radius: number;
  fill: string;
}

export interface StarLayer extends BaseLayer {
  kind: 'star';
  points: number; // e.g. 5
  outerRadius: number;
  innerRadius: number;
  fill: string;
}

export interface HeartLayer extends BaseLayer {
  kind: 'heart';
  // Heart sized to fit in a square of side 2*radius.
  radius: number;
  fill: string;
}

export interface ImageLayer extends BaseLayer {
  kind: 'image';
  // The HTMLImageElement is held in a side-table so it doesn't get serialized.
  // We store the source id; the resolver looks up the bitmap.
  imageId: string;
  // Natural width/height of the underlying image, in tile pixels at scale=1.
  width: number;
  height: number;
}

export type Layer =
  | CircleLayer
  | RectangleLayer
  | TriangleLayer
  | StarLayer
  | HeartLayer
  | ImageLayer;

export interface PatternState {
  tileSize: number; // e.g. 2000
  background: string;
  patternScale: number; // global multiplier, applied around tile center
  layers: Layer[];
  selectedId: string | null;
  palette: string[]; // 4 user-defined colors; black & white are always included implicitly
  patternTilt: number; // degrees, rotates the whole pattern around the tile center
  snapToGrid: boolean;
  gridSize: number; // snap grid in tile pixels
}
