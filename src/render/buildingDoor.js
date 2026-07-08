// Small doorway signpost marking each enterable building on the overworld —
// styled after the Whispering Hollow Asset Atlas's parchment "sign" treatment.
const TILE_SIZE = 40;

function roundRect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

export function drawBuildingDoor(ctx, building) {
  const x = building.x;
  const y = building.y;
  const doorH = 34;
  const doorY = y + TILE_SIZE - doorH;

  ctx.fillStyle = "#2b2018";
  ctx.fillRect(x + 4, doorY, TILE_SIZE - 8, doorH);
  ctx.fillStyle = building.accent;
  ctx.fillRect(x + 8, doorY + 4, TILE_SIZE - 16, doorH - 4);
  ctx.fillStyle = "rgba(255,255,255,0.18)";
  ctx.fillRect(x + 8, doorY + 4, TILE_SIZE - 16, 4);
  ctx.fillStyle = "#f0e6d2";
  ctx.beginPath();
  ctx.arc(x + TILE_SIZE - 14, doorY + doorH / 2 + 4, 2, 0, Math.PI * 2);
  ctx.fill();

  const label = building.name.toUpperCase();
  ctx.font = "700 8px 'Silkscreen', monospace";
  ctx.textBaseline = "alphabetic";
  const signW = ctx.measureText(label).width + 10;
  const signH = 13;
  const signX = Math.round(x + TILE_SIZE / 2 - signW / 2);
  const signY = y - 10;

  ctx.fillStyle = "#2b2018";
  roundRect(ctx, signX - 2, signY - 2, signW + 4, signH + 4, 4);
  ctx.fill();
  const gradient = ctx.createLinearGradient(0, signY, 0, signY + signH);
  gradient.addColorStop(0, "#f4ead6");
  gradient.addColorStop(1, "#e6d5b6");
  ctx.fillStyle = gradient;
  roundRect(ctx, signX, signY, signW, signH, 3);
  ctx.fill();
  ctx.fillStyle = "#2b2018";
  ctx.textAlign = "center";
  ctx.fillText(label, x + TILE_SIZE / 2, signY + signH - 3);
  ctx.textAlign = "left";
}
