# Whispering Hollow

Browser-based explorable pixel-art game. Full design/architecture spec lives in
`whispering-hollow-architecture.md` — read it for details this file only summarizes.

## Tech Stack

Vanilla JS + HTML5 Canvas. No build step, no framework. Do not introduce a bundler or
framework (React, Phaser, etc.) unless scope grows significantly (many more zones,
scrolling camera, multiplayer) — that's an explicit future option, not a default.

## Project Structure

```
whispering-hollow/
├── index.html
├── src/
│   ├── main.js                 # boot: load assets → init game → start loop
│   ├── game/                   # loop.js, input.js, collision.js, camera.js
│   ├── entities/                # player.js, npc.js, item.js
│   ├── systems/                 # dialogue.js, inventory.js, events.js, save.js
│   ├── render/                  # tilemap.js, sprites.js, ui.js
│   └── data/                     # map.json, npcs.json, items.json, customization.json
├── public/assets/
│   ├── sprites/  tiles/  fx/  ui/
└── README.md
```

## Design Tokens (source of truth: architecture doc §1.1)

- Colors: `color-bg-deep #16281c`, `color-grass-a #3a6b4a`, `color-grass-b #356044`,
  `color-water-deep #274a56`, `color-water-light #3d7d8a`, `color-bark #5b4636`,
  `color-path #c9a876`, `color-parchment #f0e6d2`, `color-ink #2b2018`,
  `color-gold #d4a24c` (primary accent), `color-pink #e08a9b` (decorative only),
  `color-danger #a44a3f` (destructive actions only)
- `tile-size`: 40px, `sprite-size`: 32px, world grid: 20 cols x 15 rows (800x600px)
- Spacing scale: `space-xs/s/m/l/xl` = 4/8/12/16/24px — never use arbitrary spacing values
- Fonts: `font-display` (chunky pixel/bitmap, titles/names/buttons), `font-body`
  (clean sans-serif, dialogue/hints/quest log)

## Component Rules

- Every tile is exactly one of: `walkable-decorative`, `walkable-event` (triggers a
  one-off effect), or `blocked`. New tile types must declare which.
- Characters ship as sprite sheets at 32x32px/frame, one idle frame per needed facing.
- UI panels: always `color-parchment` bg, chunky pixel border, `color-ink` text,
  spacing from the scale only.
- Buttons: `color-gold` fill, dark ink-adjacent text, always keep focus outline visible.
- Effects (sparkle/confetti/splash): under 2s, simple geometric pixel shapes, must
  respect `prefers-reduced-motion`.

## Asset Naming Convention

```
player_[state]_[direction]_[frame].png   e.g. player_walk_down_01.png
npc_[id]_idle.png                         e.g. npc_kiri_idle.png
tile_[type]_[variant].png                 e.g. tile_grass_a.png
fx_[name]_[frame].png                     e.g. fx_sparkle_01.png
ui_[element].png                          e.g. ui_dialogue_frame.png
```

## Content = Data, Not Code

New NPCs, items, and customization options are added via `npcs.json` / `items.json` /
`customization.json`, never hardcoded — that's the whole point of the data-driven
structure. A "new NPC" or "new item" task should not require touching `src/entities/`
or `src/render/` unless it needs genuinely new behavior, not just new content.

- New NPC: one idle sprite + `npcs.json` entry + hint string.
- New item: `items.json` entry with `rarity` (`common`|`rare`|`limited`); rare/limited
  get a glow-tint differentiator, not a whole new asset category.
- New customization: new category in `customization.json`, opt-in and non-blocking.

## Persistence

`localStorage` for save data (collected items, talked NPCs, chosen color) — this is
the MVP and intended final state for a personal/friends-sharing launch. Do not add a
backend (Supabase or otherwise) unless the user explicitly asks for a shared/social
layer (e.g. global counters, leaderboards) — noted as a future option, not required.

## Deployment Target

Static site → GitHub repo → Vercel (or Netlify/GitHub Pages) for a free public URL.
No server-side logic needed. Include Open Graph meta tags in `index.html` for
LinkedIn link previews (see architecture doc §2.8) before considering it launch-ready.

## Pre-Launch QA (architecture doc §2.9)

Touch controls on an actual phone, no console errors, save/reset both work, OG
preview renders, and the map is fully reachable (all NPCs/items obtainable) —
re-check reachability any time the map changes.
