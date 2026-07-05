const COOLDOWN_MS = 1500;

export function createEventTracker() {
  return { lastTileKey: null, lastTriggerTime: -Infinity };
}

// Fires onTrigger when the player enters a walkable-event tile, as long as
// it's a different tile than the last one that fired (so walking back and
// forth over the same stump doesn't spam the effect) and the cooldown has
// elapsed.
export function checkTileEvents(tracker, tileType, row, col, now, onTrigger) {
  if (tileType.kind !== "walkable-event") {
    tracker.lastTileKey = null;
    return;
  }

  const tileKey = `${row},${col}`;
  if (tileKey === tracker.lastTileKey) return;
  if (now - tracker.lastTriggerTime < COOLDOWN_MS) return;

  tracker.lastTileKey = tileKey;
  tracker.lastTriggerTime = now;
  onTrigger({ row, col, name: tileType.name });
}
