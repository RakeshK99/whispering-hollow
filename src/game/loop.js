const STEP_MS = 1000 / 60;
const MAX_FRAME_MS = 250; // avoid a huge catch-up burst after a tab is backgrounded

export function startLoop({ update, render }) {
  let accumulator = 0;
  let lastTime = performance.now();
  let running = true;

  function frame(now) {
    if (!running) return;

    const elapsed = Math.min(now - lastTime, MAX_FRAME_MS);
    lastTime = now;
    accumulator += elapsed;

    while (accumulator >= STEP_MS) {
      update(STEP_MS);
      accumulator -= STEP_MS;
    }

    render();
    requestAnimationFrame(frame);
  }

  requestAnimationFrame(frame);

  return {
    stop() {
      running = false;
    },
  };
}
