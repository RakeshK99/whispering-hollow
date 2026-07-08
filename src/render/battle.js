// Battle panel visuals, ported from the Claude Design project
// 871fff35-1062-4627-9b71-3b88b201c323 (Whispering Hollow Asset Atlas,
// "Battle Panel" section), extended with a quick-time strike bar and
// hit/miss animation (flash + shake + floating damage number) so FIGHT
// reads as a real exchange instead of an invisible dice roll.
import { drawCharacterSprite, characterWidth, drawPlayerAt } from "./sprites.js";
import { BATTLE_MAX_HP } from "../systems/battle.js";
import { timingMarkerPosition } from "../systems/minigame.js";

export const BATTLE_WIDTH = 540;
export const BATTLE_HEIGHT = 300;

function roundRect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

function hpBox(ctx, x, y, w, h, name, level, frac) {
  ctx.fillStyle = "#2b2018";
  roundRect(ctx, x - 3, y - 3, w + 6, h + 6, 9);
  ctx.fill();

  const bg = ctx.createLinearGradient(0, y, 0, y + h);
  bg.addColorStop(0, "#f4ead6");
  bg.addColorStop(1, "#e6d5b6");
  ctx.fillStyle = bg;
  roundRect(ctx, x, y, w, h, 7);
  ctx.fill();

  ctx.fillStyle = "#2b2018";
  ctx.font = "700 13px 'Silkscreen', monospace";
  ctx.textBaseline = "alphabetic";
  ctx.fillText(name, x + 12, y + 22);
  ctx.font = "700 11px 'Silkscreen', monospace";
  ctx.fillText(`Lv${level}`, x + w - 42, y + 22);

  ctx.fillStyle = "#9a6b2e";
  ctx.font = "700 10px 'Silkscreen', monospace";
  ctx.fillText("HP", x + 12, y + 40);
  const bx = x + 34;
  const bw = w - 46;
  const by = y + 31;
  ctx.fillStyle = "#2b2018";
  roundRect(ctx, bx - 2, by - 2, bw + 4, 12, 4);
  ctx.fill();
  ctx.fillStyle = "#3a2e22";
  roundRect(ctx, bx, by, bw, 8, 3);
  ctx.fill();
  const hpColor = frac > 0.5 ? "#7ac97a" : frac > 0.2 ? "#e0c14a" : "#d95b5b";
  ctx.fillStyle = hpColor;
  roundRect(ctx, bx, by, Math.max(4, bw * frac), 8, 3);
  ctx.fill();
}

// progress: 0 (just resolved) .. 1 (animation over)
function drawImpact(ctx, x, y, progress, negative) {
  const rise = progress * 26;
  ctx.save();
  ctx.globalAlpha = Math.max(0, 1 - progress);
  ctx.font = "700 18px 'Silkscreen', monospace";
  ctx.fillStyle = "#d95b5b";
  ctx.textAlign = "center";
  ctx.fillText(negative ? "-1" : "MISS", x, y - rise);
  ctx.restore();
}

export function drawBattleScene(ctx, battle) {
  const W = BATTLE_WIDTH;
  const H = BATTLE_HEIGHT;
  ctx.clearRect(0, 0, W, H);

  ctx.fillStyle = "#cfe0d4";
  ctx.fillRect(0, 0, W, H);
  ctx.fillStyle = "#c3d8c6";
  ctx.fillRect(0, H * 0.3, W, H * 0.32);
  ctx.fillStyle = "#b0cbb2";
  ctx.fillRect(0, H * 0.62, W, H * 0.38);

  const plat = (cx, cy, rx, ry) => {
    ctx.fillStyle = "#7ea486";
    ctx.beginPath();
    ctx.ellipse(cx, cy + 5, rx, ry, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "#9cbfa2";
    ctx.beginPath();
    ctx.ellipse(cx, cy, rx, ry, 0, 0, Math.PI * 2);
    ctx.fill();
  };
  plat(W * 0.74, H * 0.44, 78, 20);
  plat(W * 0.24, H * 0.78, 92, 24);

  // resolve-phase animation progress: 0 (just hit) -> 1 (settled)
  const animT = battle.phase === "resolve" ? 1 - battle.resolveTimer / battle.resolveDuration : 1;
  const shakeFor = (who) => {
    if (battle.phase !== "resolve" || battle.hitFlash !== who) return { x: 0, y: 0, flash: 0 };
    const decay = 1 - animT;
    return { x: Math.sin(animT * 50) * 6 * decay, y: 0, flash: decay };
  };

  const idleBob = Math.sin(performance.now() / 420);
  const npc = battle.npc;
  const foeShake = shakeFor("foe");
  const foeX = W * 0.74;
  const foeY = H * 0.44;
  if (npc) {
    const fu = 4;
    const fw = characterWidth(npc.id);
    ctx.save();
    ctx.translate(foeShake.x, foeShake.y + idleBob * 2);
    drawCharacterSprite(ctx, npc.id, foeX - (fw * fu) / 2, foeY + 8 - 16 * fu, fu);
    if (foeShake.flash > 0) {
      ctx.globalAlpha = foeShake.flash * 0.5;
      ctx.fillStyle = "#d95b5b";
      ctx.fillRect(foeX - (fw * fu) / 2, foeY + 8 - 16 * fu, fw * fu, 16 * fu);
    }
    ctx.restore();
  }
  if (battle.phase === "resolve" && battle.hitFlash === "foe") {
    drawImpact(ctx, foeX, foeY - 40, animT, true);
  }

  const playerShake = shakeFor("player");
  const playerX = W * 0.24;
  const playerY = H * 0.78;
  ctx.save();
  ctx.translate(playerShake.x, playerShake.y - idleBob * 1.5);
  drawPlayerAt(ctx, "up", playerX - (16 * 4.2) / 2, playerY + 10 - 16 * 4.2, 4.2, battle.playerColor);
  if (playerShake.flash > 0) {
    ctx.globalAlpha = playerShake.flash * 0.5;
    ctx.fillStyle = "#d95b5b";
    ctx.fillRect(playerX - (16 * 4.2) / 2, playerY + 10 - 16 * 4.2, 16 * 4.2, 16 * 4.2);
  }
  ctx.restore();
  if (battle.phase === "resolve" && battle.hitFlash === "player") {
    drawImpact(ctx, playerX, playerY - 50, animT, true);
  }

  hpBox(ctx, 22, 24, 210, 52, (npc ? npc.name.split(" ")[0] : "FOE").toUpperCase(), npc ? npc.battleLevel : 12, battle.foeHp / BATTLE_MAX_HP);
  hpBox(ctx, W - 232, H - 92, 210, 60, "EXPLORER", 12, battle.playerHp / BATTLE_MAX_HP);

  if (battle.phase === "qte") {
    drawStrikeBar(ctx, W, H, battle.qte);
  }
}

function drawStrikeBar(ctx, W, H, qte) {
  const barW = 260;
  const barX = W / 2 - barW / 2;
  const barY = H - 46;
  const barH = 18;

  ctx.fillStyle = "#2b2018";
  ctx.fillRect(barX - 3, barY - 3, barW + 6, barH + 6);
  ctx.fillStyle = "#3a2e22";
  ctx.fillRect(barX, barY, barW, barH);

  const zoneX = barX + qte.zoneStart * barW;
  const zoneW = qte.config.zoneWidth * barW;
  ctx.fillStyle = "#d4a24c";
  ctx.fillRect(zoneX, barY, zoneW, barH);

  if (qte.phase === "playing") {
    const markerX = barX + timingMarkerPosition(qte) * barW;
    ctx.fillStyle = "#f0e6d2";
    ctx.fillRect(markerX - 2, barY - 6, 4, barH + 12);
  }

  ctx.font = "700 11px 'Silkscreen', monospace";
  ctx.fillStyle = "#2b2018";
  ctx.textAlign = "center";
  ctx.fillText("Press STRIKE! on the glow", W / 2, barY - 12);
  ctx.textAlign = "left";
}
