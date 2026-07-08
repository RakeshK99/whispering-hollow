import { timingMarkerPosition, MINIGAME_DIRECTIONS } from "../systems/minigame.js";
import { drawCharacterSprite, characterWidth } from "./sprites.js";

const DIR_GLYPH = { up: "▲", down: "▼", left: "◀", right: "▶" };
// Compass layout, relative to a center point.
const DIR_OFFSET = { up: [0, -1], down: [0, 1], left: [-1, 0], right: [1, 0] };
const FEEDBACK_DURATION = 500;

function feedbackAnim(game) {
  if (!game.feedback || game.feedback.elapsed >= FEEDBACK_DURATION) return { type: null, t: 1 };
  return { type: game.feedback.type, t: game.feedback.elapsed / FEEDBACK_DURATION };
}

// The host character, reacting live to the game state — an idle bob at all
// times, a quick pop + sparkle burst on a hit, a shake + red flash on a
// miss. Shared across all four mechanics so every mini-game reads as "this
// character is doing the thing", not an abstract UI bar floating alone.
function drawCharacterReaction(ctx, npcKey, x, y, unit, game, fb) {
  const bob = Math.sin(game.animClock / 260) * 3;
  let dx = 0;
  let scale = 1;
  if (fb.type === "hit") {
    scale = 1 + (1 - fb.t) * 0.22 * Math.sin(fb.t * Math.PI);
  } else if (fb.type === "miss") {
    dx = Math.sin(fb.t * 44) * 5 * (1 - fb.t);
  }

  const w = characterWidth(npcKey) * unit;
  const h = 16 * unit;

  ctx.save();
  ctx.fillStyle = "rgba(0,0,0,0.18)";
  ctx.beginPath();
  ctx.ellipse(x + dx, y + bob + h / 2 + 4, w * 0.32, w * 0.1, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();

  ctx.save();
  ctx.translate(x + dx - (w / 2) * scale, y + bob - (h / 2) * scale);
  ctx.scale(scale, scale);
  drawCharacterSprite(ctx, npcKey, 0, 0, unit);
  ctx.restore();

  if (fb.type === "miss") {
    ctx.save();
    ctx.globalAlpha = (1 - fb.t) * 0.38;
    ctx.fillStyle = "#d95b5b";
    ctx.beginPath();
    ctx.ellipse(x + dx, y + bob, w * 0.42, h * 0.42, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  } else if (fb.type === "hit") {
    ctx.save();
    ctx.globalAlpha = 1 - fb.t;
    ctx.fillStyle = "#ffe9a8";
    const r = 12 + fb.t * 22;
    for (let i = 0; i < 6; i += 1) {
      const ang = (i / 6) * Math.PI * 2 + game.animClock / 260;
      ctx.beginPath();
      ctx.arc(x + Math.cos(ang) * r, y + Math.sin(ang) * r, 2.5, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();
  }
}

function drawHeader(ctx, width, building) {
  ctx.font = "700 16px 'Silkscreen', monospace";
  ctx.fillStyle = "#f0e6d2";
  ctx.textAlign = "center";
  ctx.fillText(building.mini, width / 2, 34);
}

function drawResultBanner(ctx, width, y, game) {
  if (game.phase !== "done") return;
  ctx.font = "700 18px 'Silkscreen', monospace";
  ctx.fillStyle = game.won ? "#7ac97a" : "#d95b5b";
  ctx.textAlign = "center";
  ctx.fillText(game.won ? "You nailed it!" : "So close — try again?", width / 2, y);
  if (game.won && game.newTrinketEarned) {
    ctx.font = "700 11px 'Silkscreen', monospace";
    ctx.fillStyle = "#d4a24c";
    ctx.fillText("★ New trinket earned!", width / 2, y + 20);
  }
}

function drawTiming(ctx, width, height, game, building, fb) {
  const charX = 90;
  const charY = height / 2 + 4;
  drawCharacterReaction(ctx, building.npc, charX, charY, 2.4, game, fb);

  const barX = 160;
  const barY = height / 2 - 10;
  const barW = width - barX - 40;
  const barH = 20;

  ctx.font = "700 10px 'Silkscreen', monospace";
  ctx.fillStyle = "#8fa08c";
  ctx.textAlign = "center";
  ctx.fillText(`Round ${Math.min(game.round + 1, game.config.rounds)} of ${game.config.rounds}`, barX + barW / 2, 60);

  ctx.fillStyle = "#2b2018";
  ctx.fillRect(barX - 3, barY - 3, barW + 6, barH + 6);
  ctx.fillStyle = "#3a2e22";
  ctx.fillRect(barX, barY, barW, barH);

  const zoneX = barX + game.zoneStart * barW;
  const zoneW = game.config.zoneWidth * barW;
  ctx.fillStyle = building.accent || "#d4a24c";
  ctx.fillRect(zoneX, barY, zoneW, barH);

  if (game.phase === "playing") {
    const markerX = barX + timingMarkerPosition(game) * barW;
    ctx.fillStyle = "#f0e6d2";
    ctx.fillRect(markerX - 2, barY - 8, 4, barH + 16);
  }

  const dotSize = 12;
  const dotsY = barY + barH + 30;
  const totalDotsW = game.config.rounds * (dotSize + 8) - 8;
  const dotsX = barX + barW / 2 - totalDotsW / 2;
  for (let i = 0; i < game.config.rounds; i += 1) {
    const result = game.history[i];
    ctx.fillStyle = result === "hit" ? "#7ac97a" : result === "miss" ? "#d95b5b" : "#3a3f47";
    ctx.beginPath();
    ctx.arc(dotsX + i * (dotSize + 8) + dotSize / 2, dotsY, dotSize / 2, 0, Math.PI * 2);
    ctx.fill();
  }

  ctx.font = "700 12px 'Silkscreen', monospace";
  ctx.fillStyle = "#c7bfa8";
  if (game.phase === "playing") {
    ctx.fillText("Press INTERACT when the marker hits the glow", width / 2, dotsY + 40);
  } else {
    drawResultBanner(ctx, width, dotsY + 44, game);
  }
}

function drawRhythm(ctx, width, height, game, building, fb) {
  const laneY = height / 2;
  const laneLeft = 130;
  const laneRight = width - 60;
  const hitZoneW = 46;

  drawCharacterReaction(ctx, building.npc, 74, laneY, 2.2, game, fb);

  ctx.font = "700 10px 'Silkscreen', monospace";
  ctx.fillStyle = "#8fa08c";
  ctx.textAlign = "center";
  ctx.fillText(`Streak: ${game.hits} hit · ${game.misses} missed`, (laneLeft + laneRight) / 2, 60);

  ctx.strokeStyle = "#3a2e22";
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(laneLeft, laneY);
  ctx.lineTo(laneRight, laneY);
  ctx.stroke();

  ctx.fillStyle = building.accent || "#d4a24c";
  ctx.fillRect(laneLeft - hitZoneW / 2, laneY - 22, hitZoneW, 44);

  if (game.phase === "playing") {
    game.beats.forEach((beat) => {
      if (beat.resolved) return;
      const progress = (game.elapsed - beat.bornAt) / game.config.travelMs;
      const x = laneRight - progress * (laneRight - laneLeft);
      if (x < laneLeft - 30) return;
      ctx.fillStyle = "#f0e6d2";
      ctx.beginPath();
      ctx.arc(x, laneY, 10, 0, Math.PI * 2);
      ctx.fill();
    });
  }

  ctx.font = "700 12px 'Silkscreen', monospace";
  ctx.fillStyle = "#c7bfa8";
  if (game.phase === "playing") {
    ctx.fillText("Press INTERACT as each beat crosses the glow", width / 2, laneY + 70);
  } else {
    drawResultBanner(ctx, width, laneY + 70, game);
  }
}

function compassPositions(cx, cy, radius) {
  const pos = {};
  MINIGAME_DIRECTIONS.forEach((dir) => {
    const [ox, oy] = DIR_OFFSET[dir];
    pos[dir] = [cx + ox * radius, cy + oy * radius];
  });
  return pos;
}

function drawMemory(ctx, width, height, game, building, fb) {
  const cx = width / 2;
  const cy = height / 2 + 6;
  const radius = 74;
  const boxSize = 44;
  const pos = compassPositions(cx, cy, radius);

  ctx.font = "700 10px 'Silkscreen', monospace";
  ctx.fillStyle = "#8fa08c";
  ctx.textAlign = "center";
  ctx.fillText(
    game.phase === "showing" ? "Watch the sequence..." : game.phase === "input" ? "Now repeat it — use the arrow keys" : "",
    cx,
    60
  );

  drawCharacterReaction(ctx, building.npc, cx, cy, 1.8, game, fb);

  MINIGAME_DIRECTIONS.forEach((dir) => {
    const [x, y] = pos[dir];
    const active = game.phase === "showing" && game.activeDir === dir;
    ctx.fillStyle = active ? building.accent || "#d4a24c" : "#2b2018";
    ctx.fillRect(x - boxSize / 2, y - boxSize / 2, boxSize, boxSize);
    ctx.fillStyle = active ? "#2b2018" : "#8fa08c";
    ctx.font = "700 20px 'Silkscreen', monospace";
    ctx.fillText(DIR_GLYPH[dir], x, y + 7);
  });

  if (game.phase === "input") {
    const dotSize = 10;
    const totalW = game.sequence.length * (dotSize + 6) - 6;
    const dotsX = cx - totalW / 2;
    for (let i = 0; i < game.sequence.length; i += 1) {
      let color = "#3a3f47";
      if (i < game.inputIndex) color = "#7ac97a";
      ctx.fillStyle = color;
      ctx.beginPath();
      ctx.arc(dotsX + i * (dotSize + 6) + dotSize / 2, cy + radius + 34, dotSize / 2, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  ctx.font = "700 12px 'Silkscreen', monospace";
  ctx.fillStyle = "#c7bfa8";
  drawResultBanner(ctx, width, cy + radius + 60, game);
}

function drawMatch(ctx, width, height, game, building, fb) {
  const cx = width / 2;
  const cy = height / 2 + 20;
  const radius = 74;
  const boxSize = 44;
  const pos = compassPositions(cx, cy, radius);
  const colors = game.optionColors;
  const targetColor = colors[game.targetDir];

  ctx.font = "700 10px 'Silkscreen', monospace";
  ctx.fillStyle = "#8fa08c";
  ctx.textAlign = "center";
  ctx.fillText(`Round ${Math.min(game.round + 1, game.config.rounds)} of ${game.config.rounds} — match this color:`, cx, 50);

  ctx.fillStyle = targetColor;
  ctx.fillRect(cx - 20, 60, 40, 28);
  ctx.strokeStyle = "#2b2018";
  ctx.lineWidth = 2;
  ctx.strokeRect(cx - 20, 60, 40, 28);

  if (game.phase === "playing") {
    const barW = width - 120;
    const frac = 1 - game.roundTimer / game.config.roundMs;
    ctx.fillStyle = "#2b2018";
    ctx.fillRect(60 - 2, 100, barW + 4, 8);
    ctx.fillStyle = frac > 0.3 ? "#7ac97a" : "#d95b5b";
    ctx.fillRect(60, 102, Math.max(0, barW * frac), 4);
  }

  drawCharacterReaction(ctx, building.npc, cx, cy, 1.8, game, fb);

  MINIGAME_DIRECTIONS.forEach((dir) => {
    const [x, y] = pos[dir];
    ctx.fillStyle = colors[dir];
    ctx.fillRect(x - boxSize / 2, y - boxSize / 2, boxSize, boxSize);
    ctx.strokeStyle = "#2b2018";
    ctx.lineWidth = 2;
    ctx.strokeRect(x - boxSize / 2, y - boxSize / 2, boxSize, boxSize);
    ctx.fillStyle = "#2b2018";
    ctx.font = "700 16px 'Silkscreen', monospace";
    ctx.fillText(DIR_GLYPH[dir], x, y + 6);
  });

  ctx.font = "700 12px 'Silkscreen', monospace";
  ctx.fillStyle = "#c7bfa8";
  if (game.phase === "playing") {
    ctx.fillText("Press the arrow key for the matching color", cx, cy + radius + 44);
  } else {
    drawResultBanner(ctx, width, cy + radius + 44, game);
  }
}

const DRAWERS = { timing: drawTiming, rhythm: drawRhythm, memory: drawMemory, match: drawMatch };

export function drawMinigame(ctx, width, height, game, building) {
  ctx.clearRect(0, 0, width, height);
  ctx.fillStyle = "#1b3020";
  ctx.fillRect(0, 0, width, height);

  const fb = feedbackAnim(game);
  let shakeX = 0;
  let shakeY = 0;
  if (fb.type === "miss") {
    const decay = 1 - fb.t;
    shakeX = (Math.random() * 2 - 1) * 4 * decay;
    shakeY = (Math.random() * 2 - 1) * 2 * decay;
  }

  ctx.save();
  ctx.translate(shakeX, shakeY);
  drawHeader(ctx, width, building);
  const drawer = DRAWERS[game.type];
  if (drawer) drawer(ctx, width, height, game, building, fb);
  ctx.restore();

  ctx.textAlign = "left";
}
