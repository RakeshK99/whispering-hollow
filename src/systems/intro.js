const overlay = document.getElementById("intro-overlay");
const titleEl = document.getElementById("intro-title");
const paragraphsEl = document.getElementById("intro-paragraphs");
const beginButton = document.getElementById("intro-begin");

let open = false;

export function isIntroOpen() {
  return open;
}

export function showIntro(title, paragraphs, beginLabel, onBegin) {
  titleEl.textContent = title;
  paragraphsEl.innerHTML = "";
  paragraphs.forEach((text) => {
    const p = document.createElement("p");
    p.textContent = text;
    paragraphsEl.appendChild(p);
  });
  beginButton.textContent = beginLabel;

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
