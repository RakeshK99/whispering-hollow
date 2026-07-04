# Whispering Hollow — Design System & Build Architecture

**How to use this doc:** hand this to Claude Code along with the Claude Design import snippet below and the earlier visual brief. This doc is the single source of truth for both visual consistency (Part 1) and the technical build + deployment (Part 2), so the game can end up live at a public URL you can drop into a LinkedIn post.

**Asset import (paste this to Claude Code as-is):**
```
Use the claude_design MCP (https://api.anthropic.com/v1/design/mcp, auth via /design-login) to import this project:
https://claude.ai/design/p/3c367480-358d-4356-bb01-93086977e9b5?file=Whispering+Hollow+-+Asset+Atlas.dc.html
Implement: Whispering Hollow - Asset Atlas.dc.html
```

---

# PART 1 — Design System

This is the source of truth for anything visual, so every future addition (new NPC, new item, new UI panel) stays consistent without needing a new design pass each time.

## 1.1 Design Tokens

**Color tokens**
| Token | Hex | Usage |
|---|---|---|
| `color-bg-deep` | `#16281c` | Page background behind the game |
| `color-grass-a` | `#3a6b4a` | Grass tile, variant A |
| `color-grass-b` | `#356044` | Grass tile, variant B (checkerboard alternation) |
| `color-water-deep` | `#274a56` | Blocked/deep water tiles |
| `color-water-light` | `#3d7d8a` | Shallow/pond-edge tiles |
| `color-bark` | `#5b4636` | Tree trunks, stump wood |
| `color-path` | `#c9a876` | Walkable path tiles |
| `color-parchment` | `#f0e6d2` | All UI panel backgrounds |
| `color-ink` | `#2b2018` | All body text |
| `color-gold` | `#d4a24c` | Primary accent — buttons, highlights, glow effects |
| `color-pink` | `#e08a9b` | Decorative accent (flowers) |
| `color-danger` | `#a44a3f` | Destructive actions only (e.g. reset progress) |

**Sizing tokens**
| Token | Value | Usage |
|---|---|---|
| `tile-size` | 40px | Canonical world grid unit — every tile and collision check is based on this |
| `sprite-size` | 32px | Canonical character/NPC sprite frame size |
| `world-cols` / `world-rows` | 20 / 15 | Current map dimensions (800x600px world) |
| `space-xs` … `space-xl` | 4 / 8 / 12 / 16 / 24px | UI spacing scale — use only these values, never arbitrary spacing |

**Typography tokens**
- `font-display`: a chunky pixel/bitmap-style font — for titles, NPC names, buttons
- `font-body`: a clean, simple sans-serif — for dialogue text, hints, quest log (readability matters more than style here)

## 1.2 Component Rules

- **Tiles** — every tile type is one of: `walkable-decorative` (grass, flower, path), `walkable-event` (stump, pond-edge — triggers a one-off effect), or `blocked` (tree, deep water). Any new tile type must declare which of these three it is.
- **Characters** — every character (player or NPC) ships as a sprite sheet at `sprite-size` (32x32px per frame), with a consistent naming convention (below) and at minimum one idle frame per facing direction it needs.
- **UI panels** — always `color-parchment` background, chunky pixel-style border, `color-ink` text, spacing from the `space-*` scale only.
- **Buttons** — `color-gold` fill, `color-ink`-adjacent dark text, visible focus outline (accessibility — never remove focus outlines).
- **Effects (sparkle, confetti, splash)** — always short (under 2 seconds), built from simple geometric pixel shapes, and must have a reduced-motion fallback (respect `prefers-reduced-motion`).

## 1.3 Asset Naming Convention

Claude Code should expect (or enforce, if re-exporting) this naming pattern so assets can be loaded programmatically instead of hardcoded one-by-one:

```
player_[state]_[direction]_[frame].png     e.g. player_walk_down_01.png
npc_[id]_idle.png                           e.g. npc_kiri_idle.png
tile_[type]_[variant].png                   e.g. tile_grass_a.png, tile_tree_01.png
fx_[name]_[frame].png                       e.g. fx_sparkle_01.png
ui_[element].png                            e.g. ui_dialogue_frame.png
```

## 1.4 Extension Rules (for future content)

- **New NPC**: needs one idle sprite (32x32px, matching palette), an entry in `npcs.json` (see schema below), and a hint string. No code changes required.
- **New item / rarity tier**: add to `items.json` with a `rarity` field (`common` | `rare` | `limited`). Rare/limited items should get a subtle visual differentiator (e.g. colored glow tint) rather than a whole new asset category.
- **New customization option** (beyond player color): add a new `customization` category in the save schema (see 2.6) — keep it opt-in and non-blocking, same pattern as the color picker.

---

# PART 2 — Game Architecture

## 2.1 Tech Stack

Keep it **vanilla JS + HTML5 Canvas** — no build step, no framework overhead. This matches the existing working prototype and is the fastest path to a live, shareable link. Recommended only if scope grows significantly later (many more NPCs/zones, camera/scrolling, real multiplayer): migrate the rendering layer to **Phaser** or **Kaboom.js**. Not needed for launch.

## 2.2 Project Structure

```
whispering-hollow/
├── index.html
├── src/
│   ├── main.js                 # boot sequence: load assets → init game → start loop
│   ├── game/
│   │   ├── loop.js              # requestAnimationFrame loop
│   │   ├── input.js              # keyboard + touch input state
│   │   ├── collision.js          # tile-based collision checks
│   │   └── camera.js              # no-op for now (whole map fits); stub for future scrolling
│   ├── entities/
│   │   ├── player.js
│   │   ├── npc.js
│   │   └── item.js
│   ├── systems/
│   │   ├── dialogue.js           # NPC interaction + dialogue overlay
│   │   ├── inventory.js          # collected items + quest log state
│   │   ├── events.js             # stump/pond silly-event triggers
│   │   └── save.js               # localStorage persistence
│   ├── render/
│   │   ├── tilemap.js
│   │   ├── sprites.js
│   │   └── ui.js
│   └── data/
│       ├── map.json
│       ├── npcs.json
│       ├── items.json
│       └── customization.json
├── public/
│   └── assets/
│       ├── sprites/              # player + NPC sprite sheets
│       ├── tiles/                 # tileset images
│       ├── fx/                     # sparkle/confetti/splash sheets
│       └── ui/                      # panel/button/icon assets
└── README.md
```

## 2.3 Data Schemas

**`map.json`**
```json
{
  "cols": 20,
  "rows": 15,
  "tileSize": 40,
  "tiles": [[1,1,1, "... 2D array of tile-type ints ..."]]
}
```

**`npcs.json`**
```json
[
  {
    "id": "kiri",
    "name": "Kiri the Ember Sprite",
    "sprite": "npc_kiri_idle.png",
    "position": { "row": 2, "col": 9 },
    "hint": "Seek where petals bloom near the southern edge of the grove.",
    "linkedItemId": "acorn"
  }
]
```

**`items.json`**
```json
[
  {
    "id": "acorn",
    "name": "Acorn of Whispers",
    "icon": "item_acorn.png",
    "position": { "row": 12, "col": 4 },
    "rarity": "common",
    "revealedBy": "kiri",
    "secret": false
  }
]
```

**`customization.json`**
```json
{
  "playerColor": {
    "options": ["#e0724a", "#4a90d9", "#7ac97a", "#e0c14a", "#c264c9"],
    "default": "#e0724a"
  }
}
```

Keeping all of this in data files (not hardcoded in JS) is what makes "add a rare item" or "add an NPC" a content change instead of a code change — directly supports the Part 1 extension rules.

## 2.4 Core Systems

- **Game loop** — fixed-step update (movement, collision, tile-trigger checks) followed by render, via `requestAnimationFrame`.
- **Input** — unify keyboard (arrow keys/WASD) and touch (on-screen d-pad + interact button) into one input-state object so the rest of the game never needs to know which input source is active.
- **Collision** — sample the four corners of the player's bounding box against `map.json`; block movement into any `blocked` tile type.
- **Dialogue system** — on interact key/button, find nearest NPC within a fixed radius, open dialogue overlay, mark NPC as talked, reveal linked item.
- **Inventory/quest system** — derived state from `npcs.json` + `items.json` + save data; renders the sidebar tabs.
- **Event system** — tracks the player's current tile; on entering a `walkable-event` tile (stump/pond) that differs from the last-triggered tile, fires the relevant effect with a cooldown so it doesn't spam.
- **Save system** — see 2.6.

## 2.5 Asset Loading Pipeline

1. Preload all sprite sheets, tileset images, and UI assets before starting the game loop (simple `Promise.all` over `Image` load events is enough — no need for a heavy asset-loader library at this scale).
2. Sprite sheets should be sliced by fixed frame size (`sprite-size` / `tile-size`) rather than needing per-frame coordinate files, if the naming convention in 1.3 is followed — simpler and less error-prone than a JSON atlas map, unless Claude Design's actual export requires one (in which case, follow whatever atlas-coordinate format it provides).

## 2.6 Persistence Strategy

**Important:** the original prototype used `window.storage`, which only exists inside Claude.ai's Artifacts sandbox. A real deployed site needs its own persistence:

- **MVP (launch this way):** use `localStorage` for save data (collected items, talked NPCs, chosen color). Same shape as before, just a different storage call. This requires no backend and is enough for a personal/friends-sharing use case.
- **Future, if you want a shared/social layer** (e.g. a global "X people have found the Forgotten Key" counter, or leaderboards across everyone who plays the link): you already have Supabase experience from Trackd — that's a natural fit for a lightweight shared backend later. Not needed for launch.

## 2.7 Deployment Plan (get a public link fast)

Since this is a static site (HTML/CSS/JS + assets, no server-side logic required for MVP), the simplest path:

1. Push the project to a GitHub repo.
2. Connect the repo to **Vercel** (or **GitHub Pages** / **Netlify** as equally simple alternatives) — all offer free static hosting with automatic deploys on push.
3. Vercel/Netlify will give you a public URL immediately (e.g. `whispering-hollow.vercel.app`); a custom domain can be added later if you want.
4. That URL is what goes in the LinkedIn post.

## 2.8 Social Sharing Polish (for the LinkedIn post specifically)

- Add Open Graph meta tags to `index.html` so the link unfurls with a proper title, description, and preview image on LinkedIn instead of a bare link:
  ```html
  <meta property="og:title" content="Whispering Hollow">
  <meta property="og:description" content="A tiny explorable grove full of hidden treasures — find them all.">
  <meta property="og:image" content="[URL to a screenshot or custom thumbnail]">
  <meta property="og:type" content="website">
  ```
- Take a real screenshot (or have Claude Design produce a clean title-card image) to use as that preview image — LinkedIn posts with a visual preview get noticeably more engagement than bare links.
- Confirm the touch controls and layout work well on mobile before posting, since a lot of LinkedIn traffic will be on phones.

## 2.9 Pre-Launch QA Checklist

- [ ] Works in Chrome, Safari, and at least one mobile browser
- [ ] Touch controls tested on an actual phone, not just resized desktop browser
- [ ] No console errors on load or during play
- [ ] Save/reset progress both work as expected
- [ ] Open Graph preview renders correctly (test with LinkedIn's post preview before publishing)
- [ ] Game is playable start-to-finish (all NPCs reachable, all items collectible) — same reachability check done for the current tile layout should be re-run if the map changes

---

# PART 3 — Summary Instruction Block for Claude Code

Paste this as your opening message to Claude Code:

> Build "Whispering Hollow," a browser-based explorable pixel-art game, using the attached design brief and this architecture doc as the spec. First, import the visual assets via the Claude Design MCP snippet included above. Follow the design system in Part 1 exactly for consistency. Implement the architecture in Part 2 — vanilla JS + Canvas, data-driven map/NPCs/items, localStorage-based save system. Once working locally, set up deployment per section 2.7 so I end up with a public URL, and add the Open Graph tags from section 2.8 so it shares well on LinkedIn.
