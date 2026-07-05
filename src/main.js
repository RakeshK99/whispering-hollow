import { startLoop } from "./game/loop.js";
import { initInput, getInputState, consumeInteractPressed } from "./game/input.js";
import { tileTypeAtPixel } from "./game/collision.js";
import { createPlayer, updatePlayer, playerCenter, setPlayerColor } from "./entities/player.js";
import { createNpc, findNearestNpc } from "./entities/npc.js";
import { createItem, findCollectableItemAt, isItemRevealed } from "./entities/item.js";
import { createShrine, isNearShrine } from "./entities/shrine.js";
import { loadSave, writeSave, resetSave } from "./systems/save.js";
import { openDialogue, closeDialogue, isDialogueOpen } from "./systems/dialogue.js";
import { showIntro, isIntroOpen } from "./systems/intro.js";
import { initInventoryUI } from "./systems/inventory.js";
import { createEventTracker, checkTileEvents } from "./systems/events.js";
import { drawTilemap } from "./render/tilemap.js";
import { drawPlayer, drawNpc, drawItem, drawShrine } from "./render/sprites.js";
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

const SHRINE_IDLE_TEXT = "An old stone altar sits quiet at the crossroads, moss thick in its carvings.";
const SHRINE_CALM_TEXT =
  "The shrine is cool and still. The travelers are home. Somewhere, four realms remember a stranger who helped them find their way.";

async function loadJson(path) {
  const response = await fetch(path);
  return response.json();
}

async function boot() {
  const [map, npcsData, itemsData, customization] = await Promise.all([
    loadJson("/src/data/map.json"),
    loadJson("/src/data/npcs.json"),
    loadJson("/src/data/items.json"),
    loadJson("/src/data/customization.json"),
  ]);

  const npcs = npcsData.map(createNpc);
  const items = itemsData.map(createItem);
  const save = loadSave(customization);
  const shrine = createShrine({ row: 5, col: 9 });

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

  function handleShrineInteract() {
    const undelivered = save.foundItemIds.filter((id) => !isDelivered(id));

    if (undelivered.length > 0) {
      const names = undelivered.map((id) => items.find((item) => item.id === id).name);
      save.deliveredItemIds.push(...undelivered);
      writeSave(save);
      inventoryUI.render(save);
      fx.trigger("sparkle", shrine.x + 20, shrine.y + 10);

      if (save.deliveredItemIds.length === items.length) {
        save.epilogueSeen = true;
        writeSave(save);
        playCelebrationFanfare();
        [-24, -8, 8, 24].forEach((dx) => fx.trigger("confetti", shrine.x + 20 + dx, shrine.y));
        openDialogue(
          "The Crossroads",
          "As the last treasure settles onto the stone, the crossroads shudders — four paths of light bloom outward, one to each realm. Kiri, Sable, Wren, and Mochi each pause at their threshold to look back at you before stepping through. The night grows quiet again. You may have found something too, in all this wandering."
        );
      } else {
        playPickupChime();
        openDialogue("The Shrine", `You lay the ${names.join(" and ")} upon the stone. It glows a little brighter.`);
      }
      return;
    }

    if (save.epilogueSeen) {
      openDialogue("The Shrine", SHRINE_CALM_TEXT);
    } else if (save.deliveredItemIds.length > 0) {
      openDialogue(
        "The Shrine",
        `The shrine hums faintly. ${save.deliveredItemIds.length} of ${items.length} travelers are on their way home.`
      );
    } else {
      openDialogue("The Shrine", SHRINE_IDLE_TEXT);
    }
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
      openDialogue("Found!", `You found the ${collectable.name}. Carry it back to the shrine at the crossroads.`);
      return;
    }

    if (isNearShrine(shrine, center)) {
      handleShrineInteract();
    }
  }

  function update(dt) {
    const input = getInputState();
    const paused = isDialogueOpen() || isIntroOpen();

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
    if (isNearShrine(shrine, center)) return shrine;
    return null;
  }

  function render() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    drawTilemap(ctx, map);
    drawShrine(ctx, shrine, save.deliveredItemIds.length / items.length);

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
