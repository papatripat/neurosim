# Pulse Everyday Streets 16x16

A modern/contemporary top-down 16x16 pixel-art tileset: apartment interiors,
city streets, and a park — with furniture, street props, two animated NPCs,
and full 47-tile blob autotiles. All art is **procedurally crafted with code**
(string-map sprites + numpy painters from a hand-defined 64-color palette);
no generative AI models were used.

## Contents

- `terrain_day/` — 12 seamless tiles: `wood_floor_1/2`, `carpet_1/2`,
  `classroom_tile`, `sidewalk`, `asphalt`, `asphalt_dashes`, `crosswalk`,
  `grass_1/2/3`
- `terrain_night/` — the same 12 tiles remapped to a moonlit palette
- `props/` — 26 sprites: desk, chair, bed, sofa, coffee_table, potted_plant,
  floor_lamp, bookshelf, door, window, streetlamp, trash_can, park_bench,
  tree, bush, wooden_fence, picket_fence, car_top + car_bottom (one 16x32
  car), mailbox, fire_hydrant, manhole_cover, traffic_cone, newspaper_box,
  parking_meter, dumpster
- `npc/` — 2 characters (hoodie teen, office worker) x 4 directions x
  4 walk frames = 32 frames + 2 sheets. `left` frames are exact horizontal
  mirrors of `right` (pixel-clean flip).
- `autotile/` — 47-tile blob sets for grass, sidewalk, road (141 tiles),
  with `README.md` + `mapping.json` documenting the bitmask layout
- `sheets/` — category montages; `mockup.png` — a tiled scene built only
  from included tiles
- `PALETTE.md` — the 64-color palette with named ramps

## License

CC0 1.0 Universal — free for commercial use, no attribution required
(see `LICENSE-CC0.txt`). Credit "Pulse Games" is appreciated but optional.

## Import

- **Godot 4:** import PNGs, set Texture2D filter to Nearest; for autotiles
  use a TerrainSet in "match corners and sides" mode with the 47 tiles in
  `mapping.json` order.
- **Unity:** Sprite Mode Multiple, 16 PPU, Filter Mode Point, slice 16x16.
- **Unreal (Paper2D):** import, set Texture Filter to Nearest, make a
  Tile Set with 16x16 grid.
- **GameMaker:** sprite 16x16, origin centered, disable interpolation.

## Credits

Art pack by **Pulse Games**. Procedurally crafted with code — no
generative AI models.
