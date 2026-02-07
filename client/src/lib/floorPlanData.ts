/**
 * Floor Plan Data — Type DU1 Ground Floor
 * DEFINITIVE v10
 *
 * Coordinate system:
 *   Origin (0,0) = northwest corner of the APARTMENT ENVELOPE
 *   X = increases to the RIGHT (east)
 *   Z = increases DOWNWARD (south)
 *
 * LAYOUT (looking from above, north at top):
 *
 *   NW notch is to the LEFT of stairs.
 *   All rooms are on the SAME ROW at the top.
 *
 *     NOTCH                                                    
 *     (out) | Stairs |  GT  |  MB  | Maid's Room | Kitchen    |
 *      "C"  |  (U)   |      |      |             |            |
 *           |        +------+------+------+------+            |
 *           |        |  (open)     | Corridor    |            |
 *           |        |             |  (MR→Kit)   +------------+
 *           +--------+             +-------------+ Kit extends
 *           |                      |             | into garden
 *           |     Reception        |             |
 *           |   (full width below) |  Reception  |
 *           |   5.78m deep left    |  3.93m right|
 *           |                      |             |
 *           +----------------------+-------------+
 *
 *   - Stairs are on same row as rooms, notch to their left
 *   - Corridor runs from Kitchen to Maid's Room ONLY
 *   - Below stairs/GT/MB: open to reception (no corridor wall)
 *   - Maid's Room entrance is from Maid's Bathroom
 *   - Kitchen extends south to z=4.12 (into garden area)
 *   - Reception: 11.72m wide, 5.78m deep (left), 3.93m deep (right)
 *   - Garden: L-shaped, south + east of apartment
 */

export const WALL_HEIGHT = 3.0;
export const EXT_WALL = 0.20;
export const INT_WALL = 0.10;
export const DOOR_HEIGHT = 2.4;
export const WINDOW_HEIGHT = 1.2;
export const WINDOW_SILL = 0.9;

// ============================================================
// MASTER DIMENSIONS (meters, from plan labels + user corrections)
// ============================================================
const NOTCH_W = 0.50;   // notch width (NW corner cutout)
const NOTCH_H = 1.80;   // notch height

const GT_W = 1.22;      // Guest Toilet width
const MB_W = 1.22;      // Maid's Bathroom width
const MR_W = 1.98;      // Maid's Room width
const KIT_W = 3.31;     // Kitchen width

const ROOM_D = 1.98;    // GT & MB depth (north to south)
const MR_D = 2.71;      // Maid's Room depth
const KIT_D = 4.12;     // Kitchen depth (extends into garden)
const CORR_D = 1.22;    // Corridor depth

const REC_W = 11.72;    // Reception width (= apartment width)
const REC_LEFT_D = 5.78; // Reception depth on left side
const REC_RIGHT_D = 3.93; // Reception depth on right side

// Stair width: calculated so top row fits within 11.72m
// NOTCH_W + STAIR_W + INT + GT + INT + MB + INT + MR + INT + KIT = 11.72
// 0.50 + S + 4*0.10 + 1.22 + 1.22 + 1.98 + 3.31 = 11.72
// S = 11.72 - 0.50 - 0.40 - 7.73 = 3.09
const STAIR_W = REC_W - NOTCH_W - 4 * INT_WALL - GT_W - MB_W - MR_W - KIT_W;
// ≈ 3.09m

// ============================================================
// DERIVED X-COORDINATES (left to right)
// ============================================================
// Notch: x=0 to x=NOTCH_W (outside apartment at NW corner)
const S_X0 = NOTCH_W;                                          // stairs left edge
const S_X1 = S_X0 + STAIR_W;                                   // stairs right edge

const GT_X0 = S_X1 + INT_WALL;                                 // GT left
const GT_X1 = GT_X0 + GT_W;                                    // GT right

const MB_X0 = GT_X1 + INT_WALL;                                // MB left
const MB_X1 = MB_X0 + MB_W;                                    // MB right

const MR_X0 = MB_X1 + INT_WALL;                                // MR left
const MR_X1 = MR_X0 + MR_W;                                    // MR right

const K_X0 = MR_X1 + INT_WALL;                                 // Kitchen left
const K_X1 = K_X0 + KIT_W;                                     // Kitchen right ≈ 11.72

// ============================================================
// DERIVED Z-COORDINATES (top to bottom)
// ============================================================
// All rooms start at z=0 (north wall)
const ROOMS_Z0 = 0;

// GT & MB bottom
const GT_Z1 = ROOM_D;                                          // = 1.98
const MB_Z1 = ROOM_D;                                          // = 1.98

// Stairs bottom (same depth as GT/MB since on same row)
const S_Z1 = ROOM_D;                                           // = 1.98

// Wall below GT/MB
const WALL_BELOW_ROOMS = GT_Z1 + INT_WALL;                     // = 2.08

// Maid's Room bottom
const MR_Z1 = MR_D;                                            // = 2.71

// Corridor: from MR bottom to corridor bottom
// Corridor top = MR_Z1 = 2.71
const CORR_Z0 = MR_Z1;                                         // = 2.71
const CORR_Z1 = CORR_Z0 + CORR_D;                              // = 3.93

// Kitchen bottom
const K_Z1 = KIT_D;                                            // = 4.12

// Apartment depth: reception left starts at WALL_BELOW_ROOMS, depth = 5.78
const APT_DEPTH = WALL_BELOW_ROOMS + REC_LEFT_D;               // = 2.08 + 5.78 = 7.86
// Verify: reception right starts at CORR_Z1 = 3.93, depth = 3.93 → 3.93 + 3.93 = 7.86 ✓

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
  // Reception: step-shaped, full width at bottom, narrower at top
  // Left side: from z=WALL_BELOW_ROOMS to z=APT_DEPTH (5.78m)
  // Right side: from z=CORR_Z1 to z=APT_DEPTH (3.93m)
  // Below kitchen (z=K_Z1 to APT_DEPTH): full width 11.72m
  // Between z=CORR_Z1 and z=K_Z1: from x=0 to x=K_X0 (left of kitchen)
  // Between z=WALL_BELOW_ROOMS and z=CORR_Z1: from x=0 to x=MR_X0 (left of corridor)
  {
    name: "Reception",
    vertices: [
      [0, WALL_BELOW_ROOMS],         // NW of reception (left side, below GT/MB)
      [MR_X0, WALL_BELOW_ROOMS],     // where corridor starts (right edge of open area)
      [MR_X0, CORR_Z1],             // corridor bottom, left side
      [K_X1, CORR_Z1],              // corridor bottom, right side (kitchen east)
      [K_X1, APT_DEPTH],            // SE corner
      [0, APT_DEPTH],               // SW corner
    ],
    color: COLORS.reception,
    labelPosition: [REC_W / 3, (CORR_Z1 + APT_DEPTH) / 2],
    dimensions: `${REC_W}m wide`,
  },

  // Stairs (U-shaped, open to reception on the south side)
  {
    name: "Stairs",
    vertices: [
      [S_X0, ROOMS_Z0],
      [S_X1, ROOMS_Z0],
      [S_X1, S_Z1],
      [S_X0, S_Z1],
    ],
    color: COLORS.stairs,
    labelPosition: [(S_X0 + S_X1) / 2, S_Z1 / 2],
    dimensions: "U-Shaped",
  },

  // Guest Toilet
  {
    name: "Guest Toilet",
    vertices: [
      [GT_X0, ROOMS_Z0],
      [GT_X1, ROOMS_Z0],
      [GT_X1, GT_Z1],
      [GT_X0, GT_Z1],
    ],
    color: COLORS.guestToilet,
    labelPosition: [(GT_X0 + GT_X1) / 2, GT_Z1 / 2],
    dimensions: `${GT_W}m × ${ROOM_D}m`,
  },

  // Maid's Bathroom
  {
    name: "Maid's Bathroom",
    vertices: [
      [MB_X0, ROOMS_Z0],
      [MB_X1, ROOMS_Z0],
      [MB_X1, MB_Z1],
      [MB_X0, MB_Z1],
    ],
    color: COLORS.maidsBathroom,
    labelPosition: [(MB_X0 + MB_X1) / 2, MB_Z1 / 2],
    dimensions: `${MB_W}m × ${ROOM_D}m`,
  },

  // Maid's Room (entrance from Maid's Bathroom, deeper than GT/MB)
  {
    name: "Maid's Room",
    vertices: [
      [MR_X0, ROOMS_Z0],
      [MR_X1, ROOMS_Z0],
      [MR_X1, MR_Z1],
      [MR_X0, MR_Z1],
    ],
    color: COLORS.maidsRoom,
    labelPosition: [(MR_X0 + MR_X1) / 2, MR_Z1 / 2],
    dimensions: `${MR_W}m × ${MR_D}m`,
  },

  // Corridor: runs from Kitchen west wall to Maid's Room west wall
  // Positioned below MR and Kitchen, above reception
  {
    name: "Corridor",
    vertices: [
      [MR_X0, CORR_Z0],
      [K_X1, CORR_Z0],
      [K_X1, CORR_Z1],
      [MR_X0, CORR_Z1],
    ],
    color: COLORS.corridor,
    labelPosition: [(MR_X0 + K_X1) / 2, (CORR_Z0 + CORR_Z1) / 2],
    dimensions: `${CORR_D}m deep`,
  },

  // Kitchen (extends further south to z=4.12, into garden area)
  {
    name: "Kitchen",
    vertices: [
      [K_X0, ROOMS_Z0],
      [K_X1, ROOMS_Z0],
      [K_X1, K_Z1],
      [K_X0, K_Z1],
    ],
    color: COLORS.kitchen,
    labelPosition: [(K_X0 + K_X1) / 2, K_Z1 / 2],
    dimensions: `${KIT_W}m × ${KIT_D}m`,
  },

  // Garden (L-shaped: south of apartment + east of kitchen extension)
  {
    name: "Garden",
    vertices: [
      [0, APT_DEPTH],                    // apartment SW corner
      [K_X1, APT_DEPTH],                 // apartment SE corner
      [K_X1, K_Z1],                      // kitchen SE corner
      [K_X1 + 4, K_Z1],                  // garden extends east
      [K_X1 + 4, APT_DEPTH + 4],         // garden SE corner
      [0, APT_DEPTH + 4],                // garden SW corner
    ],
    color: COLORS.garden,
    labelPosition: [(K_X1 + K_X1 + 4) / 2, (K_Z1 + APT_DEPTH + 4) / 2],
    dimensions: "Garden",
  },
];

// ============================================================
// VOID & STAIRS
// ============================================================
export const receptionVoid = {
  x: 0.30,
  z: (CORR_Z1 + APT_DEPTH) / 2 - 1.75,
  width: 5.15,
  depth: 3.5,
};

export const internalStairs = {
  x: S_X0,
  z: ROOMS_Z0,
  width: STAIR_W,
  depth: S_Z1 - ROOMS_Z0,
  stepCount: 16,
  isUShape: true,
  leftFlightWidth: (STAIR_W - 0.10) / 2,
  landingDepth: 0.6,
};

// ============================================================
// WALLS
// ============================================================
export const walls: WallSegment[] = [
  // ═══ EXTERIOR WALLS ═══

  // North wall: from notch step to kitchen east wall
  { start: [NOTCH_W, 0], end: [K_X1, 0], thickness: EXT_WALL, height: WALL_HEIGHT, isExterior: true },

  // Notch step walls (NW corner cutout)
  // Vertical: from (NOTCH_W, 0) south to (NOTCH_W, NOTCH_H)
  { start: [NOTCH_W, 0], end: [NOTCH_W, NOTCH_H], thickness: EXT_WALL, height: WALL_HEIGHT, isExterior: true },
  // Horizontal: from (NOTCH_W, NOTCH_H) west to (0, NOTCH_H)
  { start: [0, NOTCH_H], end: [NOTCH_W, NOTCH_H], thickness: EXT_WALL, height: WALL_HEIGHT, isExterior: true },

  // West wall: from notch bottom to apartment south wall
  { start: [0, NOTCH_H], end: [0, APT_DEPTH], thickness: EXT_WALL, height: WALL_HEIGHT, isExterior: true },

  // South wall: full width
  { start: [0, APT_DEPTH], end: [K_X1, APT_DEPTH], thickness: EXT_WALL, height: WALL_HEIGHT, isExterior: true },

  // East wall: from north to kitchen south (z=4.12)
  { start: [K_X1, 0], end: [K_X1, K_Z1], thickness: EXT_WALL, height: WALL_HEIGHT, isExterior: true },

  // Kitchen south wall (exterior, faces garden)
  { start: [K_X0, K_Z1], end: [K_X1, K_Z1], thickness: EXT_WALL, height: WALL_HEIGHT, isExterior: true },

  // East wall below kitchen: from kitchen south to apartment south
  // This is the reception's east wall on the right side
  { start: [K_X1, K_Z1], end: [K_X1, APT_DEPTH], thickness: EXT_WALL, height: WALL_HEIGHT, isExterior: true },

  // ═══ GARDEN BOUNDARY (low walls) ═══
  { start: [0, APT_DEPTH], end: [0, APT_DEPTH + 4], thickness: 0.12, height: WALL_HEIGHT * 0.35, isExterior: true },
  { start: [0, APT_DEPTH + 4], end: [K_X1 + 4, APT_DEPTH + 4], thickness: 0.12, height: WALL_HEIGHT * 0.35, isExterior: true },
  { start: [K_X1 + 4, K_Z1], end: [K_X1 + 4, APT_DEPTH + 4], thickness: 0.12, height: WALL_HEIGHT * 0.35, isExterior: true },
  { start: [K_X1, K_Z1], end: [K_X1 + 4, K_Z1], thickness: 0.12, height: WALL_HEIGHT * 0.35, isExterior: true },

  // ═══ INTERIOR WALLS ═══

  // Wall between Stairs and Guest Toilet (vertical)
  { start: [S_X1, 0], end: [S_X1, S_Z1], thickness: INT_WALL, height: WALL_HEIGHT, isExterior: false },

  // Wall between Guest Toilet and Maid's Bathroom (vertical)
  { start: [GT_X1, 0], end: [GT_X1, GT_Z1], thickness: INT_WALL, height: WALL_HEIGHT, isExterior: false },

  // Wall between Maid's Bathroom and Maid's Room (vertical)
  // This wall runs from z=0 to z=MR_Z1 (full room depth)
  { start: [MB_X1, 0], end: [MB_X1, MR_Z1], thickness: INT_WALL, height: WALL_HEIGHT, isExterior: false },

  // Wall between Maid's Room and Kitchen (vertical, from z=0 to z=K_Z1)
  { start: [MR_X1, 0], end: [MR_X1, K_Z1], thickness: INT_WALL, height: WALL_HEIGHT, isExterior: false },

  // Bottom wall of GT and MB (horizontal) — separates rooms from reception below
  { start: [S_X0, GT_Z1], end: [MB_X1, GT_Z1], thickness: INT_WALL, height: WALL_HEIGHT, isExterior: false },

  // Bottom wall of Maid's Room (horizontal) = top of corridor
  { start: [MR_X0, MR_Z1], end: [MR_X1, MR_Z1], thickness: INT_WALL, height: WALL_HEIGHT, isExterior: false },

  // Corridor bottom wall (horizontal) — from MR left to Kitchen right
  // This separates corridor from reception below
  { start: [MR_X0, CORR_Z1], end: [K_X1, CORR_Z1], thickness: INT_WALL, height: WALL_HEIGHT, isExterior: false },

  // Kitchen west wall below corridor (from corridor bottom to kitchen south)
  // This separates kitchen from reception on the left
  { start: [K_X0, CORR_Z1], end: [K_X0, K_Z1], thickness: INT_WALL, height: WALL_HEIGHT, isExterior: false },

  // Stairs bottom wall: connects stairs to GT bottom wall
  // The stairs' south side is open to reception, but the east wall of stairs
  // connects to the GT bottom wall
  { start: [S_X0, S_Z1], end: [S_X1, S_Z1], thickness: INT_WALL, height: WALL_HEIGHT, isExterior: false },
];

// ============================================================
// DOORS
// ============================================================
export const doors: DoorOpening[] = [
  // Entrance: on the west wall, below the notch
  {
    position: [0, (NOTCH_H + S_Z1) / 2],
    width: 1.0,
    height: DOOR_HEIGHT,
    wallDirection: "z",
    label: "Entrance",
  },
  // Guest Toilet door (from the area below, through bottom wall of GT)
  {
    position: [(GT_X0 + GT_X1) / 2, GT_Z1],
    width: 0.7,
    height: DOOR_HEIGHT,
    wallDirection: "x",
  },
  // Maid's Bathroom door (from the area below, through bottom wall)
  {
    position: [(MB_X0 + MB_X1) / 2, MB_Z1],
    width: 0.7,
    height: DOOR_HEIGHT,
    wallDirection: "x",
  },
  // Maid's Room door: entrance from Maid's Bathroom (through the wall between MB and MR)
  {
    position: [MB_X1, (ROOMS_Z0 + Math.min(MB_Z1, MR_Z1)) / 2],
    width: 0.8,
    height: DOOR_HEIGHT,
    wallDirection: "z",
  },
  // Kitchen door (from corridor, through the wall between MR and Kitchen)
  {
    position: [MR_X1, (CORR_Z0 + CORR_Z1) / 2],
    width: 0.9,
    height: DOOR_HEIGHT,
    wallDirection: "z",
  },
  // Garden sliding door (south wall of reception)
  {
    position: [K_X1 / 3, APT_DEPTH],
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
  // West wall windows (reception area)
  {
    position: [0, (WALL_BELOW_ROOMS + APT_DEPTH) / 3],
    width: 1.5,
    height: WINDOW_HEIGHT,
    sillHeight: WINDOW_SILL,
    wallDirection: "z",
  },
  {
    position: [0, (WALL_BELOW_ROOMS + APT_DEPTH) * 2 / 3],
    width: 1.5,
    height: WINDOW_HEIGHT,
    sillHeight: WINDOW_SILL,
    wallDirection: "z",
  },
  // Kitchen east wall window
  {
    position: [K_X1, KIT_D / 2],
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
  // Top row room widths
  { start: [GT_X0, 0], end: [GT_X1, 0], label: `${GT_W}m`, offset: -0.4 },
  { start: [MB_X0, 0], end: [MB_X1, 0], label: `${MB_W}m`, offset: -0.4 },
  { start: [MR_X0, 0], end: [MR_X1, 0], label: `${MR_W}m`, offset: -0.4 },
  { start: [K_X0, 0], end: [K_X1, 0], label: `${KIT_W}m`, offset: -0.4 },

  // Room depths (right side)
  { start: [MB_X1, 0], end: [MB_X1, GT_Z1], label: `${ROOM_D}m`, offset: 0.4 },
  { start: [MR_X1, 0], end: [MR_X1, MR_Z1], label: `${MR_D}m`, offset: 0.4 },
  { start: [K_X1, 0], end: [K_X1, K_Z1], label: `${KIT_D}m`, offset: 0.5 },

  // Corridor depth
  { start: [MR_X0, CORR_Z0], end: [MR_X0, CORR_Z1], label: `${CORR_D}m`, offset: -0.4 },

  // Reception dimensions
  // Left depth: 5.78m
  { start: [0, WALL_BELOW_ROOMS], end: [0, APT_DEPTH], label: `${REC_LEFT_D}m`, offset: -0.8 },
  // Right depth: 3.93m
  { start: [K_X1, CORR_Z1], end: [K_X1, APT_DEPTH], label: `${REC_RIGHT_D}m`, offset: 0.8 },
  // Width: 11.72m
  { start: [0, APT_DEPTH], end: [K_X1, APT_DEPTH], label: `${REC_W}m`, offset: 0.6 },

  // Void dimensions
  { start: [receptionVoid.x, receptionVoid.z], end: [receptionVoid.x + receptionVoid.width, receptionVoid.z], label: "5.15m", offset: -0.3 },
  { start: [1.0, APT_DEPTH - 2.5], end: [1.0 + 3.93, APT_DEPTH - 2.5], label: "3.93m", offset: 0.4 },
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

// Export computed values for renderers
export const APT_DIMS = {
  topWidth: K_X1,
  recWidth: REC_W,
  depth: APT_DEPTH,
  kitchenBottom: K_Z1,
  corridorBottom: CORR_Z1,
  corridorTop: CORR_Z0,
  notchW: NOTCH_W,
  notchH: NOTCH_H,
  stairLeft: S_X0,
  stairRight: S_X1,
  stairBottom: S_Z1,
  roomsBottom: GT_Z1,
  mrLeft: MR_X0,
  mrRight: MR_X1,
  kitLeft: K_X0,
  kitRight: K_X1,
};
