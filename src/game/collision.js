export function tileTypeAt(map, row, col) {
  if (row < 0 || col < 0 || row >= map.rows || col >= map.cols) {
    return { name: "tree", kind: "blocked" };
  }
  const tileValue = map.tiles[row][col];
  return map.tileTypes[String(tileValue)] || { name: "tree", kind: "blocked" };
}

export function tileKindAt(map, row, col) {
  return tileTypeAt(map, row, col).kind;
}

// Samples the four corners of a bounding box (in pixel space) against the
// map and returns true if any corner lands on a blocked tile.
export function isBoxBlocked(map, x, y, width, height) {
  const { tileSize } = map;
  const corners = [
    [x, y],
    [x + width - 1, y],
    [x, y + height - 1],
    [x + width - 1, y + height - 1],
  ];

  return corners.some(([px, py]) => {
    const col = Math.floor(px / tileSize);
    const row = Math.floor(py / tileSize);
    return tileKindAt(map, row, col) === "blocked";
  });
}

export function tileTypeAtPixel(map, x, y) {
  const col = Math.floor(x / map.tileSize);
  const row = Math.floor(y / map.tileSize);
  return tileTypeAt(map, row, col);
}
