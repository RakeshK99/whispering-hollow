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

The world the player starts in is **Troy** — a moonlit graveyard crossroads,
reskinned from an earlier lush-grove look per a second design pass, project
**"Copy of Whispering Hollow Visual Brief"** (project ID
`871fff35-1062-4627-9b71-3b88b201c323`, same file name, same `DesignSync` flow).
That atlas also defines two more worlds — **UWM** (finance district, 5
characters) and **Ann Arbor** (college city, 3 characters) — plus a battle-
encounter panel for "challenging" those characters. Only the portal/world-select
*framework* is built so far; UWM and Ann Arbor are data-only stubs in
`src/data/worlds.json` with no playable map yet, and the battle mechanic
(agreed: a quick lighthearted stat/luck mini-game, not a full turn-based RPG)
isn't built at all. Don't assume either exists beyond the stub dialogue.

Troy's tile textures are still named `grassA`/`grassB`/`path`/`tree`/`water`/
`pond`/`flower`/`stump` in `map.json` — only the colors changed in
`tilemap.js` (dark grass, dirt path, bare dead trees, inky water). The
decorative moon/lamp/grave/fog layer lives in `src/render/atmosphere.js`,
drawn after the tilemap but before characters so sprites stay full-brightness
against the dimmed night tint.

The item-delivery loop is unchanged in mechanics — find 4 items from the 4
NPCs, carry them, deliver them — just reskinned: the delivery object is now
the **lantern** (`entities/lantern.js`, `drawLantern` in `sprites.js`, brightens
per delivery) instead of a stone shrine. Delivering the 4th item sets
`save.epilogueSeen`, which is what makes the **portal** (`entities/portal.js`,
`drawPortal`) appear and become interactable just north of the lantern.
Interacting with the portal opens the world-select overlay
(`systems/worldSelect.js`) once; the chosen world is locked into
`save.unlockedWorld` permanently (no re-picking) and shown as "coming soon"
on future portal interactions until that world is actually built.

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
│   ├── main.js                 # boot: load assets → init game → start loop
│   ├── game/                   # loop.js, input.js, collision.js, camera.js
│   ├── entities/                # player.js, npc.js, item.js, lantern.js, portal.js
│   ├── systems/                 # dialogue.js, intro.js, worldSelect.js, inventory.js,
│   │                             # events.js, save.js, audio.js
│   ├── render/                  # tilemap.js, sprites.js, ui.js, icons.js, atmosphere.js
│   └── data/                     # map.json, npcs.json, items.json, customization.json,
│                                    # worlds.json
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
