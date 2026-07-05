import { isBoxBlocked } from "../game/collision.js";

const SPRITE_SIZE = 32;
const SPEED_PX_PER_SEC = 130;
const ANIM_FRAME_MS = 110;
const ANIM_SEQUENCE = [0, 1, 0, 2];

export function createPlayer({ row, col, color }) {
  return {
    x: col * 40 + (40 - SPRITE_SIZE) / 2,
    y: row * 40 + (40 - SPRITE_SIZE) / 2,
    width: SPRITE_SIZE,
    height: SPRITE_SIZE,
    color,
    facing: "down",
    moving: false,
    animPhase: 0,
    animTimer: 0,
    animStep: 0,
  };
}

export function setPlayerColor(player, color) {
  player.color = color;
}

export function playerCenter(player) {
  return {
    x: player.x + player.width / 2,
    y: player.y + player.height / 2,
  };
}

export function updatePlayer(player, dt, input, map) {
  const distance = (SPEED_PX_PER_SEC * dt) / 1000;
  let dx = 0;
  let dy = 0;

  if (input.left) dx -= 1;
  if (input.right) dx += 1;
  if (input.up) dy -= 1;
  if (input.down) dy += 1;

  player.moving = dx !== 0 || dy !== 0;

  if (dx > 0) player.facing = "right";
  else if (dx < 0) player.facing = "left";
  else if (dy > 0) player.facing = "down";
  else if (dy < 0) player.facing = "up";

  if (dx !== 0 && dy !== 0) {
    // normalize so diagonal movement isn't faster than cardinal movement
    const norm = Math.SQRT1_2;
    dx *= norm;
    dy *= norm;
  }

  const nextX = player.x + dx * distance;
  const nextY = player.y + dy * distance;

  if (!isBoxBlocked(map, nextX, player.y, player.width, player.height)) {
    player.x = nextX;
  }
  if (!isBoxBlocked(map, player.x, nextY, player.width, player.height)) {
    player.y = nextY;
  }

  if (player.moving) {
    player.animTimer += dt;
    while (player.animTimer >= ANIM_FRAME_MS) {
      player.animTimer -= ANIM_FRAME_MS;
      player.animStep = (player.animStep + 1) % ANIM_SEQUENCE.length;
    }
    player.animPhase = ANIM_SEQUENCE[player.animStep];
  } else {
    player.animTimer = 0;
    player.animStep = 0;
    player.animPhase = 0;
  }
}
