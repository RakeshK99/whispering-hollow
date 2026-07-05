const TILE_SIZE = 40;
const INTERACT_RADIUS_PX = TILE_SIZE * 1.5;

export function createShrine({ row, col }) {
  return {
    row,
    col,
    x: col * TILE_SIZE,
    y: row * TILE_SIZE,
  };
}

export function isNearShrine(shrine, point) {
  const centerX = shrine.x + TILE_SIZE / 2;
  const centerY = shrine.y + TILE_SIZE / 2;
  return Math.hypot(centerX - point.x, centerY - point.y) <= INTERACT_RADIUS_PX;
}
