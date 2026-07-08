// Explorer leveling — a light meta-progression layer across the whole
// playthrough (not per-world). XP comes from winning a building's mini-game
// (bigger the first time, since that's also when the trinket drops) and from
// battle wins. Trinkets double as a spendable resource: each one banks a
// "charm" that can be spent to forgive one miss in a tough mini-game or
// battle later.
const XP_PER_NEW_TRINKET = 25;
const XP_PER_MINIGAME_REPLAY_WIN = 5;
const XP_PER_BATTLE_WIN = 15;
const XP_PER_LEVEL = 50;

export function levelForXp(xp) {
  return 1 + Math.floor(xp / XP_PER_LEVEL);
}

export function xpIntoLevel(xp) {
  return xp % XP_PER_LEVEL;
}

export function xpForLevelUp() {
  return XP_PER_LEVEL;
}

export function charmsAvailable(save) {
  const earned = save.trinkets.length;
  const spent = save.charmsSpent || 0;
  return Math.max(0, earned - spent);
}

export function spendCharm(save) {
  if (charmsAvailable(save) <= 0) return false;
  save.charmsSpent = (save.charmsSpent || 0) + 1;
  return true;
}

// Returns the XP just awarded, and whether a new trinket was earned, so the
// caller can trigger the right fx/sound/dialogue. Trinkets store their own
// display info (id/name/accent) so the sidebar can render them without
// needing every world's building data loaded at once.
export function awardMinigameWin(save, building) {
  const isNewTrinket = !save.trinkets.some((t) => t.id === building.id);
  if (isNewTrinket) {
    save.trinkets.push({ id: building.id, name: building.name, accent: building.accent });
    save.xp += XP_PER_NEW_TRINKET;
    return { xp: XP_PER_NEW_TRINKET, newTrinket: true };
  }
  save.xp += XP_PER_MINIGAME_REPLAY_WIN;
  return { xp: XP_PER_MINIGAME_REPLAY_WIN, newTrinket: false };
}

export function awardBattleWin(save) {
  save.xp += XP_PER_BATTLE_WIN;
  return { xp: XP_PER_BATTLE_WIN };
}
