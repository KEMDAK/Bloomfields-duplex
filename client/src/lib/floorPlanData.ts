/**
 * Floor Plan Data - Type DU1 Ground Floor (CORRECTED)
 * All dimensions in meters, true to scale from the architectural plan.
 * Coordinate system: X = width (left-right), Z = depth (top-bottom), Y = height
 * Origin (0,0) is at the top-left corner of the apartment exterior.
 *
 * LAYOUT (looking from above, north = top):
 * ┌─────────────────────────────────────┐
 * │  Reception (upper)  │ GuestToilet   │
 * │                     │───────────────│
 * │  [internal stairs]  │ Maid's Room   │
 * │                     │───────────────│
 * │  Reception (lower/  │   Kitchen     │
 * │   dining)           │               │
 * ├─────────────────────┴───────────────┤
 * │              Garden (bottom)         │
 * │                                      │
 * ├──────────┐                           │
 * │  Garden  │                           │
 * │  (left)  │                           │
 * └──────────┘                           │ <- L-shaped garden wraps left + bottom
 *
 * The top-right staircase visible in the plan is a SHARED BUILDING staircase
 * and is NOT part of this apartment — it is excluded from the model.
 */

export const WALL_HEIGHT = 3.0;
export const WALL_THICKNESS = 0.2;
export const DOOR_HEIGHT = 2.4;
export const DOOR_WIDTH_STANDARD = 0.9;
export const WINDOW_HEIGHT = 1.2;
export const WINDOW_SILL_HEIGHT = 0.9;

export const COLORS = {
  floor: 0x2a2a3e,
  wallExterior: 0x334455,
  wallInterior: 0x3a4a5a,
  wallEdge: 0x00d4ff,
  door: 0xffa500,
  window: 0x4488ff,
  windowGlass: 0x88ccff,
  grid: 0x1a1a2e,
  reception: 0x1a5c3a,
  kitchen: 0x5c3a1a,
  maidsRoom: 0x3a1a5c,
  guestToilet: 0x1a3a5c,
  garden: 0x2a5c2a,
  stairs: 0x4a5568,
  label: 0xffffff,
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
// APARTMENT DIMENSIONS (from plan)
// ============================================================
// Reception top width: 5.78m
// Reception left wall full depth: 11.72m
// Dining area: 3.93m wide
// Reception width at seating: 5.15m
// Kitchen: 4.12m wide × 3.31m deep
// Maid's room: 2.71m wide × ~2.71m deep
// Guest toilet: ~1.22m × 1.22m (with small corridor 1.22m)
// Corridor: 1.22m wide
// Internal staircase (dashed): ~3.93m × 5.15m area in reception

// Apartment bounding box:
// Width: 5.78 + 0.2 (wall) + corridor/rooms ≈ 10.0m
// Depth: 11.72m

const APT_WIDTH = 10.0;    // total apartment width
const APT_DEPTH = 11.72;   // total apartment depth
const RECEPTION_W = 5.78;  // reception width at top
const KITCHEN_W = 4.12;
const KITCHEN_D = 3.31;
const MAIDS_W = 2.71;
const MAIDS_D = 2.71;
const TOILET_W = 2.22;     // guest toilet + passage
const TOILET_D = 1.72;
const CORRIDOR_W = 1.22;

// Right-side rooms start X
const RIGHT_X = APT_WIDTH - KITCHEN_W; // 5.88
// Kitchen top Z
const KITCHEN_TOP_Z = APT_DEPTH - KITCHEN_D; // 8.41
// Maid's room
const MAIDS_TOP_Z = KITCHEN_TOP_Z - MAIDS_D - 0.2; // ~5.50
// Guest toilet
const TOILET_TOP_Z = MAIDS_TOP_Z - TOILET_D - 0.2; // ~3.58

// Garden L-shape: wraps left side and bottom of apartment
const GARDEN_LEFT_W = 3.5;   // garden strip on the left
const GARDEN_BOTTOM_D = 5.0; // garden strip on the bottom
const GARDEN_TOTAL_W = APT_WIDTH + GARDEN_LEFT_W; // full width at bottom

// ============================================================
// ROOMS
// ============================================================
export const rooms: Room[] = [
  {
    name: "Reception",
    vertices: [
      [0, 0],
      [RECEPTION_W, 0],
      [RECEPTION_W, 5.5],
      [RIGHT_X, 5.5],
      [RIGHT_X, APT_DEPTH],
      [0, APT_DEPTH],
    ],
    color: COLORS.reception,
    labelPosition: [2.89, 5.0],
    dimensions: "5.78m × 11.72m",
  },
  {
    name: "Kitchen",
    vertices: [
      [RIGHT_X, KITCHEN_TOP_Z],
      [APT_WIDTH, KITCHEN_TOP_Z],
      [APT_WIDTH, APT_DEPTH],
      [RIGHT_X, APT_DEPTH],
    ],
    color: COLORS.kitchen,
    labelPosition: [RIGHT_X + KITCHEN_W / 2, KITCHEN_TOP_Z + KITCHEN_D / 2],
    dimensions: "4.12m × 3.31m",
  },
  {
    name: "Maid's Room",
    vertices: [
      [RIGHT_X, MAIDS_TOP_Z],
      [RIGHT_X + MAIDS_W, MAIDS_TOP_Z],
      [RIGHT_X + MAIDS_W, MAIDS_TOP_Z + MAIDS_D],
      [RIGHT_X, MAIDS_TOP_Z + MAIDS_D],
    ],
    color: COLORS.maidsRoom,
    labelPosition: [RIGHT_X + MAIDS_W / 2, MAIDS_TOP_Z + MAIDS_D / 2],
    dimensions: "2.71m × 2.71m",
  },
  {
    name: "Guest Toilet",
    vertices: [
      [RIGHT_X, TOILET_TOP_Z],
      [RIGHT_X + TOILET_W, TOILET_TOP_Z],
      [RIGHT_X + TOILET_W, TOILET_TOP_Z + TOILET_D],
      [RIGHT_X, TOILET_TOP_Z + TOILET_D],
    ],
    color: COLORS.guestToilet,
    labelPosition: [RIGHT_X + TOILET_W / 2, TOILET_TOP_Z + TOILET_D / 2],
    dimensions: "2.22m × 1.72m",
  },
  {
    name: "Garden",
    // L-shaped: bottom strip + left strip
    // We define it as a polygon forming the L
    vertices: [
      [-GARDEN_LEFT_W, 0],                              // top-left of left strip
      [0, 0],                                            // where left strip meets apartment top
      [0, APT_DEPTH],                                    // bottom-left of apartment
      [APT_WIDTH, APT_DEPTH],                            // bottom-right of apartment
      [APT_WIDTH, APT_DEPTH + GARDEN_BOTTOM_D],          // bottom-right of bottom strip
      [-GARDEN_LEFT_W, APT_DEPTH + GARDEN_BOTTOM_D],     // bottom-left corner of L
    ],
    color: COLORS.garden,
    labelPosition: [2.0, APT_DEPTH + 2.5],
    dimensions: "Garden",
  },
];

// Internal staircase data (dashed rectangle in reception)
export const internalStairs = {
  x: 0.8,           // left edge of stair area
  z: 5.5,           // top edge of stair area
  width: 3.93,      // matches dining width dimension
  depth: 5.15,      // matches the 5.15 dimension
  stepCount: 16,
  goingUp: true,
};

// ============================================================
// WALLS
// ============================================================
export const walls: WallSegment[] = [
  // === APARTMENT EXTERIOR WALLS ===
  // Top wall (north)
  { start: [0, 0], end: [APT_WIDTH, 0], thickness: 0.25, height: WALL_HEIGHT, isExterior: true },
  // Left wall (west) of apartment
  { start: [0, 0], end: [0, APT_DEPTH], thickness: 0.25, height: WALL_HEIGHT, isExterior: true },
  // Bottom wall (south) of apartment
  { start: [0, APT_DEPTH], end: [APT_WIDTH, APT_DEPTH], thickness: 0.25, height: WALL_HEIGHT, isExterior: true },
  // Right wall (east) of apartment
  { start: [APT_WIDTH, 0], end: [APT_WIDTH, APT_DEPTH], thickness: 0.25, height: WALL_HEIGHT, isExterior: true },

  // === GARDEN BOUNDARY WALLS (low walls / fences) ===
  // Garden left boundary
  { start: [-GARDEN_LEFT_W, 0], end: [-GARDEN_LEFT_W, APT_DEPTH + GARDEN_BOTTOM_D], thickness: 0.15, height: WALL_HEIGHT * 0.35, isExterior: true },
  // Garden top boundary (left strip top)
  { start: [-GARDEN_LEFT_W, 0], end: [0, 0], thickness: 0.15, height: WALL_HEIGHT * 0.35, isExterior: true },
  // Garden bottom boundary
  { start: [-GARDEN_LEFT_W, APT_DEPTH + GARDEN_BOTTOM_D], end: [APT_WIDTH, APT_DEPTH + GARDEN_BOTTOM_D], thickness: 0.15, height: WALL_HEIGHT * 0.35, isExterior: true },
  // Garden right boundary (bottom strip right)
  { start: [APT_WIDTH, APT_DEPTH], end: [APT_WIDTH, APT_DEPTH + GARDEN_BOTTOM_D], thickness: 0.15, height: WALL_HEIGHT * 0.35, isExterior: true },

  // === INTERIOR WALLS ===
  // Reception right wall (upper portion)
  { start: [RECEPTION_W, 0], end: [RECEPTION_W, 5.5], thickness: 0.2, height: WALL_HEIGHT, isExterior: false },
  // Horizontal wall from reception right to right-side rooms
  { start: [RECEPTION_W, 5.5], end: [RIGHT_X, 5.5], thickness: 0.2, height: WALL_HEIGHT, isExterior: false },
  // Vertical wall separating reception from kitchen/corridor
  { start: [RIGHT_X, 5.5], end: [RIGHT_X, APT_DEPTH], thickness: 0.2, height: WALL_HEIGHT, isExterior: false },

  // Kitchen top wall
  { start: [RIGHT_X, KITCHEN_TOP_Z], end: [APT_WIDTH, KITCHEN_TOP_Z], thickness: 0.2, height: WALL_HEIGHT, isExterior: false },

  // Maid's room walls
  { start: [RIGHT_X, MAIDS_TOP_Z], end: [RIGHT_X + MAIDS_W, MAIDS_TOP_Z], thickness: 0.2, height: WALL_HEIGHT, isExterior: false },
  { start: [RIGHT_X + MAIDS_W, MAIDS_TOP_Z], end: [RIGHT_X + MAIDS_W, MAIDS_TOP_Z + MAIDS_D], thickness: 0.2, height: WALL_HEIGHT, isExterior: false },
  { start: [RIGHT_X, MAIDS_TOP_Z + MAIDS_D], end: [RIGHT_X + MAIDS_W, MAIDS_TOP_Z + MAIDS_D], thickness: 0.2, height: WALL_HEIGHT, isExterior: false },

  // Guest toilet walls
  { start: [RIGHT_X, TOILET_TOP_Z], end: [RIGHT_X + TOILET_W, TOILET_TOP_Z], thickness: 0.2, height: WALL_HEIGHT, isExterior: false },
  { start: [RIGHT_X + TOILET_W, TOILET_TOP_Z], end: [RIGHT_X + TOILET_W, TOILET_TOP_Z + TOILET_D], thickness: 0.2, height: WALL_HEIGHT, isExterior: false },
  { start: [RIGHT_X, TOILET_TOP_Z + TOILET_D], end: [RIGHT_X + TOILET_W, TOILET_TOP_Z + TOILET_D], thickness: 0.2, height: WALL_HEIGHT, isExterior: false },
];

// ============================================================
// DOORS
// ============================================================
export const doors: DoorOpening[] = [
  // Main entrance - right side of building
  {
    position: [APT_WIDTH, 5.0],
    width: 1.2,
    height: DOOR_HEIGHT,
    wallDirection: "z",
  },
  // Door from corridor to kitchen
  {
    position: [RIGHT_X + 1.5, KITCHEN_TOP_Z],
    width: DOOR_WIDTH_STANDARD,
    height: DOOR_HEIGHT,
    wallDirection: "x",
  },
  // Door to maid's room
  {
    position: [RIGHT_X, MAIDS_TOP_Z + 1.2],
    width: DOOR_WIDTH_STANDARD,
    height: DOOR_HEIGHT,
    wallDirection: "z",
  },
  // Door to guest toilet
  {
    position: [RIGHT_X, TOILET_TOP_Z + 0.7],
    width: 0.7,
    height: DOOR_HEIGHT,
    wallDirection: "z",
  },
  // Garden sliding door from reception (south wall)
  {
    position: [2.5, APT_DEPTH],
    width: 2.0,
    height: DOOR_HEIGHT,
    wallDirection: "x",
  },
  // Door from reception to corridor/right side
  {
    position: [RIGHT_X, 7.5],
    width: DOOR_WIDTH_STANDARD,
    height: DOOR_HEIGHT,
    wallDirection: "z",
  },
];

// ============================================================
// WINDOWS
// ============================================================
export const windows: WindowOpening[] = [
  // Reception left wall windows
  {
    position: [0, 3.0],
    width: 1.5,
    height: WINDOW_HEIGHT,
    sillHeight: WINDOW_SILL_HEIGHT,
    wallDirection: "z",
  },
  {
    position: [0, 7.0],
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
  // Kitchen south wall window
  {
    position: [RIGHT_X + 2.0, APT_DEPTH],
    width: 1.2,
    height: WINDOW_HEIGHT,
    sillHeight: WINDOW_SILL_HEIGHT,
    wallDirection: "x",
  },
  // Maid's room window (east wall)
  {
    position: [APT_WIDTH, MAIDS_TOP_Z + 1.35],
    width: 1.0,
    height: WINDOW_HEIGHT,
    sillHeight: WINDOW_SILL_HEIGHT,
    wallDirection: "z",
  },
];

// ============================================================
// BOUNDING BOX for the entire property (apartment + garden)
// Used to constrain the ground plane and grid
// ============================================================
export const propertyBounds = {
  minX: -GARDEN_LEFT_W,
  maxX: APT_WIDTH,
  minZ: 0,
  maxZ: APT_DEPTH + GARDEN_BOTTOM_D,
};
