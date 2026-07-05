// Decorative night-time layer for Troy, ported from the Claude Design
// project 871fff35-1062-4627-9b71-3b88b201c323 (moon/lamp/grave structs +
// fog/night-tint). These are pure atmosphere — not tied to the tile grid
// or collision — drawn once per frame at fixed world positions chosen to
// stay clear of NPCs, items, and the lantern.

const GRAVE_ROWS = [
  "..gggg..",
  ".gggggg.",
  "gggggggg",
  "gg.CC.gg",
  "gg.CC.gg",
  "gCCCCCCg",
  "gg.CC.gg",
  "gg.CC.gg",
];
const GRAVE_MAP = { ".": null, g: "#8f8b82", C: "#5a564e" };

const LAMP_ROWS = [
  ".GGGG.",
  ".GllG.",
  ".GGGG.",
  "..pp..",
  "..pp..",
  "..pp..",
  "..pp..",
  "..pp..",
  "..pp..",
  "..pp..",
  "..pp..",
  "..pp..",
  ".bbbb.",
];
const LAMP_MAP = { ".": null, G: "#3a3f47", l: "#f0e6d2", p: "#2b2f36", b: "#20242a" };

function drawPixelGrid(ctx, rows, colorMap, ox, oy, unit) {
  for (let y = 0; y < rows.length; y += 1) {
    const row = rows[y];
    for (let x = 0; x < row.length; x += 1) {
      const color = colorMap[row[x]];
      if (!color) continue;
      ctx.fillStyle = color;
      ctx.fillRect(Math.round(ox + x * unit), Math.round(oy + y * unit), Math.ceil(unit), Math.ceil(unit));
    }
  }
}

function drawMoon(ctx, cx, cy) {
  ctx.fillStyle = "rgba(216, 208, 192, 0.14)";
  ctx.beginPath();
  ctx.arc(cx, cy, 42, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = "#d8d0c0";
  ctx.beginPath();
  ctx.arc(cx, cy, 24, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = "#22362a";
  ctx.beginPath();
  ctx.arc(cx + 10, cy - 8, 20, 0, Math.PI * 2);
  ctx.fill();
}

function drawLamp(ctx, x, y, unit) {
  const glow = ctx.createRadialGradient(x + 3 * unit, y + 2 * unit, 2, x + 3 * unit, y + 2 * unit, 50);
  glow.addColorStop(0, "rgba(240, 222, 178, 0.55)");
  glow.addColorStop(1, "rgba(240, 222, 178, 0)");
  ctx.fillStyle = glow;
  ctx.fillRect(x - 40, y - 30, 110, 110);
  drawPixelGrid(ctx, LAMP_ROWS, LAMP_MAP, x, y, unit);
}

function drawGrave(ctx, x, y, unit) {
  drawPixelGrid(ctx, GRAVE_ROWS, GRAVE_MAP, x, y, unit);
}

const LAMPS = [
  { x: 90, y: 90, unit: 5 },
  { x: 650, y: 140, unit: 5 },
];

const GRAVES = [
  { x: 90, y: 500, unit: 4 },
  { x: 460, y: 90, unit: 4 },
  { x: 230, y: 520, unit: 4 },
];

const FOG_PATCHES = [
  [200, 300, 90],
  [500, 200, 70],
  [650, 450, 85],
  [350, 480, 75],
];

export function drawTroyAtmosphere(ctx, width, height) {
  ctx.save();
  ctx.fillStyle = "rgba(20, 12, 34, 0.44)";
  ctx.fillRect(0, 0, width, height);
  ctx.restore();

  drawMoon(ctx, width - 60, 70);

  LAMPS.forEach(({ x, y, unit }) => drawLamp(ctx, x, y, unit));
  GRAVES.forEach(({ x, y, unit }) => drawGrave(ctx, x, y, unit));

  ctx.save();
  ctx.fillStyle = "rgba(200, 210, 215, 0.09)";
  FOG_PATCHES.forEach(([x, y, r]) => {
    ctx.beginPath();
    ctx.ellipse(x, y, r, r * 0.5, 0, 0, Math.PI * 2);
    ctx.fill();
  });
  ctx.restore();
}
