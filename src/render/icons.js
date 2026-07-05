// Ported from the Whispering Hollow Asset Atlas (Claude Design project
// 3c367480-358d-4356-bb01-93086977e9b5).
const INK = "#2b2018";

const HEART_GRID = [
  "...HH.HH...",
  "..HHHHHHH..",
  "..HHHHHHH..",
  "...HHHHH...",
  "....HHH....",
  ".....H.....",
];

const STAR_GRID = [
  ".....X.....",
  "....XXX....",
  "XXXXXXXXXXX",
  ".XXXXXXXXX.",
  "..XXXXXXX..",
  "..XX...XX..",
];

export function drawIcon(ctx, kind, ox, oy, size, accent = "#d4a24c") {
  const N = 16;
  const blk = size / N;
  const put = (x, y, w, h, color) => {
    ctx.fillStyle = color;
    ctx.fillRect(Math.round(ox + x * blk), Math.round(oy + y * blk), Math.ceil(w * blk), Math.ceil(h * blk));
  };

  if (kind === "treasure") {
    put(3, 6, 10, 7, INK);
    put(4, 7, 8, 5, "#8a5a30");
    put(4, 7, 8, 2, "#a9713e");
    put(3, 5, 10, 2, INK);
    put(4, 5, 8, 1, "#6e4726");
    put(7, 8, 2, 3, accent);
    put(3, 9, 10, 1, INK);
  } else if (kind === "scroll") {
    put(4, 2, 8, 12, INK);
    put(5, 3, 6, 10, "#f0e6d2");
    put(6, 5, 4, 1, "#9a6b2e");
    put(6, 7, 4, 1, "#9a6b2e");
    put(6, 9, 4, 1, "#9a6b2e");
    put(4, 2, 8, 1, "#c9a876");
    put(4, 13, 8, 1, "#c9a876");
  } else if (kind === "bag") {
    put(5, 2, 6, 2, "#7a5a3a");
    put(4, 4, 8, 9, INK);
    put(5, 5, 6, 7, "#9a6b2e");
    put(5, 5, 6, 2, "#b0824a");
    put(7, 7, 2, 4, "#5a3f24");
  } else if (kind === "heart") {
    for (let y = 0; y < HEART_GRID.length; y += 1) {
      for (let x = 0; x < HEART_GRID[y].length; x += 1) {
        if (HEART_GRID[y][x] === "H") put(x + 2, y + 4, 1, 1, "#e08a9b");
      }
    }
  } else if (kind === "star") {
    for (let y = 0; y < STAR_GRID.length; y += 1) {
      for (let x = 0; x < STAR_GRID[y].length; x += 1) {
        if (STAR_GRID[y][x] === "X") put(x + 2.5, y + 4, 1, 1, "#d4a24c");
      }
    }
  }
}

export function drawTreasureIcon(ctx, ox, oy, size, accent) {
  drawIcon(ctx, "treasure", ox, oy, size, accent);
}

// Distinct item glyphs so each collectible reads differently at a glance
// instead of every item sharing the one "treasure chest" icon. Only the
// "ACCENT" cells pick up the rarity tint; everything else is a fixed color
// tied to that item's theme.
const ITEM_GLYPHS = {
  charm: {
    rows: [
      "....OO......",
      "...O..O.....",
      "....OO......",
      "...CCCC.....",
      "..CCCCCC....",
      ".CCCCCCCC...",
      ".CCCAAACC...",
      ".CCCAAACC...",
      ".CCCCCCCC...",
      "..CCCCCC....",
      "...CCCC.....",
    ],
    map: { ".": null, O: INK, C: "#d9863a", A: "ACCENT" },
  },
  shard: {
    rows: [
      "......S.....",
      ".....SSS....",
      "....SSSSS...",
      "...SSSSSSS..",
      "..SSSSSSSSS.",
      ".SSSSAASSSS.",
      "..SSSSSSSSS.",
      "...SSSSSSS..",
      "....SSSSS...",
      ".....SSS....",
      "......S.....",
    ],
    map: { ".": null, S: "#6fb8c9", A: "ACCENT" },
  },
  leaf: {
    rows: [
      "......L.......",
      ".....LLL......",
      "....LLLLL.....",
      "...LLLVLLL....",
      "..LLLLVLLLL...",
      "..LLLLVLLLL...",
      "...LLLVLLL....",
      "....LLLLL.....",
      ".....LLL......",
      "......L.......",
    ],
    map: { ".": null, L: "#4aa86a", V: "ACCENT" },
  },
  bead: {
    rows: [
      "....BBBB....",
      "..BBBBBBBB..",
      ".BBBBBBBBBB.",
      ".BBBHBBBBBB.",
      "BBBBBBBBBBBB",
      "BBBBBBBBBBBB",
      ".BBBBBBBBBB.",
      ".BBBBBBBBBB.",
      "..BBBBBBBB..",
      "....BBBB....",
    ],
    map: { ".": null, B: "#6fcf8a", H: "ACCENT" },
  },
};

export function drawItemGlyph(ctx, shape, ox, oy, size, accent = "#d4a24c") {
  const glyph = ITEM_GLYPHS[shape];
  if (!glyph) {
    drawIcon(ctx, "treasure", ox, oy, size, accent);
    return;
  }

  const n = Math.max(...glyph.rows.map((row) => row.length));
  const blk = size / n;
  for (let y = 0; y < glyph.rows.length; y += 1) {
    const row = glyph.rows[y];
    for (let x = 0; x < row.length; x += 1) {
      let color = glyph.map[row[x]];
      if (!color) continue;
      if (color === "ACCENT") color = accent;
      ctx.fillStyle = color;
      ctx.fillRect(Math.round(ox + x * blk), Math.round(oy + y * blk), Math.ceil(blk), Math.ceil(blk));
    }
  }
}

export function renderIconToCanvas(kind, size, accent) {
  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext("2d");
  if (ITEM_GLYPHS[kind]) {
    drawItemGlyph(ctx, kind, 0, 0, size, accent);
  } else {
    drawIcon(ctx, kind, 0, 0, size, accent);
  }
  return canvas;
}
