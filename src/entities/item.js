const TILE_SIZE = 40;
const PICKUP_RADIUS_PX = TILE_SIZE * 0.9;

export function createItem(data) {
  return {
    id: data.id,
    name: data.name,
    icon: data.icon,
    shape: data.shape,
    rarity: data.rarity,
    revealedBy: data.revealedBy,
    secret: Boolean(data.secret),
    row: data.position.row,
    col: data.position.col,
    x: data.position.col * TILE_SIZE,
    y: data.position.row * TILE_SIZE,
  };
}

export function isItemRevealed(item, talkedNpcIds) {
  if (!item.revealedBy) return true;
  return talkedNpcIds.has(item.revealedBy);
}

export function findCollectableItemAt(items, point, collectedIds, talkedNpcIds) {
  return items.find((item) => {
    if (collectedIds.has(item.id)) return false;
    if (!isItemRevealed(item, talkedNpcIds)) return false;
    const centerX = item.x + TILE_SIZE / 2;
    const centerY = item.y + TILE_SIZE / 2;
    return Math.hypot(centerX - point.x, centerY - point.y) <= PICKUP_RADIUS_PX;
  });
}
