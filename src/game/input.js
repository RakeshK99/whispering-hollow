const KEY_BINDINGS = {
  up: ["ArrowUp", "KeyW"],
  down: ["ArrowDown", "KeyS"],
  left: ["ArrowLeft", "KeyA"],
  right: ["ArrowRight", "KeyD"],
  interact: ["Space", "Enter", "KeyE"],
  challenge: ["KeyB"],
};

const state = {
  up: false,
  down: false,
  left: false,
  right: false,
  interact: false,
  challenge: false,
};

let interactPressedThisFrame = false;
let challengePressedThisFrame = false;

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
  if (direction === "challenge") {
    if (isActive && !state.challenge) challengePressedThisFrame = true;
    state.challenge = isActive;
    return;
  }
  state[direction] = isActive;
}

function bindKeyboard() {
  window.addEventListener("keydown", (event) => {
    const direction = directionForKey(event.code);
    if (!direction) return;
    // Space/Arrow keys default to scrolling the page — with no preventDefault
    // that scroll can fire on every key repeat while playing, which is
    // especially disruptive for the interact-key-driven mini-games.
    event.preventDefault();
    setDirection(direction, true);
  });
  window.addEventListener("keyup", (event) => {
    const direction = directionForKey(event.code);
    if (!direction) return;
    event.preventDefault();
    setDirection(direction, false);
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
  bindTouchButton("challenge-button", "challenge");
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

export function consumeChallengePressed() {
  const pressed = challengePressedThisFrame;
  challengePressedThisFrame = false;
  return pressed;
}
