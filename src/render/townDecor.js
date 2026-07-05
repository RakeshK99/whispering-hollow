// Static building decoration for UWM and Ann Arbor, ported from the Claude
// Design project 871fff35-1062-4627-9b71-3b88b201c323. These sit on top of
// the "buildingBlock" (blocked) filler tiles in each world's map.json — the
// filler tiles handle collision, this handles the actual artwork.
const TILE_SIZE = 40;

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

function shade(hex, factor) {
  const n = parseInt(hex.slice(1), 16);
  const r = Math.round(((n >> 16) & 255) * factor);
  const g = Math.round(((n >> 8) & 255) * factor);
  const b = Math.round((n & 255) * factor);
  return `#${((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1)}`;
}

const BANK_ROWS = [
  "...PPPPPP...",
  "..PPPGPPPP..",
  ".PPPPPPPPPP.",
  "ssssssssssss",
  "sCCsCCsCCsCs",
  "sCCsCCsCCsCs",
  "sCCsCCsCCsCs",
  "sCCsCCsCCsCs",
  "ssssssssssss",
  "BBBBBBBBBBBB",
];
const BANK_MAP = { ".": null, P: "#d8d2c4", G: "#d4a24c", s: "#c2bcae", C: "#e6e1d6", B: "#9a948a" };

const HOUSE_ROWS = [
  "....RRRR....",
  "...RRRRRR...",
  "..RRRRRRRR..",
  ".RRRRRRRRRR.",
  "EwwwwwwwwwwE",
  "EwggwwwwggwE",
  "EwggwwwwggwE",
  "EwwwwddwwwwE",
  "EwwwwddwwwwE",
  "EwwwwddwwwwE",
  "EEEEEEEEEEEE",
];

function drawHouse(ctx, x, y, unit, roof, wall) {
  const map = { ".": null, R: roof, E: shade(wall, 0.68), w: wall, g: "#e0c14a", d: "#4a3628" };
  drawPixelGrid(ctx, HOUSE_ROWS, map, x, y, unit);
}

const BUILDING_ROWS = [
  "WWWWWWWWWW",
  "WggWggWggW",
  "WggWggWggW",
  "WWWWWWWWWW",
  "WggWggWggW",
  "WggWggWggW",
  "WWWWWWWWWW",
  "WggWggWggW",
  "WggWggWggW",
  "WWWWWWWWWW",
  "WggWggWggW",
  "WggWggWggW",
  "WWWDDWWWWW",
  "WWWDDWWWWW",
];
const BUILDING_MAP = { ".": null, W: "#5a6270", g: "#bcd0d8", D: "#2b2f36" };

const UNIHALL_ROWS = [
  "......ll......",
  "....BBBBBB....",
  "....BdddB.....",
  "....BBBBBB....",
  "...MMMMMMMM...",
  "..MMMMMMMMMM..",
  ".BBBBBBBBBBBB.",
  ".BgBgBgBgBgB..",
  ".BgBgBgBgBgB..",
  ".BBBBBBBBBBBB.",
  ".BB.DDDDDD.BB.",
  ".BBBBBBBBBBBB.",
];
const UNIHALL_MAP = { ".": null, l: "#d4a24c", B: "#274a56", d: "#e0c14a", M: "#e0c14a", g: "#bcd6c2", D: "#1a2a30" };

export function drawUwmDecor(ctx) {
  drawPixelGrid(ctx, BANK_ROWS, BANK_MAP, 8 * TILE_SIZE, 0, 16);
  drawHouse(ctx, 1 * TILE_SIZE, 0, 13, "#8a4a3a", "#d9c2a0");
  drawHouse(ctx, 15 * TILE_SIZE, 0, 13, "#3a5a8a", "#cdd8e0");
  drawHouse(ctx, 1 * TILE_SIZE, 10 * TILE_SIZE, 13, "#4a7a4a", "#d9c2a0");
  drawHouse(ctx, 15 * TILE_SIZE, 10 * TILE_SIZE, 13, "#7a5a2a", "#e0d2b0");
}

export function drawAnnArborDecor(ctx) {
  drawPixelGrid(ctx, UNIHALL_ROWS, UNIHALL_MAP, 7 * TILE_SIZE, 0, 16);
  drawPixelGrid(ctx, BUILDING_ROWS, BUILDING_MAP, 1 * TILE_SIZE, 0, 12);
  drawPixelGrid(ctx, BUILDING_ROWS, BUILDING_MAP, 16 * TILE_SIZE, 0, 12);
}
