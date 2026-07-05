const overlay = document.getElementById("world-select-overlay");
const list = document.getElementById("world-select-list");

let open = false;

export function isWorldSelectOpen() {
  return open;
}

export function closeWorldSelect() {
  overlay.hidden = true;
  open = false;
}

export function showWorldSelect(worlds, onChoose) {
  list.innerHTML = "";

  worlds.forEach((world) => {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "world-option";
    button.innerHTML = `
      <span class="world-option-name">${world.name}</span>
      <span class="world-option-tag">${world.tag} · ${world.mood}</span>
      <span class="world-option-desc">${world.desc}</span>
    `;
    button.addEventListener("click", () => {
      closeWorldSelect();
      onChoose(world.id);
    });
    list.appendChild(button);
  });

  overlay.hidden = false;
  open = true;
}
