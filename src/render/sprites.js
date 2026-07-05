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

const SHRINE_GRID = [
  "................",
  "................",
  ".....GGGG.......",
  "....GGGGGG......",
  "...SSSSSSSS.....",
  "..SSSSSSSSSS....",
  "..SSSSSSSSSS....",
  "..SSSSSSSSSS....",
  "...SSSSSSSS.....",
  "....SSSSSS......",
  "................",
];

// progress: 0..1, how many of the four treasures have been delivered here —
// the center gem warms from dull stone-gray toward gold and glows brighter
// as the crossroads nears its ending.
export function drawShrine(ctx, shrine, progress) {
  const unit = 40 / 16;
  const pulse = 0.85 + Math.sin(performance.now() / 500) * 0.15;
  const gemColor = mix("#5f6b66", "#ffe9a8", progress);

  if (progress > 0) {
    ctx.save();
    ctx.shadowColor = gemColor;
    ctx.shadowBlur = 6 + progress * 14 * pulse;
  }

  for (let y = 0; y < SHRINE_GRID.length; y += 1) {
    const row = SHRINE_GRID[y];
    for (let x = 0; x < row.length; x += 1) {
      const ch = row[x];
      let color = null;
      if (ch === "S") color = "#5a6a63";
      else if (ch === "G") color = gemColor;
      if (!color) continue;
      ctx.fillStyle = color;
      ctx.fillRect(Math.round(shrine.x + x * unit), Math.round(shrine.y + y * unit), Math.ceil(unit), Math.ceil(unit));
    }
  }

  if (progress > 0) ctx.restore();
}
