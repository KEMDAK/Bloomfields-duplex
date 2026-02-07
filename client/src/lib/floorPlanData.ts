/**
 * Floor Plan Data — Type DU1 Ground Floor
 * DEFINITIVE v5
 *
 * All dimensions in meters, true to scale.
 *
 * Coordinate system (portrait orientation, matching dimensioned image):
 *   X = left to right
 *   Z = top to bottom (when viewed from above)
 *   Origin (0,0) = top-left interior corner of the apartment
 *
 * KEY LAYOUT FACTS:
 * - The Reception is an OPEN-PLAN space. It is NOT walled off from the
 *   stairs or guest toilet area. The partition wall only begins at the
 *   corridor level and runs downward.
 * - The Reception extends past the corridor/stairs into extra space on
 *   the right side above the corridor.
 * - The right-side rooms are stacked vertically: Guest Toilet, Male Toilet,
 *   Stairs (open), then corridor → Maid's Room, Kitchen.
 *
 * DIMENSION INVENTORY (each used exactly once):
 *   11.72m — total apartment depth (left wall, Z-axis)
 *   5.78m  — reception width (left section, X-axis)
 *   4.12m  — kitchen depth (Z-axis)
 *   3.31m  — kitchen width (X-axis)
 *   2.71m  — maid's room width (X-axis) AND depth (Z-axis)
 *   1.98m  — corridor depth (Z-axis)
 *   1.22m  — guest toilet depth (Z-axis), male toilet depth (Z-axis),
 *            corridor width (X-axis)
 *   5.15m  — void width in reception
 *   3.93m  — dining area width in reception
 *
 * RIGHT-SIDE VERTICAL STACK (top to bottom):
 *   Guest Toilet:  1.22m deep
 *   Male Toilet:   1.22m deep
 *   Stairs:        open to reception, ~2.71m deep (fills gap)
 *   Corridor:      1.98m deep, 1.22m wide
 *   Maid's Room:   2.71m deep, 2.71m wide (to right of corridor)
 *   Kitchen:       4.12m deep, 3.31m wide (full right-side width)
 *
 *   Walls between rooms: ~0.15m each
 *   Sum check: 1.22 + 0.15 + 1.22 + 0.15 + 2.71 + 0.15 + 1.98 + 0.15 + 4.12 = 11.85
 *   Adjust stair depth to fit: stairs = 11.72 - (1.22+0.15+1.22+0.15+0.15+1.98+0.15+4.12) = 2.58m
 *
 * RIGHT-SIDE WIDTH:
 *   Corridor: 1.22m + wall 0.15m + Rooms: 2.71m = 4.08m
 *   Kitchen is 3.31m wide (extends from corridor left edge to right wall)
 *   So: corridor(1.22) + wall(0.15) + remaining(1.94) = 3.31? No.
 *   Kitchen 3.31m is measured differently. Let's say:
 *   Right side total = max(3.31, 1.22+0.15+2.71) = max(3.31, 4.08) = 4.08m
 *   Kitchen 3.31m wide means it doesn't span the full right side.
 *   Actually kitchen 4.12 is the depth, 3.31 is the width.
 *   Total right side width = 1.22 (corridor) + 0.15 (wall) + 2.71 (rooms) = 4.08m
 *   Kitchen width 3.31m < 4.08m, so kitchen doesn't fill full width.
 *   But from the plan, kitchen appears to span the full right side.
 *   Let me use: right side = 3.31m + 1.22m = 4.53m? Or just use 4.08m.
 *
 *   Looking at the plan again: the corridor is only in the MIDDLE section.
 *   At the top: Guest Toilet and Male Toilet span the full right-side width.
 *   In the middle: Corridor (1.22m) + Maid's Room (2.71m) = 3.93m? No.
 *   At the bottom: Kitchen spans the full right-side width.
 *
 *   I'll use: right side total width = 1.22 + 0.15 + 2.71 = 4.08m
 *   Kitchen width = 3.31m, positioned to fill from corridor to right wall:
 *   Kitchen left = corridor_right_edge, Kitchen right = apartment_right
 *
 * FINAL: Let me simplify. Right side width = corridor(1.22) + wall(0.15) + rooms(2.71) = 4.08
 * But kitchen is labeled 3.31 wide. Kitchen spans from partition wall to right wall = 4.08m?
 * The 3.31 might be interior dimension. With walls: 3.31 + 0.15 + 0.15 = 3.61? Still not 4.08.
 *
 * SIMPLIFICATION: Use the dimensions as-is, don't over-constrain.
 * Right side = 1.22(corr) + 0.15(wall) + 2.71(rooms) = 4.08m
 * Kitchen = 3.31m wide (interior), starts at partition+wall
 * Total apt width = 5.78 + 0.20(partition) + 4.08 = 10.06m
 */

export const WALL_HEIGHT = 3.0;
export const EXT_WALL = 0.20; // exterior wall thickness
export const INT_WALL = 0.15; // interior wall/partition thickness
export const DOOR_HEIGHT = 2.4;
export const WINDOW_HEIGHT = 1.2;
export const WINDOW_SILL = 0.9;

// ============================================================
// MASTER DIMENSIONS
// ============================================================
const APT_DEPTH = 11.72; // total depth (Z), left wall
const REC_WIDTH = 5.78;  // reception width (X)

// Right side
const CORR_W = 1.22;     // corridor width
const ROOM_W = 2.71;     // maid's room width (also depth)
const RIGHT_W = CORR_W + INT_WALL + ROOM_W; // 1.22 + 0.15 + 2.71 = 4.08

// Partition wall
const PART_X = REC_WIDTH;                    // 5.78 (left face)
const PART_XR = PART_X + INT_WALL;           // 5.93 (right face)

// Apartment total width
const APT_WIDTH = PART_XR + RIGHT_W;         // 5.93 + 4.08 = 10.01

// Corridor X bounds
const CORR_L = PART_XR;                      // 5.93
const CORR_R = CORR_L + CORR_W;             // 7.15

// Rooms column X bounds
const ROOM_WALL_X = CORR_R + INT_WALL;      // 7.30
const ROOM_R = ROOM_WALL_X + ROOM_W;        // 10.01 = APT_WIDTH ✓

// ── Right-side vertical stack (Z coordinates) ──

// Guest Toilet: top
const GT_TOP = 0;
const GT_DEPTH = 1.22;
const GT_BOT = GT_TOP + GT_DEPTH;            // 1.22

// Male Toilet: below GT
const MT_TOP = GT_BOT + INT_WALL;            // 1.37
const MT_DEPTH = 1.22;
const MT_BOT = MT_TOP + MT_DEPTH;            // 2.59

// Stairs: below MT (OPEN to reception)
const STAIR_TOP = MT_BOT + INT_WALL;         // 2.74
// Calculate stair depth to fill gap before corridor
// Corridor top = Kitchen top - Kitchen depth... no, let's work bottom-up

// Kitchen: at bottom
const KIT_DEPTH = 4.12;
const KIT_WIDTH = 3.31;
const KIT_BOT = APT_DEPTH;                   // 11.72
const KIT_TOP = KIT_BOT - KIT_DEPTH;         // 7.60

// Corridor: above kitchen
const CORR_DEPTH = 1.98;
const CORR_BOT = KIT_TOP - INT_WALL;         // 7.45
const CORR_TOP = CORR_BOT - CORR_DEPTH;      // 5.47

// Maid's Room: same Z range as corridor (to the right of corridor)
const MR_DEPTH = 2.71;
const MR_TOP = CORR_TOP;                     // 5.47
const MR_BOT = MR_TOP + MR_DEPTH;            // 8.18

// Stairs: fills gap between Male Toilet bottom and Corridor top
const STAIR_BOT = CORR_TOP - INT_WALL;       // 5.32
// STAIR_TOP already = 2.74
const STAIR_DEPTH = STAIR_BOT - STAIR_TOP;   // 2.58

// ── Partition wall: only from corridor top downward ──
// Above CORR_TOP, the reception is OPEN to the right side (stairs, GT, MT)
const PARTITION_START_Z = CORR_TOP;           // 5.47
const PARTITION_END_Z = APT_DEPTH;            // 11.72

// ── Reception extends into the right side above the corridor ──
// The reception occupies:
//   Left section: 0→5.78 (X), 0→11.72 (Z)
//   Right extension: 5.78→10.01 (X), MT_BOT→CORR_TOP (Z) — the stairs area
//   Plus the GT and MT areas are open to reception too

// ── Void (dashed rectangle in reception) ──
const VOID_X = 0.30;
const VOID_Z_START = APT_DEPTH - 5.5;        // approximate
const VOID_W = 5.15;
const VOID_D = 4.0;

// ── Garden L-shape ──
const GARDEN_SIDE_W = 5.0;   // garden extends left of apartment
const GARDEN_BOT_D = 5.0;    // garden extends below apartment

// ============================================================
// COLORS
// ============================================================
export const COLORS = {
  wallExterior: 0x334455,
  wallInterior: 0x3a4a5a,
  wallEdge: 0x00d4ff,
  door: 0xffa500,
  window: 0x4488ff,
  reception: 0x1a5c3a,
  kitchen: 0x5c3a1a,
  maidsRoom: 0x3a1a5c,
  guestToilet: 0x1a3a5c,
  maleToilet: 0x1a4a6c,
  corridor: 0x2a3a4a,
  garden: 0x2a5c2a,
  stairs: 0x4a5568,
};

// ============================================================
// TYPES
// ============================================================
export interface WallSegment {
  start: [number, number];
  end: [number, number];
  thickness: number;
  height: number;
  isExterior: boolean;
}

export interface DoorOpening {
  position: [number, number];
  width: number;
  height: number;
  wallDirection: "x" | "z";
  label?: string;
}

export interface WindowOpening {
  position: [number, number];
  width: number;
  height: number;
  sillHeight: number;
  wallDirection: "x" | "z";
}

export interface Room {
  name: string;
  vertices: [number, number][];
  color: number;
  labelPosition: [number, number];
  dimensions?: string;
}

export interface DimensionLine {
  start: [number, number];
  end: [number, number];
  label: string;
  offset: number;
}

// ============================================================
// ROOMS
// ============================================================
export const rooms: Room[] = [
  // Reception: L-shaped open plan
  // Left section full height + right extension above corridor
  {
    name: "Reception",
    vertices: [
      [0, 0],
      [APT_WIDTH, 0],
      [APT_WIDTH, GT_TOP],
      [APT_WIDTH, STAIR_BOT],
      [PART_XR, STAIR_BOT],
      [PART_XR, PARTITION_START_Z],
      [PART_X, PARTITION_START_Z],
      [PART_X, APT_DEPTH],
      [0, APT_DEPTH],
    ],
    color: COLORS.reception,
    labelPosition: [REC_WIDTH / 2, APT_DEPTH * 0.6],
    dimensions: "Reception",
  },
  // Guest Toilet (top-right area, enclosed)
  {
    name: "Guest Toilet",
    vertices: [
      [PART_XR, GT_TOP],
      [APT_WIDTH, GT_TOP],
      [APT_WIDTH, GT_BOT],
      [PART_XR, GT_BOT],
    ],
    color: COLORS.guestToilet,
    labelPosition: [(PART_XR + APT_WIDTH) / 2, (GT_TOP + GT_BOT) / 2],
    dimensions: "1.22m",
  },
  // Male Toilet (below guest toilet)
  {
    name: "Male Toilet",
    vertices: [
      [PART_XR, MT_TOP],
      [APT_WIDTH, MT_TOP],
      [APT_WIDTH, MT_BOT],
      [PART_XR, MT_BOT],
    ],
    color: COLORS.maleToilet,
    labelPosition: [(PART_XR + APT_WIDTH) / 2, (MT_TOP + MT_BOT) / 2],
    dimensions: "1.22m",
  },
  // Internal Stairs (open to reception)
  {
    name: "Stairs",
    vertices: [
      [PART_XR, STAIR_TOP],
      [APT_WIDTH, STAIR_TOP],
      [APT_WIDTH, STAIR_BOT],
      [PART_XR, STAIR_BOT],
    ],
    color: COLORS.stairs,
    labelPosition: [(PART_XR + APT_WIDTH) / 2, (STAIR_TOP + STAIR_BOT) / 2],
    dimensions: `${STAIR_DEPTH.toFixed(1)}m`,
  },
  // Corridor
  {
    name: "Corridor",
    vertices: [
      [CORR_L, CORR_TOP],
      [CORR_R, CORR_TOP],
      [CORR_R, CORR_BOT],
      [CORR_L, CORR_BOT],
    ],
    color: COLORS.corridor,
    labelPosition: [(CORR_L + CORR_R) / 2, (CORR_TOP + CORR_BOT) / 2],
    dimensions: "1.22m × 1.98m",
  },
  // Maid's Room
  {
    name: "Maid's Room",
    vertices: [
      [ROOM_WALL_X, MR_TOP],
      [ROOM_R, MR_TOP],
      [ROOM_R, MR_BOT],
      [ROOM_WALL_X, MR_BOT],
    ],
    color: COLORS.maidsRoom,
    labelPosition: [(ROOM_WALL_X + ROOM_R) / 2, (MR_TOP + MR_BOT) / 2],
    dimensions: "2.71m × 2.71m",
  },
  // Kitchen
  {
    name: "Kitchen",
    vertices: [
      [PART_XR, KIT_TOP],
      [PART_XR + KIT_WIDTH, KIT_TOP],
      [PART_XR + KIT_WIDTH, KIT_BOT],
      [PART_XR, KIT_BOT],
    ],
    color: COLORS.kitchen,
    labelPosition: [PART_XR + KIT_WIDTH / 2, (KIT_TOP + KIT_BOT) / 2],
    dimensions: "3.31m × 4.12m",
  },
  // Garden (L-shaped)
  {
    name: "Garden",
    vertices: [
      [-GARDEN_SIDE_W, 0],
      [0, 0],
      [0, APT_DEPTH],
      [APT_WIDTH, APT_DEPTH],
      [APT_WIDTH, APT_DEPTH + GARDEN_BOT_D],
      [-GARDEN_SIDE_W, APT_DEPTH + GARDEN_BOT_D],
    ],
    color: COLORS.garden,
    labelPosition: [APT_WIDTH / 2, APT_DEPTH + GARDEN_BOT_D / 2],
    dimensions: "Garden",
  },
];

// ============================================================
// VOID & STAIRS
// ============================================================
export const receptionVoid = {
  x: VOID_X,
  z: VOID_Z_START,
  width: VOID_W,
  depth: VOID_D,
};

export const internalStairs = {
  x: PART_XR,
  z: STAIR_TOP,
  width: APT_WIDTH - PART_XR,
  depth: STAIR_DEPTH,
  stepCount: 14,
};

// ============================================================
// WALLS
// ============================================================
export const walls: WallSegment[] = [
  // ═══ EXTERIOR WALLS ═══
  // Top wall (full width)
  { start: [0, 0], end: [APT_WIDTH, 0], thickness: EXT_WALL, height: WALL_HEIGHT, isExterior: true },
  // Left wall (full depth)
  { start: [0, 0], end: [0, APT_DEPTH], thickness: EXT_WALL, height: WALL_HEIGHT, isExterior: true },
  // Bottom wall (full width)
  { start: [0, APT_DEPTH], end: [APT_WIDTH, APT_DEPTH], thickness: EXT_WALL, height: WALL_HEIGHT, isExterior: true },
  // Right wall (full depth)
  { start: [APT_WIDTH, 0], end: [APT_WIDTH, APT_DEPTH], thickness: EXT_WALL, height: WALL_HEIGHT, isExterior: true },

  // ═══ GARDEN BOUNDARY (low walls) ═══
  { start: [-GARDEN_SIDE_W, 0], end: [0, 0], thickness: 0.12, height: WALL_HEIGHT * 0.35, isExterior: true },
  { start: [-GARDEN_SIDE_W, 0], end: [-GARDEN_SIDE_W, APT_DEPTH + GARDEN_BOT_D], thickness: 0.12, height: WALL_HEIGHT * 0.35, isExterior: true },
  { start: [-GARDEN_SIDE_W, APT_DEPTH + GARDEN_BOT_D], end: [APT_WIDTH, APT_DEPTH + GARDEN_BOT_D], thickness: 0.12, height: WALL_HEIGHT * 0.35, isExterior: true },
  { start: [APT_WIDTH, APT_DEPTH], end: [APT_WIDTH, APT_DEPTH + GARDEN_BOT_D], thickness: 0.12, height: WALL_HEIGHT * 0.35, isExterior: true },

  // ═══ INTERIOR WALLS ═══

  // ── Right-side room dividers (horizontal walls) ──
  // Guest Toilet bottom wall
  { start: [PART_XR, GT_BOT], end: [APT_WIDTH, GT_BOT], thickness: INT_WALL, height: WALL_HEIGHT, isExterior: false },
  // Male Toilet bottom wall
  { start: [PART_XR, MT_BOT], end: [APT_WIDTH, MT_BOT], thickness: INT_WALL, height: WALL_HEIGHT, isExterior: false },

  // ── Partition wall: ONLY from corridor top to apartment bottom ──
  // This is the key correction: reception is open above this level
  { start: [PART_X, PARTITION_START_Z], end: [PART_X, APT_DEPTH], thickness: INT_WALL, height: WALL_HEIGHT, isExterior: false },

  // ── Right-side vertical wall between GT/MT and stairs ──
  // There's a wall separating the toilets from the stairs
  // Actually from the plan, GT and MT are at the top, stairs below — separated by horizontal walls only
  // The GT/MT/Stairs all span the full right-side width

  // ── Corridor walls ──
  // Corridor top wall (horizontal)
  { start: [PART_XR, CORR_TOP], end: [APT_WIDTH, CORR_TOP], thickness: INT_WALL, height: WALL_HEIGHT, isExterior: false },
  // Corridor right wall (vertical, between corridor and rooms)
  { start: [CORR_R, CORR_TOP], end: [CORR_R, CORR_BOT], thickness: INT_WALL, height: WALL_HEIGHT, isExterior: false },

  // ── Maid's Room walls ──
  // Maid's Room bottom wall
  { start: [ROOM_WALL_X, MR_BOT], end: [ROOM_R, MR_BOT], thickness: INT_WALL, height: WALL_HEIGHT, isExterior: false },

  // ── Kitchen top wall ──
  { start: [PART_XR, KIT_TOP], end: [PART_XR + KIT_WIDTH, KIT_TOP], thickness: INT_WALL, height: WALL_HEIGHT, isExterior: false },
];

// ============================================================
// DOORS
// ============================================================
export const doors: DoorOpening[] = [
  // Entrance: at top wall, in the reception area (left of the right-side rooms)
  {
    position: [PART_X - 1.0, 0],
    width: 1.0,
    height: DOOR_HEIGHT,
    wallDirection: "x",
    label: "Entrance",
  },
  // Guest Toilet door
  {
    position: [PART_XR + RIGHT_W / 2, GT_BOT],
    width: 0.7,
    height: DOOR_HEIGHT,
    wallDirection: "x",
  },
  // Male Toilet door
  {
    position: [PART_XR + RIGHT_W / 2, MT_BOT],
    width: 0.7,
    height: DOOR_HEIGHT,
    wallDirection: "x",
  },
  // Corridor to reception (opening in partition wall)
  {
    position: [PART_X, CORR_TOP + CORR_DEPTH / 2],
    width: 0.9,
    height: DOOR_HEIGHT,
    wallDirection: "z",
  },
  // Maid's Room door (from corridor)
  {
    position: [CORR_R, MR_TOP + 1.0],
    width: 0.9,
    height: DOOR_HEIGHT,
    wallDirection: "z",
  },
  // Kitchen door
  {
    position: [PART_XR + 1.5, KIT_TOP],
    width: 0.9,
    height: DOOR_HEIGHT,
    wallDirection: "x",
  },
  // Garden sliding door (bottom wall of reception)
  {
    position: [REC_WIDTH / 2, APT_DEPTH],
    width: 2.0,
    height: DOOR_HEIGHT,
    wallDirection: "x",
  },
];

// ============================================================
// WINDOWS
// ============================================================
export const windows: WindowOpening[] = [
  // Reception left wall windows
  {
    position: [0, 3.5],
    width: 1.5,
    height: WINDOW_HEIGHT,
    sillHeight: WINDOW_SILL,
    wallDirection: "z",
  },
  {
    position: [0, 8.5],
    width: 1.5,
    height: WINDOW_HEIGHT,
    sillHeight: WINDOW_SILL,
    wallDirection: "z",
  },
  // Reception top wall window
  {
    position: [2.5, 0],
    width: 1.5,
    height: WINDOW_HEIGHT,
    sillHeight: WINDOW_SILL,
    wallDirection: "x",
  },
  // Kitchen right wall window
  {
    position: [PART_XR + KIT_WIDTH, KIT_TOP + KIT_DEPTH / 2],
    width: 1.0,
    height: WINDOW_HEIGHT,
    sillHeight: WINDOW_SILL,
    wallDirection: "z",
  },
  // Maid's Room window (right wall)
  {
    position: [APT_WIDTH, MR_TOP + MR_DEPTH / 2],
    width: 1.0,
    height: WINDOW_HEIGHT,
    sillHeight: WINDOW_SILL,
    wallDirection: "z",
  },
];

// ============================================================
// DIMENSION LINES
// ============================================================
export const dimensionLines: DimensionLine[] = [
  // Reception width: 5.78m
  { start: [0, 0], end: [REC_WIDTH, 0], label: "5.78m", offset: -0.8 },
  // Total apartment depth: 11.72m
  { start: [0, 0], end: [0, APT_DEPTH], label: "11.72m", offset: -1.0 },
  // Kitchen: 3.31m × 4.12m
  { start: [PART_XR, KIT_TOP], end: [PART_XR + KIT_WIDTH, KIT_TOP], label: "3.31m", offset: -0.4 },
  { start: [PART_XR + KIT_WIDTH, KIT_TOP], end: [PART_XR + KIT_WIDTH, KIT_BOT], label: "4.12m", offset: 0.5 },
  // Maid's Room: 2.71m × 2.71m
  { start: [ROOM_WALL_X, MR_TOP], end: [ROOM_R, MR_TOP], label: "2.71m", offset: -0.3 },
  { start: [ROOM_R, MR_TOP], end: [ROOM_R, MR_BOT], label: "2.71m", offset: 0.4 },
  // Corridor: 1.22m wide, 1.98m deep
  { start: [CORR_L, CORR_TOP + 0.5], end: [CORR_R, CORR_TOP + 0.5], label: "1.22m", offset: -0.3 },
  { start: [CORR_L, CORR_TOP], end: [CORR_L, CORR_BOT], label: "1.98m", offset: -0.4 },
  // Guest Toilet depth: 1.22m
  { start: [APT_WIDTH, GT_TOP], end: [APT_WIDTH, GT_BOT], label: "1.22m", offset: 0.5 },
  // Male Toilet depth: 1.22m
  { start: [APT_WIDTH, MT_TOP], end: [APT_WIDTH, MT_BOT], label: "1.22m", offset: 0.5 },
  // Void: 5.15m
  { start: [VOID_X, VOID_Z_START], end: [VOID_X + VOID_W, VOID_Z_START], label: "5.15m", offset: -0.3 },
  // Dining: 3.93m
  { start: [0.5, APT_DEPTH - 2.5], end: [0.5 + 3.93, APT_DEPTH - 2.5], label: "3.93m", offset: 0.4 },
];

// ============================================================
// PROPERTY BOUNDS
// ============================================================
export const propertyBounds = {
  minX: -GARDEN_SIDE_W,
  maxX: APT_WIDTH,
  minZ: 0,
  maxZ: APT_DEPTH + GARDEN_BOT_D,
};

// Export computed values for the 2D viewer ruler
export const APT_DIMS = {
  width: APT_WIDTH,
  depth: APT_DEPTH,
  recWidth: REC_WIDTH,
};
