// The whole map fits on screen at launch, so the camera never needs to move.
// Kept as a stub so a future scrolling camera can slot in without touching
// render code — anything reading the offset already goes through here.
export function getCameraOffset() {
  return { x: 0, y: 0 };
}
