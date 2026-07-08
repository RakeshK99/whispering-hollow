// Enterable-building interior ("cozy Pokémon-style room"), ported from the
// Claude Design project 871fff35-1062-4627-9b71-3b88b201c323 (Whispering
// Hollow Asset Atlas, "Enterable Buildings & Interiors" section).
import { drawCharacterSprite } from "./sprites.js";

export const INTERIOR_WIDTH = 560;
export const INTERIOR_HEIGHT = 320;
const WALL_HEIGHT = 72;
const FLOOR_Y = WALL_HEIGHT + 6;

function shade(hex, factor) {
  const n = parseInt(hex.slice(1), 16);
  const r = Math.min(255, Math.round(((n >> 16) & 255) * factor));
  const g = Math.min(255, Math.round(((n >> 8) & 255) * factor));
  const b = Math.min(255, Math.round((n & 255) * factor));
  return `#${((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1)}`;
}

export function drawInterior(ctx, building) {
  const W = INTERIOR_WIDTH;
  const H = INTERIOR_HEIGHT;
  const R = (x, y, w, h, col) => {
    ctx.fillStyle = col;
    ctx.fillRect(Math.round(x), Math.round(y), Math.round(w), Math.round(h));
  };
  const ell = (cx, cy, rx, ry, col) => {
    ctx.fillStyle = col;
    ctx.beginPath();
    ctx.ellipse(cx, cy, rx, ry, 0, 0, Math.PI * 2);
    ctx.fill();
  };
  const stroke = (col, w) => {
    ctx.strokeStyle = col;
    ctx.lineWidth = w;
  };
  const acc = building.accent || "#c23a3a";

  ctx.clearRect(0, 0, W, H);

  // ===== FLOOR =====
  const checker = (a, b, sz) => {
    for (let y = WALL_HEIGHT; y < H; y += sz) {
      for (let x = 0; x < W; x += sz) {
        R(x, y, sz, sz, (Math.floor(x / sz) + Math.floor(y / sz)) % 2 ? a : b);
        ctx.fillStyle = "rgba(0,0,0,0.05)";
        ctx.fillRect(x, y, sz, 1);
      }
    }
  };
  const carpet = (base) => {
    R(0, WALL_HEIGHT, W, H, base);
    for (let i = 0; i < 220; i += 1) {
      const x = Math.random() * W;
      const y = WALL_HEIGHT + Math.random() * (H - WALL_HEIGHT);
      ctx.fillStyle = Math.random() < 0.5 ? shade(base, 0.94) : shade(base, 1.06);
      ctx.fillRect(x, y, 2, 2);
    }
  };
  const wood = (base = "#9a6238") => {
    R(0, 0, W, H, base);
    for (let y = WALL_HEIGHT; y < H; y += 16) {
      R(0, y, W, 16, Math.floor(y / 16) % 2 ? shade(base, 0.89) : shade(base, 0.96));
      ctx.fillStyle = "rgba(58,34,18,0.55)";
      ctx.fillRect(0, y, W, 2);
      const off = Math.floor(y / 16) % 2 ? 0 : 56;
      for (let x = off; x < W; x += 112) {
        ctx.fillStyle = "rgba(58,34,18,0.4)";
        ctx.fillRect(x, y, 2, 16);
      }
    }
  };
  // Buildings can override the two-tone floor palette (`floorColors`) to fit
  // their world's mood instead of the named preset's default colors — Troy's
  // graveyard interiors need much darker tones than a sunlit UWM office.
  const [fcA, fcB] = building.floorColors || [];
  const floor = building.floor || "wood";
  if (floor === "wood" || floor === "court") wood(fcA);
  else if (floor === "rubber") carpet(fcA || "#3c4048");
  else if (floor === "carpetB") carpet(fcA || "#5a6470");
  else if (floor === "carpetG") carpet(fcA || "#4f6a52");
  else if (floor === "carpetM") carpet(fcA || "#6e4a4a");
  else if (floor === "tileL") checker(fcA || "#cfc8ba", fcB || "#e2ddd2", 28);
  else if (floor === "tileWarm") checker(fcA || "#e2cfa8", fcB || "#efe2c4", 28);
  else if (floor === "tileMint") checker(fcA || "#cceae0", fcB || "#eaf7f2", 28);
  else if (floor === "tileItal") checker(fcA || "#2b2b2b", fcB || "#e8e4da", 28);
  else wood(fcA);
  if (floor === "court") {
    stroke("#e8dcc0", 3);
    ctx.strokeRect(30, FLOOR_Y + 18, W - 60, H - FLOOR_Y - 40);
    ctx.beginPath();
    ctx.arc(W / 2, FLOOR_Y + 18, 44, 0, Math.PI);
    ctx.stroke();
  }

  // ===== WALLS + DOOR =====
  R(0, 0, 10, H, "#3a2a1c");
  R(W - 10, 0, 10, H, "#3a2a1c");
  const wall = building.wall || "#e2d2ac";
  R(0, 0, W, WALL_HEIGHT, wall);
  R(0, 0, W, 12, shade(wall, 1.08));
  R(0, WALL_HEIGHT - 10, W, 10, shade(wall, 0.82));
  const dx = W / 2 - 38;
  R(dx, 0, 76, WALL_HEIGHT - 10, "#8a7a60");
  R(dx + 8, 0, 60, WALL_HEIGHT - 18, "#5f503c");
  R(dx + 8, 0, 60, 8, "#6e5d45");

  const frame = (fx, col) => {
    R(fx, 16, 38, 30, "#3a2e22");
    R(fx + 4, 20, 30, 22, col);
    R(fx + 4, 20, 30, 7, shade(col, 1.2));
  };
  (building.art || ["#8fb0d8", "#d88f8f", "#a8d090", "#e6cc84"]).forEach((col, i) =>
    frame(i < 2 ? 58 + i * 66 : W - 170 + (i - 2) * 74, col)
  );
  const plant = (px) => {
    R(px, WALL_HEIGHT - 20, 22, 12, "#c07a44");
    R(px + 2, WALL_HEIGHT - 20, 22, 3, "#d68a52");
    R(px + 4, WALL_HEIGHT - 40, 14, 22, "#3f7350");
    R(px + 7, WALL_HEIGHT - 46, 10, 12, "#4f8a60");
    R(px + 1, WALL_HEIGHT - 34, 6, 8, "#357a52");
  };
  plant(dx - 42);
  plant(dx + 82);

  // ===== shared prop helpers =====
  const counter = (x, y, w, col) => {
    R(x, y, w, 42, shade(col, 0.7));
    R(x, y, w, 10, col);
    R(x + 3, y + 3, w - 6, 5, shade(col, 1.25));
  };
  const glassCase = (x, y, w, rows) => {
    R(x, y + 26, w, 20, "#7a5230");
    R(x, y + 22, w, 6, "#a87a4e");
    R(x, y, w, 24, "rgba(190,220,235,0.5)");
    stroke("#dfeef6", 2);
    ctx.strokeRect(x, y, w, 24);
    for (let r = 0; r < rows.length; r += 1) {
      const items = rows[r];
      for (let i = 0; i < items.length; i += 1) {
        R(x + 6 + (i * (w - 12)) / items.length, y + 6 + r * 10, (w - 14) / items.length, 7, items[i]);
      }
    }
  };
  const monitor = (x, y, scr) => {
    R(x, y, 34, 24, "#2b2f36");
    R(x + 3, y + 3, 28, 16, scr);
    R(x + 14, y + 24, 6, 6, "#2b2f36");
    R(x + 8, y + 30, 18, 3, "#2b2f36");
  };
  const bookcase = (x, w, h) => {
    R(x, FLOOR_Y + 2, w, h, "#5b4636");
    const cols = ["#c23a3a", "#4a90d9", "#7ac97a", "#e0c14a", "#c264c9", "#e08a4a"];
    for (let r = 0; r * 30 < h - 8; r += 1) {
      R(x + 4, FLOOR_Y + 8 + r * 30, w - 8, 24, "#3a2e22");
      for (let b = 0; b * 9 < w - 14; b += 1) R(x + 5 + b * 9, FLOOR_Y + 9 + r * 30, 7, 22, cols[(b + r) % 6]);
    }
  };

  // ===== per-building themed scene =====
  const k = building.id;
  if (k === "zwest") {
    R(40, FLOOR_Y + 70, 150, 54, "#20242a");
    R(52, FLOOR_Y + 78, 126, 36, "#4a90d9");
    R(60, FLOOR_Y + 84, 40, 24, "#7ab0e8");
    R(150, FLOOR_Y + 150, 10, 10, acc);
    R(70, FLOOR_Y + 150, 90, 20, "#2b2f36");
    R(96, FLOOR_Y + 150, 10, 20, "#e0c14a");
    ell(150, FLOOR_Y + 176, 44, 16, shade(acc, 0.85));
    R(120, FLOOR_Y + 140, 60, 24, acc);
    R(120, FLOOR_Y + 140, 60, 22, acc);
    R(112, FLOOR_Y + 120, 26, 60, acc);
    R(180, FLOOR_Y + 120, 26, 60, acc);
    counter(360, FLOOR_Y + 22, 180, "#6e4c30");
    R(384, FLOOR_Y + 2, 28, 24, "#3a4a5a");
    R(424, FLOOR_Y + 4, 40, 22, "#bcd6e0");
    R(490, FLOOR_Y + 2, 40, 24, "#cfd6da");
    R(360, FLOOR_Y + 150, 70, 44, "#7a5230");
    ell(395, FLOOR_Y + 150, 40, 15, "#8a6242");
    R(410, FLOOR_Y + 142, 18, 8, "#f0e6d2");
  } else if (k === "lifetime" || k === "sportsplex") {
    R(20, FLOOR_Y, 150, 14, "#bcd6e0");
    R(20, FLOOR_Y, 150, 90, "rgba(190,214,224,0.35)");
    R(60, FLOOR_Y + 120, 120, 20, "#2b2f36");
    R(60, FLOOR_Y + 134, 120, 30, "#20242a");
    R(150, FLOOR_Y + 96, 14, 44, "#3a3f47");
    R(150, FLOOR_Y + 96, 44, 14, "#5a6270");
    R(360, FLOOR_Y + 30, 160, 20, "#3a3f47");
    R(360, FLOOR_Y + 30, 10, 86, "#2b2f36");
    R(510, FLOOR_Y + 30, 10, 86, "#2b2f36");
    for (let i = 0; i < 4; i += 1) ell(378 + i * 36, FLOOR_Y + 40, 11, 11, acc);
    R(230, FLOOR_Y + 150, 120, 34, shade(acc, 0.9));
    stroke(shade(acc, 1.3), 2);
    ctx.strokeRect(236, FLOOR_Y + 156, 108, 22);
    R(500, FLOOR_Y + 130, 26, 50, "#cfd6da");
    R(506, FLOOR_Y + 120, 14, 14, "#8fd0e8");
    if (k === "sportsplex") {
      R(410, FLOOR_Y + 2, 90, 8, "#e08a4a");
      R(452, FLOOR_Y + 8, 6, 26, "#3a2e22");
      ell(455, FLOOR_Y + 40, 20, 7, "#e08a4a");
    }
  } else if (k === "cookieboys") {
    glassCase(300, FLOOR_Y + 40, 240, [
      ["#a86b3c", "#8a5a2a", "#c78a4c", "#a86b3c"],
      ["#8a5a2a", "#c78a4c", "#a86b3c", "#8a5a2a"],
    ]);
    R(320, FLOOR_Y + 2, 60, 40, "#9aa0a8");
    R(326, FLOOR_Y + 8, 48, 28, "#3a2e22");
    R(340, FLOOR_Y + 14, 20, 16, "#e08a4a");
    R(324, FLOOR_Y + 2, 56, 5, "#cfd6da");
    R(60, FLOOR_Y + 120, 120, 44, shade("#8a5a2a", 0.7));
    R(60, FLOOR_Y + 120, 120, 10, "#8a5a2a");
    R(150, FLOOR_Y + 128, 22, 16, "#2b2f36");
    for (let i = 0; i < 4; i += 1) ell(80 + i * 22, FLOOR_Y + 110, 8, 6, "#c78a4c");
  } else if (k === "zoyo") {
    for (let i = 0; i < 3; i += 1) {
      R(310 + i * 70, FLOOR_Y + 20, 54, 70, "#cfd6da");
      R(316 + i * 70, FLOOR_Y + 26, 42, 30, ["#e08a9b", "#7ac97a", "#8fb0d8"][i]);
      R(330 + i * 70, FLOOR_Y + 56, 14, 20, "#9aa0a8");
      R(330 + i * 70, FLOOR_Y + 76, 14, 8, "#e0c14a");
    }
    R(60, FLOOR_Y + 130, 180, 30, "#eaf7f2");
    for (let i = 0; i < 6; i += 1) R(70 + i * 28, FLOOR_Y + 132, 22, 26, ["#e08a9b", "#e0c14a", "#7ac97a", "#8fb0d8", "#c264c9", "#e08a4a"][i]);
    for (let i = 0; i < 5; i += 1) R(430 + i * 8, FLOOR_Y + 130, 7, 18, "#eef7f4");
  } else if (k === "rudys" || k === "corattis") {
    const cold = k === "corattis";
    glassCase(
      300,
      FLOOR_Y + 40,
      240,
      cold
        ? [
            ["#e08a9b", "#7ac97a", "#e0c14a", "#8fb0d8"],
            ["#c264c9", "#e08a4a", "#efe2c4", "#a86b3c"],
          ]
        : [["#c78a4c", "#e0c14a", "#a86b3c", "#efe2c4"]]
    );
    if (cold) {
      R(320, FLOOR_Y - 2, 70, 44, "#8a4632");
      ctx.fillStyle = "#8a4632";
      ctx.beginPath();
      ctx.arc(355, FLOOR_Y, 35, Math.PI, 0);
      ctx.fill();
      R(340, FLOOR_Y + 20, 30, 20, "#e08a4a");
    } else {
      R(330, FLOOR_Y, 50, 42, "#3a3f47");
      R(338, FLOOR_Y + 8, 34, 20, "#5a6270");
      R(350, FLOOR_Y + 30, 10, 10, "#8a6242");
      ctx.fillStyle = "rgba(230,230,235,0.5)";
      R(352, FLOOR_Y - 10, 4, 10, "rgba(230,230,235,0.5)");
    }
    R(40, FLOOR_Y + 8, 64, 52, "#2b2018");
    for (let i = 0; i < 4; i += 1) R(48, FLOOR_Y + 16 + i * 10, 48, 3, "#cfc8ba");
    ell(150, FLOOR_Y + 150, 40, 15, "#8a6242");
    R(120, FLOOR_Y + 140, 16, 8, "#f0e6d2");
    R(160, FLOOR_Y + 142, 16, 8, "#f0e6d2");
    if (cold) {
      R(20, FLOOR_Y + 120, W - 40, 7, "#4f8a60");
      R(20, FLOOR_Y + 127, W - 40, 7, "#f0e6d2");
      R(20, FLOOR_Y + 134, W - 40, 7, "#c23a3a");
    }
  } else if (k === "mall") {
    ell(W / 2, FLOOR_Y + 150, 70, 26, "#3a6ea0");
    ell(W / 2, FLOOR_Y + 146, 70, 24, "#4f8fc0");
    ell(W / 2, FLOOR_Y + 142, 40, 14, "#8fc0e0");
    R(W / 2 - 4, FLOOR_Y + 110, 8, 36, "#9aa0a8");
    const rack = (x) => {
      R(x, FLOOR_Y + 30, 4, 60, "#9aa0a8");
      R(x - 30, FLOOR_Y + 30, 64, 4, "#9aa0a8");
      for (let i = 0; i < 5; i += 1) R(x - 26 + i * 12, FLOOR_Y + 34, 10, 30, ["#e08a9b", "#8fb0d8", "#e0c14a", "#7ac97a", "#c264c9"][i]);
    };
    rack(90);
    rack(470);
    R(250, FLOOR_Y + 8, 60, 42, "#2b2f36");
    R(256, FLOOR_Y + 14, 48, 30, "#7ac97a");
    R(276, FLOOR_Y + 50, 8, 10, "#2b2f36");
    R(60, FLOOR_Y + 150, 90, 14, "#7a5230");
    R(70, FLOOR_Y + 164, 8, 16, "#5b4636");
    R(132, FLOOR_Y + 164, 8, 16, "#5b4636");
  } else if (k === "uwmnorth") {
    R(40, FLOOR_Y, 70, 150, "#20242a");
    for (let r = 0; r < 8; r += 1) {
      R(46, FLOOR_Y + 8 + r * 18, 58, 12, "#2b3038");
      R(52, FLOOR_Y + 11 + r * 18, 6, 6, ["#7ac97a", "#e0c14a", "#c23a3a"][r % 3]);
      R(62, FLOOR_Y + 11 + r * 18, 6, 6, "#4a90d9");
    }
    const desk = (x) => {
      R(x, FLOOR_Y + 90, 90, 16, "#6e5236");
      monitor(x + 26, FLOOR_Y + 64, "#173a2a");
    };
    desk(180);
    desk(300);
    R(430, FLOOR_Y + 20, 90, 64, "#e8e4da");
    stroke("#4a90d9", 3);
    ctx.beginPath();
    ctx.moveTo(440, FLOOR_Y + 70);
    ctx.lineTo(465, FLOOR_Y + 45);
    ctx.lineTo(490, FLOOR_Y + 55);
    ctx.lineTo(512, FLOOR_Y + 30);
    ctx.stroke();
  } else if (k === "uwmsouth") {
    R(300, FLOOR_Y + 6, 150, 70, "#e8e4da");
    for (let i = 0; i < 5; i += 1) R(312 + i * 26, FLOOR_Y + 66 - i * 8 - 6, 18, i * 8 + 8, shade(acc, 1.1));
    ctx.strokeStyle = "#c23a3a";
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(312, FLOOR_Y + 58);
    ctx.lineTo(440, FLOOR_Y + 20);
    ctx.stroke();
    const desk = (x) => {
      R(x, FLOOR_Y + 110, 96, 16, "#6e5236");
      monitor(x + 10, FLOOR_Y + 84, "#1a2a3a");
      R(x + 70, FLOOR_Y + 96, 16, 10, "#2b2f36");
    };
    desk(60);
    desk(180);
    R(500, FLOOR_Y + 120, 26, 50, "#cfd6da");
    R(506, FLOOR_Y + 110, 14, 14, "#8fd0e8");
  } else if (k === "shapiro") {
    bookcase(24, 60, 180);
    bookcase(W - 84, 60, 180);
    R(120, FLOOR_Y + 2, W - 240, 40, "#5b4636");
    for (let b = 0; b < (W - 240) / 9; b += 1) R(126 + b * 9, FLOOR_Y + 9, 7, 26, ["#c23a3a", "#4a90d9", "#7ac97a", "#e0c14a"][b % 4]);
    const table = (cx, cy) => {
      ell(cx, cy, 52, 18, "#7a5230");
      ell(cx, cy - 4, 52, 18, "#8a6242");
      R(cx - 26, cy - 16, 12, 12, "#f0e6d2");
      R(cx + 14, cy - 16, 12, 12, "#f0e6d2");
      R(cx - 4, cy - 22, 8, 14, "#3a6b4a");
      R(cx - 2, cy - 28, 4, 8, "#e0c14a");
    };
    table(160, FLOOR_Y + 150);
    table(400, FLOOR_Y + 150);
    R(250, FLOOR_Y + 120, 60, 30, "#6e5236");
    R(256, FLOOR_Y + 112, 20, 12, "#e0e0e0");
    R(280, FLOOR_Y + 112, 20, 12, "#c23a3a");
  } else {
    counter(300, FLOOR_Y + 30, 236, "#6e4c30");
  }

  // welcome rug at doorway
  R(W / 2 - 26, H - 30, 52, 24, acc);
  R(W / 2 - 20, H - 24, 40, 12, shade(acc, 1.2));

  // ===== the NPC inside =====
  const nx = building.npcX != null ? building.npcX : W / 2 - (16 * 3) / 2;
  const ny = building.npcY != null ? building.npcY : FLOOR_Y + 30;
  ctx.fillStyle = "rgba(0,0,0,.18)";
  ctx.beginPath();
  ctx.ellipse(nx + 24, ny + 46, 16, 5, 0, 0, Math.PI * 2);
  ctx.fill();
  drawCharacterSprite(ctx, building.npc, nx, ny, 3);
}
