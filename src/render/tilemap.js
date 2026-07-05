// Ported from the Whispering Hollow Asset Atlas (Claude Design project
// 3c367480-358d-4356-bb01-93086977e9b5). Each tile kind is deterministic —
// seeded only by its name + size, never by world position — so every
// instance of "grassA" looks identical. That means we can pre-render each
// kind once to an offscreen canvas and blit it every frame instead of
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

  if (kind === "grassA") {
    grass("#3a6b4a", "#2f5a3f", "#498059");
  } else if (kind === "grassB") {
    grass("#356044", "#2b5039", "#417351");
  } else if (kind === "path") {
    put(0, 0, N, N, "#c9a876");
    for (let i = 0; i < 22; i += 1) {
      const x = Math.floor(rnd() * N);
      const y = Math.floor(rnd() * N);
      put(x, y, 1, 1, rnd() < 0.5 ? "#b8945f" : "#dcc08e");
    }
    for (let i = 0; i < 4; i += 1) {
      put(Math.floor(rnd() * N), Math.floor(rnd() * N), 2, 1, "#a37f4d");
    }
  } else if (kind === "water") {
    put(0, 0, N, N, "#274a56");
    for (let y = 2; y < N; y += 5) {
      for (let x = 1; x < N - 1; x += 6) {
        put(x, y, 3, 1, "#3d7d8a");
        put(x + 3, y + 1, 2, 1, "#274a56");
      }
    }
    put(2, 7, 3, 1, "#5a99a6");
    put(12, 14, 3, 1, "#5a99a6");
  } else if (kind === "pond") {
    for (let y = 0; y < N; y += 1) {
      for (let x = 0; x < N; x += 1) {
        const shore = x + y;
        put(x, y, 1, 1, shore < N - 3 ? "#3a6b4a" : shore < N + 1 ? "#3d7d8a" : "#274a56");
      }
    }
    for (let i = 0; i < 10; i += 1) {
      const x = 10 + Math.floor(rnd() * 9);
      const y = 10 + Math.floor(rnd() * 9);
      put(x, y, 1, 1, "#5a99a6");
    }
  } else if (kind === "flower") {
    grass("#3a6b4a", "#2f5a3f", "#498059");
    const bloom = (cx, cy, color) => {
      put(cx, cy - 1, 1, 1, color);
      put(cx - 1, cy, 1, 1, color);
      put(cx + 1, cy, 1, 1, color);
      put(cx, cy + 1, 1, 1, color);
      put(cx, cy, 1, 1, "#e0c14a");
    };
    bloom(6, 7, "#e08a9b");
    bloom(13, 12, "#e08a9b");
    bloom(12, 6, "#d9d06a");
  } else if (kind === "stump") {
    grass("#356044", "#2b5039", "#417351");
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
    grass("#3a6b4a", "#2f5a3f", "#498059");
    put(9, 13, 2, 5, "#5b4636");
    put(9, 13, 1, 5, "#4a3628");
    const cx = 10;
    const cy = 8;
    const R = 7;
    for (let y = -R; y <= R; y += 1) {
      for (let x = -R; x <= R; x += 1) {
        const dd = Math.sqrt(x * x * 1.05 + y * y);
        if (dd <= R) {
          let color = "#2e5a3a";
          if (dd > R - 1.3) color = "#20402a";
          else if ((x + y) % 3 === 0) color = "#3f7350";
          put(cx + x, cy + y, 1, 1, color);
        }
      }
    }
    put(cx - 3, cy - 3, 2, 1, "#4a8560");
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
