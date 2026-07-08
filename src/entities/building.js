// Enterable-building doors, placed on the overworld map. Position/interaction
// logic mirrors portal.js/deliveryPoint.js — the door itself has no collision
// footprint (same convention as the portal and delivery point), it's purely
// a visual + interact target.
const TILE_SIZE = 40;
const INTERACT_RADIUS_PX = TILE_SIZE * 1.5;

export function createBuildings(buildingsData) {
  return buildingsData.map((data) => ({
    id: data.id,
    name: data.name,
    npc: data.npc,
    hostName: data.hostName,
    quest: data.quest,
    mini: data.mini,
    floor: data.floor,
    wall: data.wall,
    accent: data.accent,
    art: data.art,
    row: data.door.row,
    col: data.door.col,
    x: data.door.col * TILE_SIZE,
    y: data.door.row * TILE_SIZE,
  }));
}

export function findNearestBuilding(buildings, point) {
  let nearest = null;
  let nearestDistance = Infinity;

  for (const building of buildings) {
    const centerX = building.x + TILE_SIZE / 2;
    const centerY = building.y + TILE_SIZE / 2;
    const distance = Math.hypot(centerX - point.x, centerY - point.y);
    if (distance <= INTERACT_RADIUS_PX && distance < nearestDistance) {
      nearest = building;
      nearestDistance = distance;
    }
  }

  return nearest;
}
