// A quick, animated "stat/luck" encounter — not a full turn-based RPG (see
// CLAUDE.md), but each FIGHT is now a real quick-time strike (reusing the
// same timing engine as the building mini-games) instead of an invisible
// dice roll, with hit/miss animation on both sides. BAG/SWITCH stay
// flavor-only dead ends, matching the visual button quartet from the design
// without needing a real inventory/team system.
import { createMinigame, startMinigame, updateMinigame, attemptTimingHit, activateCharm } from "./minigame.js";

const MAX_HP = 3;
const RESOLVE_MS = 650;

export function createBattle() {
  return {
    phase: "idle", // idle | menu | qte | resolve | done
    npc: null,
    playerColor: null,
    playerHp: MAX_HP,
    foeHp: MAX_HP,
    lastOutcome: null, // "hit" | "miss"
    result: null, // "won" | "lost" | "ran"
    flavorMessage: "",
    qte: createMinigame(),
    hitFlash: null, // "player" | "foe" | null
    resolveTimer: 0,
    resolveDuration: RESOLVE_MS,
  };
}

export function startBattle(battle, npc) {
  battle.phase = "menu";
  battle.npc = npc;
  battle.playerHp = MAX_HP;
  battle.foeHp = MAX_HP;
  battle.lastOutcome = null;
  battle.result = null;
  battle.flavorMessage = "";
  battle.hitFlash = null;
}

export function battleStartFight(battle) {
  if (battle.phase !== "menu") return;
  battle.phase = "qte";
  battle.flavorMessage = "";
  startMinigame(battle.qte, "timing", { rounds: 1, winThreshold: 1, periodMs: 700, zoneWidth: 0.26 });
}

export function battleUseCharm(battle) {
  if (battle.phase !== "qte") return;
  activateCharm(battle.qte);
}

export function battleStrike(battle) {
  if (battle.phase !== "qte" || battle.qte.phase !== "playing") return;
  attemptTimingHit(battle.qte);
  if (battle.qte.phase !== "done") return; // single-round QTE always finishes in one hit

  const playerLands = battle.qte.won;
  battle.lastOutcome = playerLands ? "hit" : "miss";
  if (playerLands) {
    battle.foeHp -= 1;
    battle.hitFlash = "foe";
  } else {
    battle.playerHp -= 1;
    battle.hitFlash = "player";
  }

  if (battle.foeHp <= 0) battle.result = "won";
  else if (battle.playerHp <= 0) battle.result = "lost";

  battle.phase = "resolve";
  battle.resolveTimer = RESOLVE_MS;
}

export function updateBattle(battle, dt) {
  if (battle.phase === "qte") {
    updateMinigame(battle.qte, dt);
  } else if (battle.phase === "resolve") {
    battle.resolveTimer -= dt;
    if (battle.resolveTimer <= 0) {
      battle.hitFlash = null;
      battle.phase = battle.result ? "done" : "menu";
    }
  }
}

export function battleFlavor(battle, message) {
  if (battle.phase !== "menu") return;
  battle.flavorMessage = message;
}

export function battleRun(battle) {
  if (battle.phase !== "menu") return;
  battle.result = "ran";
  battle.phase = "done";
}

export const BATTLE_MAX_HP = MAX_HP;
