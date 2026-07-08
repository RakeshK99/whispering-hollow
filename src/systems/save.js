const STORAGE_KEY = "whispering-hollow-save";
const WORLD_IDS = ["troy", "uwm", "ann-arbor"];

function sanitizeTrinkets(raw) {
  if (!Array.isArray(raw)) return [];
  return raw.filter((t) => t && typeof t === "object" && typeof t.id === "string");
}

function defaultWorldState() {
  return {
    talkedNpcIds: [],
    foundItemIds: [],
    deliveredItemIds: [],
    epilogueSeen: false,
    hasSeenIntro: false,
  };
}

function defaultSave(customizationData, muted = false) {
  const worlds = {};
  WORLD_IDS.forEach((id) => {
    worlds[id] = defaultWorldState();
  });
  return {
    playerColor: customizationData.playerColor.default,
    muted,
    currentWorld: "troy",
    unlockedWorlds: ["troy"],
    worlds,
    // Meta-progression: a trinket is earned the first time a building's
    // mini-game is won (one per building id, 11 max); xp comes from that
    // plus battle wins and drives the Explorer level shown in the sidebar.
    trinkets: [],
    xp: 0,
  };
}

function sanitizeWorldState(raw) {
  if (!raw || typeof raw !== "object") return defaultWorldState();
  return {
    talkedNpcIds: Array.isArray(raw.talkedNpcIds) ? raw.talkedNpcIds : [],
    foundItemIds: Array.isArray(raw.foundItemIds) ? raw.foundItemIds : [],
    deliveredItemIds: Array.isArray(raw.deliveredItemIds) ? raw.deliveredItemIds : [],
    epilogueSeen: Boolean(raw.epilogueSeen),
    hasSeenIntro: Boolean(raw.hasSeenIntro),
  };
}

export function loadSave(customizationData) {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return defaultSave(customizationData);
    const parsed = JSON.parse(raw);

    if (parsed.worlds) {
      const worlds = {};
      WORLD_IDS.forEach((id) => {
        worlds[id] = sanitizeWorldState(parsed.worlds[id]);
      });
      return {
        playerColor: parsed.playerColor || customizationData.playerColor.default,
        muted: Boolean(parsed.muted),
        currentWorld: WORLD_IDS.includes(parsed.currentWorld) ? parsed.currentWorld : "troy",
        unlockedWorlds: Array.isArray(parsed.unlockedWorlds) && parsed.unlockedWorlds.length
          ? parsed.unlockedWorlds.filter((id) => WORLD_IDS.includes(id))
          : ["troy"],
        worlds,
        trinkets: sanitizeTrinkets(parsed.trinkets),
        xp: Number.isFinite(parsed.xp) ? parsed.xp : 0,
      };
    }

    // Migrate a pre-multi-world save (flat troy-only fields, possibly even
    // older `collectedItemIds`-only saves) into the new per-world shape so
    // returning players keep their Troy progress instead of losing it.
    const legacyCollected = Array.isArray(parsed.collectedItemIds) ? parsed.collectedItemIds : null;
    const troyState = {
      talkedNpcIds: Array.isArray(parsed.talkedNpcIds) ? parsed.talkedNpcIds : [],
      foundItemIds: Array.isArray(parsed.foundItemIds) ? parsed.foundItemIds : legacyCollected || [],
      deliveredItemIds: Array.isArray(parsed.deliveredItemIds) ? parsed.deliveredItemIds : legacyCollected || [],
      epilogueSeen: Boolean(parsed.epilogueSeen),
      hasSeenIntro: parsed.hasSeenIntro !== undefined ? Boolean(parsed.hasSeenIntro) : true,
    };

    const worlds = { troy: troyState, uwm: defaultWorldState(), "ann-arbor": defaultWorldState() };
    const unlockedWorlds = ["troy"];
    if (parsed.unlockedWorld && WORLD_IDS.includes(parsed.unlockedWorld)) {
      unlockedWorlds.push(parsed.unlockedWorld);
    }

    return {
      playerColor: parsed.playerColor || customizationData.playerColor.default,
      muted: Boolean(parsed.muted),
      currentWorld: "troy",
      unlockedWorlds,
      worlds,
      trinkets: [],
      xp: 0,
    };
  } catch {
    return defaultSave(customizationData);
  }
}

export function writeSave(save) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(save));
}

// Resetting progress starts the whole journey over — all worlds, back to
// just Troy unlocked. Mute is a device preference, not game progress, so it
// survives the reset.
export function resetSave(customizationData, muted = false) {
  const fresh = defaultSave(customizationData, muted);
  writeSave(fresh);
  return fresh;
}
