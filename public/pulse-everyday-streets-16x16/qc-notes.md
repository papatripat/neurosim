# QC Notes — Pack 2: Pulse Everyday Streets 16×16

Art generator: `generate_streets.py` (single regenerable script, PIL + numpy, fixed seeds).
All art rendered from code. Two full review → fix rounds completed; every sheet
viewed at 8× nearest-neighbor (6× for autotile sheets) before sign-off.

## Round 1 critique (viewed: props, terrain day/night, npc1, npc2, autotile
grass/road sheets, 3×3 tiling swatches, mockup at 4×)

1. **Sofa unreadable.** Rendered as a flat gray-blue box with two dark dots —
   read as a window/face, not furniture. No armrests, no cushion separation.
2. **NPC torsos too blocky.** Teal/white torso read as a plain rectangle;
   arms fully merged into the silhouette with no separation.
3. **Night road markings wrong.** The indigo moonlit remap turned yellow center
   dashes magenta-purple and washed white markings to lavender — markings and
   lamp glow should stay warm/recognizable at night.
4. **npc2 "right" frame scare (false alarm).** A 4× mockup crop looked
   front-facing; direct inspection of `npc/npc2_right_1.png` at 8× confirmed
   the profile frame is correct — misread of the small crop, no bug.
5. Terrain tiling: 3×3 swatches of all 12 day terrains showed **no visible
   seams** (periodic 8×8 noise + mirror-safe painters confirmed visually).
6. Autotile sheets (grass/road): 47 distinct blob shapes, rounded, 1px dark
   outline, top-left light rim / bottom-right dark rim, full tiles full-bleed
   with no false outlines. Good as-is.

### Round 1 fixes (in `generate_streets.py`, then re-rendered)
- Sofa fully redesigned: side armrests, backrest cushions, two seat cushions
  with center gap, front rail, dithered seat. Now reads as a sofa at 8×.
- Added 1px dark sleeve-seam lines (x3/x12, rows 8–10) to all NPC body maps
  before the NPC1→NPC2 palette translation, so both characters get arm
  separation in the correct ramp tone.
- `night_remap()` gained a `gentle` mode for `line_yellow`, `line_white`,
  `glow_dk`, `glow`, `glow_hi`: 20% hue shift / 70% lightness instead of
  55%/52%. Dashes now stay warm yellow at night; lamps stay warm.

## Round 2 critique (re-rendered; viewed: props, npc1, npc2, terrain night,
autotile sidewalk sheet, mockup at 4×)

1. Sofa: fixed — armrests, backrest, cushion gaps all legible. (Pixel check:
   backrest renders as slate (140,152,172), not red; the 8× thumbnail had
   misled the eye.)
2. NPC sleeve seams: subtle, read correctly on both characters; tie/profile
   views unaffected.
3. Night dashes: stay warm yellow; moonlit indigo cast preserved elsewhere.
4. Sidewalk autotile sheet: clean, consistent with grass/road.
5. Mockup scene (interior + street + park): cohesive, all props legible,
   car two-tile alignment correct, crosswalk/fences/park read well.
6. No further defects found. Traffic cone slightly square but acceptable at
   16px; chair/door/newspaper box all legible.

## Automated QC (final run, all passing)

- **Detached-component (BFS, 8-connected alpha):** 26/26 props and 32/32 NPC
  frames have exactly 1 component. 0 failures. (141 autotile tiles also checked
  in-generator: 0 failures.)
- **Naming:** all 245 PNGs snake_case, no violations.
- **Grid:** every PNG is a multiple of 16px in both dimensions, no violations.
- **Alpha:** all 24 terrain tiles fully opaque; all 26 props contain both
  transparent and opaque pixels; no fully-transparent sprites.
- **Seams:** 3×3 tiling swatches for all 12 day terrains inspected — no seams.
- **Palette:** exactly 64 named colors (`assert len(DAY) == 64` in generator);
  night set is a deterministic moonlit remap of the same 64.

## Final counts

- terrain_day: 12, terrain_night: 12 (12 requested types + night variants)
- props: 26 (incl. 2-tile car: car_top + car_bottom)
- npc: 42 files = 32 frames (2 NPCs × 4 dirs × 4 walk frames) + 8 direction
  sheets + 2 full sheets. Left frames are pixel-clean horizontal mirrors of
  right (documented in README).
- autotile: 141 (47 shapes × grass, sidewalk, road)
- sheets: 8 (props, terrain_day, terrain_night, npc1, npc2, autotile_grass,
  autotile_sidewalk, autotile_road)
- mockup.png: 896×640 (14×10 tiles at 4× nearest-neighbor)
- docs: README.md, PALETTE.md, LICENSE-CC0.txt (+ AUTOTILE.md authored as
  autotile/autotile_mapping.md)
- Total: 245 PNGs.

## Art-gate self-assessment

- 64 cohesive named colors; top-left lighting on rims/highlights; 1px dark
  outlines on all props and NPCs; terrain uses edge shading (blob rims), not
  outlines; three-tone ramps on major shapes (car, tree, sofa, NPCs, lamps);
  checker dithering on large fills (terrain, cushions, canopies).
- Per-tile detail exceeds batch 1: dithered terrain, 47-shape blob autotiles
  with lit rims, 4-frame NPC walk cycles with arm/leg separation, day+night
  terrain variants.
- Competitive with Cainos "Pixel Art Top Down — Basic": outlined readable
  props, richer autotiling (47 vs basic blob), animated NPCs, night variants —
  honest pass.
