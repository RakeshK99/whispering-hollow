// Tile textures for Troy, the moonlit-graveyard starting world — ported
// from the Claude Design project 871fff35-1062-4627-9b71-3b88b201c323
// (Troy/UWM/Ann Arbor Asset Atlas). Each tile kind is deterministic —
// seeded only by its name + size, never by world position — so every
// instance of a given kind looks identical. That means we can pre-render
// each kind once to an offscreen canvas and blit it every frame instead of
// redrawing ~30 fillRects per tile per frame.

function rng(seed) {
  let s = seed;
  return () => {
    s = (s * 1103515245 + 12345) & 0x7fffffff;
    return s / 0x7fffffff;
  };
}

function drawTileKind(ctx, kind, ox, oy, size) {
  const N = 20;
  const blk = size / N;
  const put = (x, y, w, h, color) => {
    ctx.fillStyle = color;
    ctx.fillRect(Math.round(ox + x * blk), Math.round(oy + y * blk), Math.ceil(w * blk), Math.ceil(h * blk));
  };
  const rnd = rng(kind.length * 97 + size);

  const grass = (base, dark, light) => {
    put(0, 0, N, N, base);
    for (let i = 0; i < 26; i += 1) {
      const x = Math.floor(rnd() * N);
      const y = Math.floor(rnd() * N);
      put(x, y, 1, rnd() < 0.4 ? 2 : 1, rnd() < 0.5 ? dark : light);
    }
  };

  if (kind === "grassA" || kind === "grassB") {
    // Troy uses one uniform dark grass, not a two-tone checkerboard —
    // both kind names render identically now (kept distinct in map.json
    // only so the underlying tile-value grid didn't need to change).
    grass("#22362a", "#1a2a20", "#2c4536");
  } else if (kind === "path") {
    put(0, 0, N, N, "#3a2e22");
    for (let i = 0; i < 20; i += 1) {
      const x = Math.floor(rnd() * N);
      const y = Math.floor(rnd() * N);
      put(x, y, 1, 1, rnd() < 0.5 ? "#2e2419" : "#4a3a2a");
    }
  } else if (kind === "water") {
    put(0, 0, N, N, "#0d1a20");
    for (let y = 2; y < N; y += 5) {
      for (let x = 1; x < N - 1; x += 6) {
        put(x, y, 3, 1, "#1c333c");
        put(x + 3, y + 1, 2, 1, "#0d1a20");
      }
    }
    put(2, 7, 3, 1, "#3a5a68");
    put(12, 14, 3, 1, "#3a5a68");
  } else if (kind === "pond") {
    for (let y = 0; y < N; y += 1) {
      for (let x = 0; x < N; x += 1) {
        const shore = x + y;
        put(x, y, 1, 1, shore < N - 3 ? "#22362a" : shore < N + 1 ? "#3a5a68" : "#0d1a20");
      }
    }
    for (let i = 0; i < 10; i += 1) {
      const x = 10 + Math.floor(rnd() * 9);
      const y = 10 + Math.floor(rnd() * 9);
      put(x, y, 1, 1, "#7fa0ac");
    }
  } else if (kind === "flower") {
    // pale moonflowers left at graves, instead of bright grove blooms
    grass("#22362a", "#1a2a20", "#2c4536");
    const bloom = (cx, cy, color) => {
      put(cx, cy - 1, 1, 1, color);
      put(cx - 1, cy, 1, 1, color);
      put(cx + 1, cy, 1, 1, color);
      put(cx, cy + 1, 1, 1, color);
      put(cx, cy, 1, 1, "#cfd8e3");
    };
    bloom(6, 7, "#e8e2d4");
    bloom(13, 12, "#e8e2d4");
    bloom(12, 6, "#d8d0c0");
  } else if (kind === "stump") {
    grass("#22362a", "#1a2a20", "#2c4536");
    const cx = 10;
    const cy = 10;
    const R = 7;
    for (let y = -R; y <= R; y += 1) {
      for (let x = -R; x <= R; x += 1) {
        const dd = Math.sqrt(x * x + y * y);
        if (dd <= R) {
          let color = "#5b4636";
          if (dd > R - 1) color = "#4a3628";
          else if (dd < 5 && dd > 3.6) color = "#6e5643";
          else if (dd < 2.4) color = "#6e5643";
          else if (dd < 1) color = "#4a3628";
          put(cx + x, cy + y, 1, 1, color);
        }
      }
    }
    put(cx - 1, cy - 1, 1, 1, "#7a624a");
  } else if (kind === "tree") {
    // a bare, gnarled dead tree instead of a leafy canopy
    grass("#22362a", "#1a2a20", "#2c4536");
    put(9, 13, 2, 6, "#3a2e24");
    put(9, 13, 1, 6, "#2b2018");
    put(9, 9, 1, 4, "#3a2e24");
    put(6, 8, 4, 1, "#2b2018");
    put(11, 7, 4, 1, "#2b2018");
    put(5, 5, 2, 1, "#3a2e24");
    put(13, 5, 2, 1, "#3a2e24");
    put(7, 4, 1, 2, "#3a2e24");
    put(12, 4, 1, 2, "#3a2e24");
  } else if (kind === "lushGrassA") {
    // the original daytime grove grass — used by UWM and Ann Arbor, which
    // are sunlit towns rather than Troy's moonlit graveyard.
    grass("#3a6b4a", "#2f5a3f", "#498059");
  } else if (kind === "lushGrassB") {
    grass("#356044", "#2b5039", "#417351");
  } else if (kind === "sidewalk") {
    put(0, 0, N, N, "#9a948a");
    put(0, 0, N, 1, "#7f7a72");
    put(0, N - 1, N, 1, "#7f7a72");
    put(10, 0, 1, N, "#8a857c");
  } else if (kind === "asphalt") {
    put(0, 0, N, N, "#3a3f47");
    for (let i = 0; i < 16; i += 1) {
      const x = Math.floor(rnd() * N);
      const y = Math.floor(rnd() * N);
      put(x, y, 1, 1, rnd() < 0.5 ? "#31363d" : "#43494f");
    }
  } else if (kind === "buildingBlock") {
    // plain filler tile that sits under a multi-tile building/house/hall
    // overlay drawn separately in render/townDecor.js — never seen on its
    // own, just needs to read as "blocked ground" if a corner peeks through.
    put(0, 0, N, N, "#3a3f47");
  }
}

const textureCache = new Map();

function getTileTexture(kind, size) {
  const key = `${kind}:${size}`;
  let canvas = textureCache.get(key);
  if (!canvas) {
    canvas = document.createElement("canvas");
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext("2d");
    drawTileKind(ctx, kind, 0, 0, size);
    textureCache.set(key, canvas);
  }
  return canvas;
}

export function drawTilemap(ctx, map) {
  const { tileSize, tileTypes, tiles } = map;

  for (let row = 0; row < map.rows; row += 1) {
    for (let col = 0; col < map.cols; col += 1) {
      const tileType = tileTypes[String(tiles[row][col])];
      const name = tileType ? tileType.name : "grassA";
      const texture = getTileTexture(name, tileSize);
      ctx.drawImage(texture, col * tileSize, row * tileSize);
    }
  }
}
