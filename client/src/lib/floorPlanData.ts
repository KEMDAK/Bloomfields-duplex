/**
 * Floor Plan Data - Type DU1 Ground Floor (FINAL PRECISE VERSION)
 * 
 * All dimensions in meters, true to scale from the architectural plan.
 * 
 * Coordinate system:
 *   X = left to right (west to east)
 *   Z = top to bottom (north to south) when viewed from above
 *   Y = height (up)
 *   Origin (0,0) = top-left interior corner of the apartment
 *
 * PLAN LAYOUT (as seen looking down):
 * ┌──────────────────────┬────┬──────────┐  Z=0
 * │                      │    │  Guest   │
 * │                      │    │  Toilet  │
 * │  ┌─ ─ ─ ─ ─ ─ ─┐    │    │  1.22    │
 * │  │  Stair void   │   │corr├──────────┤  Z≈2.5
 * │  │  (dashed)     │   │1.22│          │
 * │  │               │   │    │  Maid's  │
 * │  │  5.15m wide   │   │    │  Room    │
 * │  │               │   │    │  2.71    │
 * │  └─ ─ ─ ─ ─ ─ ─┘    │    │          │
 * │                      │    ├──────────┤  Z≈5.2
 * │    Reception         │    │          │
 * │    5.78m wide        │    │  (open   │
 * │    11.72m deep       │    │   area)  │
 * │                      ├────┤          │
 * │                      │              │
 * │  ┌────────────┐      │   Kitchen    │
 * │  │ dining     │      │   4.12×3.31  │
 * │  │ 3.93m wide │      │              │
 * │  └────────────┘      │              │
 * └──────────────────────┴──────────────┘  Z=11.72
 * 
 * Garden is L-shaped: LEFT side + BOTTOM of apartment
 *
 * KEY DIMENSIONS FROM PLAN:
 *   5.78  = Reception width (top portion, between left wall and partition)
 *   11.72 = Full apartment depth (north to south)
 *   5.15  = Width of stair void / reception at stair level
 *   3.93  = Dining area width (near bottom of reception)
 *   4.12  = Kitchen width
 *   3.31  = Kitchen depth
 *   2.71  = Maid's room width & depth
 *   1.22  = Corridor width / guest toilet dimension
 *   1.98  = Various passage depths
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

// ============================================================
// PRECISE COORDINATES (all in meters)
// ============================================================

// Apartment envelope
const APT_W = 10.10;  // 5.78 + 0.20(wall) + 4.12
const APT_D = 11.72;  // full depth

// Reception (left column, full height)
const REC_W = 5.78;   // interior width

// Partition wall X position
const PART_X = REC_W;  // 5.78 (left face of partition wall)
const PART_X_INNER = PART_X + WALL_THICKNESS; // 5.98 (right face = start of corridor/rooms)

// Right side total width = 4.12m (from PART_X_INNER to APT_W)
// This contains: corridor(1.22) + wall(0.20) + rooms(2.70)

// Corridor (vertical passage on right side)
const CORR_W = 1.22;
const CORR_LEFT = PART_X_INNER; // 5.98
const CORR_RIGHT = CORR_LEFT + CORR_W; // 7.20

// Room divider wall
const ROOM_WALL_X = CORR_RIGHT + WALL_THICKNESS; // 7.40

// Guest Toilet (top-right of right side)
// In the plan: labeled "Guest Toilet" with dimensions ~1.22 × 1.22
// Located at the top of the right-side rooms
const GT_TOP = 0;
const GT_D = 1.98; // depth including passage area (1.98m from plan)
const GT_BOTTOM = GT_TOP + GT_D; // 1.98

// Maid's Room (middle-right)
// 2.71m wide × 2.71m deep
const MR_TOP = GT_BOTTOM + WALL_THICKNESS; // 2.18
const MR_W = 2.71;
const MR_D = 2.71;
const MR_LEFT = ROOM_WALL_X; // 7.40
const MR_RIGHT = MR_LEFT + MR_W; // 10.11 ≈ APT_W
const MR_BOTTOM = MR_TOP + MR_D; // 4.89

// Kitchen (bottom-right)
// 4.12m wide × 3.31m deep
const KIT_W = 4.12;
const KIT_D = 3.31;
const KIT_BOTTOM = APT_D; // 11.72
const KIT_TOP = KIT_BOTTOM - KIT_D; // 8.41
const KIT_LEFT = PART_X_INNER; // 5.98 (kitchen spans full right side width)
const KIT_RIGHT = KIT_LEFT + KIT_W; // 10.10 = APT_W

// Corridor vertical extent (between guest toilet and kitchen)
const CORR_TOP = GT_BOTTOM; // 1.98
const CORR_BOTTOM = KIT_TOP; // 8.41

// ── Internal Staircase ──
// The dashed rectangle in the UPPER portion of the reception
// In the plan, it's clearly in the upper-left area where the living room furniture is shown
// The stair void starts near the top of the reception
// 5.15m appears to be the width of the stair void
// The depth spans from near the top wall down through the living area
const STAIR_X = 0.30;          // starts near left wall
const STAIR_Z = 0.80;          // starts below top wall
const STAIR_W = 5.15;          // width = 5.15m (the labeled dimension)
const STAIR_D = 7.0;           // depth of the dashed rectangle (extends down through living area)
const STAIR_TREADS_D = 4.5;    // actual stair treads occupy upper portion

// Garden L-shape
const GARDEN_LEFT_STRIP_W = 5.0;  // garden extends left of apartment
const GARDEN_BOTTOM_STRIP_D = 5.0; // garden extends below apartment

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
    labelPosition: [2.89, 8.5],
    dimensions: "5.78m × 11.72m",
  },
  {
    name: "Guest Toilet",
    vertices: [
      [PART_X_INNER, GT_TOP],
      [APT_W, GT_TOP],
      [APT_W, GT_BOTTOM],
      [PART_X_INNER, GT_BOTTOM],
    ],
    color: COLORS.guestToilet,
    labelPosition: [PART_X_INNER + (APT_W - PART_X_INNER) / 2, GT_D / 2],
    dimensions: "1.22m × 1.22m",
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
    // L-shape: left strip + bottom strip
    vertices: [
      [-GARDEN_LEFT_STRIP_W, 0],
      [0, 0],
      [0, APT_D],
      [APT_W, APT_D],
      [APT_W, APT_D + GARDEN_BOTTOM_STRIP_D],
      [-GARDEN_LEFT_STRIP_W, APT_D + GARDEN_BOTTOM_STRIP_D],
    ],
    color: COLORS.garden,
    labelPosition: [-GARDEN_LEFT_STRIP_W / 2, APT_D / 2],
    dimensions: "Garden",
  },
];

// Internal staircase
export const internalStairs = {
  x: STAIR_X,
  z: STAIR_Z,
  width: STAIR_W,
  depth: STAIR_D,
  treadsDepth: STAIR_TREADS_D,
  stepCount: 16,
};

// ============================================================
// WALLS
// ============================================================
export const walls: WallSegment[] = [
  // === APARTMENT EXTERIOR WALLS ===
  { start: [0, 0], end: [APT_W, 0], thickness: 0.25, height: WALL_HEIGHT, isExterior: true },
  { start: [0, 0], end: [0, APT_D], thickness: 0.25, height: WALL_HEIGHT, isExterior: true },
  { start: [0, APT_D], end: [APT_W, APT_D], thickness: 0.25, height: WALL_HEIGHT, isExterior: true },
  { start: [APT_W, 0], end: [APT_W, APT_D], thickness: 0.25, height: WALL_HEIGHT, isExterior: true },

  // === GARDEN BOUNDARY WALLS (low) ===
  { start: [-GARDEN_LEFT_STRIP_W, 0], end: [-GARDEN_LEFT_STRIP_W, APT_D + GARDEN_BOTTOM_STRIP_D], thickness: 0.15, height: WALL_HEIGHT * 0.35, isExterior: true },
  { start: [-GARDEN_LEFT_STRIP_W, 0], end: [0, 0], thickness: 0.15, height: WALL_HEIGHT * 0.35, isExterior: true },
  { start: [-GARDEN_LEFT_STRIP_W, APT_D + GARDEN_BOTTOM_STRIP_D], end: [APT_W, APT_D + GARDEN_BOTTOM_STRIP_D], thickness: 0.15, height: WALL_HEIGHT * 0.35, isExterior: true },
  { start: [APT_W, APT_D], end: [APT_W, APT_D + GARDEN_BOTTOM_STRIP_D], thickness: 0.15, height: WALL_HEIGHT * 0.35, isExterior: true },

  // === INTERIOR WALLS ===

  // Main partition: reception | right side (at X = 5.78, full height)
  { start: [PART_X, 0], end: [PART_X, APT_D], thickness: WALL_THICKNESS, height: WALL_HEIGHT, isExterior: false },

  // Guest toilet bottom wall (horizontal, at Z = GT_BOTTOM)
  { start: [PART_X_INNER, GT_BOTTOM], end: [APT_W, GT_BOTTOM], thickness: WALL_THICKNESS, height: WALL_HEIGHT, isExterior: false },

  // Corridor right wall (vertical, between corridor and rooms)
  { start: [CORR_RIGHT, CORR_TOP], end: [CORR_RIGHT, CORR_BOTTOM], thickness: WALL_THICKNESS, height: WALL_HEIGHT, isExterior: false },

  // Maid's room top wall
  { start: [MR_LEFT, MR_TOP], end: [MR_RIGHT, MR_TOP], thickness: WALL_THICKNESS, height: WALL_HEIGHT, isExterior: false },
  // Maid's room bottom wall
  { start: [MR_LEFT, MR_BOTTOM], end: [MR_RIGHT, MR_BOTTOM], thickness: WALL_THICKNESS, height: WALL_HEIGHT, isExterior: false },
  // Maid's room left wall
  { start: [MR_LEFT, MR_TOP], end: [MR_LEFT, MR_BOTTOM], thickness: WALL_THICKNESS, height: WALL_HEIGHT, isExterior: false },

  // Kitchen top wall
  { start: [KIT_LEFT, KIT_TOP], end: [KIT_RIGHT, KIT_TOP], thickness: WALL_THICKNESS, height: WALL_HEIGHT, isExterior: false },
];

// ============================================================
// DOORS
// ============================================================
export const doors: DoorOpening[] = [
  // Main entrance (on the partition wall, from corridor to reception)
  {
    position: [PART_X, 5.5],
    width: 1.0,
    height: DOOR_HEIGHT,
    wallDirection: "z",
  },
  // Door to guest toilet (bottom wall of guest toilet)
  {
    position: [CORR_LEFT + 0.6, GT_BOTTOM],
    width: 0.7,
    height: DOOR_HEIGHT,
    wallDirection: "x",
  },
  // Door to maid's room (left wall of maid's room, from corridor)
  {
    position: [MR_LEFT, MR_TOP + 1.0],
    width: DOOR_WIDTH_STANDARD,
    height: DOOR_HEIGHT,
    wallDirection: "z",
  },
  // Door to kitchen (top wall of kitchen)
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
  // Kitchen back door (south wall, to garden)
  {
    position: [KIT_LEFT + 2.5, APT_D],
    width: 0.9,
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
    position: [0, 3.0],
    width: 1.5,
    height: WINDOW_HEIGHT,
    sillHeight: WINDOW_SILL_HEIGHT,
    wallDirection: "z",
  },
  // Reception left wall — lower window
  {
    position: [0, 8.5],
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
  // Guest toilet — right wall small window
  {
    position: [APT_W, GT_D / 2],
    width: 0.6,
    height: 0.6,
    sillHeight: 1.5,
    wallDirection: "z",
  },
];

// ============================================================
// PROPERTY BOUNDS
// ============================================================
export const propertyBounds = {
  minX: -GARDEN_LEFT_STRIP_W,
  maxX: APT_W,
  minZ: 0,
  maxZ: APT_D + GARDEN_BOTTOM_STRIP_D,
};
