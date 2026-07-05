// Generic "return your found items here" object — rendered differently per
// world (lantern in Troy, vault in UWM, Big M in Ann Arbor) but identical in
// position/interaction logic.
const TILE_SIZE = 40;
const INTERACT_RADIUS_PX = TILE_SIZE * 1.5;

export function createDeliveryPoint({ row, col }) {
  return {
    row,
    col,
    x: col * TILE_SIZE,
    y: row * TILE_SIZE,
  };
}

export function isNearDeliveryPoint(deliveryPoint, point) {
  const centerX = deliveryPoint.x + TILE_SIZE / 2;
  const centerY = deliveryPoint.y + TILE_SIZE / 2;
  return Math.hypot(centerX - point.x, centerY - point.y) <= INTERACT_RADIUS_PX;
}
