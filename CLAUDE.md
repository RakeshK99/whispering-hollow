# Whispering Hollow

Browser-based explorable pixel-art game. Full design/architecture spec lives in
`whispering-hollow-architecture.md` — read it for details this file only summarizes.

## Visual Assets — Real, Not Placeholder

All pixel art (player, 4 NPCs, tiles, icons, FX) is ported directly from the
Claude Design project **"Whispering Hollow Visual Brief"**
(project ID `3c367480-358d-4356-bb01-93086977e9b5`, file
`Whispering Hollow - Asset Atlas.dc.html`), read via the `DesignSync` tool. It's all
procedural canvas-drawing code (pixel-grid strings + a color map), not PNG files —
`src/render/tilemap.js`, `sprites.js`, and `icons.js` are direct ports of that source.
If visuals need to change, either edit the ported drawing code directly, or re-pull
the atlas file from that project ID if the source design changes upstream.

The 4 NPCs are **Kiri** (ember sprite, floating), **Sable** (shade-fox spirit),
**Wren** (traveling scholar), **Mochi** (slime guardian, floating) — not generic
placeholders. Tile kinds in `map.json` use the atlas's own names directly:
`grassA`, `grassB`, `path`, `flower`, `tree`, `water` (deep, blocked), `pond`
(shore/edge, walkable-event), `stump` (walkable-event). FX are named `sparkle`
(item reveal), `confetti` (stump "dance" event), `splash` (pond-edge event),
`dust` (footstep puffs while walking).

Each item also has a `shape` field (`charm`/`shard`/`leaf`/`bead`, defined in
`src/render/icons.js`) so collectibles read as visually distinct instead of
sharing one generic treasure-chest icon — keep this in mind when adding new
items: give each a matching shape, don't default them all to `treasure`.

## Multi-World Structure

There are three fully playable worlds, all ported from the Claude Design
project **"Copy of Whispering Hollow Visual Brief"** (project ID
`871fff35-1062-4627-9b71-3b88b201c323`, file `Whispering Hollow - Asset
Atlas.dc.html`, same `DesignSync` flow as the original atlas):

- **Troy** (starting world) — moonlit graveyard crossroads, reskinned from an
  earlier lush-grove look. NPCs: Kiri, Sable, Wren, Mochi.
- **UWM** — finance-district town (bank, houses, a road). Characters: Eesha,
  Sungat, Rohit, Prakhar (rides a horse — a wider "combo" sprite), Nithy.
- **Ann Arbor** — college city (university hall, the Big M landmark, flanking
  buildings). Characters: Vish, Bhuvi, Vedant (drives a car — also a combo
  sprite).

**Not built yet:** the battle-encounter mechanic (agreed: a quick
lighthearted stat/luck mini-game, not a full turn-based RPG) for "challenging"
these characters. Don't assume it exists.

Each world is fully data-driven under `src/data/<world>/{map,npcs,items}.json`,
with per-world engine config (spawn point, delivery-object position/kind,
portal position, intro copy, dialogue-object flavor text) in the shared
`src/data/worlds.json`. `main.js`'s `boot()` reads `save.currentWorld`, loads
that world's three JSON files, resizes the canvas to that world's `cols`/`rows`,
and runs the same generic game loop — nothing about movement, dialogue, items,
or the delivery loop is hardcoded to Troy anymore.

Each world reuses the identical **find items → deliver them → portal opens →
choose the next world** loop, just reskinned per world:
- Troy delivers to **the lantern** (`deliveryKind: "lantern"`, brightens per delivery)
- UWM delivers to **the vault** (`deliveryKind: "vault"`, lock glows gold as it unlocks)
- Ann Arbor delivers to **the Big M** (`deliveryKind: "bigm"`, glows brighter per delivery)

All three render via `entities/deliveryPoint.js` (position/interaction only —
world-agnostic) and whichever draw function `sprites.js` exports for that
`deliveryKind`. Delivering the last item sets `worldState.epilogueSeen`,
triggers a one-shot screen-shake (`shakeTimeLeft` in `main.js`, skipped under
`prefers-reduced-motion`), and makes the **portal** (`entities/portal.js`,
`drawPortal`) appear next to the delivery object — positioned to the *side*,
not directly adjacent, so its interact radius doesn't overlap the delivery
object's.

Interacting with an open portal shows `systems/worldSelect.js` filtered to
worlds NOT YET in `save.unlockedWorlds`. Choosing one pushes it onto
`unlockedWorlds`, sets `save.currentWorld`, and reloads the page after a short
delay — `main.js` is stateless across worlds by design (full reload rather
than in-memory teardown/rebuild), so don't try to hot-swap worlds without
reloading. If no worlds remain locked, the portal shows a "you've explored
every realm" line instead of the select screen. There is currently no way to
travel *back* to an already-unlocked world — only forward, once per portal.

Troy's tile kinds are still named `grassA`/`grassB`/`path`/`tree`/`water`/
`pond`/`flower`/`stump` (only colors changed for the graveyard mood, in
`tilemap.js`). UWM/Ann Arbor introduce their own kind names —
`lushGrassA`/`lushGrassB` (the original bright grove colors), `sidewalk`,
`asphalt`, `buildingBlock` (blocked filler under building art). Building/bank/
university-hall/house art is a separate non-tile-grid decorative pass in
`src/render/townDecor.js` (analogous to Troy's `atmosphere.js`), drawn on top
of the blocked filler tiles — collision comes from the filler tiles, not the
decoration.

Save data is now nested per-world: `save.worlds.<id> = { talkedNpcIds,
foundItemIds, deliveredItemIds, epilogueSeen, hasSeenIntro }`, plus top-level
`save.currentWorld` and `save.unlockedWorlds`. `save.js` migrates the old
flat (Troy-only) schema automatically. The secret "Moonlit Silver" tunic
color unlocks once `save.unlockedWorlds.length > 1` (i.e. the player has
completed at least one world), not tied to any single world's epilogue flag.

## Audio

SFX are synthesized at runtime via the Web Audio API in `src/systems/audio.js` —
no audio files, consistent with the procedural-visuals approach above. Mute
state lives in save data (`save.muted`) and survives a progress reset (it's a
device preference, not game progress — see `resetSave` in `save.js`). There is
no background music by user's choice — don't add a looping ambient track
without checking first.

## Tech Stack

Vanilla JS + HTML5 Canvas. No build step, no framework. Do not introduce a bundler or
framework (React, Phaser, etc.) unless scope grows significantly (many more zones,
scrolling camera, multiplayer) — that's an explicit future option, not a default.

## Project Structure

```
whispering-hollow/
├── index.html
├── src/
│   ├── main.js                 # world-driven boot: read save.currentWorld → load that
│   │                             # world's data → run the generic game loop
│   ├── game/                   # loop.js, input.js, collision.js, camera.js
│   ├── entities/                # player.js, npc.js, item.js, deliveryPoint.js, portal.js
│   ├── systems/                 # dialogue.js, intro.js, worldSelect.js, inventory.js,
│   │                             # events.js, save.js, audio.js
│   ├── render/                  # tilemap.js, sprites.js, ui.js, icons.js, atmosphere.js
│   │                             # (Troy), townDecor.js (UWM/Ann Arbor)
│   └── data/
│       ├── worlds.json           # per-world engine config (spawn/delivery/portal/copy)
│       ├── customization.json
│       ├── troy/  uwm/  ann-arbor/   # each: map.json, npcs.json, items.json
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
- Fonts: `font-display` = Silkscreen (chunky pixel/bitmap, titles/names/buttons),
  `font-body` = Nunito (clean sans-serif, dialogue/hints/quest log) — loaded via
  Google Fonts in `index.html`, exposed as CSS vars `--font-display`/`--font-body`

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

This convention still applies if real exported PNG sprite sheets are ever added to
`public/assets/`. For now everything is drawn procedurally in `src/render/` (ported
from the atlas — see above), so there are no files to name yet.

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
