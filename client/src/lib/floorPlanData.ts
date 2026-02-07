/**
 * Floor Plan Data — Type DU1 Ground Floor
 * DEFINITIVE v9
 *
 * Coordinate system:
 *   Origin (0,0) = northwest corner of the BUILDING ENVELOPE (top-left)
 *   X = increases to the RIGHT (east)
 *   Z = increases DOWNWARD (south)
 *
 * LAYOUT (looking from above, north at top):
 *
 *   NOTCH +-------+----+----+---------+-----------+
 *   (out) |       | GT | MB | Maid's  |           |
 *         | Stairs|    |    | Room    |  Kitchen  |
 *         |  (U)  +----+----+---------+           |
 *         | (open)| Corridor          |           |
 *         |       |                   +-----------+
 *         +-------+---+                     |
 *         |            |                    |
 *         |  Reception |                    |
 *         |  (open to  |                    |
 *         |   stairs)  |                    |
 *         |            |                    |
 *         +------------+--------------------+
 *
 *   The reception is a wide open space.
 *   The reception's east wall aligns with the right edge of the Maid's Room (PART_X).
 *   Below the corridor, from PART_X to K_X1, there's an exterior wall step.
 *   Kitchen extends further SOUTH (to z=4.12) than the corridor bottom (z=3.35).
 *   Garden is L-shaped: south of apartment + east of kitchen.
 *   Entrance is on the WEST wall near the stairs.
 *   The top-left corner has a NOTCH — the "C" area is outside the apartment.
 *
 * ROOMS:
 *   GT  = Guest Toilet
 *   MB  = Maid's Bathroom
 */

export const WALL_HEIGHT = 3.0;
export const EXT_WALL = 0.20;
export const INT_WALL = 0.15;
export const DOOR_HEIGHT = 2.4;
export const WINDOW_HEIGHT = 1.2;
export const WINDOW_SILL = 0.9;

// ============================================================
// MASTER DIMENSIONS (all in meters, from the plan labels)
// ============================================================

// 5.78m spans from the west wall to the east edge of Maid's Bathroom
// It includes: stairs + wall + GT + wall + MB
const SPAN_578 = 5.78;
const GT_W = 1.22;    // Guest Toilet width
const MB_W = 1.22;    // Maid's Bathroom width

// Stairs width = 5.78 - wall - GT - wall - MB
const STAIR_W = SPAN_578 - INT_WALL - GT_W - INT_WALL - MB_W; // ≈ 3.04

const MR_W = 2.71;    // Maid's Room width
const MR_D = 2.71;    // Maid's Room depth
const KIT_W = 3.31;   // Kitchen width
const KIT_D = 4.12;   // Kitchen depth

const ROOM_D = 1.98;  // Depth of toilet rooms (north-south)
const CORR_D = 1.22;  // Corridor depth (north-south)
const APT_DEPTH = 11.72; // Total apartment depth (west wall, north to south)

// ── Top-left notch ──
// The "C" area at the top-left is OUTSIDE the apartment.
// The notch is approximately the width of half the stair area
// and about 1.5m tall. The apartment's NW corner is indented.
const NOTCH_W = 1.5;  // How far the notch extends to the right from x=0
const NOTCH_H = 1.8;  // How far the notch extends down from z=0

// ── X coordinates of room boundaries ──
const S_X0 = 0;                                               // Stairs left (west wall)
const S_X1 = STAIR_W;                                         // ≈3.04 Stairs right

const GT_X0 = S_X1 + INT_WALL;                                // ≈3.19 Guest Toilet left
const GT_X1 = GT_X0 + GT_W;                                   // ≈4.41 Guest Toilet right

const MB_X0 = GT_X1 + INT_WALL;                               // ≈4.56 Maid's Bathroom left
const MB_X1 = MB_X0 + MB_W;                                   // =5.78 Maid's Bathroom right ✓

const MR_X0 = MB_X1 + INT_WALL;                               // ≈5.93 Maid's Room left
const MR_X1 = MR_X0 + MR_W;                                   // ≈8.64 Maid's Room right

const K_X0 = MR_X1 + INT_WALL;                                // ≈8.79 Kitchen left
const K_X1 = K_X0 + KIT_W;                                    // ≈12.10 Kitchen right

// ── Z coordinates ──
const ROOMS_Z0 = 0;                                           // North wall
const ROOMS_Z1 = ROOM_D;                                      // =1.98 Bottom of toilets
const CORR_Z0 = ROOMS_Z1 + INT_WALL;                          // ≈2.13 Corridor top
const CORR_Z1 = CORR_Z0 + CORR_D;                             // ≈3.35 Corridor bottom

// Maid's room: from z=0 to z=MR_D (2.71)
const MR_Z1 = MR_D;                                           // =2.71

// Kitchen: from z=0 to z=KIT_D (4.12) — extends further south
const K_Z1 = KIT_D;                                           // =4.12

// Stairs: from z=NOTCH_H (below the notch) to corridor bottom
// The stairs are open to the reception below
const S_Z0 = NOTCH_H;                                         // ≈1.8 (below the notch)
const S_Z1 = CORR_Z1;                                         // ≈3.35

// The reception's east wall (partition) is at x = MR_X1
// This wall only exists from CORR_Z1 downward
const PART_X = MR_X1;                                         // ≈8.64

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
  maidsBathroom: 0x1a4a6c,
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
  // Reception: large open space
  // The reception is OPEN to the stairs (no wall between them)
  // It extends from the west wall to PART_X (east wall of Maid's Room)
  // The reception also includes the stair area (open plan)
  // Shape: The reception is the full width below the corridor,
  // plus the stair area above the corridor (since stairs are open)
  {
    name: "Reception",
    vertices: [
      [S_X0, S_Z0],                   // Top of stairs (below notch)
      [S_X1, S_Z0],                   // Stairs right edge at top (where wall to GT starts)
      [S_X1, CORR_Z1],               // Stairs right edge at corridor bottom
      [PART_X, CORR_Z1],             // East wall starts at corridor bottom
      [PART_X, APT_DEPTH],           // SE corner of reception
      [S_X0, APT_DEPTH],             // SW corner
    ],
    color: COLORS.reception,
    labelPosition: [PART_X / 2, (CORR_Z1 + APT_DEPTH) / 2],
    dimensions: `${PART_X.toFixed(1)}m × ${(APT_DEPTH - CORR_Z1).toFixed(1)}m`,
  },

  // Stairs (U-shaped, open to reception on the south side)
  // The stairs sit below the notch, from z=NOTCH_H to z=CORR_Z1
  {
    name: "Stairs",
    vertices: [
      [S_X0, S_Z0],
      [S_X1, S_Z0],
      [S_X1, S_Z1],
      [S_X0, S_Z1],
    ],
    color: COLORS.stairs,
    labelPosition: [S_X1 / 2, (S_Z0 + S_Z1) / 2],
    dimensions: `${STAIR_W.toFixed(2)}m × ${(S_Z1 - S_Z0).toFixed(2)}m`,
  },

  // Guest Toilet (to the RIGHT of stairs)
  {
    name: "Guest Toilet",
    vertices: [
      [GT_X0, ROOMS_Z0],
      [GT_X1, ROOMS_Z0],
      [GT_X1, ROOMS_Z1],
      [GT_X0, ROOMS_Z1],
    ],
    color: COLORS.guestToilet,
    labelPosition: [(GT_X0 + GT_X1) / 2, ROOMS_Z1 / 2],
    dimensions: `${GT_W}m × ${ROOM_D}m`,
  },

  // Maid's Bathroom (to the RIGHT of Guest Toilet)
  {
    name: "Maid's Bathroom",
    vertices: [
      [MB_X0, ROOMS_Z0],
      [MB_X1, ROOMS_Z0],
      [MB_X1, ROOMS_Z1],
      [MB_X0, ROOMS_Z1],
    ],
    color: COLORS.maidsBathroom,
    labelPosition: [(MB_X0 + MB_X1) / 2, ROOMS_Z1 / 2],
    dimensions: `${MB_W}m × ${ROOM_D}m`,
  },

  // Corridor: runs east-west between room row and reception
  // From stairs right edge to the Maid's Room right edge
  {
    name: "Corridor",
    vertices: [
      [S_X1, CORR_Z0],
      [MR_X1, CORR_Z0],
      [MR_X1, CORR_Z1],
      [S_X1, CORR_Z1],
    ],
    color: COLORS.corridor,
    labelPosition: [(S_X1 + MR_X1) / 2, (CORR_Z0 + CORR_Z1) / 2],
    dimensions: `${CORR_D}m deep`,
  },

  // Maid's Room (to the RIGHT of Maid's Bathroom)
  {
    name: "Maid's Room",
    vertices: [
      [MR_X0, 0],
      [MR_X1, 0],
      [MR_X1, MR_Z1],
      [MR_X0, MR_Z1],
    ],
    color: COLORS.maidsRoom,
    labelPosition: [(MR_X0 + MR_X1) / 2, MR_Z1 / 2],
    dimensions: `${MR_W}m × ${MR_D}m`,
  },

  // Kitchen (to the RIGHT of Maid's Room, extends further SOUTH)
  {
    name: "Kitchen",
    vertices: [
      [K_X0, 0],
      [K_X1, 0],
      [K_X1, K_Z1],
      [K_X0, K_Z1],
    ],
    color: COLORS.kitchen,
    labelPosition: [(K_X0 + K_X1) / 2, K_Z1 / 2],
    dimensions: `${KIT_W}m × ${KIT_D}m`,
  },

  // Garden (L-shaped: south of apartment + east of kitchen)
  {
    name: "Garden",
    vertices: [
      [S_X0, APT_DEPTH],                  // apartment SW corner
      [PART_X, APT_DEPTH],                // apartment SE corner (reception)
      [PART_X, K_Z1],                     // step east at kitchen south level
      [K_X1, K_Z1],                       // kitchen SE corner
      [K_X1 + 4, K_Z1],                   // garden extends east
      [K_X1 + 4, APT_DEPTH + 4],          // garden SE corner
      [S_X0, APT_DEPTH + 4],              // garden SW corner
    ],
    color: COLORS.garden,
    labelPosition: [K_X1 + 1.5, (K_Z1 + APT_DEPTH + 4) / 2],
    dimensions: "Garden",
  },
];

// ============================================================
// VOID & STAIRS
// ============================================================
export const receptionVoid = {
  x: 0.30,
  z: APT_DEPTH - 5.0,
  width: 5.15,
  depth: 3.5,
};

export const internalStairs = {
  x: S_X0,
  z: S_Z0,
  width: STAIR_W,
  depth: S_Z1 - S_Z0,
  stepCount: 16,
  isUShape: true,
  // U-shape: left flight goes north (up), landing at top, right flight comes south (down)
  // Open at the south side (facing reception)
  leftFlightWidth: (STAIR_W - 0.15) / 2,  // half width minus central wall
  landingDepth: 1.0,
};

// ============================================================
// WALLS
// ============================================================
export const walls: WallSegment[] = [
  // ═══ EXTERIOR WALLS ═══

  // North wall: from the notch corner to the kitchen east wall
  // The north wall starts at (NOTCH_W, 0) because the top-left is notched out
  // Actually, looking at the plan: the north wall runs across the TOP of all rooms
  // The stairs extend from z=NOTCH_H, so above the stairs (z=0 to NOTCH_H) is the notch
  // The north wall at z=0 runs from x=S_X1 (right edge of stairs) to K_X1
  // The stairs' north wall is at z=NOTCH_H, from x=0 to x=S_X1
  
  // North wall above rooms (from stairs right edge to kitchen right edge)
  { start: [S_X1, 0], end: [K_X1, 0], thickness: EXT_WALL, height: WALL_HEIGHT, isExterior: true },
  
  // Stairs north wall (at z=NOTCH_H, from x=0 to stairs right edge)
  { start: [0, NOTCH_H], end: [S_X1, NOTCH_H], thickness: EXT_WALL, height: WALL_HEIGHT, isExterior: true },
  
  // Notch: vertical wall connecting stairs north wall to rooms north wall
  // From (S_X1, NOTCH_H) up to (S_X1, 0) — but S_X1 already has the interior wall
  // Actually the step is: from (S_X1, 0) the north wall goes right, and from (0, NOTCH_H) goes right to S_X1
  // The vertical connection is at x=S_X1 from z=0 to z=NOTCH_H — this is part of the stair/GT wall
  // We need a short exterior wall segment from (S_X1, 0) to (S_X1, NOTCH_H) on the exterior side
  { start: [S_X1, 0], end: [S_X1, NOTCH_H], thickness: EXT_WALL, height: WALL_HEIGHT, isExterior: true },

  // West wall: from notch corner down to apartment south wall
  { start: [0, NOTCH_H], end: [0, APT_DEPTH], thickness: EXT_WALL, height: WALL_HEIGHT, isExterior: true },

  // South wall of reception (apartment south wall)
  { start: [0, APT_DEPTH], end: [PART_X, APT_DEPTH], thickness: EXT_WALL, height: WALL_HEIGHT, isExterior: true },

  // East wall of reception: from corridor bottom down to apartment south
  { start: [PART_X, CORR_Z1], end: [PART_X, APT_DEPTH], thickness: EXT_WALL, height: WALL_HEIGHT, isExterior: true },

  // Connection wall from reception east wall to kitchen at corridor level
  // This is the horizontal wall from PART_X to K_X0 at z=CORR_Z1
  { start: [PART_X, CORR_Z1], end: [K_X0, CORR_Z1], thickness: EXT_WALL, height: WALL_HEIGHT, isExterior: true },

  // Kitchen west wall: from corridor bottom down to kitchen south
  { start: [K_X0, CORR_Z1], end: [K_X0, K_Z1], thickness: EXT_WALL, height: WALL_HEIGHT, isExterior: true },

  // Kitchen south wall
  { start: [K_X0, K_Z1], end: [K_X1, K_Z1], thickness: EXT_WALL, height: WALL_HEIGHT, isExterior: true },

  // Kitchen east wall
  { start: [K_X1, 0], end: [K_X1, K_Z1], thickness: EXT_WALL, height: WALL_HEIGHT, isExterior: true },

  // ═══ GARDEN BOUNDARY (low walls) ═══
  { start: [0, APT_DEPTH], end: [0, APT_DEPTH + 4], thickness: 0.12, height: WALL_HEIGHT * 0.35, isExterior: true },
  { start: [0, APT_DEPTH + 4], end: [K_X1 + 4, APT_DEPTH + 4], thickness: 0.12, height: WALL_HEIGHT * 0.35, isExterior: true },
  { start: [K_X1 + 4, K_Z1], end: [K_X1 + 4, APT_DEPTH + 4], thickness: 0.12, height: WALL_HEIGHT * 0.35, isExterior: true },
  { start: [K_X1, K_Z1], end: [K_X1 + 4, K_Z1], thickness: 0.12, height: WALL_HEIGHT * 0.35, isExterior: true },

  // ═══ INTERIOR WALLS ═══

  // Wall between Stairs and Guest Toilet (vertical, north to south)
  // From north wall (z=0) down to bottom of toilet rooms (z=ROOMS_Z1)
  // Note: the exterior step wall at x=S_X1 from z=0 to z=NOTCH_H handles the notch
  // This interior wall runs from z=0 to z=ROOMS_Z1
  { start: [S_X1, 0], end: [S_X1, ROOMS_Z1], thickness: INT_WALL, height: WALL_HEIGHT, isExterior: false },

  // Wall between Guest Toilet and Maid's Bathroom (vertical)
  { start: [GT_X1, 0], end: [GT_X1, ROOMS_Z1], thickness: INT_WALL, height: WALL_HEIGHT, isExterior: false },

  // Wall between Maid's Bathroom and Maid's Room (vertical)
  { start: [MB_X1, 0], end: [MB_X1, MR_Z1], thickness: INT_WALL, height: WALL_HEIGHT, isExterior: false },

  // Wall between Maid's Room and Kitchen (vertical)
  { start: [MR_X1, 0], end: [MR_X1, CORR_Z1], thickness: INT_WALL, height: WALL_HEIGHT, isExterior: false },

  // Bottom wall of toilets (horizontal) — from GT left to MB right
  { start: [GT_X0, ROOMS_Z1], end: [MB_X1, ROOMS_Z1], thickness: INT_WALL, height: WALL_HEIGHT, isExterior: false },

  // Bottom wall of Maid's Room (horizontal)
  { start: [MR_X0, MR_Z1], end: [MR_X1, MR_Z1], thickness: INT_WALL, height: WALL_HEIGHT, isExterior: false },

  // Corridor bottom wall (horizontal) — from stairs right edge to Maid's Room right edge
  // This separates the corridor from the reception below
  { start: [S_X1, CORR_Z1], end: [MR_X1, CORR_Z1], thickness: INT_WALL, height: WALL_HEIGHT, isExterior: false },

  // Stairs right wall: from toilet bottom to corridor bottom
  // (connecting the toilet bottom wall to the corridor bottom wall)
  { start: [S_X1, ROOMS_Z1], end: [S_X1, CORR_Z1], thickness: INT_WALL, height: WALL_HEIGHT, isExterior: false },
];

// ============================================================
// DOORS
// ============================================================
export const doors: DoorOpening[] = [
  // Entrance: on the west wall, near the stairs area
  // The entrance is below the notch, around z=2.0 to z=3.0
  {
    position: [0, (NOTCH_H + CORR_Z1) / 2],
    width: 1.0,
    height: DOOR_HEIGHT,
    wallDirection: "z",
    label: "Entrance",
  },
  // Guest Toilet door (from corridor, through bottom wall of GT)
  {
    position: [(GT_X0 + GT_X1) / 2, ROOMS_Z1],
    width: 0.7,
    height: DOOR_HEIGHT,
    wallDirection: "x",
  },
  // Maid's Bathroom door (from corridor, through bottom wall)
  {
    position: [(MB_X0 + MB_X1) / 2, ROOMS_Z1],
    width: 0.7,
    height: DOOR_HEIGHT,
    wallDirection: "x",
  },
  // Maid's Room door (from corridor, through bottom wall)
  {
    position: [(MR_X0 + MR_X1) / 2, MR_Z1],
    width: 0.9,
    height: DOOR_HEIGHT,
    wallDirection: "x",
  },
  // Kitchen door (from corridor area, through the wall between MR and Kitchen)
  {
    position: [MR_X1, (CORR_Z0 + CORR_Z1) / 2],
    width: 0.9,
    height: DOOR_HEIGHT,
    wallDirection: "z",
  },
  // Garden sliding door (south wall of reception)
  {
    position: [PART_X / 2, APT_DEPTH],
    width: 2.0,
    height: DOOR_HEIGHT,
    wallDirection: "x",
    label: "Garden",
  },
];

// ============================================================
// WINDOWS
// ============================================================
export const windows: WindowOpening[] = [
  // West wall windows (reception) — two windows
  {
    position: [0, 5.0],
    width: 1.5,
    height: WINDOW_HEIGHT,
    sillHeight: WINDOW_SILL,
    wallDirection: "z",
  },
  {
    position: [0, 9.0],
    width: 1.5,
    height: WINDOW_HEIGHT,
    sillHeight: WINDOW_SILL,
    wallDirection: "z",
  },
  // Kitchen east wall window
  {
    position: [K_X1, K_Z1 / 2],
    width: 1.2,
    height: WINDOW_HEIGHT,
    sillHeight: WINDOW_SILL,
    wallDirection: "z",
  },
  // Maid's Room north wall window
  {
    position: [(MR_X0 + MR_X1) / 2, 0],
    width: 1.0,
    height: WINDOW_HEIGHT,
    sillHeight: WINDOW_SILL,
    wallDirection: "x",
  },
];

// ============================================================
// DIMENSION LINES
// ============================================================
export const dimensionLines: DimensionLine[] = [
  // 5.78m: total width from west wall to right edge of Maid's Bathroom
  // This includes: stairs (3.04) + wall (0.15) + GT (1.22) + wall (0.15) + MB (1.22) = 5.78
  { start: [0, NOTCH_H], end: [MB_X1, NOTCH_H], label: "5.78m", offset: -0.6 },
  // 11.72m: total apartment depth (west wall)
  { start: [0, NOTCH_H], end: [0, APT_DEPTH], label: "11.72m", offset: -1.0 },
  // 1.22m: GT width
  { start: [GT_X0, 0], end: [GT_X1, 0], label: "1.22m", offset: -0.4 },
  // 1.22m: MB width
  { start: [MB_X0, 0], end: [MB_X1, 0], label: "1.22m", offset: -0.4 },
  // 1.98m: toilet depth
  { start: [MB_X1, 0], end: [MB_X1, ROOMS_Z1], label: "1.98m", offset: 0.5 },
  // 2.71m: maid's room width
  { start: [MR_X0, 0], end: [MR_X1, 0], label: "2.71m", offset: -0.4 },
  // 2.71m: maid's room depth
  { start: [MR_X1, 0], end: [MR_X1, MR_Z1], label: "2.71m", offset: 0.5 },
  // 3.31m: kitchen width
  { start: [K_X0, 0], end: [K_X1, 0], label: "3.31m", offset: -0.4 },
  // 4.12m: kitchen depth
  { start: [K_X1, 0], end: [K_X1, K_Z1], label: "4.12m", offset: 0.5 },
  // 1.22m: corridor depth
  { start: [S_X1, CORR_Z0], end: [S_X1, CORR_Z1], label: "1.22m", offset: -0.4 },
  // 5.15m: void width
  { start: [receptionVoid.x, receptionVoid.z], end: [receptionVoid.x + receptionVoid.width, receptionVoid.z], label: "5.15m", offset: -0.3 },
  // 3.93m: dining area
  { start: [1.0, APT_DEPTH - 3.0], end: [1.0 + 3.93, APT_DEPTH - 3.0], label: "3.93m", offset: 0.4 },
];

// ============================================================
// PROPERTY BOUNDS
// ============================================================
export const propertyBounds = {
  minX: -1.5,
  maxX: K_X1 + 5,
  minZ: -1.5,
  maxZ: APT_DEPTH + 5,
};

// Export computed values for use in renderers
export const APT_DIMS = {
  topWidth: K_X1,        // full width at top (including kitchen)
  recWidth: PART_X,      // reception width (narrower)
  depth: APT_DEPTH,      // total depth
  kitchenBottom: K_Z1,   // how far south the kitchen extends
  corridorBottom: CORR_Z1, // corridor bottom z
  notchW: NOTCH_W,       // notch width
  notchH: NOTCH_H,       // notch height
  stairTop: S_Z0,        // top of stairs (below notch)
};
