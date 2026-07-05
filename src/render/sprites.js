// Ported from the Whispering Hollow Asset Atlas (Claude Design project
// 3c367480-358d-4356-bb01-93086977e9b5): the player's recolorable 16x16
// pixel grid (per facing direction) and the four named NPCs.
import { drawItemGlyph } from "./icons.js";

function shade(hex, factor) {
  const n = parseInt(hex.slice(1), 16);
  let r = (n >> 16) & 255;
  let g = (n >> 8) & 255;
  let b = n & 255;
  r = Math.min(255, Math.round(r * factor));
  g = Math.min(255, Math.round(g * factor));
  b = Math.min(255, Math.round(b * factor));
  return `#${((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1)}`;
}

function mix(hexA, hexB, t) {
  const a = parseInt(hexA.slice(1), 16);
  const b = parseInt(hexB.slice(1), 16);
  const ar = (a >> 16) & 255;
  const ag = (a >> 8) & 255;
  const ab = a & 255;
  const br = (b >> 16) & 255;
  const bg = (b >> 8) & 255;
  const bb = b & 255;
  const r = Math.round(ar + (br - ar) * t);
  const g = Math.round(ag + (bg - ag) * t);
  const bl = Math.round(ab + (bb - ab) * t);
  return `#${((1 << 24) + (r << 16) + (g << 8) + bl).toString(16).slice(1)}`;
}

const PLAYER_MAP = {
  ".": null,
  h: "#6b4f38",
  s: "#eab892",
  d: "#c78a5c",
  X: "#2b1c14",
  t: "TUNIC",
  T: "TUNICD",
  p: "#465063",
  b: "#332720",
};

const PLAYER_ROWS = {
  down: [
    "................",
    "....hhhhhh......",
    "...hhhhhhhh.....",
    "...hssssssh.....",
    "...hssssssh.....",
    "...hsXssXsh.....",
    "...hssssssh.....",
    "...hsddddsh.....",
    "....ssssss......",
    "....tTTTt.......",
    "...tttttttt.....",
    "..sttttttts.....",
    "..sttttttts.....",
    "...tttttttt.....",
    "...pp..pp.......",
    "...bb..bb.......",
  ],
  up: [
    "................",
    "....hhhhhh......",
    "...hhhhhhhh.....",
    "...hhhhhhhh.....",
    "...hhhhhhhh.....",
    "...hhhhhhhh.....",
    "...hhhhhhhh.....",
    "....hhhhhh......",
    "....hhhhhh......",
    "....tTTTt.......",
    "...tttttttt.....",
    "..sttttttts.....",
    "..sttttttts.....",
    "...tttttttt.....",
    "...pp..pp.......",
    "...bb..bb.......",
  ],
  left: [
    "................",
    "....hhhhh.......",
    "...hhhhhhh......",
    "..hssssshh......",
    "..hssssshh......",
    "..Xssssshh......",
    "..hssssshh......",
    "..hsdddshh......",
    "...ssssss.......",
    "...tTTTt........",
    "..ttttttt.......",
    ".sttttttt.......",
    "..ttttttt.......",
    "..tttttt........",
    "..pp..pp........",
    "..bb..bb........",
  ],
};
PLAYER_ROWS.right = PLAYER_ROWS.left.map((row) => row.split("").reverse().join(""));

const NPC_SPRITES = {
  kiri: {
    rows: [
      ".......CC.......",
      "......CMMC......",
      ".....CMFFMC.....",
      "....CMFFFFMC....",
      "...MFFFFFFFFM...",
      "..MFFFFFFFFFFM..",
      "..MFwXFFFXwFM..",
      "..MFFFFFFFFFM...",
      "..MFFFwwwFFFM...",
      "...MFFFFFFFM....",
      "....CMFFFFMC....",
      ".....CMFFMC.....",
      "......CMMC......",
      ".......CC.......",
    ],
    map: { ".": null, C: "#ffd77a", M: "#f4a24c", F: "#e8703a", X: "#2b1712", w: "#fff2c8" },
    float: true,
  },
  sable: {
    rows: [
      "..D......D......",
      ".DBD....DBD.....",
      ".DBBD..DBBD.....",
      "..DBBBBBBBD.....",
      ".DBBBBBBBBBD....",
      ".DBBBBBBBBBD....",
      ".DBLXBBBXLBD....",
      ".DBBBBBBBBBD....",
      ".DBBBB.BBBBD....",
      "..DBBBBBBBD..TT.",
      "...DBBBBBD..TTTT",
      "...DBBBBBD...TT.",
      "....DBBBD.......",
      ".....DDD........",
    ],
    map: { ".": null, D: "#3a3a70", B: "#7a7ad0", L: "#a6a6e8", X: "#e8c268", T: "#c9c9f4" },
  },
  wren: {
    rows: [
      "................",
      "....HHHHHH......",
      "...HHHHHHHH.....",
      ".HHHHHHHHHHHH...",
      "....ssssss......",
      "....sXssXs......",
      "....ssssss......",
      "....sddds.......",
      "....cccccc......",
      "...rRrrrrRr.....",
      "..GrrrrrrrrG....",
      "..srrrrrrrrs....",
      "..GrrrrrrrrG....",
      "...rrrrrrrr.....",
      "...rrrrrrrr.....",
      "...bb....bb.....",
    ],
    map: {
      ".": null,
      H: "#6b4a30",
      s: "#eab892",
      d: "#c78a5c",
      X: "#2b1c14",
      c: "#c2604a",
      r: "#2f8a86",
      R: "#236862",
      G: "#8a6a3a",
      b: "#332720",
    },
  },
  mochi: {
    rows: [
      "......GGGG......",
      "....GGGGGGGG....",
      "...GGGGGGGGGG...",
      "..GGSSGGGGGGGG..",
      "..GGGGGGGGGGGG..",
      "..GGGGGGGGGGGG..",
      "..GGXGGGGXGGGG..",
      "..GGGGGGGGGGGG..",
      "..GGGdddddGGGG..",
      "..GGGGGGGGGGGG..",
      "...GGGGGGGGGG...",
      "....GGdGGdGG....",
      ".....GGGGGG.....",
      "................",
    ],
    map: { ".": null, G: "#4aa86a", d: "#357a52", S: "#bfe8c8", X: "#20301c" },
    float: true,
  },
  // ---- UWM: finance district ----
  eesha: {
    rows: [
      "....HHHHHH......",
      "...HHHHHHHH.....",
      "..HHHHHHHHHH....",
      "...hssssshh.h...",
      "...hsXssXsh.hh..",
      "...hssssssh.hh..",
      "...hsddddsh..h..",
      "....ssssss......",
      "....cccccc..g...",
      "...oooooooo.g...",
      "..soooooooos....",
      "..soooooooos....",
      "...oo..oo.......",
      "...oo..oo.......",
      "...bb..bb.......",
      "................",
    ],
    map: { ".": null, H: "#e0c14a", h: "#5b3a24", s: "#eab892", X: "#2b1c14", d: "#c78a5c", c: "#d95b5b", o: "#4a6fd0", g: "#b7b7c2", b: "#3a2a1a" },
  },
  sungat: {
    rows: [
      "....TTTTTT......",
      "...TTTTTTTT.....",
      "...TTTTTTTT.....",
      "...sssssss......",
      "...sXsssXs......",
      "...sssssss......",
      "...BBBBBBB......",
      "....BBBBB.......",
      "g..vkkkkkv..g...",
      ".g.vkkkkkv.g....",
      "..svkkkkkvs.....",
      "...kkkkkkk......",
      "...kkkkkkk......",
      "...pp..pp.......",
      "...ff..ff.......",
      "................",
    ],
    map: { ".": null, T: "#e0724a", s: "#d99b6a", X: "#2b1c14", B: "#2b2018", k: "#d84a90", v: "#e0c14a", g: "#d99b6a", p: "#f0e6d2", f: "#5b4636" },
  },
  rohit: {
    rows: [
      "....hhhhhh......",
      "...hRRRRRRh.....",
      "...hssssssh.....",
      "...hsXssXsh.....",
      "...hssssssh.....",
      "...hsddddsh.....",
      "....ssssss......",
      "....jjjjjj......",
      "...jjNNjj...o...",
      "..sjjjjjjs..o...",
      "..sjjjjjjs......",
      "...wwwwww.......",
      "...ss..ss.......",
      "...ss..ss.......",
      "...bb..bb.......",
      "................",
    ],
    map: { ".": null, h: "#2b2018", R: "#d95b5b", s: "#c98a5c", X: "#2b1c14", d: "#a86b3c", j: "#4a90d9", N: "#f0e6d2", w: "#f0e6d2", o: "#e0724a", b: "#f0f0f0" },
  },
  prakharP: {
    rows: [
      "....LLLL........",
      "...LLLLLL.......",
      "...LssssL.......",
      "...sXssXs.......",
      "...ssqqss.......",
      "....ssss........",
      "...jjjjjj.......",
      "..jJjjjjJj......",
      "..sjjjjjjs......",
      "..sjjjjjjs......",
      "...jjjjjj.......",
      "...pp..pp.......",
      "...pp..pp.......",
      "...bb..bb.......",
      "................",
      "................",
    ],
    map: { ".": null, L: "#4a3628", s: "#d9a878", X: "#2b1c14", q: "#c0895a", j: "#241c16", J: "#5b4636", p: "#2e2a26", b: "#141414" },
  },
  horse: {
    rows: [
      "................",
      "................",
      "..............N.",
      ".............NNN.",
      ".THHHHHHHHHNNNN..",
      ".THHHHHHHHH.NeN..",
      "..HHHHHHHHH.NNN..",
      "..HHHHHHHHH......",
      "..m.mm.mm.m.....",
      "..m.mm.mm.m.....",
      "..u.uu.uu.u.....",
      "................",
      "................",
      "................",
      "................",
      "................",
    ],
    map: { ".": null, H: "#8a6a3a", N: "#8a6a3a", T: "#5b4636", m: "#6e5236", u: "#2b2018", e: "#2b1c14" },
  },
  prakhar: { combo: [{ key: "prakharP", dx: 0, dy: 0 }, { key: "horse", dx: 13, dy: 3 }], width: 28 },
  nithy: {
    rows: [
      "....hhhhhh......",
      "...hhhhhhhh.....",
      "...hssssssh.....",
      "...hGGGGGGh.....",
      "...hssssssh.....",
      "...hsddddsh.....",
      "....ssssss......",
      "....SwwwwS......",
      "...SSwttwSS.....",
      "..sSSwttwSS.P...",
      "..sSSSSSSSs.P...",
      "...SSSSSSSS.....",
      "...SS..SS.......",
      "...SS..SS.......",
      "...bb..bb.......",
      "................",
    ],
    map: { ".": null, h: "#1a1712", s: "#d9a878", X: "#2b1c14", d: "#a86b3c", G: "#141414", S: "#2b3350", w: "#f0e6d2", t: "#d4a24c", P: "#141414", b: "#141414" },
  },
  // ---- Ann Arbor: college city ----
  vish: {
    rows: [
      "...HHHHHHHH.....",
      "..EHhhhhhhHE....",
      "..Ehssssssh.E...",
      "...hsXssXsh.....",
      "...hssssssh.....",
      "...hsddddsh.....",
      "....ssssss......",
      "....uuuuuu......",
      "...uuuuuuuu.....",
      "..suuuuuuus.....",
      "...cccccc.......",
      "..cKcKcKcKc.....",
      "...uu..uu.......",
      "...uu..uu.......",
      "...bb..bb.......",
      "................",
    ],
    map: { ".": null, H: "#2b2018", E: "#4a90d9", h: "#5b3a24", s: "#eab892", X: "#2b1c14", d: "#c78a5c", u: "#7a5ac9", c: "#9aa0ad", K: "#2b2018", b: "#2b2018" },
  },
  bhuvi: {
    rows: [
      "....hhhhhh......",
      "...hhhhhhhh.....",
      "...hssssssh.....",
      "...hsXssXsh.....",
      "...hssssssh.....",
      "...hsddddsh.....",
      "....ssssss......",
      "....jJjJjJ......",
      "...jJjJjJjJ.....",
      "..sjJjJjJjs.....",
      "...wwwwww.......",
      "...kk..kk.......",
      "...kk..kk.......",
      "...bb..bb.......",
      ".....OWO........",
      "....OWOWO.......",
    ],
    map: { ".": null, h: "#2b2018", s: "#c98a5c", X: "#2b1c14", d: "#a86b3c", j: "#e0724a", J: "#f0e6d2", w: "#2b3350", k: "#c98a5c", b: "#141414", O: "#f0f0f0", W: "#2b2018" },
  },
  vedantP: {
    rows: [
      "....hhhhhh......",
      "...hhhhhhhh.....",
      "...hssssssh.....",
      "...hGGGGGGh.....",
      "...hssssssh.....",
      "...hsqqqqsh.....",
      "....ssssss......",
      "...jjjjjjjj.....",
      "..jJjwwjJjj.....",
      "..sjjwwjjjs..K..",
      "..sjjjjjjjs..K..",
      "...jjjjjjjj.....",
      "...pp..pp.......",
      "...pp..pp.......",
      "...bb..bb.......",
      "................",
    ],
    map: { ".": null, h: "#1a1712", s: "#d9a878", G: "#141414", q: "#c0895a", j: "#7a2a2a", J: "#d4a24c", w: "#c9cdd3", K: "#d4a24c", p: "#3a4a6b", b: "#141414" },
  },
  car: {
    rows: [
      "................",
      "................",
      "................",
      "......CCCC......",
      ".....CCggCC.....",
      "...CCCCCCCCCC...",
      "..CCCCCCCCCCCC..",
      ".RCCCCCoCCCCCL..",
      ".aaCCCCCCCCCaa..",
      "..WW......WW....",
      ".WHHW....WHHW...",
      "..WW......WW....",
      "................",
      "................",
      "................",
      "................",
    ],
    map: { ".": null, C: "#c9cdd3", g: "#243040", o: "#e6e8ea", L: "#f4f0d8", R: "#c23a3a", a: "#111111", W: "#161616", H: "#d0d3d8" },
  },
  vd: { combo: [{ key: "vedantP", dx: 0, dy: 0 }, { key: "car", dx: 13, dy: 4 }], width: 28 },
};

function drawPixelGrid(ctx, rows, colorMap, ox, oy, u, { tunic, phase, dir } = {}) {
  const w = Math.max(...rows.map((r) => r.length));
  for (let y = 0; y < rows.length; y += 1) {
    const row = rows[y];
    for (let x = 0; x < row.length; x += 1) {
      const ch = row[x];
      let color = colorMap[ch];
      if (!color) continue;
      if (color === "TUNIC") color = tunic;
      else if (color === "TUNICD") color = shade(tunic, 0.74);

      let dy = 0;
      if (phase && (dir === "down" || dir === "up") && ch === "b") {
        const side = x < w / 2 ? "L" : "R";
        if ((phase === 1 && side === "L") || (phase === 2 && side === "R")) dy = -1;
      }

      ctx.fillStyle = color;
      ctx.fillRect(Math.round(ox + x * u), Math.round(oy + (y + dy) * u), Math.ceil(u), Math.ceil(u));
    }
  }
}

const SPRITE_SIZE = 32;
const SPRITE_UNIT = SPRITE_SIZE / 16;

export function drawPlayer(ctx, player) {
  drawPixelGrid(ctx, PLAYER_ROWS[player.facing], PLAYER_MAP, player.x, player.y, SPRITE_UNIT, {
    tunic: player.color,
    phase: player.animPhase,
    dir: player.facing,
  });
}

function hashSeed(str) {
  let hash = 0;
  for (let i = 0; i < str.length; i += 1) hash = (hash * 31 + str.charCodeAt(i)) & 0xffff;
  return hash;
}

const BOB_AMPLITUDE_PX = 2.5;
const BOB_PERIOD_MS = 1400;

export function drawNpc(ctx, npc) {
  const size = SPRITE_SIZE;
  const offset = (40 - size) / 2;
  const x = npc.x + offset;
  let y = npc.y + offset;
  const sprite = NPC_SPRITES[npc.id];
  if (!sprite) return;

  if (sprite.float) {
    // gentle idle bob, phase-offset per NPC so they don't bob in lockstep
    const phase = (performance.now() / BOB_PERIOD_MS) * Math.PI * 2 + hashSeed(npc.id);
    const bob = Math.sin(phase) * BOB_AMPLITUDE_PX;
    const shadowScale = 1 - Math.max(bob, 0) / (BOB_AMPLITUDE_PX * 4);
    y += bob;

    ctx.save();
    ctx.fillStyle = "rgba(0, 0, 0, 0.18)";
    ctx.beginPath();
    ctx.ellipse(x + size / 2, npc.y + offset + size * 0.94, size * 0.28 * shadowScale, size * 0.08 * shadowScale, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  if (sprite.combo) {
    // "combo" characters (Prakhar + his horse, Vedant + his car) are two
    // sprites drawn together, wider than a single tile.
    sprite.combo.forEach((part) => {
      const partSprite = NPC_SPRITES[part.key];
      if (!partSprite) return;
      drawPixelGrid(ctx, partSprite.rows, partSprite.map, x + (part.dx || 0) * SPRITE_UNIT, y + (part.dy || 0) * SPRITE_UNIT, SPRITE_UNIT);
    });
    return;
  }

  drawPixelGrid(ctx, sprite.rows, sprite.map, x, y, SPRITE_UNIT);
}

const RARITY_ACCENT = {
  common: "#d4a24c",
  rare: "#e08a9b",
  limited: "#c264c9",
};

export function drawItem(ctx, item) {
  const size = 26;
  const x = item.x + (40 - size) / 2;
  const y = item.y + (40 - size) / 2;
  const accent = RARITY_ACCENT[item.rarity] || RARITY_ACCENT.common;

  if (item.rarity !== "common") {
    ctx.save();
    ctx.shadowColor = accent;
    ctx.shadowBlur = 10;
  }

  drawItemGlyph(ctx, item.shape, x, y, size, accent);

  if (item.rarity !== "common") {
    ctx.restore();
  }
}

function hexToRgba(hex, alpha) {
  const n = parseInt(hex.slice(1), 16);
  const r = (n >> 16) & 255;
  const g = (n >> 8) & 255;
  const b = n & 255;
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

const LANTERN_ROWS = [
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

// progress: 0..1, how many of the four treasures have been delivered here —
// the lantern's flame warms from a dim ember to a bright gold glow as the
// crossroads nears its ending.
export function drawLantern(ctx, lantern, progress) {
  const unit = 2.6;
  const width = 6 * unit;
  const height = 13 * unit;
  const ox = lantern.x + (40 - width) / 2;
  const oy = lantern.y + (40 - height) / 2;
  const pulse = 0.85 + Math.sin(performance.now() / 500) * 0.15;
  const flameColor = mix("#6b6b62", "#fff6da", progress);
  const glowHex = mix("#6b6b62", "#f0deb2", progress);
  const glowAlpha = 0.15 + progress * 0.45;
  const glowRadius = 14 + progress * 40 * pulse;

  const cx = ox + 3 * unit;
  const cy = oy + 2 * unit;
  const glow = ctx.createRadialGradient(cx, cy, 1, cx, cy, glowRadius);
  glow.addColorStop(0, hexToRgba(glowHex, glowAlpha));
  glow.addColorStop(1, hexToRgba(glowHex, 0));
  ctx.fillStyle = glow;
  ctx.fillRect(cx - glowRadius, cy - glowRadius, glowRadius * 2, glowRadius * 2);

  for (let y = 0; y < LANTERN_ROWS.length; y += 1) {
    const row = LANTERN_ROWS[y];
    for (let x = 0; x < row.length; x += 1) {
      const ch = row[x];
      let color = null;
      if (ch === "G") color = "#3a3f47";
      else if (ch === "l") color = flameColor;
      else if (ch === "p") color = "#2b2f36";
      else if (ch === "b") color = "#20242a";
      if (!color) continue;
      ctx.fillStyle = color;
      ctx.fillRect(Math.round(ox + x * unit), Math.round(oy + y * unit), Math.ceil(unit), Math.ceil(unit));
    }
  }
}

const VAULT_ROWS = [
  "...VVVVVV...",
  "..VVVVVVVV..",
  ".VVVVVVVVVV.",
  "VVVVLLLLVVVV",
  "VVVLLwwLLVVV",
  "VVVLLwwLLVVV",
  "VVVVLLLLVVVV",
  ".VVVVVVVVVV.",
  "..VVVVVVVV..",
  "...VVVVVV...",
];

// UWM's delivery object — a bank vault door whose lock ring and center
// window warm from dull steel to gold as items are delivered.
export function drawVault(ctx, vault, progress) {
  const unit = 3.1;
  const width = 12 * unit;
  const height = 10 * unit;
  const ox = vault.x + (40 - width) / 2;
  const oy = vault.y + (40 - height) / 2;
  const pulse = 0.85 + Math.sin(performance.now() / 500) * 0.15;
  const lockColor = mix("#5a5f66", "#ffe9a8", progress);
  const glowHex = mix("#5a5f66", "#f0deb2", progress);
  const glowAlpha = 0.12 + progress * 0.4;
  const glowRadius = 12 + progress * 34 * pulse;

  const cx = ox + width / 2;
  const cy = oy + height / 2;
  const glow = ctx.createRadialGradient(cx, cy, 1, cx, cy, glowRadius);
  glow.addColorStop(0, hexToRgba(glowHex, glowAlpha));
  glow.addColorStop(1, hexToRgba(glowHex, 0));
  ctx.fillStyle = glow;
  ctx.fillRect(cx - glowRadius, cy - glowRadius, glowRadius * 2, glowRadius * 2);

  for (let y = 0; y < VAULT_ROWS.length; y += 1) {
    const row = VAULT_ROWS[y];
    for (let x = 0; x < row.length; x += 1) {
      const ch = row[x];
      let color = null;
      if (ch === "V") color = "#4a4f57";
      else if (ch === "L") color = lockColor;
      else if (ch === "w") color = mix("#3a3f47", "#fff6da", progress);
      if (!color) continue;
      ctx.fillStyle = color;
      ctx.fillRect(Math.round(ox + x * unit), Math.round(oy + y * unit), Math.ceil(unit), Math.ceil(unit));
    }
  }
}

const BIGM_ROWS = [
  "PPPPPPPPPPPP",
  "PMPPPPPPPPMP",
  "PMMPPPPPPMMP",
  "PMMMPPPPMMMP",
  "PMBMMPPMMBMP",
  "PMBBMMMMBBMP",
  "PMBBBMMBBBMP",
  "PMBBBBBBBBMP",
  "PMBBBBBBBBMP",
  "PMBBBBBBBBMP",
  "PPPPPPPPPPPP",
  "..EE....EE..",
];

// Ann Arbor's delivery object — the Big M landmark, which glows brighter
// gold as items are delivered at its base.
export function drawBigM(ctx, bigM, progress) {
  const unit = 3.4;
  const width = 12 * unit;
  const height = 12 * unit;
  const ox = bigM.x + (40 - width) / 2;
  const oy = bigM.y + (40 - height) / 2 - 6;
  const pulse = 0.85 + Math.sin(performance.now() / 500) * 0.15;
  const glowAlpha = 0.1 + progress * 0.4;
  const glowRadius = 14 + progress * 36 * pulse;

  const cx = ox + width / 2;
  const cy = oy + height / 2;
  const glow = ctx.createRadialGradient(cx, cy, 1, cx, cy, glowRadius);
  glow.addColorStop(0, hexToRgba("#e0c14a", glowAlpha));
  glow.addColorStop(1, hexToRgba("#e0c14a", 0));
  ctx.fillStyle = glow;
  ctx.fillRect(cx - glowRadius, cy - glowRadius, glowRadius * 2, glowRadius * 2);

  for (let y = 0; y < BIGM_ROWS.length; y += 1) {
    const row = BIGM_ROWS[y];
    for (let x = 0; x < row.length; x += 1) {
      const ch = row[x];
      let color = null;
      if (ch === "P") color = "#1c333c";
      else if (ch === "B") color = "#274a56";
      else if (ch === "M") color = mix("#8a6a2e", "#e0c14a", progress);
      else if (ch === "E") color = "#3a3f47";
      if (!color) continue;
      ctx.fillStyle = color;
      ctx.fillRect(Math.round(ox + x * unit), Math.round(oy + y * unit), Math.ceil(unit), Math.ceil(unit));
    }
  }
}

const portalReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
const PORTAL_RING_COLORS = ["#d4a24c", "#cfd8e3", "#f0e6d2"];

// The gateway that opens once every treasure has been delivered to the
// lantern. Rotation is disabled (but the portal still renders, just static)
// under prefers-reduced-motion.
export function drawPortal(ctx, portal) {
  const cx = portal.x + 20;
  const cy = portal.y + 20;
  const t = portalReducedMotion ? 0 : performance.now() / 1000;
  const pulse = portalReducedMotion ? 1 : 0.85 + Math.sin(performance.now() / 400) * 0.15;

  ctx.save();
  const glow = ctx.createRadialGradient(cx, cy, 2, cx, cy, 52 * pulse);
  glow.addColorStop(0, "rgba(212, 162, 76, 0.55)");
  glow.addColorStop(1, "rgba(212, 162, 76, 0)");
  ctx.fillStyle = glow;
  ctx.fillRect(cx - 60, cy - 60, 120, 120);

  PORTAL_RING_COLORS.forEach((color, i) => {
    const radius = 16 + i * 10;
    const spin = portalReducedMotion ? 0 : t * (i % 2 === 0 ? 1 : -1);
    ctx.save();
    ctx.translate(cx, cy);
    ctx.rotate(spin + (i * Math.PI) / 3);
    ctx.strokeStyle = color;
    ctx.lineWidth = 3;
    ctx.setLineDash([7, 7]);
    ctx.beginPath();
    ctx.arc(0, 0, radius, 0, Math.PI * 2);
    ctx.stroke();
    ctx.restore();
  });

  ctx.fillStyle = "#f0e6d2";
  ctx.beginPath();
  ctx.arc(cx, cy, 5, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}
