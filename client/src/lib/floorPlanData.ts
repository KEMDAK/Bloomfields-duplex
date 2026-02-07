/**
 * Floor Plan Data - Type DU1 Ground Floor
 * CORRECTED based on user annotations (Round 3)
 * 
 * All dimensions in meters, true to scale.
 * 
 * Coordinate system:
 *   X = left to right (west to east)
 *   Z = top to bottom (north to south) when viewed from above
 *   Origin (0,0) = top-left interior corner of the apartment
 *
 * CORRECTED LAYOUT (top-down view):
 * 
 * ┌─────────────────────────┬─────────────────────┐  Z=0
 * │                         │                     │
 * │   Top Section           │   Entrance (door    │
 * │   (counter/utility)     │   with arc, marker3)│
 * │   5.78m wide            │                     │
 * ├─────────────────────────┼──────┬──────────────┤  Z≈2.0
 * │                         │      │  Guest       │
 * │                         │      │  Toilet      │
 * │                         │      │  1.22×1.22   │
 * │                         │      ├──────────────┤  Z≈3.5
 * │                         │      │              │
 * │                         │corr  │  Internal    │
 * │   Reception             │1.22  │  Stairs      │
 * │   (with dashed void)    │      │  (marker 1)  │
 * │                         │      │              │
 * │   11.72 - 2.0 = 9.72   │      ├──────────────┤  Z≈5.5
 * │   deep                  │      │              │
 * │                         │      │  Maid's Room │
 * │                         │      │  2.71×2.71   │
 * │                         │      │              │
 * │                         │      ├──────────────┤  Z≈8.4
 * │  ┌─────────────┐        │      │              │
 * │  │ dining 3.93 │        │      │              │
 * │  └─────────────┘        ├──────┤  Kitchen     │
 * │                         │      │  4.12×3.31   │
 * │                         │      │              │
 * └─────────────────────────┴──────┴──────────────┘  Z=11.72
 * 
 * Garden is L-shaped: LEFT side + BOTTOM of apartment
 * External staircase (marker 4) is NOT rendered
 *
 * KEY DIMENSIONS FROM PLAN:
 *   5.78  = Width of top section / reception
 *   11.72 = Full apartment depth (north to south)
 *   5.15  = Dimension in reception (NOT stairs - likely void width)
 *   3.93  = Dining area width
 *   4.12  = Kitchen width (full right-side width)
 *   3.31  = Kitchen depth
 *   2.71  = Maid's room width & depth
 *   1.22  = Corridor width / guest toilet dimension
 *   1.98  = Various passage/room depths
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
  topSection: 0x2a4a5c,
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

// ============================================================
// PRECISE COORDINATES (all in meters)
// ============================================================

// Full apartment envelope
const APT_W = 10.10;  // total width
const APT_D = 11.72;  // total depth

// ── Top Section (the missing area from marker 2) ──
// This is a room/utility area at the very top of the apartment
// It spans the width of the reception (5.78m) and is about 2m deep
// Contains what appears to be a counter with two sinks
const TOP_SECTION_D = 2.0;  // depth of top section

// ── Reception ──
// Below the top section, on the left side
const REC_W = 5.78;   // interior width
const REC_TOP = TOP_SECTION_D;  // starts below top section
const REC_BOTTOM = APT_D;       // extends to bottom of apartment
const REC_D = REC_BOTTOM - REC_TOP; // ~9.72m

// ── Partition wall (separates left from right) ──
const PART_X = REC_W;  // 5.78 (left face of partition wall)
const PART_X_INNER = PART_X + WALL_THICKNESS; // 5.98

// ── Right side layout ──
// The right side contains: corridor + rooms
// Total right-side width = APT_W - PART_X_INNER = 4.12m

// Corridor (vertical passage)
const CORR_W = 1.22;
const CORR_LEFT = PART_X_INNER; // 5.98
const CORR_RIGHT = CORR_LEFT + CORR_W; // 7.20

// Room divider wall X position
const ROOM_WALL_X = CORR_RIGHT + WALL_THICKNESS; // 7.40

// ── Guest Toilet (top of right side, below top section) ──
const GT_TOP = TOP_SECTION_D;  // 2.0
const GT_D = 1.50;  // ~1.5m deep (1.22 + some passage)
const GT_BOTTOM = GT_TOP + GT_D; // 3.5

// ── Internal Stairs (marker 1 — between guest toilet and maid's room) ──
// Located on the right side, in the rooms column (not corridor)
const STAIR_TOP = GT_BOTTOM + WALL_THICKNESS; // 3.7
const STAIR_D = 1.98;  // depth of stair area
const STAIR_BOTTOM = STAIR_TOP + STAIR_D; // 5.68
const STAIR_LEFT = ROOM_WALL_X; // 7.40
const STAIR_RIGHT = APT_W; // 10.10
const STAIR_W = STAIR_RIGHT - STAIR_LEFT; // 2.70

// ── Maid's Room (below stairs) ──
const MR_TOP = STAIR_BOTTOM + WALL_THICKNESS; // 5.88
const MR_W = 2.71;
const MR_D = 2.71;
const MR_LEFT = ROOM_WALL_X; // 7.40
const MR_RIGHT = MR_LEFT + MR_W; // 10.11 ≈ APT_W
const MR_BOTTOM = MR_TOP + MR_D; // 8.59

// ── Kitchen (bottom-right) ──
const KIT_W = 4.12;
const KIT_D = 3.31;
const KIT_BOTTOM = APT_D; // 11.72
const KIT_TOP = KIT_BOTTOM - KIT_D; // 8.41
const KIT_LEFT = PART_X_INNER; // 5.98
const KIT_RIGHT = KIT_LEFT + KIT_W; // 10.10 = APT_W

// ── Corridor extent ──
const CORR_TOP = GT_TOP; // 2.0
const CORR_BOTTOM = KIT_TOP; // 8.41

// ── Dashed void in reception (NOT stairs) ──
// This is the dashed rectangle visible in the reception
// Likely a double-height void or terrace opening
const VOID_X = 0.50;
const VOID_Z = REC_TOP + 1.0; // starts 1m below reception top
const VOID_W = 5.15;
const VOID_D = 6.5;

// ── Garden L-shape ──
const GARDEN_LEFT_STRIP_W = 5.0;
const GARDEN_BOTTOM_STRIP_D = 5.0;

// ============================================================
// ROOMS
// ============================================================
export const rooms: Room[] = [
  {
    name: "Top Section",
    vertices: [
      [0, 0],
      [PART_X, 0],
      [PART_X, TOP_SECTION_D],
      [0, TOP_SECTION_D],
    ],
    color: COLORS.topSection,
    labelPosition: [REC_W / 2, TOP_SECTION_D / 2],
    dimensions: "5.78m × 2.0m",
  },
  {
    name: "Reception",
    vertices: [
      [0, REC_TOP],
      [REC_W, REC_TOP],
      [REC_W, REC_BOTTOM],
      [0, REC_BOTTOM],
    ],
    color: COLORS.reception,
    labelPosition: [REC_W / 2, REC_TOP + REC_D / 2],
    dimensions: `5.78m × ${REC_D.toFixed(1)}m`,
  },
  {
    name: "Entrance",
    vertices: [
      [PART_X_INNER, 0],
      [APT_W, 0],
      [APT_W, TOP_SECTION_D],
      [PART_X_INNER, TOP_SECTION_D],
    ],
    color: COLORS.corridor,
    labelPosition: [PART_X_INNER + (APT_W - PART_X_INNER) / 2, TOP_SECTION_D / 2],
    dimensions: "Entrance",
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
    labelPosition: [PART_X_INNER + (APT_W - PART_X_INNER) / 2, GT_TOP + GT_D / 2],
    dimensions: "Guest Toilet",
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
    name: "Internal Stairs",
    vertices: [
      [STAIR_LEFT, STAIR_TOP],
      [STAIR_RIGHT, STAIR_TOP],
      [STAIR_RIGHT, STAIR_BOTTOM],
      [STAIR_LEFT, STAIR_BOTTOM],
    ],
    color: COLORS.stairs,
    labelPosition: [STAIR_LEFT + STAIR_W / 2, STAIR_TOP + STAIR_D / 2],
    dimensions: `${STAIR_W.toFixed(1)}m × ${STAIR_D.toFixed(1)}m`,
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
      [-GARDEN_LEFT_STRIP_W, 0],
      [0, 0],
      [0, APT_D],
      [APT_W, APT_D],
      [APT_W, APT_D + GARDEN_BOTTOM_STRIP_D],
      [-GARDEN_LEFT_STRIP_W, APT_D + GARDEN_BOTTOM_STRIP_D],
    ],
    color: COLORS.garden,
    labelPosition: [-GARDEN_LEFT_STRIP_W / 2, APT_D + GARDEN_BOTTOM_STRIP_D / 2],
    dimensions: "Garden",
  },
];

// Dashed void in reception (NOT stairs)
export const receptionVoid = {
  x: VOID_X,
  z: VOID_Z,
  width: VOID_W,
  depth: VOID_D,
};

// Internal staircase (on the right side)
export const internalStairs = {
  x: STAIR_LEFT,
  z: STAIR_TOP,
  width: STAIR_W,
  depth: STAIR_D,
  stepCount: 12,
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

  // Top section bottom wall (horizontal, separates top section from reception)
  { start: [0, TOP_SECTION_D], end: [PART_X, TOP_SECTION_D], thickness: WALL_THICKNESS, height: WALL_HEIGHT, isExterior: false },

  // Main partition: left | right (at X = 5.78, from top to bottom)
  { start: [PART_X, 0], end: [PART_X, APT_D], thickness: WALL_THICKNESS, height: WALL_HEIGHT, isExterior: false },

  // Top section / entrance divider (horizontal at Z = TOP_SECTION_D on right side)
  { start: [PART_X_INNER, TOP_SECTION_D], end: [APT_W, TOP_SECTION_D], thickness: WALL_THICKNESS, height: WALL_HEIGHT, isExterior: false },

  // Guest toilet bottom wall
  { start: [PART_X_INNER, GT_BOTTOM], end: [APT_W, GT_BOTTOM], thickness: WALL_THICKNESS, height: WALL_HEIGHT, isExterior: false },

  // Corridor right wall (between corridor and rooms)
  { start: [CORR_RIGHT, CORR_TOP], end: [CORR_RIGHT, CORR_BOTTOM], thickness: WALL_THICKNESS, height: WALL_HEIGHT, isExterior: false },

  // Stairs top wall
  { start: [ROOM_WALL_X, STAIR_TOP], end: [APT_W, STAIR_TOP], thickness: WALL_THICKNESS, height: WALL_HEIGHT, isExterior: false },
  // Stairs bottom wall
  { start: [ROOM_WALL_X, STAIR_BOTTOM], end: [APT_W, STAIR_BOTTOM], thickness: WALL_THICKNESS, height: WALL_HEIGHT, isExterior: false },

  // Maid's room top wall
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
  // Main entrance (marker 3 — at top-right, door swings into entrance area)
  {
    position: [PART_X_INNER + 1.5, 0],
    width: 1.0,
    height: DOOR_HEIGHT,
    wallDirection: "x",
    label: "Entrance",
  },
  // Door from top section to reception (in the horizontal wall at Z = TOP_SECTION_D)
  {
    position: [REC_W / 2, TOP_SECTION_D],
    width: 1.0,
    height: DOOR_HEIGHT,
    wallDirection: "x",
  },
  // Door from entrance/corridor to guest toilet
  {
    position: [CORR_LEFT + 0.6, GT_BOTTOM],
    width: 0.7,
    height: DOOR_HEIGHT,
    wallDirection: "x",
  },
  // Door to maid's room (from corridor, through left wall)
  {
    position: [ROOM_WALL_X, MR_TOP + 1.0],
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
  // Door from corridor to reception (partition wall)
  {
    position: [PART_X, 5.0],
    width: 1.0,
    height: DOOR_HEIGHT,
    wallDirection: "z",
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
  // Top section — top wall window
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
// DIMENSION LINES (for 2D view)
// ============================================================
export interface DimensionLine {
  start: [number, number];
  end: [number, number];
  label: string;
  offset: number; // perpendicular offset for the line
}

export const dimensionLines: DimensionLine[] = [
  // Top section width: 5.78m
  { start: [0, 0], end: [5.78, 0], label: "5.78m", offset: -0.6 },
  // Full apartment depth: 11.72m
  { start: [0, 0], end: [0, 11.72], label: "11.72m", offset: -0.8 },
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
  // Stair area: 1.98m
  { start: [STAIR_LEFT, STAIR_TOP], end: [STAIR_LEFT, STAIR_BOTTOM], label: "1.98m", offset: -0.3 },
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
