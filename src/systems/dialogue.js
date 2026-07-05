const overlay = document.getElementById("dialogue-overlay");
const nameEl = document.getElementById("dialogue-name");
const textEl = document.getElementById("dialogue-text");

let open = false;

export function isDialogueOpen() {
  return open;
}

export function openDialogue(name, text) {
  nameEl.textContent = name;
  textEl.textContent = text;
  overlay.hidden = false;
  open = true;
}

export function closeDialogue() {
  overlay.hidden = true;
  open = false;
}
