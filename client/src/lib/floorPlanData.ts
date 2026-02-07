/**
 * Floor Plan Data - Type DU1 Ground Floor
 * CORRECTED v4 based on user feedback
 *
 * All dimensions in meters, true to scale.
 *
 * Coordinate system:
 *   X = left to right
 *   Z = top to bottom (when viewed from above)
 *   Origin (0,0) = top-left interior corner of the apartment
 *
 * CORRECTED LAYOUT (top-down):
 *
 * ┌──────────────────────────┬────┬───────────┐  Z=0
 * │                          │    │           │
 * │                          │    │  Stairs   │
 * │                          │    │  1.98m    │
 * │                          │    │           │
 * │                          ├────┼───────────┤  Z=1.98
 * │                          │    │  Guest    │
 * │   RECEPTION              │    │  Toilet   │
 * │   (one large room)       │corr│  ~2.71    │
 * │   5.78m × 11.72m         │1.22│           │
 * │                          │    ├───────────┤  Z≈4.69
 * │   Contains:              │    │           │
 * │   - living area (top)    │    │  Maid's   │
 * │   - seating (middle)     │    │  Room     │
 * │   - dining (bottom)      │    │  2.71×2.71│
 * │   - dashed void          │    │           │
 * │                          │    ├───────────┤  Z≈7.40
 * │                          │    │           │
 * │                          ├────┤  Kitchen  │
 * │                          │    │  4.12×3.31│
 * │                          │    │           │
 * └──────────────────────────┴────┴───────────┘  Z=11.72
 *
 * Entrance door: at top wall, right side (opens into stairs/reception)
 * Garden: L-shaped, left + bottom
 * External staircase: NOT rendered (outside apartment)
 */

export const WALL_HEIGHT = 3.0;
export const WALL_THICKNESS = 0.20;
export const DOOR_HEIGHT = 2.4;
export const DOOR_WIDTH_STANDARD = 0.9;
export const WINDOW_HEIGHT = 1.2;
export const WINDOW_SILL_HEIGHT = 0.9;

export const COLORS = {
  wallExterior: 0x334455,
  wallInterior: 0x3a4a5a,
  wallEdge: 0x00d4ff,
  door: 0xffa500,
  window: 0x4488ff,
  windowGlass: 0x88ccff,
  reception: 0x1a5c3a,
  kitchen: 0x5c3a1a,
  maidsRoom: 0x3a1a5c,
  guestToilet: 0x1a3a5c,
  corridor: 0x2a3a4a,
  garden: 0x2a5c2a,
  stairs: 0x4a5568,
};

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
// PRECISE COORDINATES (all in meters)
// ============================================================

// Apartment envelope
const APT_D = 11.72; // full depth (north to south)

// Reception (left side — one large room, full height)
const REC_W = 5.78;

// Partition wall at X = REC_W
const PART_X = REC_W;
const PART_X_R = PART_X + WALL_THICKNESS; // right face of partition = 5.98

// Right side total width = 4.12m (from kitchen dimension)
const RIGHT_W = 4.12;
const APT_W = PART_X_R + RIGHT_W; // 5.98 + 4.12 = 10.10

// Corridor
const CORR_W = 1.22;
const CORR_LEFT = PART_X_R; // 5.98
const CORR_RIGHT = CORR_LEFT + CORR_W; // 7.20

// Rooms column wall
const ROOM_WALL_X = CORR_RIGHT + WALL_THICKNESS; // 7.40
const ROOM_COL_W = APT_W - ROOM_WALL_X; // 2.70 ≈ 2.71

// ── Internal Stairs (TOP of right column) ──
const STAIR_TOP = 0;
const STAIR_D = 1.98;
const STAIR_BOTTOM = STAIR_TOP + STAIR_D; // 1.98
// Stairs span the full right-side width
const STAIR_LEFT = PART_X_R;
const STAIR_RIGHT = APT_W;

// ── Guest Toilet (below stairs) ──
const GT_TOP = STAIR_BOTTOM + WALL_THICKNESS; // 2.18
const GT_D = 2.31; // to fill the gap: GT_BOTTOM = GT_TOP + GT_D
const GT_BOTTOM = GT_TOP + GT_D; // 4.49

// ── Maid's Room (below guest toilet) ──
const MR_TOP = GT_BOTTOM + WALL_THICKNESS; // 4.69
const MR_W = 2.71;
const MR_D = 2.71;
const MR_LEFT = ROOM_WALL_X; // 7.40
const MR_RIGHT = MR_LEFT + MR_W; // 10.11 ≈ APT_W
const MR_BOTTOM = MR_TOP + MR_D; // 7.40

// ── Kitchen (bottom-right) ──
const KIT_D = 3.31;
const KIT_W = 4.12;
const KIT_BOTTOM = APT_D; // 11.72
const KIT_TOP = KIT_BOTTOM - KIT_D; // 8.41
const KIT_LEFT = PART_X_R; // 5.98
const KIT_RIGHT = KIT_LEFT + KIT_W; // 10.10 = APT_W

// ── Corridor extent ──
const CORR_TOP = STAIR_BOTTOM + WALL_THICKNESS; // 2.18 (starts below stairs)
const CORR_BOTTOM = KIT_TOP; // 8.41

// ── Dashed void in reception ──
const VOID_X = 0.30;
const VOID_Z = 3.0;
const VOID_W = 5.15;
const VOID_D = 6.0;

// ── Garden L-shape ──
const GARDEN_LEFT_W = 5.0;
const GARDEN_BOTTOM_D = 5.0;

// ============================================================
// ROOMS
// ============================================================
export const rooms: Room[] = [
  {
    name: "Reception",
    vertices: [
      [0, 0],
      [REC_W, 0],
      [REC_W, APT_D],
      [0, APT_D],
    ],
    color: COLORS.reception,
    labelPosition: [REC_W / 2, APT_D / 2],
    dimensions: `5.78m × 11.72m`,
  },
  {
    name: "Internal Stairs",
    vertices: [
      [STAIR_LEFT, STAIR_TOP],
      [STAIR_RIGHT, STAIR_TOP],
      [STAIR_RIGHT, STAIR_BOTTOM],
      [STAIR_LEFT, STAIR_BOTTOM],
    ],
    color: COLORS.stairs,
    labelPosition: [(STAIR_LEFT + STAIR_RIGHT) / 2, (STAIR_TOP + STAIR_BOTTOM) / 2],
    dimensions: `${RIGHT_W.toFixed(1)}m × ${STAIR_D}m`,
  },
  {
    name: "Guest Toilet",
    vertices: [
      [PART_X_R, GT_TOP],
      [APT_W, GT_TOP],
      [APT_W, GT_BOTTOM],
      [PART_X_R, GT_BOTTOM],
    ],
    color: COLORS.guestToilet,
    labelPosition: [(PART_X_R + APT_W) / 2, (GT_TOP + GT_BOTTOM) / 2],
    dimensions: `Guest Toilet`,
  },
  {
    name: "Corridor",
    vertices: [
      [CORR_LEFT, CORR_TOP],
      [CORR_RIGHT, CORR_TOP],
      [CORR_RIGHT, CORR_BOTTOM],
      [CORR_LEFT, CORR_BOTTOM],
    ],
    color: COLORS.corridor,
    labelPosition: [CORR_LEFT + CORR_W / 2, (CORR_TOP + CORR_BOTTOM) / 2],
    dimensions: "1.22m wide",
  },
  {
    name: "Maid's Room",
    vertices: [
      [MR_LEFT, MR_TOP],
      [MR_RIGHT, MR_TOP],
      [MR_RIGHT, MR_BOTTOM],
      [MR_LEFT, MR_BOTTOM],
    ],
    color: COLORS.maidsRoom,
    labelPosition: [MR_LEFT + MR_W / 2, MR_TOP + MR_D / 2],
    dimensions: "2.71m × 2.71m",
  },
  {
    name: "Kitchen",
    vertices: [
      [KIT_LEFT, KIT_TOP],
      [KIT_RIGHT, KIT_TOP],
      [KIT_RIGHT, KIT_BOTTOM],
      [KIT_LEFT, KIT_BOTTOM],
    ],
    color: COLORS.kitchen,
    labelPosition: [KIT_LEFT + KIT_W / 2, KIT_TOP + KIT_D / 2],
    dimensions: "4.12m × 3.31m",
  },
  {
    name: "Garden",
    vertices: [
      [-GARDEN_LEFT_W, 0],
      [0, 0],
      [0, APT_D],
      [APT_W, APT_D],
      [APT_W, APT_D + GARDEN_BOTTOM_D],
      [-GARDEN_LEFT_W, APT_D + GARDEN_BOTTOM_D],
    ],
    color: COLORS.garden,
    labelPosition: [-GARDEN_LEFT_W / 2, APT_D + GARDEN_BOTTOM_D / 2],
    dimensions: "Garden",
  },
];

// Dashed void in reception
export const receptionVoid = {
  x: VOID_X,
  z: VOID_Z,
  width: VOID_W,
  depth: VOID_D,
};

// Internal staircase
export const internalStairs = {
  x: STAIR_LEFT,
  z: STAIR_TOP,
  width: STAIR_RIGHT - STAIR_LEFT,
  depth: STAIR_D,
  stepCount: 12,
};

// ============================================================
// WALLS
// ============================================================
export const walls: WallSegment[] = [
  // === EXTERIOR WALLS ===
  // Top wall
  { start: [0, 0], end: [APT_W, 0], thickness: 0.25, height: WALL_HEIGHT, isExterior: true },
  // Left wall
  { start: [0, 0], end: [0, APT_D], thickness: 0.25, height: WALL_HEIGHT, isExterior: true },
  // Bottom wall
  { start: [0, APT_D], end: [APT_W, APT_D], thickness: 0.25, height: WALL_HEIGHT, isExterior: true },
  // Right wall
  { start: [APT_W, 0], end: [APT_W, APT_D], thickness: 0.25, height: WALL_HEIGHT, isExterior: true },

  // === GARDEN BOUNDARY WALLS (low) ===
  { start: [-GARDEN_LEFT_W, 0], end: [-GARDEN_LEFT_W, APT_D + GARDEN_BOTTOM_D], thickness: 0.15, height: WALL_HEIGHT * 0.35, isExterior: true },
  { start: [-GARDEN_LEFT_W, 0], end: [0, 0], thickness: 0.15, height: WALL_HEIGHT * 0.35, isExterior: true },
  { start: [-GARDEN_LEFT_W, APT_D + GARDEN_BOTTOM_D], end: [APT_W, APT_D + GARDEN_BOTTOM_D], thickness: 0.15, height: WALL_HEIGHT * 0.35, isExterior: true },
  { start: [APT_W, APT_D], end: [APT_W, APT_D + GARDEN_BOTTOM_D], thickness: 0.15, height: WALL_HEIGHT * 0.35, isExterior: true },

  // === INTERIOR WALLS ===

  // Main partition wall (left | right, full height)
  { start: [PART_X, 0], end: [PART_X, APT_D], thickness: WALL_THICKNESS, height: WALL_HEIGHT, isExterior: false },

  // Stairs bottom wall (horizontal)
  { start: [PART_X_R, STAIR_BOTTOM], end: [APT_W, STAIR_BOTTOM], thickness: WALL_THICKNESS, height: WALL_HEIGHT, isExterior: false },

  // Guest toilet bottom wall
  { start: [PART_X_R, GT_BOTTOM], end: [APT_W, GT_BOTTOM], thickness: WALL_THICKNESS, height: WALL_HEIGHT, isExterior: false },

  // Corridor right wall (between corridor and rooms column)
  { start: [CORR_RIGHT, CORR_TOP], end: [CORR_RIGHT, CORR_BOTTOM], thickness: WALL_THICKNESS, height: WALL_HEIGHT, isExterior: false },

  // Maid's room top wall (may overlap with GT bottom, but that's fine)
  { start: [ROOM_WALL_X, MR_TOP], end: [MR_RIGHT, MR_TOP], thickness: WALL_THICKNESS, height: WALL_HEIGHT, isExterior: false },

  // Maid's room bottom wall
  { start: [ROOM_WALL_X, MR_BOTTOM], end: [MR_RIGHT, MR_BOTTOM], thickness: WALL_THICKNESS, height: WALL_HEIGHT, isExterior: false },

  // Kitchen top wall
  { start: [KIT_LEFT, KIT_TOP], end: [KIT_RIGHT, KIT_TOP], thickness: WALL_THICKNESS, height: WALL_HEIGHT, isExterior: false },
];

// ============================================================
// DOORS
// ============================================================
export const doors: DoorOpening[] = [
  // Main entrance door (at top wall, right side — marker 3)
  {
    position: [PART_X_R + RIGHT_W / 2, 0],
    width: 1.0,
    height: DOOR_HEIGHT,
    wallDirection: "x",
    label: "Entrance",
  },
  // Door from corridor to reception (in partition wall)
  {
    position: [PART_X, 5.0],
    width: 1.0,
    height: DOOR_HEIGHT,
    wallDirection: "z",
  },
  // Door to guest toilet (from corridor side)
  {
    position: [CORR_LEFT + 0.6, GT_TOP],
    width: 0.7,
    height: DOOR_HEIGHT,
    wallDirection: "x",
  },
  // Door to maid's room (from corridor)
  {
    position: [ROOM_WALL_X, MR_TOP + 1.0],
    width: DOOR_WIDTH_STANDARD,
    height: DOOR_HEIGHT,
    wallDirection: "z",
  },
  // Door to kitchen (from corridor/reception side)
  {
    position: [KIT_LEFT + 1.5, KIT_TOP],
    width: DOOR_WIDTH_STANDARD,
    height: DOOR_HEIGHT,
    wallDirection: "x",
  },
  // Garden sliding door from reception (south/bottom wall)
  {
    position: [2.5, APT_D],
    width: 2.0,
    height: DOOR_HEIGHT,
    wallDirection: "x",
  },
];

// ============================================================
// WINDOWS
// ============================================================
export const windows: WindowOpening[] = [
  // Reception left wall — upper window
  {
    position: [0, 4.0],
    width: 1.5,
    height: WINDOW_HEIGHT,
    sillHeight: WINDOW_SILL_HEIGHT,
    wallDirection: "z",
  },
  // Reception left wall — lower window
  {
    position: [0, 9.0],
    width: 1.5,
    height: WINDOW_HEIGHT,
    sillHeight: WINDOW_SILL_HEIGHT,
    wallDirection: "z",
  },
  // Reception top wall window
  {
    position: [2.5, 0],
    width: 1.5,
    height: WINDOW_HEIGHT,
    sillHeight: WINDOW_SILL_HEIGHT,
    wallDirection: "x",
  },
  // Maid's room — right exterior wall window
  {
    position: [APT_W, MR_TOP + MR_D / 2],
    width: 1.0,
    height: WINDOW_HEIGHT,
    sillHeight: WINDOW_SILL_HEIGHT,
    wallDirection: "z",
  },
  // Kitchen — south wall window
  {
    position: [KIT_LEFT + 2.5, APT_D],
    width: 1.0,
    height: WINDOW_HEIGHT,
    sillHeight: WINDOW_SILL_HEIGHT,
    wallDirection: "x",
  },
];

// ============================================================
// DIMENSION LINES
// ============================================================
export const dimensionLines: DimensionLine[] = [
  // Reception width: 5.78m
  { start: [0, 0], end: [REC_W, 0], label: "5.78m", offset: -0.6 },
  // Full apartment depth: 11.72m
  { start: [0, 0], end: [0, APT_D], label: "11.72m", offset: -0.8 },
  // Kitchen width: 4.12m
  { start: [KIT_LEFT, APT_D], end: [KIT_RIGHT, APT_D], label: "4.12m", offset: 0.5 },
  // Kitchen depth: 3.31m
  { start: [APT_W, KIT_TOP], end: [APT_W, KIT_BOTTOM], label: "3.31m", offset: 0.5 },
  // Maid's room: 2.71m × 2.71m
  { start: [MR_LEFT, MR_TOP], end: [MR_RIGHT, MR_TOP], label: "2.71m", offset: -0.3 },
  { start: [MR_RIGHT, MR_TOP], end: [MR_RIGHT, MR_BOTTOM], label: "2.71m", offset: 0.4 },
  // Corridor width: 1.22m
  { start: [CORR_LEFT, 5.0], end: [CORR_RIGHT, 5.0], label: "1.22m", offset: -0.3 },
  // Dining area: 3.93m
  { start: [0.5, 10.0], end: [4.43, 10.0], label: "3.93m", offset: 0.4 },
  // Reception void: 5.15m
  { start: [VOID_X, VOID_Z], end: [VOID_X + VOID_W, VOID_Z], label: "5.15m", offset: -0.3 },
  // Stair depth: 1.98m
  { start: [APT_W, STAIR_TOP], end: [APT_W, STAIR_BOTTOM], label: "1.98m", offset: 0.5 },
];

// ============================================================
// PROPERTY BOUNDS
// ============================================================
export const propertyBounds = {
  minX: -GARDEN_LEFT_W,
  maxX: APT_W,
  minZ: 0,
  maxZ: APT_D + GARDEN_BOTTOM_D,
};
