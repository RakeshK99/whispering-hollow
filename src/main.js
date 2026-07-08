import { startLoop } from "./game/loop.js";
import { initInput, getInputState, consumeInteractPressed, consumeChallengePressed } from "./game/input.js";
import { tileTypeAtPixel } from "./game/collision.js";
import { createPlayer, updatePlayer, playerCenter, setPlayerColor } from "./entities/player.js";
import { createNpc, findNearestNpc } from "./entities/npc.js";
import { createItem, findCollectableItemAt, isItemRevealed } from "./entities/item.js";
import { createDeliveryPoint, isNearDeliveryPoint } from "./entities/deliveryPoint.js";
import { createPortal, isNearPortal } from "./entities/portal.js";
import { createBuildings, findNearestBuilding } from "./entities/building.js";
import { loadSave, writeSave, resetSave } from "./systems/save.js";
import { openDialogue, closeDialogue, isDialogueOpen } from "./systems/dialogue.js";
import { showIntro, isIntroOpen } from "./systems/intro.js";
import { showWorldSelect, isWorldSelectOpen } from "./systems/worldSelect.js";
import { initInventoryUI } from "./systems/inventory.js";
import { createEventTracker, checkTileEvents } from "./systems/events.js";
import {
  createMinigame,
  startMinigame,
  updateMinigame,
  attemptTimingHit,
  attemptRhythmHit,
  submitDirection,
  activateCharm,
  MINIGAME_DIRECTIONS,
} from "./systems/minigame.js";
import {
  createBattle,
  startBattle,
  battleStartFight,
  battleStrike,
  battleUseCharm,
  updateBattle,
  battleRun,
  battleFlavor,
} from "./systems/battle.js";
import {
  awardMinigameWin,
  awardBattleWin,
  levelForXp,
  xpIntoLevel,
  xpForLevelUp,
  charmsAvailable,
  spendCharm,
} from "./systems/progression.js";
import { drawTilemap } from "./render/tilemap.js";
import { drawTroyAtmosphere } from "./render/atmosphere.js";
import { drawTroyStructures } from "./render/troyStructures.js";
import { drawUwmDecor, drawAnnArborDecor } from "./render/townDecor.js";
import { drawPlayer, drawNpc, drawItem, drawLantern, drawVault, drawBigM, drawPortal } from "./render/sprites.js";
import { drawInteractHint, drawChallengeHint, createFxManager } from "./render/ui.js";
import { drawInterior } from "./render/interiors.js";
import { drawBuildingDoor } from "./render/buildingDoor.js";
import { drawMinigame } from "./render/minigame.js";
import { drawBattleScene } from "./render/battle.js";
import {
  initAudio,
  setMuted,
  playFootstep,
  playBlip,
  playPickupChime,
  playStumpJingle,
  playPondBlorp,
  playCelebrationFanfare,
} from "./systems/audio.js";

const canvas = document.getElementById("game-canvas");
const ctx = canvas.getContext("2d");
const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

const buildingOverlay = document.getElementById("building-overlay");
const buildingCanvas = document.getElementById("building-canvas");
const buildingCtx = buildingCanvas.getContext("2d");
const buildingNameEl = document.getElementById("building-name");
const buildingWorldTagEl = document.getElementById("building-world-tag");
const buildingHostEl = document.getElementById("building-host");
const buildingQuestEl = document.getElementById("building-quest");
const buildingMiniNameEl = document.getElementById("building-mini-name");
const buildingTalkBtn = document.getElementById("building-talk");
const buildingPlayBtn = document.getElementById("building-play");
const buildingLeaveBtn = document.getElementById("building-leave");
const buildingCharmBtn = document.getElementById("building-charm");

const battleOverlay = document.getElementById("battle-overlay");
const battleCanvas = document.getElementById("battle-canvas");
const battleCtx = battleCanvas.getContext("2d");
const battleMessageEl = document.getElementById("battle-message");
const battleFightBtn = document.getElementById("battle-fight");
const battleBagBtn = document.getElementById("battle-bag");
const battleSwitchBtn = document.getElementById("battle-switch");
const battleRunBtn = document.getElementById("battle-run");
const battleCharmBtn = document.getElementById("battle-charm");

const sidebarLevelEl = document.getElementById("sidebar-level");
const sidebarXpFillEl = document.getElementById("sidebar-xp-fill");
const sidebarCharmsEl = document.getElementById("sidebar-charms");

const DELIVERY_DRAWERS = { lantern: drawLantern, vault: drawVault, bigm: drawBigM };
const TILE_SIZE = 40;
const SHAKE_DURATION_MS = 700;
const WORLD_SWITCH_DELAY_MS = 2600;

async function loadJson(path) {
  const response = await fetch(path);
  return response.json();
}

function fillTemplate(template, values) {
  return template.replace(/\{(\w+)\}/g, (_, key) => values[key]);
}

// A clicked <button> keeps keyboard focus, so the native "Space/Enter
// activates the focused button" behavior would otherwise re-fire this same
// click every time the player presses the interact key during gameplay.
// Blurring right after the handler runs stops that double-fire.
function bindClick(button, handler) {
  button.addEventListener("click", (event) => {
    handler(event);
    button.blur();
  });
}

async function boot() {
  const [worlds, customization] = await Promise.all([
    loadJson("/src/data/worlds.json"),
    loadJson("/src/data/customization.json"),
  ]);

  const save = loadSave(customization);
  const world = worlds.find((w) => w.id === save.currentWorld) || worlds[0];
  const worldState = save.worlds[world.id];

  const [map, npcsData, itemsData, buildingsData] = await Promise.all([
    loadJson(`/src/data/${world.dataDir}/map.json`),
    loadJson(`/src/data/${world.dataDir}/npcs.json`),
    loadJson(`/src/data/${world.dataDir}/items.json`),
    loadJson(`/src/data/${world.dataDir}/buildings.json`),
  ]);

  canvas.width = world.cols * TILE_SIZE;
  canvas.height = world.rows * TILE_SIZE;
  canvas.style.aspectRatio = `${canvas.width} / ${canvas.height}`;

  const npcs = npcsData.map(createNpc);
  const items = itemsData.map(createItem);
  const buildings = createBuildings(buildingsData);
  const deliveryPoint = createDeliveryPoint(world.deliveryPoint);
  const portal = createPortal(world.portalPoint);
  const drawDeliveryPoint = DELIVERY_DRAWERS[world.deliveryKind];

  const player = createPlayer({ row: world.playerStart.row, col: world.playerStart.col, color: save.playerColor });
  const eventTracker = createEventTracker();
  const fx = createFxManager();
  let footstepTimer = 0;
  let shakeTimeLeft = 0;
  const FOOTSTEP_INTERVAL_MS = 230;

  // "overworld" | "building" | "battle" — while not "overworld", player
  // movement and the normal talk/collect/deliver/portal interact flow are
  // suspended in favor of whichever overlay is open.
  let mode = "overworld";
  let activeBuilding = null;
  let buildingPhase = "room"; // "room" | "minigame"
  const minigame = createMinigame();
  const prevDirState = { up: false, down: false, left: false, right: false };
  const battle = createBattle();

  initAudio();
  setMuted(save.muted);

  npcs.forEach((npc) => {
    npc.talked = worldState.talkedNpcIds.includes(npc.id);
  });

  function talkedIdSet() {
    return new Set(worldState.talkedNpcIds);
  }
  function foundIdSet() {
    return new Set(worldState.foundItemIds);
  }
  function isDelivered(itemId) {
    return worldState.deliveredItemIds.includes(itemId);
  }
  function inventoryView() {
    return {
      talkedNpcIds: worldState.talkedNpcIds,
      foundItemIds: worldState.foundItemIds,
      deliveredItemIds: worldState.deliveredItemIds,
      muted: save.muted,
      playerColor: save.playerColor,
      trinkets: save.trinkets,
      // the secret cosmetic unlocks once the player has moved past Troy at
      // least once, not just on the current world's own epilogue flag —
      // otherwise it would flicker on/off depending on which world you're in
      epilogueSeen: save.unlockedWorlds.length > 1,
    };
  }

  function renderProgression() {
    const level = levelForXp(save.xp);
    const need = xpForLevelUp();
    sidebarLevelEl.textContent = `Explorer · Lv ${level}`;
    sidebarXpFillEl.style.width = `${Math.round((xpIntoLevel(save.xp) / need) * 100)}%`;
    const charms = charmsAvailable(save);
    sidebarCharmsEl.textContent = `${charms} charm${charms === 1 ? "" : "s"} · ${save.trinkets.length}/11 trinkets`;
  }

  const inventoryUI = initInventoryUI({
    npcs,
    items,
    customization,
    onColorChange(hex) {
      save.playerColor = hex;
      setPlayerColor(player, hex);
      writeSave(save);
      inventoryUI.render(inventoryView());
    },
    onReset() {
      resetSave(customization, save.muted);
      window.location.reload();
    },
    onMuteToggle() {
      save.muted = !save.muted;
      setMuted(save.muted);
      writeSave(save);
      inventoryUI.render(inventoryView());
    },
  });

  inventoryUI.render(inventoryView());
  renderProgression();
  initInput();

  if (!worldState.hasSeenIntro) {
    showIntro(world.introTitle, world.introParagraphs, world.id === "troy" ? "Begin the Night" : "Begin", () => {
      worldState.hasSeenIntro = true;
      writeSave(save);
    });
  }

  function npcDialogueLine(npc) {
    // Flavor-only NPCs (building hosts like Màrtine) aren't part of the
    // find-the-item quest loop — they just have one line, always.
    if (!npc.linkedItemId) return npc.dialogue.flavor;

    const linkedItem = items.find((item) => item.id === npc.linkedItemId);
    const allDelivered = worldState.deliveredItemIds.length === items.length;
    const delivered = isDelivered(linkedItem.id);
    const found = worldState.foundItemIds.includes(linkedItem.id);

    if (allDelivered) return npc.dialogue.farewell;
    if (delivered) return npc.dialogue.thanks;
    if (found) return npc.dialogue.reminder;
    return npc.dialogue.intro;
  }

  function handleDeliveryInteract() {
    const undelivered = worldState.foundItemIds.filter((id) => !isDelivered(id));

    if (undelivered.length > 0) {
      const names = undelivered.map((id) => items.find((item) => item.id === id).name);
      worldState.deliveredItemIds.push(...undelivered);
      writeSave(save);
      inventoryUI.render(inventoryView());
      fx.trigger("sparkle", deliveryPoint.x + 20, deliveryPoint.y + 10);

      if (worldState.deliveredItemIds.length === items.length) {
        worldState.epilogueSeen = true;
        writeSave(save);
        playCelebrationFanfare();
        shakeTimeLeft = SHAKE_DURATION_MS;
        [-24, -8, 8, 24].forEach((dx) => fx.trigger("confetti", deliveryPoint.x + 20 + dx, deliveryPoint.y));
        fx.trigger("sparkle", portal.x + 20, portal.y + 20);
        openDialogue(world.name, world.epilogueText);
      } else {
        playPickupChime();
        openDialogue(world.deliveryLabel, `You leave the ${names.join(" and ")} here. It responds — just a little.`);
      }
      return;
    }

    if (worldState.epilogueSeen) {
      openDialogue(world.deliveryLabel, world.calmText);
    } else if (worldState.deliveredItemIds.length > 0) {
      openDialogue(
        world.deliveryLabel,
        fillTemplate(world.progressTextTemplate, { delivered: worldState.deliveredItemIds.length, total: items.length })
      );
    } else {
      openDialogue(world.deliveryLabel, world.idleText);
    }
  }

  function handlePortalInteract() {
    // Once a world is unlocked, the portal becomes a two-way path — it can
    // still unlock a brand-new world, but it can just as easily send you
    // back to a world you've already visited (including Troy).
    const otherWorlds = worlds
      .filter((w) => w.id !== world.id)
      .map((w) => ({ ...w, locked: !save.unlockedWorlds.includes(w.id) }));

    showWorldSelect(otherWorlds, (worldId) => {
      const wasLocked = !save.unlockedWorlds.includes(worldId);
      if (wasLocked) save.unlockedWorlds.push(worldId);
      save.currentWorld = worldId;
      writeSave(save);
      const chosen = worlds.find((w) => w.id === worldId);
      fx.trigger("sparkle", portal.x + 20, portal.y + 20);
      playPickupChime();
      openDialogue(
        "The Portal",
        wasLocked
          ? `The portal shimmers and settles on a new path. ${chosen.name} awaits on the other side...`
          : `The portal folds back into a familiar path. ${chosen.name} welcomes you again...`
      );
      setTimeout(() => window.location.reload(), WORLD_SWITCH_DELAY_MS);
    });
  }

  // The portal opens for good once this world's delivery loop is complete —
  // but if the player already has more than one world unlocked, it stays a
  // live two-way path even in a world they haven't finished yet, so they
  // can freely bounce back to an earlier world.
  function isPortalActive() {
    return worldState.epilogueSeen || save.unlockedWorlds.length > 1;
  }

  const ACTION_MECHANICS = new Set(["timing", "rhythm"]);

  function attemptMinigameAction() {
    if (minigame.type === "timing") attemptTimingHit(minigame);
    else if (minigame.type === "rhythm") attemptRhythmHit(minigame);
  }

  function onMinigameMaybeFinished() {
    if (minigame.phase !== "done") return;
    if (minigame.won) {
      const result = awardMinigameWin(save, activeBuilding);
      minigame.newTrinketEarned = result.newTrinket;
      writeSave(save);
      renderProgression();
      inventoryUI.render(inventoryView());
      playPickupChime();
    } else {
      minigame.newTrinketEarned = false;
      playBlip();
    }
  }

  function refreshBuildingButtons() {
    const gameActive = buildingPhase === "minigame" && ["playing", "showing", "input"].includes(minigame.phase);
    buildingCharmBtn.hidden = !gameActive;
    buildingCharmBtn.disabled = !gameActive || minigame.charmActive || charmsAvailable(save) <= 0;
    buildingCharmBtn.textContent = `USE CHARM (${charmsAvailable(save)})`;

    if (buildingPhase === "minigame") {
      buildingTalkBtn.disabled = true;
      if (ACTION_MECHANICS.has(minigame.type)) {
        buildingPlayBtn.disabled = false;
        if (minigame.phase !== "playing") {
          buildingPlayBtn.textContent = "PLAY AGAIN";
        } else {
          buildingPlayBtn.textContent = minigame.type === "rhythm" ? "HIT!" : "STOP!";
        }
      } else {
        const inputPhase = minigame.phase === "showing" || minigame.phase === "input" || minigame.phase === "playing";
        buildingPlayBtn.disabled = inputPhase;
        buildingPlayBtn.textContent = inputPhase ? "USE ARROW KEYS" : "PLAY AGAIN";
      }
    } else {
      buildingTalkBtn.disabled = false;
      buildingPlayBtn.disabled = false;
      buildingPlayBtn.textContent = "PLAY";
    }
  }

  function enterBuilding(building) {
    mode = "building";
    activeBuilding = building;
    buildingPhase = "room";
    buildingNameEl.textContent = building.name;
    buildingWorldTagEl.textContent = world.name;
    buildingHostEl.textContent = `Inside: ${building.hostName}`;
    buildingQuestEl.textContent = "";
    buildingMiniNameEl.textContent = building.mini;
    refreshBuildingButtons();
    buildingOverlay.hidden = false;
  }

  function leaveBuilding() {
    mode = "overworld";
    activeBuilding = null;
    buildingOverlay.hidden = true;
  }

  bindClick(buildingTalkBtn, () => {
    if (!activeBuilding || buildingPhase !== "room") return;
    playBlip();
    buildingQuestEl.textContent = activeBuilding.quest;
  });

  bindClick(buildingPlayBtn, () => {
    if (!activeBuilding) return;
    if (buildingPhase === "room" || minigame.phase === "done") {
      buildingPhase = "minigame";
      startMinigame(minigame, activeBuilding.game, activeBuilding.gameConfig);
    } else if (ACTION_MECHANICS.has(minigame.type) && minigame.phase === "playing") {
      attemptMinigameAction();
      onMinigameMaybeFinished();
    }
    refreshBuildingButtons();
  });

  bindClick(buildingCharmBtn, () => {
    if (buildingCharmBtn.disabled) return;
    if (!spendCharm(save)) return;
    activateCharm(minigame);
    writeSave(save);
    renderProgression();
    refreshBuildingButtons();
  });

  bindClick(buildingLeaveBtn, () => {
    playBlip();
    leaveBuilding();
  });

  let battleXpAwarded = false;

  function endBattle() {
    mode = "overworld";
    battleOverlay.hidden = true;
  }

  function refreshBattleMessage() {
    if (battle.phase === "done") {
      if (battle.result === "won") battleMessageEl.textContent = `You win! ${battle.npc.name.split(" ")[0]} gives you a good-natured nod.`;
      else if (battle.result === "lost") battleMessageEl.textContent = `${battle.npc.name.split(" ")[0]} gets the better of you this time. Good match!`;
      else battleMessageEl.textContent = "You retreat from the match.";
    } else if (battle.phase === "qte") {
      battleMessageEl.textContent = "Time your STRIKE!";
    } else if (battle.flavorMessage) {
      battleMessageEl.textContent = battle.flavorMessage;
    } else if (battle.lastOutcome === "hit") {
      battleMessageEl.textContent = "A clean hit!";
    } else if (battle.lastOutcome === "miss") {
      battleMessageEl.textContent = `${battle.npc.name.split(" ")[0]} gets one in on you.`;
    } else {
      battleMessageEl.textContent = "What will Explorer do?";
    }
  }

  function refreshBattleButtons() {
    const menu = battle.phase === "menu";
    const qte = battle.phase === "qte";
    const done = battle.phase === "done";

    battleFightBtn.disabled = done || battle.phase === "resolve";
    battleFightBtn.textContent = qte ? "STRIKE!" : "FIGHT";
    battleBagBtn.disabled = !menu;
    battleSwitchBtn.disabled = !menu;
    battleRunBtn.disabled = battle.phase === "resolve";
    battleRunBtn.textContent = done ? "CONTINUE" : "RUN";

    battleCharmBtn.hidden = !qte;
    battleCharmBtn.disabled = !qte || battle.qte.charmActive || charmsAvailable(save) <= 0;
    battleCharmBtn.textContent = `USE CHARM (${charmsAvailable(save)})`;
  }

  function performFightAction() {
    if (battle.phase === "menu") {
      battleStartFight(battle);
    } else if (battle.phase === "qte") {
      battleStrike(battle);
      if (battle.result === "won" && !battleXpAwarded) {
        battleXpAwarded = true;
        awardBattleWin(save);
        writeSave(save);
        renderProgression();
      }
    }
    refreshBattleMessage();
    refreshBattleButtons();
  }

  bindClick(battleFightBtn, performFightAction);

  bindClick(battleBagBtn, () => {
    battleFlavor(battle, "Your satchel's got quest items in it, not battle gear. Better FIGHT.");
    refreshBattleMessage();
  });

  bindClick(battleSwitchBtn, () => {
    battleFlavor(battle, "There's no one else to switch in — it's just you out here.");
    refreshBattleMessage();
  });

  bindClick(battleRunBtn, () => {
    if (battle.phase === "done") {
      endBattle();
      return;
    }
    battleRun(battle);
    refreshBattleMessage();
    refreshBattleButtons();
  });

  bindClick(battleCharmBtn, () => {
    if (battleCharmBtn.disabled) return;
    if (!spendCharm(save)) return;
    battleUseCharm(battle);
    writeSave(save);
    renderProgression();
    refreshBattleButtons();
  });

  function handleChallenge() {
    if (mode !== "overworld" || isDialogueOpen() || isIntroOpen() || isWorldSelectOpen()) return;

    const center = playerCenter(player);
    const nearestNpc = findNearestNpc(npcs, center);
    if (!nearestNpc || nearestNpc.battleLevel == null) return;

    mode = "battle";
    battleXpAwarded = false;
    startBattle(battle, nearestNpc);
    battle.playerColor = save.playerColor;
    battleMessageEl.textContent = `${nearestNpc.name.split(" ")[0]} accepts your challenge!`;
    refreshBattleButtons();
    battleOverlay.hidden = false;
  }

  function handleInteract() {
    if (isDialogueOpen()) {
      closeDialogue();
      return;
    }

    const center = playerCenter(player);

    const building = findNearestBuilding(buildings, center);
    if (building) {
      enterBuilding(building);
      return;
    }

    const nearestNpc = findNearestNpc(npcs, center);
    if (nearestNpc) {
      playBlip();
      openDialogue(nearestNpc.name, npcDialogueLine(nearestNpc));
      if (!nearestNpc.talked) {
        nearestNpc.talked = true;
        worldState.talkedNpcIds.push(nearestNpc.id);
        writeSave(save);
        inventoryUI.render(inventoryView());
      }
      return;
    }

    const collectable = findCollectableItemAt(items, center, foundIdSet(), talkedIdSet());
    if (collectable) {
      worldState.foundItemIds.push(collectable.id);
      writeSave(save);
      inventoryUI.render(inventoryView());
      fx.trigger("sparkle", collectable.x + 20, collectable.y + 20);
      playPickupChime();
      openDialogue("Found!", `You found the ${collectable.name}. Carry it back to ${world.deliveryLabel.toLowerCase()}.`);
      return;
    }

    if (isNearDeliveryPoint(deliveryPoint, center)) {
      handleDeliveryInteract();
      return;
    }

    if (isPortalActive() && isNearPortal(portal, center)) {
      handlePortalInteract();
    }
  }

  function update(dt) {
    const input = getInputState();
    const dirJustPressed = {};
    MINIGAME_DIRECTIONS.forEach((dir) => {
      dirJustPressed[dir] = input[dir] && !prevDirState[dir];
      prevDirState[dir] = input[dir];
    });
    const paused = isDialogueOpen() || isIntroOpen() || isWorldSelectOpen() || mode !== "overworld";

    if (!paused) {
      updatePlayer(player, dt, input, map);
    }

    if (player.moving && !paused) {
      footstepTimer += dt;
      if (footstepTimer >= FOOTSTEP_INTERVAL_MS) {
        footstepTimer -= FOOTSTEP_INTERVAL_MS;
        fx.trigger("dust", player.x + player.width / 2, player.y + player.height - 2);
        playFootstep();
      }
    } else {
      footstepTimer = 0;
    }

    if (shakeTimeLeft > 0) {
      shakeTimeLeft = Math.max(0, shakeTimeLeft - dt);
    }

    const center = playerCenter(player);
    const row = Math.floor(center.y / map.tileSize);
    const col = Math.floor(center.x / map.tileSize);
    const tileType = tileTypeAtPixel(map, center.x, center.y);

    checkTileEvents(eventTracker, tileType, row, col, performance.now(), (event) => {
      if (event.name === "stump") {
        fx.trigger("confetti", center.x, center.y);
        playStumpJingle();
      } else if (event.name === "pond") {
        fx.trigger("splash", center.x, center.y);
        playPondBlorp();
      } else {
        fx.trigger("sparkle", center.x, center.y);
      }
    });

    fx.update(dt);

    if (mode === "building") {
      updateMinigame(minigame, dt);
      const pressed = consumeInteractPressed();

      if (buildingPhase === "minigame") {
        if (pressed && ACTION_MECHANICS.has(minigame.type) && minigame.phase === "playing") {
          attemptMinigameAction();
          onMinigameMaybeFinished();
          refreshBuildingButtons();
        }

        if (minigame.type === "memory" || minigame.type === "match") {
          const inputPhase = minigame.phase === "input" || minigame.phase === "playing";
          if (inputPhase) {
            MINIGAME_DIRECTIONS.forEach((dir) => {
              if (dirJustPressed[dir] && submitDirection(minigame, dir)) {
                onMinigameMaybeFinished();
                refreshBuildingButtons();
              }
            });
          }
        }
      }

      consumeChallengePressed();
      return;
    }

    if (mode === "battle") {
      const prevPhase = battle.phase;
      updateBattle(battle, dt);
      if (battle.phase !== prevPhase) {
        refreshBattleMessage();
        refreshBattleButtons();
      }

      if (consumeInteractPressed() && (battle.phase === "menu" || battle.phase === "qte")) {
        performFightAction();
      }
      consumeChallengePressed();
      return;
    }

    if (consumeInteractPressed()) {
      handleInteract();
    }
    if (consumeChallengePressed()) {
      handleChallenge();
    }
  }

  function findNearestInteractable() {
    const center = playerCenter(player);
    const building = findNearestBuilding(buildings, center);
    if (building) return building;
    const nearestNpc = findNearestNpc(npcs, center);
    if (nearestNpc) return nearestNpc;
    const item = findCollectableItemAt(items, center, foundIdSet(), talkedIdSet());
    if (item) return item;
    if (isNearDeliveryPoint(deliveryPoint, center)) return deliveryPoint;
    if (isPortalActive() && isNearPortal(portal, center)) return portal;
    return null;
  }

  function findBattleEligibleNpc() {
    const center = playerCenter(player);
    const nearestNpc = findNearestNpc(npcs, center);
    return nearestNpc && nearestNpc.battleLevel != null ? nearestNpc : null;
  }

  function drawWorldDecor() {
    if (world.decor === "troy") {
      drawTroyAtmosphere(ctx, canvas.width, canvas.height);
    } else if (world.decor === "uwm") {
      drawUwmDecor(ctx);
    } else if (world.decor === "ann-arbor") {
      drawAnnArborDecor(ctx);
    }
  }

  function render() {
    const shakeT = shakeTimeLeft / SHAKE_DURATION_MS;
    const shakeMagnitude = reducedMotion ? 0 : 10 * shakeT * shakeT;
    const shakeX = shakeMagnitude ? (Math.random() * 2 - 1) * shakeMagnitude : 0;
    const shakeY = shakeMagnitude ? (Math.random() * 2 - 1) * shakeMagnitude : 0;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.save();
    ctx.translate(shakeX, shakeY);

    drawTilemap(ctx, map);
    drawWorldDecor();
    if (world.decor === "troy") {
      drawTroyStructures(ctx, buildings);
    }
    buildings.forEach((building) => drawBuildingDoor(ctx, building));
    if (drawDeliveryPoint) {
      drawDeliveryPoint(ctx, deliveryPoint, worldState.deliveredItemIds.length / items.length);
    }
    if (isPortalActive()) {
      drawPortal(ctx, portal);
    }

    const found = foundIdSet();
    const talked = talkedIdSet();
    items.forEach((item) => {
      if (found.has(item.id)) return;
      if (!isItemRevealed(item, talked)) return;
      drawItem(ctx, item);
    });

    npcs.forEach((npc) => drawNpc(ctx, npc));
    drawPlayer(ctx, player);
    drawInteractHint(ctx, findNearestInteractable());
    drawChallengeHint(ctx, findBattleEligibleNpc());
    fx.draw(ctx);
    ctx.restore();

    if (mode === "building" && activeBuilding) {
      if (buildingPhase === "minigame") {
        drawMinigame(buildingCtx, buildingCanvas.width, buildingCanvas.height, minigame, activeBuilding);
      } else {
        drawInterior(buildingCtx, activeBuilding);
      }
    }

    if (mode === "battle") {
      drawBattleScene(battleCtx, battle);
    }
  }

  startLoop({ update, render });
}

boot();
