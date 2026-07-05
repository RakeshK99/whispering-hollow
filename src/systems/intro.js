const overlay = document.getElementById("intro-overlay");
const beginButton = document.getElementById("intro-begin");

let open = false;

export function isIntroOpen() {
  return open;
}

export function showIntro(onBegin) {
  overlay.hidden = false;
  open = true;

  const handleBegin = () => {
    overlay.hidden = true;
    open = false;
    beginButton.removeEventListener("click", handleBegin);
    onBegin();
  };

  beginButton.addEventListener("click", handleBegin);
}
