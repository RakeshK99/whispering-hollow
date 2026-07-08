// Four distinct mini-game mechanics, each assigned per-building to match that
// character's established personality (see buildings.json `game` field) —
// not one generic game reskinned eleven times. All are quick (10-20s),
// skill-based, and replayable; none carry permanent stakes.
//
//  timing  — a marker sweeps a bar; press on the glowing zone. Good for a
//            "nail the shot" moment (Rohit's free throw, Vish's clutch play,
//            Mochi holding steady).
//  rhythm  — beats travel down a lane toward a hit line; press in time,
//            build a streak. Good for anything about keeping a beat (Kiri's
//            ember dance, Sungat's latte pour, Màrtine's scooping).
//  memory  — Simon-says: watch a directional sequence, then repeat it with
//            arrow keys. Good for tracing/recalling something (Sable's
//            moonbeams, Prakhar's detective work).
//  match   — a target appears; pick the matching one of 4 options (arrow
//            keys) before the timer runs out. Good for fast correct calls
//            under pressure (Nithy's trading floor, Wren's sorting, Bhuvi's
//            library sprint).
const DEFAULTS = {
  timing: { rounds: 5, winThreshold: 3, periodMs: 1100, zoneWidth: 0.22 },
  rhythm: { beatCount: 6, winThreshold: 4, spawnMs: 750, travelMs: 1500, hitWindow: 0.16 },
  memory: { sequenceLength: 5, winThreshold: 4, revealMs: 500, gapMs: 220 },
  match: { rounds: 5, winThreshold: 3, roundMs: 1500 },
};

const DIRECTIONS = ["up", "down", "left", "right"];
const MATCH_COLORS = ["#e08a9b", "#8fb0d8", "#e0c14a", "#7ac97a"];

function randomDirection() {
  return DIRECTIONS[Math.floor(Math.random() * DIRECTIONS.length)];
}

function shuffledMatchColors() {
  const shuffled = [...MATCH_COLORS].sort(() => Math.random() - 0.5);
  const byDirection = {};
  DIRECTIONS.forEach((dir, i) => {
    byDirection[dir] = shuffled[i];
  });
  return byDirection;
}

export function createMinigame() {
  return { type: null, phase: "idle", config: null, won: false, animClock: 0, feedback: null };
}

// Drives the character-reaction animation in render/minigame.js — a pop on
// hit, a shake+red-flash on miss. `elapsed` is advanced in updateMinigame.
function setFeedback(game, type) {
  game.feedback = { type, elapsed: 0 };
}

function randomizeTimingZone(game) {
  game.zoneStart = 0.1 + Math.random() * (1 - game.config.zoneWidth - 0.2);
}

function nextMatchRound(game) {
  game.optionColors = shuffledMatchColors();
  game.targetDir = randomDirection();
  game.roundTimer = 0;
}

export function startMinigame(game, type, configOverrides = {}) {
  game.type = type;
  game.config = { ...DEFAULTS[type], ...configOverrides };
  game.won = false;
  game.result = null;
  game.animClock = 0;
  game.feedback = null;
  game.charmActive = false;
  game.charmUsed = false;

  if (type === "timing") {
    game.phase = "playing";
    game.round = 0;
    game.hits = 0;
    game.elapsed = 0;
    game.history = [];
    randomizeTimingZone(game);
  } else if (type === "rhythm") {
    game.phase = "playing";
    game.elapsed = 0;
    game.hits = 0;
    game.misses = 0;
    game.spawned = 0;
    game.beats = []; // { bornAt, resolved: null|"hit"|"miss" }
  } else if (type === "memory") {
    game.phase = "showing";
    game.sequence = Array.from({ length: game.config.sequenceLength }, randomDirection);
    game.showIndex = 0;
    game.showTimer = 0;
    game.activeDir = null;
    game.inputIndex = 0;
    game.correctCount = 0;
  } else if (type === "match") {
    game.phase = "playing";
    game.round = 0;
    game.correctCount = 0;
    game.history = [];
    nextMatchRound(game);
  }
}

export function updateMinigame(game, dt) {
  game.animClock += dt;
  if (game.feedback && game.feedback.elapsed < 500) {
    game.feedback.elapsed += dt;
  }

  if (game.type === "timing" && game.phase === "playing") {
    game.elapsed += dt;
  } else if (game.type === "rhythm" && game.phase === "playing") {
    game.elapsed += dt;
    const { beatCount, spawnMs, travelMs } = game.config;
    if (game.spawned < beatCount && game.elapsed >= game.spawned * spawnMs) {
      game.beats.push({ bornAt: game.elapsed, resolved: null });
      game.spawned += 1;
    }
    game.beats.forEach((beat) => {
      if (beat.resolved) return;
      const progress = (game.elapsed - beat.bornAt) / travelMs;
      if (progress > 1.15) {
        beat.resolved = "miss";
        game.misses += 1;
        setFeedback(game, "miss");
      }
    });
    if (game.spawned >= beatCount && game.beats.every((b) => b.resolved)) {
      game.phase = "done";
      game.won = game.hits >= game.config.winThreshold;
    }
  } else if (game.type === "memory" && game.phase === "showing") {
    game.showTimer += dt;
    const { revealMs, gapMs } = game.config;
    const cycle = revealMs + gapMs;
    const idx = Math.floor(game.showTimer / cycle);
    const within = game.showTimer % cycle;
    if (idx >= game.sequence.length) {
      game.phase = "input";
      game.activeDir = null;
    } else {
      game.activeDir = within < revealMs ? game.sequence[idx] : null;
    }
  } else if (game.type === "match" && game.phase === "playing") {
    game.roundTimer += dt;
    if (game.roundTimer >= game.config.roundMs) {
      game.history.push("miss");
      setFeedback(game, "miss");
      advanceMatchRound(game);
    }
  }
}

export function timingMarkerPosition(game) {
  const t = (game.elapsed % game.config.periodMs) / game.config.periodMs;
  return t < 0.5 ? t * 2 : 2 - t * 2;
}

// Spending a trinket-earned charm forgives exactly one upcoming miss, in
// whichever mechanic is currently active — set once, consumed on the next
// attempt regardless of mechanic.
export function activateCharm(game) {
  game.charmActive = true;
}

export function attemptTimingHit(game) {
  if (game.type !== "timing" || game.phase !== "playing") return;
  const pos = timingMarkerPosition(game);
  let inZone = pos >= game.zoneStart && pos <= game.zoneStart + game.config.zoneWidth;
  if (!inZone && game.charmActive) {
    inZone = true;
    game.charmActive = false;
    game.charmUsed = true;
  }
  game.history.push(inZone ? "hit" : "miss");
  setFeedback(game, inZone ? "hit" : "miss");
  if (inZone) game.hits += 1;
  game.round += 1;

  if (game.round >= game.config.rounds) {
    game.phase = "done";
    game.won = game.hits >= game.config.winThreshold;
  } else {
    game.elapsed = 0;
    randomizeTimingZone(game);
  }
}

export function attemptRhythmHit(game) {
  if (game.type !== "rhythm" || game.phase !== "playing") return;
  const { travelMs, hitWindow } = game.config;
  let best = null;
  let bestDist = Infinity;
  game.beats.forEach((beat) => {
    if (beat.resolved) return;
    const progress = (game.elapsed - beat.bornAt) / travelMs;
    const dist = Math.abs(progress - 1);
    if (dist < bestDist) {
      best = beat;
      bestDist = dist;
    }
  });
  if (best && (bestDist <= hitWindow || game.charmActive)) {
    best.resolved = "hit";
    game.hits += 1;
    setFeedback(game, "hit");
    if (game.charmActive) {
      game.charmActive = false;
      game.charmUsed = true;
    }
  } else {
    setFeedback(game, "miss");
  }
}

function advanceMatchRound(game) {
  game.round += 1;
  if (game.round >= game.config.rounds) {
    game.phase = "done";
    game.won = game.correctCount >= game.config.winThreshold;
  } else {
    nextMatchRound(game);
  }
}

// Directional input (arrow keys / dpad), used by memory + match. Returns
// true if the press changed game state (used by the caller to know whether
// to play a sound).
export function submitDirection(game, direction) {
  if (game.type === "memory" && game.phase === "input") {
    const expected = game.sequence[game.inputIndex];
    let correct = expected === direction;
    if (!correct && game.charmActive) {
      correct = true;
      game.charmActive = false;
      game.charmUsed = true;
    }
    if (correct) game.correctCount += 1;
    game.inputIndex += 1;
    game.lastInputCorrect = correct;
    setFeedback(game, correct ? "hit" : "miss");
    if (game.inputIndex >= game.sequence.length) {
      game.phase = "done";
      game.won = game.correctCount >= game.config.winThreshold;
    }
    return true;
  }

  if (game.type === "match" && game.phase === "playing") {
    let correct = direction === game.targetDir;
    if (!correct && game.charmActive) {
      correct = true;
      game.charmActive = false;
      game.charmUsed = true;
    }
    if (correct) game.correctCount += 1;
    game.history.push(correct ? "hit" : "miss");
    setFeedback(game, correct ? "hit" : "miss");
    advanceMatchRound(game);
    return true;
  }

  return false;
}

export const MINIGAME_DIRECTIONS = DIRECTIONS;
