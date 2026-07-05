import { startLoop } from "./game/loop.js";
import { initInput, getInputState, consumeInteractPressed } from "./game/input.js";
import { tileTypeAtPixel } from "./game/collision.js";
import { createPlayer, updatePlayer, playerCenter, setPlayerColor } from "./entities/player.js";
import { createNpc, findNearestNpc } from "./entities/npc.js";
import { createItem, findCollectableItemAt, isItemRevealed } from "./entities/item.js";
import { createDeliveryPoint, isNearDeliveryPoint } from "./entities/deliveryPoint.js";
import { createPortal, isNearPortal } from "./entities/portal.js";
import { loadSave, writeSave, resetSave } from "./systems/save.js";
import { openDialogue, closeDialogue, isDialogueOpen } from "./systems/dialogue.js";
import { showIntro, isIntroOpen } from "./systems/intro.js";
import { showWorldSelect, isWorldSelectOpen } from "./systems/worldSelect.js";
import { initInventoryUI } from "./systems/inventory.js";
import { createEventTracker, checkTileEvents } from "./systems/events.js";
import { drawTilemap } from "./render/tilemap.js";
import { drawTroyAtmosphere } from "./render/atmosphere.js";
import { drawUwmDecor, drawAnnArborDecor } from "./render/townDecor.js";
import { drawPlayer, drawNpc, drawItem, drawLantern, drawVault, drawBigM, drawPortal } from "./render/sprites.js";
import { drawInteractHint, createFxManager } from "./render/ui.js";
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

async function boot() {
  const [worlds, customization] = await Promise.all([
    loadJson("/src/data/worlds.json"),
    loadJson("/src/data/customization.json"),
  ]);

  const save = loadSave(customization);
  const world = worlds.find((w) => w.id === save.currentWorld) || worlds[0];
  const worldState = save.worlds[world.id];

  const [map, npcsData, itemsData] = await Promise.all([
    loadJson(`/src/data/${world.dataDir}/map.json`),
    loadJson(`/src/data/${world.dataDir}/npcs.json`),
    loadJson(`/src/data/${world.dataDir}/items.json`),
  ]);

  canvas.width = world.cols * TILE_SIZE;
  canvas.height = world.rows * TILE_SIZE;
  canvas.style.aspectRatio = `${canvas.width} / ${canvas.height}`;

  const npcs = npcsData.map(createNpc);
  const items = itemsData.map(createItem);
  const deliveryPoint = createDeliveryPoint(world.deliveryPoint);
  const portal = createPortal(world.portalPoint);
  const drawDeliveryPoint = DELIVERY_DRAWERS[world.deliveryKind];

  const player = createPlayer({ row: world.playerStart.row, col: world.playerStart.col, color: save.playerColor });
  const eventTracker = createEventTracker();
  const fx = createFxManager();
  let footstepTimer = 0;
  let shakeTimeLeft = 0;
  const FOOTSTEP_INTERVAL_MS = 230;

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
      // the secret cosmetic unlocks once the player has moved past Troy at
      // least once, not just on the current world's own epilogue flag —
      // otherwise it would flicker on/off depending on which world you're in
      epilogueSeen: save.unlockedWorlds.length > 1,
    };
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
  initInput();

  if (!worldState.hasSeenIntro) {
    showIntro(world.introTitle, world.introParagraphs, world.id === "troy" ? "Begin the Night" : "Begin", () => {
      worldState.hasSeenIntro = true;
      writeSave(save);
    });
  }

  function npcDialogueLine(npc) {
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
    const lockedWorlds = worlds.filter((w) => !save.unlockedWorlds.includes(w.id));

    if (lockedWorlds.length === 0) {
      openDialogue(
        "The Portal",
        "The portal shimmers but holds still — you've already walked every path the crossroads had to show you."
      );
      return;
    }

    showWorldSelect(lockedWorlds, (worldId) => {
      save.unlockedWorlds.push(worldId);
      save.currentWorld = worldId;
      writeSave(save);
      const chosen = worlds.find((w) => w.id === worldId);
      fx.trigger("sparkle", portal.x + 20, portal.y + 20);
      playPickupChime();
      openDialogue("The Portal", `The portal shimmers and settles on a path. ${chosen.name} awaits on the other side...`);
      setTimeout(() => window.location.reload(), WORLD_SWITCH_DELAY_MS);
    });
  }

  function handleInteract() {
    if (isDialogueOpen()) {
      closeDialogue();
      return;
    }

    const center = playerCenter(player);
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

    if (worldState.epilogueSeen && isNearPortal(portal, center)) {
      handlePortalInteract();
    }
  }

  function update(dt) {
    const input = getInputState();
    const paused = isDialogueOpen() || isIntroOpen() || isWorldSelectOpen();

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

    if (consumeInteractPressed()) {
      handleInteract();
    }
  }

  function findNearestInteractable() {
    const center = playerCenter(player);
    const nearestNpc = findNearestNpc(npcs, center);
    if (nearestNpc) return nearestNpc;
    const item = findCollectableItemAt(items, center, foundIdSet(), talkedIdSet());
    if (item) return item;
    if (isNearDeliveryPoint(deliveryPoint, center)) return deliveryPoint;
    if (worldState.epilogueSeen && isNearPortal(portal, center)) return portal;
    return null;
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
    if (drawDeliveryPoint) {
      drawDeliveryPoint(ctx, deliveryPoint, worldState.deliveredItemIds.length / items.length);
    }
    if (worldState.epilogueSeen) {
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
    fx.draw(ctx);
    ctx.restore();
  }

  startLoop({ update, render });
}

boot();
