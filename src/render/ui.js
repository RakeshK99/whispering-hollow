// Interact hint bubble + FX (sparkle/confetti/splash) ported from the
// Whispering Hollow Asset Atlas (Claude Design project
// 3c367480-358d-4356-bb01-93086977e9b5). The atlas versions loop forever for
// the preview page; these are single-shot, driven by elapsed time instead of
// a repeating tick, and fade to nothing so they stay under 2 seconds.
const FX_DURATION_MS = 900;
const FX_DURATIONS = { dust: 380 };
const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

function rng(seed) {
  let s = seed;
  return () => {
    s = (s * 1103515245 + 12345) & 0x7fffffff;
    return s / 0x7fffffff;
  };
}

export function drawInteractHint(ctx, target) {
  if (!target) return;
  const x = target.x + 20;
  const y = target.y - 6;

  ctx.fillStyle = "#f0e6d2";
  ctx.strokeStyle = "#2b2018";
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.arc(x, y, 9, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();

  ctx.fillStyle = "#2b2018";
  ctx.font = "bold 12px system-ui, sans-serif";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText("!", x, y + 1);
}

// A small red "B" badge above battle-eligible NPCs, shown alongside the
// regular talk hint so it's clear this NPC can also be challenged.
export function drawChallengeHint(ctx, target) {
  if (!target) return;
  const x = target.x + 20;
  const y = target.y - 24;

  ctx.fillStyle = "#d95b5b";
  ctx.strokeStyle = "#2b2018";
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.arc(x, y, 9, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();

  ctx.fillStyle = "#f0e6d2";
  ctx.font = "bold 10px system-ui, sans-serif";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText("B", x, y + 1);
}

function drawSparkle(ctx, cx, cy, t) {
  const size = 64;
  const ox = cx - size / 2;
  const oy = cy - size / 2;
  const g = Math.sin(t * Math.PI);
  const arm = 8 + g * 10;

  ctx.fillStyle = "#ffe9a8";
  ctx.fillRect(ox + size / 2 - 2, oy + size / 2 - arm, 4, arm * 2);
  ctx.fillRect(ox + size / 2 - arm, oy + size / 2 - 2, arm * 2, 4);

  ctx.save();
  ctx.translate(ox + size / 2, oy + size / 2);
  ctx.rotate(Math.PI / 4);
  const a2 = arm * 0.6;
  ctx.fillStyle = "#d4a24c";
  ctx.fillRect(-1.5, -a2, 3, a2 * 2);
  ctx.fillRect(-a2, -1.5, a2 * 2, 3);
  ctx.restore();

  ctx.fillStyle = "#fff6da";
  ctx.fillRect(ox + size / 2 - 3, oy + size / 2 - 3, 6, 6);

  const rnd = rng(7);
  for (let i = 0; i < 3; i += 1) {
    const angle = rnd() * Math.PI * 2;
    const r = 14 + g * 8;
    ctx.fillStyle = "#ffe9a8";
    ctx.fillRect(ox + size / 2 + Math.cos(angle) * r - 2, oy + size / 2 + Math.sin(angle) * r - 2, 3, 3);
  }
}

function drawConfetti(ctx, cx, cy, t) {
  const colors = ["#e08a9b", "#d4a24c", "#7ac97a", "#4a90d9", "#c264c9", "#e0c14a"];
  const rnd = rng(11);
  for (let i = 0; i < 14; i += 1) {
    const angle = rnd() * Math.PI * 2;
    const speed = 10 + rnd() * 22;
    const r = t * speed;
    const x = cx + Math.cos(angle) * r;
    const y = cy + Math.sin(angle) * r - t * 6 + t * t * 14;
    ctx.fillStyle = colors[i % colors.length];
    const size = Math.max(4 - t * 1.5, 0);
    ctx.fillRect(x - size / 2, y - size / 2, size, size);
  }
}

function drawSplash(ctx, cx, cyBase, t) {
  const cy = cyBase - 14;
  const rnd = rng(5);
  for (let i = 0; i < 9; i += 1) {
    const angle = -Math.PI * 0.2 - (i / 9) * Math.PI * 0.6;
    const speed = 16 + rnd() * 10;
    const x = cx + Math.cos(angle) * speed * t;
    const y = cy - Math.sin(-angle) * speed * t + t * t * 30;
    ctx.fillStyle = i % 2 ? "#bfe8f0" : "#7fbfd0";
    const size = Math.max(5 - t * 2, 0);
    ctx.fillRect(x - size / 2, y - size / 2, size, size);
  }
  ctx.save();
  ctx.globalAlpha = 0.3 * (1 - t);
  ctx.fillStyle = "#274a56";
  ctx.fillRect(cx - 14, cy + 20, 28, 4);
  ctx.restore();
}

function drawDust(ctx, cx, cy, t) {
  const rnd = rng(3);
  for (let i = 0; i < 4; i += 1) {
    const angle = rnd() * Math.PI - Math.PI / 2 - Math.PI / 4;
    const speed = 6 + rnd() * 8;
    const x = cx + Math.cos(angle) * speed * t;
    const y = cy + Math.sin(angle) * speed * t * 0.5 - t * 6;
    const size = Math.max(3.5 - t * 2.5, 0);
    ctx.fillStyle = i % 2 ? "#c9a876" : "#a98a5e";
    ctx.fillRect(x - size / 2, y - size / 2, size, size);
  }
}

const FX_DRAWERS = { sparkle: drawSparkle, confetti: drawConfetti, splash: drawSplash, dust: drawDust };

export function createFxManager() {
  const active = [];

  return {
    trigger(kind, x, y) {
      if (!FX_DRAWERS[kind]) return;
      const duration = FX_DURATIONS[kind] || FX_DURATION_MS;
      active.push({ kind, x, y, duration, elapsed: reducedMotion ? duration * 0.85 : 0 });
    },
    update(dt) {
      for (let i = active.length - 1; i >= 0; i -= 1) {
        active[i].elapsed += dt;
        if (active[i].elapsed >= active[i].duration) active.splice(i, 1);
      }
    },
    draw(ctx) {
      active.forEach((fx) => {
        const t = Math.min(fx.elapsed / fx.duration, 1);
        ctx.save();
        ctx.globalAlpha = 1 - t;
        FX_DRAWERS[fx.kind](ctx, fx.x, fx.y, t);
        ctx.restore();
      });
    },
  };
}
