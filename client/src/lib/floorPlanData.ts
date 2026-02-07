/**
 * Floor Plan Data — Type DU1 Ground Floor
 * DEFINITIVE v11
 *
 * Coordinate system:
 *   Origin (0,0) = northwest corner of the apartment envelope
 *   X = increases to the RIGHT (east)
 *   Z = increases DOWNWARD (south)
 *
 * LAYOUT (looking from above, north at top):
 *
 *     NOTCH                                                          
 *     (out)  | Stairs | GT | MB | Maid's Room |     Kitchen     |
 *      "C"   |  (U)   |    |    |             |  K_X0 ── K_X1   |
 *            |        +----+----+------+------+-----+           |
 *            |        |(open)   |  Corridor   |     |           |
 *            |        |         | (MR→K_X0)   |     |           |
 *            +--------+         +-------------+-----+-----------+
 *            |                  |             Kitchen south      |
 *            |                  |  Reception  |.....             |
 *            |   Reception      |  (right)    |  (garden below) |
 *            |   (left 5.78m)   |  (3.93m)    |                 |
 *            |                  |             REC_EAST           |
 *            +------------------+-------------+                 |
 *                                             |     Garden      |
 *                                             |                 |
 *
 *   KEY RELATIONSHIPS:
 *   - Stairs on same row as rooms, notch to their left
 *   - Corridor: from Kitchen west wall (K_X0) to Maid's Room west wall (MR_X0)
 *   - Reception east wall at REC_EAST ≈ middle of kitchen width
 *   - Kitchen protrudes EAST beyond reception into garden
 *   - Kitchen protrudes SOUTH beyond corridor into garden
 *   - Garden: L-shaped, wraps south of apartment + east of REC_EAST below kitchen
 *   - Maid's Room entrance from Maid's Bathroom
 *
 * DIMENSION CONSISTENCY:
 *   Left:  ROOM_D(1.98) + wall(0.10) + REC_LEFT_D(5.78) = 7.86m ✓
 *   Right: MR_D(2.71) + CORR_D(1.22) + REC_RIGHT_D(3.93) = 7.86m ✓
 */

export const WALL_HEIGHT = 3.0;
export const EXT_WALL = 0.20;
export const INT_WALL = 0.10;
export const DOOR_HEIGHT = 2.4;
export const WINDOW_HEIGHT = 1.2;
export const WINDOW_SILL = 0.9;

// ============================================================
// MASTER DIMENSIONS (meters, from plan labels)
// ============================================================
const NOTCH_W = 1.50;   // notch width (wider per user request)
const NOTCH_H = 1.80;   // notch height

const STAIR_W = 2.00;   // stairs width (narrower per user request)

const GT_W = 1.22;      // Guest Toilet width
const MB_W = 1.22;      // Maid's Bathroom width
const MR_W = 1.98;      // Maid's Room width
const KIT_W = 3.31;     // Kitchen width

const ROOM_D = 1.98;    // GT & MB depth
const MR_D = 2.71;      // Maid's Room depth
const KIT_D = 4.12;     // Kitchen depth
const CORR_D = 1.22;    // Corridor depth

const REC_LEFT_D = 5.78;  // Reception depth, left side
const REC_RIGHT_D = 3.93; // Reception depth, right side

// ============================================================
// DERIVED X-COORDINATES (left to right)
// ============================================================
const S_X0 = NOTCH_W;                                          // 1.50
const S_X1 = S_X0 + STAIR_W;                                   // 3.50

const GT_X0 = S_X1 + INT_WALL;                                 // 3.60
const GT_X1 = GT_X0 + GT_W;                                    // 4.82

const MB_X0 = GT_X1 + INT_WALL;                                // 4.92
const MB_X1 = MB_X0 + MB_W;                                    // 6.14

const MR_X0 = MB_X1 + INT_WALL;                                // 6.24
const MR_X1 = MR_X0 + MR_W;                                    // 8.22

const K_X0 = MR_X1 + INT_WALL;                                 // 8.32
const K_X1 = K_X0 + KIT_W;                                     // 11.63

// Reception east wall: in the MIDDLE of the kitchen
const REC_EAST = K_X0 + KIT_W / 2;                             // ≈ 9.975

// ============================================================
// DERIVED Z-COORDINATES (top to bottom)
// ============================================================
const ROOMS_Z0 = 0;
const GT_Z1 = ROOM_D;                                          // 1.98
const MB_Z1 = ROOM_D;                                          // 1.98
const S_Z1 = ROOM_D;                                           // 1.98
const WALL_BELOW_ROOMS = GT_Z1 + INT_WALL;                     // 2.08
const MR_Z1 = MR_D;                                            // 2.71
const CORR_Z0 = MR_Z1;                                         // 2.71
const CORR_Z1 = CORR_Z0 + CORR_D;                              // 3.93
const K_Z1 = KIT_D;                                            // 4.12

// Apartment depth (consistent both sides):
//   Left:  1.98 + 0.10 + 5.78 = 7.86
//   Right: 2.71 + 1.22 + 3.93 = 7.86
const APT_DEPTH = WALL_BELOW_ROOMS + REC_LEFT_D;               // 7.86

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
  // Reception: step-shaped
  // Left side (below stairs/GT/MB): z=WALL_BELOW_ROOMS to z=APT_DEPTH, x=0 to MR_X0
  // Right side (below corridor): z=CORR_Z1 to z=APT_DEPTH, x=MR_X0 to REC_EAST
  {
    name: "Reception",
    vertices: [
      [0, WALL_BELOW_ROOMS],           // top-left
      [MR_X0, WALL_BELOW_ROOMS],       // step right (where corridor starts)
      [MR_X0, CORR_Z1],               // corridor bottom left
      [REC_EAST, CORR_Z1],            // corridor bottom right (= reception east wall)
      [REC_EAST, APT_DEPTH],          // bottom-right
      [0, APT_DEPTH],                 // bottom-left
    ],
    color: COLORS.reception,
    labelPosition: [4.0, (CORR_Z1 + APT_DEPTH) / 2],
    dimensions: `${REC_LEFT_D}m × ${REC_RIGHT_D}m`,
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

  // Maid's Room (entrance from Maid's Bathroom)
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

  // Corridor: from MR west wall to Kitchen west wall
  {
    name: "Corridor",
    vertices: [
      [MR_X0, CORR_Z0],
      [K_X0, CORR_Z0],
      [K_X0, CORR_Z1],
      [MR_X0, CORR_Z1],
    ],
    color: COLORS.corridor,
    labelPosition: [(MR_X0 + K_X0) / 2, (CORR_Z0 + CORR_Z1) / 2],
    dimensions: `${CORR_D}m deep`,
  },

  // Kitchen: full rectangle, protrudes south and east beyond reception
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

  // Garden: L-shaped, wraps around the apartment
  // South of apartment (z=APT_DEPTH to garden boundary)
  // East of REC_EAST below kitchen (z=K_Z1 to garden boundary)
  {
    name: "Garden",
    vertices: [
      [0, APT_DEPTH],                    // apartment SW
      [REC_EAST, APT_DEPTH],             // reception SE
      [REC_EAST, K_Z1],                  // up to kitchen south level
      [K_X1, K_Z1],                      // kitchen SE corner
      [K_X1 + 3, K_Z1],                  // garden extends east
      [K_X1 + 3, APT_DEPTH + 3],         // garden SE
      [0, APT_DEPTH + 3],                // garden SW
    ],
    color: COLORS.garden,
    labelPosition: [K_X1 + 1, (K_Z1 + APT_DEPTH + 3) / 2],
    dimensions: "Garden",
  },
];

// ============================================================
// VOID & STAIRS
// ============================================================
export const receptionVoid = {
  x: 0.30,
  z: (CORR_Z1 + APT_DEPTH) / 2 - 1.5,
  width: 5.15,
  depth: 3.0,
};

export const internalStairs = {
  x: S_X0,
  z: ROOMS_Z0,
  width: STAIR_W,
  depth: S_Z1 - ROOMS_Z0,
  stepCount: 16,
  isUShape: true,
  leftFlightWidth: (STAIR_W - 0.10) / 2,
  landingDepth: 0.5,
};

// ============================================================
// WALLS
// ============================================================
export const walls: WallSegment[] = [
  // ═══ EXTERIOR WALLS ═══

  // North wall: from notch step to kitchen east wall
  { start: [NOTCH_W, 0], end: [K_X1, 0], thickness: EXT_WALL, height: WALL_HEIGHT, isExterior: true },

  // Notch step walls (NW corner cutout)
  { start: [NOTCH_W, 0], end: [NOTCH_W, NOTCH_H], thickness: EXT_WALL, height: WALL_HEIGHT, isExterior: true },
  { start: [0, NOTCH_H], end: [NOTCH_W, NOTCH_H], thickness: EXT_WALL, height: WALL_HEIGHT, isExterior: true },

  // West wall: from notch bottom to apartment south
  { start: [0, NOTCH_H], end: [0, APT_DEPTH], thickness: EXT_WALL, height: WALL_HEIGHT, isExterior: true },

  // South wall: from west to reception east wall
  { start: [0, APT_DEPTH], end: [REC_EAST, APT_DEPTH], thickness: EXT_WALL, height: WALL_HEIGHT, isExterior: true },

  // Reception east wall: from kitchen south to apartment south
  // (Between CORR_Z1 and K_Z1 at x=REC_EAST, the kitchen occupies that space)
  { start: [REC_EAST, K_Z1], end: [REC_EAST, APT_DEPTH], thickness: EXT_WALL, height: WALL_HEIGHT, isExterior: true },

  // Kitchen east wall: from north to kitchen south
  { start: [K_X1, 0], end: [K_X1, K_Z1], thickness: EXT_WALL, height: WALL_HEIGHT, isExterior: true },

  // Kitchen south wall: from kitchen east to kitchen west
  { start: [K_X0, K_Z1], end: [K_X1, K_Z1], thickness: EXT_WALL, height: WALL_HEIGHT, isExterior: true },


  // ═══ GARDEN BOUNDARY (low walls) ═══
  { start: [0, APT_DEPTH], end: [0, APT_DEPTH + 3], thickness: 0.12, height: WALL_HEIGHT * 0.35, isExterior: true },
  { start: [0, APT_DEPTH + 3], end: [K_X1 + 3, APT_DEPTH + 3], thickness: 0.12, height: WALL_HEIGHT * 0.35, isExterior: true },
  { start: [K_X1 + 3, K_Z1], end: [K_X1 + 3, APT_DEPTH + 3], thickness: 0.12, height: WALL_HEIGHT * 0.35, isExterior: true },
  { start: [K_X1, K_Z1], end: [K_X1 + 3, K_Z1], thickness: 0.12, height: WALL_HEIGHT * 0.35, isExterior: true },


  // ═══ INTERIOR WALLS ═══

  // Wall between Stairs and Guest Toilet
  { start: [S_X1, 0], end: [S_X1, S_Z1], thickness: INT_WALL, height: WALL_HEIGHT, isExterior: false },

  // Wall between Guest Toilet and Maid's Bathroom
  { start: [GT_X1, 0], end: [GT_X1, GT_Z1], thickness: INT_WALL, height: WALL_HEIGHT, isExterior: false },

  // Wall between Maid's Bathroom and Maid's Room
  { start: [MB_X1, 0], end: [MB_X1, MR_Z1], thickness: INT_WALL, height: WALL_HEIGHT, isExterior: false },

  // Wall between Maid's Room and Kitchen (from z=0 to z=K_Z1)
  { start: [MR_X1, 0], end: [MR_X1, K_Z1], thickness: INT_WALL, height: WALL_HEIGHT, isExterior: false },

  // Bottom wall of Stairs, GT, MB (horizontal, separates from reception)
  { start: [S_X0, S_Z1], end: [MB_X1, S_Z1], thickness: INT_WALL, height: WALL_HEIGHT, isExterior: false },

  // Bottom wall of Maid's Room = top of corridor
  { start: [MR_X0, MR_Z1], end: [MR_X1, MR_Z1], thickness: INT_WALL, height: WALL_HEIGHT, isExterior: false },

  // Corridor bottom wall: from MR left to Kitchen west wall
  { start: [MR_X0, CORR_Z1], end: [K_X0, CORR_Z1], thickness: INT_WALL, height: WALL_HEIGHT, isExterior: false },

  // Corridor bottom wall extension: from K_X0 to REC_EAST
  // This connects the corridor bottom to the reception east wall
  { start: [K_X0, CORR_Z1], end: [REC_EAST, CORR_Z1], thickness: INT_WALL, height: WALL_HEIGHT, isExterior: false },

  // Kitchen interior west wall below corridor (from CORR_Z1 to K_Z1)
  // Separates kitchen from reception on the left side of kitchen
  { start: [K_X0, CORR_Z1], end: [K_X0, K_Z1], thickness: INT_WALL, height: WALL_HEIGHT, isExterior: false },
];

// ============================================================
// DOORS
// ============================================================
export const doors: DoorOpening[] = [
  // 1. Entrance door: on the west wall, in the notch area
  //    Arc swings inward (east) into the space below the stairs
  {
    position: [0, NOTCH_H + 0.05],
    width: 1.0,
    height: DOOR_HEIGHT,
    wallDirection: "z",
    label: "Entrance",
  },

  // 2. Guest Toilet door: on GT's south wall (z=1.98)
  //    Arc swings north into the GT room
  {
    position: [GT_X0 + 0.45, GT_Z1],
    width: 0.70,
    height: DOOR_HEIGHT,
    wallDirection: "x",
  },

  // 3. Maid's Bathroom door: on MB's south wall (z=1.98)
  //    Arc swings north into the MB room
  {
    position: [MB_X0 + 0.45, MB_Z1],
    width: 0.70,
    height: DOOR_HEIGHT,
    wallDirection: "x",
  },

  // 4. Maid's Room door: on the wall between MB and MR (x=MB_X1)
  //    Entrance from Maid's Bathroom, arc swings east into MR
  //    Positioned near the north end of the shared wall
  {
    position: [MB_X1, 0.60],
    width: 0.80,
    height: DOOR_HEIGHT,
    wallDirection: "z",
  },

  // 5. Kitchen door: from corridor through MR/Kitchen wall (x=MR_X1)
  //    Arc swings east into the kitchen
  {
    position: [MR_X1, (CORR_Z0 + CORR_Z1) / 2],
    width: 0.90,
    height: DOOR_HEIGHT,
    wallDirection: "z",
  },

  // 6. Garden sliding door: on the south wall of reception (z=APT_DEPTH)
  //    Wide sliding glass door leading to the garden
  {
    position: [4.5, APT_DEPTH],
    width: 2.40,
    height: DOOR_HEIGHT,
    wallDirection: "x",
    label: "Garden",
  },
];

// ============================================================
// WINDOWS
// ============================================================
export const windows: WindowOpening[] = [
  // 1. Notch step wall windows: on the horizontal notch wall (z=NOTCH_H)
  //    Two small windows visible in the "C" area on the notch step wall
  {
    position: [NOTCH_W / 3, NOTCH_H],
    width: 0.60,
    height: WINDOW_HEIGHT,
    sillHeight: WINDOW_SILL,
    wallDirection: "x",
  },
  {
    position: [NOTCH_W * 2 / 3, NOTCH_H],
    width: 0.60,
    height: WINDOW_HEIGHT,
    sillHeight: WINDOW_SILL,
    wallDirection: "x",
  },

  // 2. West wall window (reception, upper): on the west wall of reception
  {
    position: [0, WALL_BELOW_ROOMS + 1.5],
    width: 1.50,
    height: WINDOW_HEIGHT,
    sillHeight: WINDOW_SILL,
    wallDirection: "z",
  },

  // 3. West wall window (reception, lower): second window on west wall
  {
    position: [0, APT_DEPTH - 1.8],
    width: 1.50,
    height: WINDOW_HEIGHT,
    sillHeight: WINDOW_SILL,
    wallDirection: "z",
  },

  // 4. Kitchen north wall window: at the top of the kitchen
  {
    position: [K_X0 + KIT_W / 2, 0],
    width: 1.20,
    height: WINDOW_HEIGHT,
    sillHeight: WINDOW_SILL,
    wallDirection: "x",
  },

  // 5. Kitchen east wall window: on the right side of the kitchen
  {
    position: [K_X1, 1.50],
    width: 1.20,
    height: WINDOW_HEIGHT,
    sillHeight: WINDOW_SILL,
    wallDirection: "z",
  },

  // 6. Maid's Room north wall window: at the top of MR
  {
    position: [(MR_X0 + MR_X1) / 2, 0],
    width: 1.00,
    height: WINDOW_HEIGHT,
    sillHeight: WINDOW_SILL,
    wallDirection: "x",
  },

  // 7. South wall window (reception): large window/sliding glass to garden
  //    Adjacent to the garden sliding door
  {
    position: [7.0, APT_DEPTH],
    width: 2.00,
    height: WINDOW_HEIGHT,
    sillHeight: 0.0,
    wallDirection: "x",
  },
];

// ============================================================
// DIMENSION LINES
// ============================================================
export const dimensionLines: DimensionLine[] = [
  // Top row room widths
  { start: [S_X0, 0], end: [S_X1, 0], label: `${STAIR_W}m`, offset: -0.4 },
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

  // Reception depths
  { start: [0, WALL_BELOW_ROOMS], end: [0, APT_DEPTH], label: `${REC_LEFT_D}m`, offset: -0.8 },
  { start: [REC_EAST, CORR_Z1], end: [REC_EAST, APT_DEPTH], label: `${REC_RIGHT_D}m`, offset: 0.8 },

  // Notch width
  { start: [0, NOTCH_H], end: [NOTCH_W, NOTCH_H], label: `${NOTCH_W}m`, offset: 0.3 },

  // Total top row width
  { start: [NOTCH_W, 0], end: [K_X1, 0], label: `${(K_X1 - NOTCH_W).toFixed(2)}m`, offset: -0.8 },
];

// ============================================================
// PROPERTY BOUNDS
// ============================================================
export const propertyBounds = {
  minX: -2,
  maxX: K_X1 + 4,
  minZ: -1.5,
  maxZ: APT_DEPTH + 4,
};

// Export computed values for renderers
export const APT_DIMS = {
  topWidth: K_X1,
  recEast: REC_EAST,
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
