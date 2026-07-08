const TILE_SIZE = 40;
const INTERACT_RADIUS_PX = TILE_SIZE * 1.5;

export function createNpc(data) {
  return {
    id: data.id,
    name: data.name,
    sprite: data.sprite,
    dialogue: data.dialogue,
    linkedItemId: data.linkedItemId,
    battleLevel: data.battleLevel,
    row: data.position.row,
    col: data.position.col,
    x: data.position.col * TILE_SIZE,
    y: data.position.row * TILE_SIZE,
    talked: false,
  };
}

export function findNearestNpc(npcs, point) {
  let nearest = null;
  let nearestDistance = Infinity;

  for (const npc of npcs) {
    const centerX = npc.x + TILE_SIZE / 2;
    const centerY = npc.y + TILE_SIZE / 2;
    const distance = Math.hypot(centerX - point.x, centerY - point.y);
    if (distance <= INTERACT_RADIUS_PX && distance < nearestDistance) {
      nearest = npc;
      nearestDistance = distance;
    }
  }

  return nearest;
}
