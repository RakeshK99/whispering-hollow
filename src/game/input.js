const KEY_BINDINGS = {
  up: ["ArrowUp", "KeyW"],
  down: ["ArrowDown", "KeyS"],
  left: ["ArrowLeft", "KeyA"],
  right: ["ArrowRight", "KeyD"],
  interact: ["Space", "Enter", "KeyE"],
};

const state = {
  up: false,
  down: false,
  left: false,
  right: false,
  interact: false,
};

let interactPressedThisFrame = false;

function directionForKey(code) {
  for (const [direction, codes] of Object.entries(KEY_BINDINGS)) {
    if (codes.includes(code)) return direction;
  }
  return null;
}

function setDirection(direction, isActive) {
  if (!direction) return;
  if (direction === "interact") {
    if (isActive && !state.interact) interactPressedThisFrame = true;
    state.interact = isActive;
    return;
  }
  state[direction] = isActive;
}

function bindKeyboard() {
  window.addEventListener("keydown", (event) => {
    setDirection(directionForKey(event.code), true);
  });
  window.addEventListener("keyup", (event) => {
    setDirection(directionForKey(event.code), false);
  });
}

function bindTouchButton(elementId, direction) {
  const button = document.getElementById(elementId);
  if (!button) return;

  const press = (event) => {
    event.preventDefault();
    document.body.classList.add("touch");
    setDirection(direction, true);
  };
  const release = (event) => {
    event.preventDefault();
    setDirection(direction, false);
  };

  button.addEventListener("touchstart", press, { passive: false });
  button.addEventListener("touchend", release, { passive: false });
  button.addEventListener("touchcancel", release, { passive: false });
  button.addEventListener("mousedown", press);
  button.addEventListener("mouseup", release);
  button.addEventListener("mouseleave", release);
}

function bindTouchControls() {
  bindTouchButton("dpad-up", "up");
  bindTouchButton("dpad-down", "down");
  bindTouchButton("dpad-left", "left");
  bindTouchButton("dpad-right", "right");
  bindTouchButton("interact-button", "interact");
}

function detectTouch() {
  if ("ontouchstart" in window || navigator.maxTouchPoints > 0) {
    document.body.classList.add("touch");
  }
}

export function initInput() {
  bindKeyboard();
  bindTouchControls();
  detectTouch();
}

export function getInputState() {
  return { ...state };
}

export function consumeInteractPressed() {
  const pressed = interactPressedThisFrame;
  interactPressedThisFrame = false;
  return pressed;
}
