import { renderIconToCanvas } from "../render/icons.js";
import { playUiClick } from "./audio.js";

const RARITY_ACCENT = { common: "#d4a24c", rare: "#e08a9b", limited: "#c264c9" };

const questLogList = document.getElementById("quest-log-list");
const inventoryList = document.getElementById("inventory-list");
const colorPicker = document.getElementById("color-picker");
const resetButton = document.getElementById("reset-progress");
const tabPanels = {
  "tab-quest": document.getElementById("panel-quest"),
  "tab-inventory": document.getElementById("panel-inventory"),
};
const tabButtons = Object.keys(tabPanels).map((id) => document.getElementById(id));
const muteButton = document.getElementById("mute-toggle");

function bindTabs() {
  tabButtons.forEach((button) => {
    button.addEventListener("click", () => {
      playUiClick();
      tabButtons.forEach((b) => b.setAttribute("aria-selected", String(b === button)));
      Object.entries(tabPanels).forEach(([id, panel]) => {
        panel.hidden = id !== button.id;
      });
    });
  });
}

function makeSwatch(hex, label, save, onColorChange, extraClass) {
  const swatch = document.createElement("button");
  swatch.type = "button";
  swatch.className = extraClass ? `color-swatch ${extraClass}` : "color-swatch";
  swatch.style.background = hex;
  swatch.title = label;
  swatch.setAttribute("aria-label", `Choose color ${label}`);
  swatch.setAttribute("aria-pressed", String(save.playerColor === hex));
  swatch.addEventListener("click", () => {
    playUiClick();
    onColorChange(hex);
  });
  return swatch;
}

function renderColorPicker(customization, save, onColorChange) {
  colorPicker.innerHTML = "";
  customization.playerColor.options.forEach((hex) => {
    colorPicker.appendChild(makeSwatch(hex, hex, save, onColorChange));
  });

  const secret = customization.secretPlayerColor;
  if (secret && save.epilogueSeen) {
    colorPicker.appendChild(makeSwatch(secret.hex, secret.name, save, onColorChange, "color-swatch-secret"));
  }
}

function iconRow(iconKind, accent, text) {
  const li = document.createElement("li");
  li.className = "icon-row";
  const icon = renderIconToCanvas(iconKind, 20, accent);
  li.appendChild(icon);
  const span = document.createElement("span");
  span.textContent = text;
  li.appendChild(span);
  return li;
}

function renderQuestLog(npcs, items, save) {
  questLogList.innerHTML = "";
  npcs.forEach((npc) => {
    // Flavor-only NPCs (building hosts) aren't part of the fetch-quest loop.
    if (!npc.linkedItemId) return;

    const talked = save.talkedNpcIds.includes(npc.id);
    const linkedItem = items.find((item) => item.id === npc.linkedItemId);
    const delivered = linkedItem && save.deliveredItemIds.includes(linkedItem.id);
    const found = linkedItem && save.foundItemIds.includes(linkedItem.id);

    if (!talked) {
      questLogList.appendChild(iconRow("scroll", "#d4a24c", `${npc.name}: not yet met`));
    } else if (delivered) {
      const accent = RARITY_ACCENT[linkedItem.rarity] || RARITY_ACCENT.common;
      questLogList.appendChild(iconRow(linkedItem.shape, accent, `${npc.name}: ${linkedItem.name} delivered — thank you!`));
    } else if (found) {
      const accent = RARITY_ACCENT[linkedItem.rarity] || RARITY_ACCENT.common;
      questLogList.appendChild(
        iconRow(linkedItem.shape, accent, `${npc.name}: found the ${linkedItem.name} — return it to the lantern!`)
      );
    } else {
      questLogList.appendChild(iconRow("scroll", "#d4a24c", `${npc.name}: "${npc.dialogue.intro}"`));
    }
  });
}

function renderInventoryList(items, save) {
  inventoryList.innerHTML = "";
  const carried = items.filter((item) => save.foundItemIds.includes(item.id) && !save.deliveredItemIds.includes(item.id));
  const delivered = items.filter((item) => save.deliveredItemIds.includes(item.id));

  if (carried.length === 0 && delivered.length === 0 && save.trinkets.length === 0) {
    inventoryList.appendChild(iconRow("bag", "#d4a24c", "No items collected yet."));
  }

  carried.forEach((item) => {
    const accent = RARITY_ACCENT[item.rarity] || RARITY_ACCENT.common;
    inventoryList.appendChild(iconRow(item.shape, accent, `${item.name} — in your satchel`));
  });

  delivered.forEach((item) => {
    const accent = RARITY_ACCENT[item.rarity] || RARITY_ACCENT.common;
    inventoryList.appendChild(iconRow(item.shape, accent, `${item.name} — delivered to the lantern`));
  });

  save.trinkets.forEach((trinket) => {
    inventoryList.appendChild(iconRow("star", trinket.accent, `${trinket.name} trinket — won`));
  });
}

export function initInventoryUI({ npcs, items, customization, onColorChange, onReset, onMuteToggle }) {
  bindTabs();
  resetButton.addEventListener("click", () => {
    playUiClick();
    onReset();
  });
  muteButton.addEventListener("click", () => {
    playUiClick();
    onMuteToggle();
  });

  return {
    render(save) {
      renderQuestLog(npcs, items, save);
      renderInventoryList(items, save);
      renderColorPicker(customization, save, onColorChange);
      muteButton.textContent = save.muted ? "SOUND: OFF" : "SOUND: ON";
      muteButton.setAttribute("aria-pressed", String(save.muted));
    },
  };
}
