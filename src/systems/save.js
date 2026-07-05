const STORAGE_KEY = "whispering-hollow-save";

function defaultSave(customizationData, muted = false, hasSeenIntro = false) {
  return {
    talkedNpcIds: [],
    foundItemIds: [],
    deliveredItemIds: [],
    playerColor: customizationData.playerColor.default,
    muted,
    hasSeenIntro,
    epilogueSeen: false,
  };
}

export function loadSave(customizationData) {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return defaultSave(customizationData);
    const parsed = JSON.parse(raw);

    // Older saves (pre-shrine) only had `collectedItemIds`, meaning "fully
    // done" — migrate those straight to delivered so returning players don't
    // lose progress or see items they already found reappear on the ground.
    const legacyCollected = Array.isArray(parsed.collectedItemIds) ? parsed.collectedItemIds : null;
    const foundItemIds = Array.isArray(parsed.foundItemIds) ? parsed.foundItemIds : legacyCollected || [];
    const deliveredItemIds = Array.isArray(parsed.deliveredItemIds)
      ? parsed.deliveredItemIds
      : legacyCollected || [];

    return {
      talkedNpcIds: Array.isArray(parsed.talkedNpcIds) ? parsed.talkedNpcIds : [],
      foundItemIds,
      deliveredItemIds,
      playerColor: parsed.playerColor || customizationData.playerColor.default,
      muted: Boolean(parsed.muted),
      // Any pre-existing save means this isn't this player's first time here.
      hasSeenIntro: parsed.hasSeenIntro !== undefined ? Boolean(parsed.hasSeenIntro) : true,
      epilogueSeen: Boolean(parsed.epilogueSeen),
    };
  } catch {
    return defaultSave(customizationData);
  }
}

export function writeSave(save) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(save));
}

// Resetting progress (NPCs talked, items found/delivered) shouldn't also
// silently flip the mute preference or re-show the intro — those are device
// preferences, not game progress — so the caller passes them through.
export function resetSave(customizationData, muted = false) {
  const fresh = defaultSave(customizationData, muted, true);
  writeSave(fresh);
  return fresh;
}
