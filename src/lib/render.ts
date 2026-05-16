import type {
  Layer,
  PatternState,
  CircleLayer,
  RectangleLayer,
  TriangleLayer,
  StarLayer,
  FlowerLayer,
  ImageLayer,
} from '../types/pattern';

// --- Seamless wrap ---
// Given a layer's center (x,y) and a conservative bounding RADIUS (the largest
// distance from center to any point of the transformed shape), this returns
// the set of offset positions at which to draw the shape so that it tiles
// seamlessly. A shape entirely inside the tile returns one offset of (0,0).
// A shape clipping the right edge returns (0,0) and (-tileSize, 0). A shape
// clipping the bottom-right corner returns four offsets.
export function getWrapOffsets(
  cx: number,
  cy: number,
  boundingRadius: number,
  tileSize: number,
): Array<{ dx: number; dy: number }> {
  const offsets: Array<{ dx: number; dy: number }> = [{ dx: 0, dy: 0 }];

  const crossesLeft = cx - boundingRadius < 0;
  const crossesRight = cx + boundingRadius > tileSize;
  const crossesTop = cy - boundingRadius < 0;
  const crossesBottom = cy + boundingRadius > tileSize;

  if (crossesLeft) offsets.push({ dx: tileSize, dy: 0 });
  if (crossesRight) offsets.push({ dx: -tileSize, dy: 0 });
  if (crossesTop) offsets.push({ dx: 0, dy: tileSize });
  if (crossesBottom) offsets.push({ dx: 0, dy: -tileSize });

  // Corner cases: if the shape crosses two adjacent edges, also add the
  // diagonal offset so the corner wraps correctly.
  if (crossesLeft && crossesTop) offsets.push({ dx: tileSize, dy: tileSize });
  if (crossesRight && crossesTop) offsets.push({ dx: -tileSize, dy: tileSize });
  if (crossesLeft && crossesBottom) offsets.push({ dx: tileSize, dy: -tileSize });
  if (crossesRight && crossesBottom) offsets.push({ dx: -tileSize, dy: -tileSize });

  return offsets;
}

// --- Effective transform ---
// Pattern scale scales positions AND sizes around the tile center.
// A layer at (x,y) with patternScale=2 ends up positioned at:
//   center + (x - center) * 2
// and its size is also doubled.
export function applyPatternScale(
  layer: Layer,
  tileSize: number,
  patternScale: number,
  patternTilt = 0,
): { cx: number; cy: number; effectiveScale: number } {
  const center = tileSize / 2;
  let cx = center + (layer.x - center) * patternScale;
  let cy = center + (layer.y - center) * patternScale;
  if (patternTilt !== 0) {
    const rad = (patternTilt * Math.PI) / 180;
    const cos = Math.cos(rad);
    const sin = Math.sin(rad);
    const dx = cx - center;
    const dy = cy - center;
    cx = center + dx * cos - dy * sin;
    cy = center + dx * sin + dy * cos;
  }
  const effectiveScale = layer.scale * patternScale;
  return { cx, cy, effectiveScale };
}

// --- Bounding radius per shape kind ---
// A conservative upper bound on how far any point of the shape can be from
// its center, after rotation and scale. Rotation doesn't change this since
// we're computing a circle, which is rotation-invariant.
export function getBoundingRadius(layer: Layer, effectiveScale: number): number {
  switch (layer.kind) {
    case 'circle':
      return layer.radius * effectiveScale;
    case 'rectangle':
      return Math.hypot(layer.width, layer.height) * 0.5 * effectiveScale;
    case 'triangle':
      return layer.radius * effectiveScale;
    case 'star':
      return layer.outerRadius * effectiveScale;
    case 'heart':
      // The heart fits in a 2r x 2r box but the bottom point extends to ~r
      // below center; the diagonal to a corner is r*sqrt(2).
      return layer.radius * Math.SQRT2 * effectiveScale;
    case 'flower':
      return (Math.max(0, layer.coreRadius) + layer.petalRadius) * effectiveScale;
    case 'image':
      return Math.hypot(layer.width, layer.height) * 0.5 * effectiveScale;
  }
}

// --- Path builders ---
// Each shape is drawn centered at (0,0) in its own local coordinate system.
// The render loop translates/rotates/scales the context before calling these.

function pathCircle(ctx: CanvasRenderingContext2D, layer: CircleLayer) {
  ctx.beginPath();
  ctx.arc(0, 0, layer.radius, 0, Math.PI * 2);
}

function pathRectangle(ctx: CanvasRenderingContext2D, layer: RectangleLayer) {
  ctx.beginPath();
  ctx.rect(-layer.width / 2, -layer.height / 2, layer.width, layer.height);
}

function pathTriangle(ctx: CanvasRenderingContext2D, layer: TriangleLayer) {
  // Equilateral triangle, point up, vertices on the circle of radius r.
  const r = layer.radius;
  ctx.beginPath();
  for (let i = 0; i < 3; i++) {
    const angle = -Math.PI / 2 + (i * 2 * Math.PI) / 3;
    const x = Math.cos(angle) * r;
    const y = Math.sin(angle) * r;
    if (i === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  }
  ctx.closePath();
}

function pathStar(ctx: CanvasRenderingContext2D, layer: StarLayer) {
  const { points, outerRadius, innerRadius } = layer;
  ctx.beginPath();
  for (let i = 0; i < points * 2; i++) {
    const r = i % 2 === 0 ? outerRadius : innerRadius;
    const angle = -Math.PI / 2 + (i * Math.PI) / points;
    const x = Math.cos(angle) * r;
    const y = Math.sin(angle) * r;
    if (i === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  }
  ctx.closePath();
}

function pathFlower(ctx: CanvasRenderingContext2D, layer: FlowerLayer) {
  const { petals, petalRadius, coreRadius } = layer;
  const halfR = petalRadius * 0.5;
  const narrowR = petalRadius * 0.35;
  // coreRadius pushes petal centers outward, creating a gap at the center.
  // At 0 petals meet at the origin; larger values open a ring.
  const petalDist = Math.max(0, coreRadius) + halfR;
  ctx.beginPath();
  for (let i = 0; i < petals; i++) {
    const angle = (i * 2 * Math.PI) / petals - Math.PI / 2;
    const cx = Math.cos(angle) * petalDist;
    const cy = Math.sin(angle) * petalDist;
    // rotation = angle - π/2 so radiusY (long axis) points radially outward
    const rotation = angle - Math.PI / 2;
    // moveTo the ellipse's parametric t=0 point to avoid connecting lines between petals
    ctx.moveTo(cx + narrowR * Math.cos(rotation), cy + narrowR * Math.sin(rotation));
    ctx.ellipse(cx, cy, narrowR, halfR, rotation, 0, Math.PI * 2);
  }
}

function fillShape(ctx: CanvasRenderingContext2D, layer: Layer) {
  switch (layer.kind) {
    case 'circle':
      pathCircle(ctx, layer);
      ctx.fillStyle = layer.fill;
      ctx.fill();
      break;
    case 'rectangle':
      pathRectangle(ctx, layer);
      ctx.fillStyle = layer.fill;
      ctx.fill();
      break;
    case 'triangle':
      pathTriangle(ctx, layer);
      ctx.fillStyle = layer.fill;
      ctx.fill();
      break;
    case 'star':
      pathStar(ctx, layer);
      ctx.fillStyle = layer.fill;
      ctx.fill();
      break;
    case 'flower':
      pathFlower(ctx, layer);
      ctx.fillStyle = layer.fill;
      ctx.fill();
      break;
    case 'heart':
      // Heart needs both halves filled. Build full path explicitly.
      ctx.beginPath();
      {
        const r = layer.radius;
        ctx.moveTo(0, -r * 0.3);
        ctx.bezierCurveTo(-r * 0.6, -r * 1.0, -r * 1.2, -r * 0.4, 0, r * 0.8);
        ctx.bezierCurveTo(r * 1.2, -r * 0.4, r * 0.6, -r * 1.0, 0, -r * 0.3);
        ctx.closePath();
      }
      ctx.fillStyle = layer.fill;
      ctx.fill();
      break;
    case 'image':
      // Handled separately in renderLayer below.
      break;
  }
}

// --- Layer drawing with seamless wrap ---
// Draws a single layer onto the given context, wrapping across tile edges
// as needed.
export function renderLayer(
  ctx: CanvasRenderingContext2D,
  layer: Layer,
  state: PatternState,
  imageRegistry: Map<string, HTMLImageElement>,
) {
  const { tileSize, patternScale, patternTilt = 0 } = state;
  const { cx, cy, effectiveScale } = applyPatternScale(layer, tileSize, patternScale, patternTilt);
  const boundingRadius = getBoundingRadius(layer, effectiveScale);
  const offsets = getWrapOffsets(cx, cy, boundingRadius, tileSize);

  for (const { dx, dy } of offsets) {
    ctx.save();
    ctx.translate(cx + dx, cy + dy);
    ctx.rotate(((layer.rotation + patternTilt) * Math.PI) / 180);
    ctx.scale(effectiveScale, effectiveScale);

    if (layer.kind === 'image') {
      const img = imageRegistry.get((layer as ImageLayer).imageId);
      if (img) {
        ctx.drawImage(
          img,
          -layer.width / 2,
          -layer.height / 2,
          layer.width,
          layer.height,
        );
      }
    } else {
      fillShape(ctx, layer);
    }

    ctx.restore();
  }
}

// --- Full canvas render ---
// Clears, fills background, then renders each layer in order.
export function renderTile(
  ctx: CanvasRenderingContext2D,
  state: PatternState,
  imageRegistry: Map<string, HTMLImageElement>,
) {
  const { tileSize, background, layers } = state;

  // Background.
  ctx.fillStyle = background;
  ctx.fillRect(0, 0, tileSize, tileSize);

  // Clip to the tile so wrapped portions of shapes don't bleed past edges.
  ctx.save();
  ctx.beginPath();
  ctx.rect(0, 0, tileSize, tileSize);
  ctx.clip();

  for (const layer of layers) {
    renderLayer(ctx, layer, state, imageRegistry);
  }

  ctx.restore();
}
