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
  } else if (kind === "brick") {
    put(3, 4, 10, 2, "#e0724a");
    put(3, 6, 10, 6, INK);
    put(4, 7, 8, 4, "#d95b5b");
    put(4, 7, 8, 1, "#e88f7a");
    put(4, 4, 2, 2, "#e88f7a");
    put(7, 4, 2, 2, "#e88f7a");
    put(10, 4, 2, 2, "#e88f7a");
    put(4, 4, 2, 1, "#c94a3a");
    put(7, 4, 2, 1, "#c94a3a");
    put(10, 4, 2, 1, "#c94a3a");
  } else if (kind === "anklet") {
    put(4, 6, 8, 1, INK);
    put(3, 7, 1, 3, INK);
    put(12, 7, 1, 3, INK);
    put(4, 10, 8, 1, INK);
    put(4, 7, 8, 3, "#d4a24c");
    put(4, 7, 8, 1, "#e8c878");
    put(5, 11, 2, 3, "#d4a24c");
    put(9, 11, 2, 3, "#d4a24c");
    put(5, 13, 2, 1, "#e8c878");
    put(9, 13, 2, 1, "#e8c878");
    put(7, 11, 2, 2, "#d4a24c");
  } else if (kind === "ball") {
    const ballGrid = [
      "..XXXXXX..",
      ".XXXXXXXX.",
      "XXXXXXXXXX",
      "XXXXXXXXXX",
      "XXXXXXXXXX",
      "XXXXXXXXXX",
      ".XXXXXXXX.",
      "..XXXXXX..",
    ];
    for (let y = 0; y < ballGrid.length; y += 1) {
      for (let x = 0; x < ballGrid[y].length; x += 1) {
        if (ballGrid[y][x] === "X") put(x + 3, y + 4, 1, 1, "#f0e6d2");
      }
    }
    put(6, 7, 4, 4, INK);
    put(3, 5, 2, 2, INK);
    put(11, 5, 2, 2, INK);
    put(3, 11, 2, 2, INK);
    put(11, 11, 2, 2, INK);
    put(7, 3, 2, 2, INK);
  } else if (kind === "watch") {
    put(7, 3, 2, 2, "#d4a24c");
    put(6, 4, 1, 1, "#d4a24c");
    put(9, 4, 1, 1, "#d4a24c");
    put(5, 5, 6, 1, INK);
    put(4, 6, 8, 6, INK);
    put(3, 7, 1, 4, INK);
    put(12, 7, 1, 4, INK);
    put(5, 12, 6, 1, INK);
    put(5, 6, 6, 6, "#e8c878");
    put(5, 6, 6, 1, "#f4e0a8");
    put(7, 7, 2, 3, INK);
    put(7, 7, 1, 4, INK);
    put(9, 9, 2, 1, INK);
  } else if (kind === "cufflink") {
    put(5, 5, 6, 6, INK);
    put(6, 6, 4, 4, "#d4a24c");
    put(6, 6, 4, 1, "#f4e0a8");
    put(6, 6, 1, 4, "#e8c878");
    put(7, 7, 2, 2, "#8a6a2a");
    put(4, 7, 1, 2, INK);
    put(11, 7, 1, 2, INK);
    put(3, 7, 1, 2, "#d4a24c");
    put(12, 7, 1, 2, "#d4a24c");
    put(7, 11, 2, 2, INK);
    put(7, 12, 2, 1, "#d4a24c");
  } else if (kind === "controller") {
    put(3, 6, 10, 5, INK);
    put(3, 7, 1, 3, INK);
    put(12, 7, 1, 3, INK);
    put(2, 7, 1, 3, INK);
    put(13, 7, 1, 3, INK);
    put(4, 6, 8, 4, "#4a90d9");
    put(4, 6, 8, 1, "#7ab0e8");
    put(5, 8, 1, 1, INK);
    put(4, 7, 1, 1, INK);
    put(6, 7, 1, 1, INK);
    put(5, 7, 1, 1, "#f0e6d2");
    put(5, 8, 1, 1, "#f0e6d2");
    put(5, 9, 1, 1, "#f0e6d2");
    put(4, 8, 1, 1, "#f0e6d2");
    put(6, 8, 1, 1, "#f0e6d2");
    put(9, 7, 1, 1, "#d95b5b");
    put(10, 8, 1, 1, "#7ac97a");
    put(2, 9, 2, 2, INK);
    put(12, 9, 2, 2, INK);
  } else if (kind === "cleat") {
    put(3, 7, 7, 3, INK);
    put(3, 10, 10, 3, INK);
    put(4, 8, 5, 2, "#4a90d9");
    put(4, 8, 5, 1, "#7ab0e8");
    put(4, 11, 8, 1, "#356aa3");
    put(9, 7, 1, 3, INK);
    put(4, 13, 1, 1, INK);
    put(6, 13, 1, 1, INK);
    put(8, 13, 1, 1, INK);
    put(10, 13, 1, 1, INK);
    put(4, 6, 3, 1, "#f0e6d2");
  } else if (kind === "keychain") {
    put(5, 2, 6, 5, INK);
    put(6, 3, 4, 3, "#c2c6cc");
    put(6, 3, 4, 1, "#e8eaec");
    put(7, 4, 2, 1, "#3a4048");
    put(7, 6, 2, 2, INK);
    put(7, 6, 2, 1, "#9aa0a8");
    put(6, 8, 2, 5, INK);
    put(6, 8, 2, 1, "#e8eaec");
    put(6, 8, 1, 5, "#c2c6cc");
    put(5, 11, 1, 2, INK);
    put(5, 11, 1, 1, "#c2c6cc");
    put(4, 12, 1, 1, INK);
    put(9, 8, 2, 6, INK);
    put(9, 8, 2, 1, "#e8eaec");
    put(9, 8, 1, 6, "#c2c6cc");
    put(11, 11, 2, 1, INK);
    put(11, 11, 2, 1, "#c2c6cc");
    put(11, 13, 1, 1, INK);
  }
}

const ITEM_ICON_KINDS = new Set(["brick", "anklet", "ball", "watch", "cufflink", "controller", "cleat", "keychain"]);

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
    drawIcon(ctx, ITEM_ICON_KINDS.has(shape) ? shape : "treasure", ox, oy, size, accent);
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
