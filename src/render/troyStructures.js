// Small structures behind each of Troy's 4 building doors — Troy had no
// real architecture at all before this (unlike UWM's houses/bank or Ann
// Arbor's unihall/buildings in townDecor.js), so the doors floated in empty
// grass with nothing to anchor them. Each one is themed to its host spirit.
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

// Kiri — a small firelit market stall.
const EMBER_BAZAAR_ROWS = [
  "...RRRRRR...",
  "..RRRRRRRR..",
  ".RRRRRRRRRR.",
  "WWWWWWWWWWWW",
  "W..........W",
  "W.LLLLLLLL.W",
  "W.LggggggL.W",
  "W.LgllllgL.W",
  "W.LggggggL.W",
  "W.LLLLLLLL.W",
  "WWWWWWWWWWWW",
  "..WW....WW..",
];
const EMBER_BAZAAR_MAP = { ".": null, R: "#e0724a", W: "#3a2a1c", L: "#2b2018", g: "#5b4636", l: "#ffe9a8" };

// Sable — a mossy stone alcove lit by moonlight.
const MOONLIT_DEN_ROWS = [
  "..SSSSSS..",
  ".SSSSSSSS.",
  "SSSSSSSSSS",
  "SS.MMMM.SS",
  "S.MmmmmM.S",
  "S.MmbbbmM.S",
  "S.MmbbbmM.S",
  "S.MmmmmM.S",
  "SS.MMMM.SS",
  "SSSSSSSSSS",
];
const MOONLIT_DEN_MAP = { ".": null, S: "#3a4a44", M: "#274a56", m: "#7a7ad0", b: "#1c2a3a" };

// Wren — a leaning book-cart with a canvas tent top.
const ARCHIVE_ROWS = [
  "....TT....",
  "...TTTT...",
  "..TTTTTT..",
  ".TTTTTTTT.",
  "WWWWWWWWWW",
  "WbbWbbWbbW",
  "WbbWbbWbbW",
  "WWWWWWWWWW",
  "..WW..WW..",
];
const ARCHIVE_MAP = { ".": null, T: "#8a6a3a", W: "#3a2e22", b: "#2f8a86" };

// Mochi — a rounded mossy jelly-mound den.
const WOBBLE_DEN_ROWS = [
  "..GGGGGG..",
  ".GGGGGGGG.",
  "GGGGGGGGGG",
  "GGGjjjjGGG",
  "GGjjjjjjGG",
  "GGjjjjjjGG",
  "GGGjjjjGGG",
  "GGGGGGGGGG",
];
const WOBBLE_DEN_MAP = { ".": null, G: "#1c2e24", j: "#4aa86a" };

const STRUCTURES = {
  mall: { rows: EMBER_BAZAAR_ROWS, map: EMBER_BAZAAR_MAP, unit: 5 },
  lifetime: { rows: MOONLIT_DEN_ROWS, map: MOONLIT_DEN_MAP, unit: 5 },
  cookieboys: { rows: ARCHIVE_ROWS, map: ARCHIVE_MAP, unit: 5 },
  zoyo: { rows: WOBBLE_DEN_ROWS, map: WOBBLE_DEN_MAP, unit: 5 },
};

export function drawTroyStructures(ctx, buildings) {
  buildings.forEach((building) => {
    const structure = STRUCTURES[building.id];
    if (!structure) return;
    const { rows, map, unit } = structure;
    const w = Math.max(...rows.map((r) => r.length)) * unit;
    const h = rows.length * unit;
    const ox = building.x + TILE_SIZE / 2 - w / 2;
    const oy = building.y + TILE_SIZE - h;
    drawPixelGrid(ctx, rows, map, ox, oy, unit);
  });
}
