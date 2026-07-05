import { startLoop } from "./game/loop.js";
import { initInput, getInputState, consumeInteractPressed } from "./game/input.js";
import { tileTypeAtPixel } from "./game/collision.js";
import { createPlayer, updatePlayer, playerCenter, setPlayerColor } from "./entities/player.js";
import { createNpc, findNearestNpc } from "./entities/npc.js";
import { createItem, findCollectableItemAt, isItemRevealed } from "./entities/item.js";
import { createLantern, isNearLantern } from "./entities/lantern.js";
import { createPortal, isNearPortal } from "./entities/portal.js";
import { loadSave, writeSave, resetSave } from "./systems/save.js";
import { openDialogue, closeDialogue, isDialogueOpen } from "./systems/dialogue.js";
import { showIntro, isIntroOpen } from "./systems/intro.js";
import { showWorldSelect, closeWorldSelect, isWorldSelectOpen } from "./systems/worldSelect.js";
import { initInventoryUI } from "./systems/inventory.js";
import { createEventTracker, checkTileEvents } from "./systems/events.js";
import { drawTilemap } from "./render/tilemap.js";
import { drawTroyAtmosphere } from "./render/atmosphere.js";
import { drawPlayer, drawNpc, drawItem, drawLantern, drawPortal } from "./render/sprites.js";
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

const LANTERN_IDLE_TEXT = "An old iron lantern stands at the crossroads, its flame unlit and waiting.";
const LANTERN_CALM_TEXT =
  "The lantern burns steady and warm. The travelers are home — and something new glimmers at the crossroads.";
const EPILOGUE_TEXT =
  "As the last treasure settles into the lantern's flame, it flares bright gold — and beside it, the air itself begins to fold, a shimmering portal blinking open at the crossroads. Kiri, Sable, Wren, and Mochi each pause to look back at you, one last time, before their night finally comes to an end. Something tells you this crossroads isn't finished with you yet.";
const PORTAL_LOCKED_PREFIX = "The portal shimmers and settles on a path. Somewhere beyond it,";

async function loadJson(path) {
  const response = await fetch(path);
  return response.json();
}

async function boot() {
  const [map, npcsData, itemsData, customization, worlds] = await Promise.all([
    loadJson("/src/data/map.json"),
    loadJson("/src/data/npcs.json"),
    loadJson("/src/data/items.json"),
    loadJson("/src/data/customization.json"),
    loadJson("/src/data/worlds.json"),
  ]);

  const npcs = npcsData.map(createNpc);
  const items = itemsData.map(createItem);
  const save = loadSave(customization);
  const lantern = createLantern({ row: 5, col: 9 });
  const portal = createPortal({ row: 4, col: 9 });

  const player = createPlayer({ row: 6, col: 9, color: save.playerColor });
  const eventTracker = createEventTracker();
  const fx = createFxManager();
  let footstepTimer = 0;
  const FOOTSTEP_INTERVAL_MS = 230;

  initAudio();
  setMuted(save.muted);

  npcs.forEach((npc) => {
    npc.talked = save.talkedNpcIds.includes(npc.id);
  });

  function talkedIdSet() {
    return new Set(save.talkedNpcIds);
  }
  function foundIdSet() {
    return new Set(save.foundItemIds);
  }
  function isDelivered(itemId) {
    return save.deliveredItemIds.includes(itemId);
  }

  const inventoryUI = initInventoryUI({
    npcs,
    items,
    customization,
    onColorChange(hex) {
      save.playerColor = hex;
      setPlayerColor(player, hex);
      writeSave(save);
      inventoryUI.render(save);
    },
    onReset() {
      const fresh = resetSave(customization, save.muted);
      Object.assign(save, fresh);
      npcs.forEach((npc) => {
        npc.talked = false;
      });
      setPlayerColor(player, save.playerColor);
      closeDialogue();
      inventoryUI.render(save);
    },
    onMuteToggle() {
      save.muted = !save.muted;
      setMuted(save.muted);
      writeSave(save);
      inventoryUI.render(save);
    },
  });

  inventoryUI.render(save);
  initInput();

  if (!save.hasSeenIntro) {
    showIntro(() => {
      save.hasSeenIntro = true;
      writeSave(save);
    });
  }

  function npcDialogueLine(npc) {
    const linkedItem = items.find((item) => item.id === npc.linkedItemId);
    const allDelivered = save.deliveredItemIds.length === items.length;
    const delivered = isDelivered(linkedItem.id);
    const found = save.foundItemIds.includes(linkedItem.id);

    if (allDelivered) return npc.dialogue.farewell;
    if (delivered) return npc.dialogue.thanks;
    if (found) return npc.dialogue.reminder;
    return npc.dialogue.intro;
  }

  function handleLanternInteract() {
    const undelivered = save.foundItemIds.filter((id) => !isDelivered(id));

    if (undelivered.length > 0) {
      const names = undelivered.map((id) => items.find((item) => item.id === id).name);
      save.deliveredItemIds.push(...undelivered);
      writeSave(save);
      inventoryUI.render(save);
      fx.trigger("sparkle", lantern.x + 20, lantern.y + 10);

      if (save.deliveredItemIds.length === items.length) {
        save.epilogueSeen = true;
        writeSave(save);
        playCelebrationFanfare();
        [-24, -8, 8, 24].forEach((dx) => fx.trigger("confetti", lantern.x + 20 + dx, lantern.y));
        fx.trigger("sparkle", portal.x + 20, portal.y + 20);
        openDialogue("The Crossroads", EPILOGUE_TEXT);
      } else {
        playPickupChime();
        openDialogue("The Lantern", `You feed the ${names.join(" and ")} to the flame. It burns a little brighter.`);
      }
      return;
    }

    if (save.epilogueSeen) {
      openDialogue("The Lantern", LANTERN_CALM_TEXT);
    } else if (save.deliveredItemIds.length > 0) {
      openDialogue(
        "The Lantern",
        `The lantern's flame flickers gently. ${save.deliveredItemIds.length} of ${items.length} travelers are on their way home.`
      );
    } else {
      openDialogue("The Lantern", LANTERN_IDLE_TEXT);
    }
  }

  function handlePortalInteract() {
    if (save.unlockedWorld) {
      const world = worlds.find((w) => w.id === save.unlockedWorld);
      openDialogue(
        "The Portal",
        `${PORTAL_LOCKED_PREFIX} ${world.name} awaits — though the way there is still being built. Come back soon.`
      );
      return;
    }

    showWorldSelect(worlds, (worldId) => {
      save.unlockedWorld = worldId;
      writeSave(save);
      const world = worlds.find((w) => w.id === worldId);
      fx.trigger("sparkle", portal.x + 20, portal.y + 20);
      playPickupChime();
      openDialogue(
        "The Portal",
        `${PORTAL_LOCKED_PREFIX} ${world.name} awaits — though the way there is still being built. Come back soon.`
      );
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
        save.talkedNpcIds.push(nearestNpc.id);
        writeSave(save);
        inventoryUI.render(save);
      }
      return;
    }

    const collectable = findCollectableItemAt(items, center, foundIdSet(), talkedIdSet());
    if (collectable) {
      save.foundItemIds.push(collectable.id);
      writeSave(save);
      inventoryUI.render(save);
      fx.trigger("sparkle", collectable.x + 20, collectable.y + 20);
      playPickupChime();
      openDialogue("Found!", `You found the ${collectable.name}. Carry it back to the lantern at the crossroads.`);
      return;
    }

    if (isNearLantern(lantern, center)) {
      handleLanternInteract();
      return;
    }

    if (save.epilogueSeen && isNearPortal(portal, center)) {
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
    if (isNearLantern(lantern, center)) return lantern;
    if (save.epilogueSeen && isNearPortal(portal, center)) return portal;
    return null;
  }

  function render() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    drawTilemap(ctx, map);
    drawTroyAtmosphere(ctx, canvas.width, canvas.height);
    drawLantern(ctx, lantern, save.deliveredItemIds.length / items.length);
    if (save.epilogueSeen) {
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
  }

  startLoop({ update, render });
}

boot();
