# Autotile — 47-tile blob sets

Three terrains: `grass/`, `sidewalk/`, `road/`. Each folder holds 47 tiles
(`tile_00.png` … `tile_46.png`) plus a sheet montage. Tiles are indexed in
the order below, which matches the bitmask in `mapping.json`:

- `bit0` = N edge, `bit1` = NE, `bit2` = E, `bit3` = SE,
  `bit4` = S, `bit5` = SW, `bit6` = W, `bit7` = NW (1 = same terrain)
- A diagonal bit only affects the shape when both adjacent edges are 1;
  otherwise it is a don't-care and renders as present.
- 00 isolated, 01–04 single edges (N,E,S,W), 05–06 tubes (NS,EW),
  07–14 corners (NE,SE,SW,NW, each plain + inner-notch),
  15–30 three-edge tiles (missing N/E/S/W × 4 inner-corner variants),
  31–46 full tiles (16 inner-corner variants, 31 = no notch).

The blob boundary is generated from a distance field, so edges join
seamlessly across tiles. In Godot 4, load the 47 tiles in order into a
TerrainSet using "match corners and sides" mode.
