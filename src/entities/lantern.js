const TILE_SIZE = 40;
const INTERACT_RADIUS_PX = TILE_SIZE * 1.5;

export function createLantern({ row, col }) {
  return {
    row,
    col,
    x: col * TILE_SIZE,
    y: row * TILE_SIZE,
  };
}

export function isNearLantern(lantern, point) {
  const centerX = lantern.x + TILE_SIZE / 2;
  const centerY = lantern.y + TILE_SIZE / 2;
  return Math.hypot(centerX - point.x, centerY - point.y) <= INTERACT_RADIUS_PX;
}
