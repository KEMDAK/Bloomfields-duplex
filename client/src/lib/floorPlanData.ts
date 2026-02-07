/**
 * Floor Plan Data - Type DU1 Ground Floor
 * All dimensions in meters, true to scale from the architectural plan.
 * Coordinate system: X = width (left-right), Z = depth (top-bottom), Y = height
 * Origin (0,0) is at the top-left corner of the building exterior.
 */

export const WALL_HEIGHT = 3.0; // Standard residential wall height
export const WALL_THICKNESS = 0.2; // ~20cm wall thickness
export const DOOR_HEIGHT = 2.4;
export const DOOR_WIDTH_STANDARD = 0.9;
export const WINDOW_HEIGHT = 1.2;
export const WINDOW_SILL_HEIGHT = 0.9;
export const WINDOW_WIDTH = 1.2;

// Colors
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
  staircase: 0x5c5c1a,
  garden: 0x2a5c2a,
  label: 0xffffff,
};

export interface WallSegment {
  start: [number, number]; // [x, z]
  end: [number, number]; // [x, z]
  thickness: number;
  height: number;
  isExterior: boolean;
}

export interface DoorOpening {
  position: [number, number]; // [x, z] center of door
  width: number;
  height: number;
  wallDirection: "x" | "z"; // which axis the wall runs along
  swingAngle?: number; // door swing direction in radians
}

export interface WindowOpening {
  position: [number, number]; // [x, z] center of window
  width: number;
  height: number;
  sillHeight: number;
  wallDirection: "x" | "z";
}

export interface Room {
  name: string;
  vertices: [number, number][]; // floor polygon vertices [x, z]
  color: number;
  labelPosition: [number, number]; // [x, z] for text label
  dimensions?: string; // display string
}

// ============================================================
// BUILDING GEOMETRY
// Based on the floor plan image analysis:
//
// The building footprint (looking from top):
// - Total width (left to right): ~11.72m (left wall) 
// - The building has an L-shape configuration
//
// Layout from the plan (top = north in our model):
// Top-left: Reception upper area (5.78m wide)
// Top-right: Staircase + Guest toilet
// Middle-left: Reception lower / dining area
// Middle-right: Maid's room + bathroom
// Bottom-left: Garden (outdoor)
// Bottom-right: Kitchen
// ============================================================

// Key reference points (all in meters from top-left corner of building):
// The building exterior envelope:
const B = {
  // Exterior boundaries
  leftX: 0,
  topZ: 0,
  
  // Reception area top wall
  receptionTopWidth: 5.78,
  
  // Right side of building
  rightX: 10.0, // Total building width
  
  // Reception full depth on left side
  receptionDepth: 11.72,
  
  // Interior partition positions
  receptionRightWallX: 5.78, // Right wall of reception at top
  kitchenRightX: 10.0,
  
  // Kitchen
  kitchenWidth: 4.12,
  kitchenDepth: 3.31,
  
  // Maid's room
  maidsRoomWidth: 2.71,
  maidsRoomDepth: 2.71,
  
  // Guest toilet
  guestToiletWidth: 1.22,
  guestToiletDepth: 1.22,
  
  // Staircase
  staircaseWidth: 1.98,
  
  // Corridor
  corridorWidth: 1.22,
  
  // Dining table area
  diningWidth: 3.93,
  
  // Door/passage widths
  passageWidth: 1.98,
};

// Computed positions
const rightSideX = B.receptionTopWidth + 0.2; // After reception right wall
const kitchenTopZ = B.receptionDepth - B.kitchenDepth;
const kitchenLeftX = B.rightX - B.kitchenWidth;
const maidsRoomLeftX = kitchenLeftX;
const maidsRoomTopZ = kitchenTopZ - B.maidsRoomDepth - 0.2;
const staircaseLeftX = B.rightX - B.staircaseWidth;
const guestToiletLeftX = maidsRoomLeftX;
const guestToiletTopZ = maidsRoomTopZ - B.guestToiletDepth - 0.2;

// ============================================================
// ROOMS
// ============================================================
export const rooms: Room[] = [
  {
    name: "Reception",
    vertices: [
      [0, 0],
      [B.receptionTopWidth, 0],
      [B.receptionTopWidth, 5.5],
      [kitchenLeftX - 0.2, 5.5],
      [kitchenLeftX - 0.2, B.receptionDepth],
      [0, B.receptionDepth],
    ],
    color: COLORS.reception,
    labelPosition: [2.89, 6.0],
    dimensions: "5.78m × 11.72m",
  },
  {
    name: "Kitchen",
    vertices: [
      [kitchenLeftX, kitchenTopZ],
      [B.rightX, kitchenTopZ],
      [B.rightX, B.receptionDepth],
      [kitchenLeftX, B.receptionDepth],
    ],
    color: COLORS.kitchen,
    labelPosition: [kitchenLeftX + B.kitchenWidth / 2, kitchenTopZ + B.kitchenDepth / 2],
    dimensions: "4.12m × 3.31m",
  },
  {
    name: "Maid's Room",
    vertices: [
      [maidsRoomLeftX, maidsRoomTopZ],
      [maidsRoomLeftX + B.maidsRoomWidth, maidsRoomTopZ],
      [maidsRoomLeftX + B.maidsRoomWidth, maidsRoomTopZ + B.maidsRoomDepth],
      [maidsRoomLeftX, maidsRoomTopZ + B.maidsRoomDepth],
    ],
    color: COLORS.maidsRoom,
    labelPosition: [
      maidsRoomLeftX + B.maidsRoomWidth / 2,
      maidsRoomTopZ + B.maidsRoomDepth / 2,
    ],
    dimensions: "2.71m × 2.71m",
  },
  {
    name: "Guest Toilet",
    vertices: [
      [guestToiletLeftX, guestToiletTopZ],
      [guestToiletLeftX + B.guestToiletWidth + 1.0, guestToiletTopZ],
      [guestToiletLeftX + B.guestToiletWidth + 1.0, guestToiletTopZ + B.guestToiletDepth + 0.5],
      [guestToiletLeftX, guestToiletTopZ + B.guestToiletDepth + 0.5],
    ],
    color: COLORS.guestToilet,
    labelPosition: [
      guestToiletLeftX + (B.guestToiletWidth + 1.0) / 2,
      guestToiletTopZ + (B.guestToiletDepth + 0.5) / 2,
    ],
    dimensions: "2.22m × 1.72m",
  },
  {
    name: "Staircase",
    vertices: [
      [staircaseLeftX, 0],
      [B.rightX, 0],
      [B.rightX, 3.5],
      [staircaseLeftX, 3.5],
    ],
    color: COLORS.staircase,
    labelPosition: [staircaseLeftX + B.staircaseWidth / 2, 1.75],
    dimensions: "1.98m × 3.50m",
  },
  {
    name: "Garden",
    vertices: [
      [0, B.receptionDepth + 0.2],
      [kitchenLeftX - 0.2, B.receptionDepth + 0.2],
      [kitchenLeftX - 0.2, B.receptionDepth + 5.0],
      [0, B.receptionDepth + 5.0],
    ],
    color: COLORS.garden,
    labelPosition: [2.5, B.receptionDepth + 2.6],
    dimensions: "Garden",
  },
];

// ============================================================
// WALLS
// ============================================================
export const walls: WallSegment[] = [
  // === EXTERIOR WALLS ===
  // Top wall (north) - full width
  { start: [0, 0], end: [B.rightX, 0], thickness: 0.25, height: WALL_HEIGHT, isExterior: true },
  // Left wall (west) - full depth including garden boundary
  { start: [0, 0], end: [0, B.receptionDepth + 5.0], thickness: 0.25, height: WALL_HEIGHT, isExterior: true },
  // Bottom wall of reception/building
  { start: [0, B.receptionDepth], end: [B.rightX, B.receptionDepth], thickness: 0.25, height: WALL_HEIGHT, isExterior: true },
  // Right wall (east) - full depth
  { start: [B.rightX, 0], end: [B.rightX, B.receptionDepth], thickness: 0.25, height: WALL_HEIGHT, isExterior: true },
  // Garden bottom wall
  { start: [0, B.receptionDepth + 5.0], end: [kitchenLeftX - 0.2, B.receptionDepth + 5.0], thickness: 0.25, height: WALL_HEIGHT * 0.4, isExterior: true },
  // Garden right wall
  { start: [kitchenLeftX - 0.2, B.receptionDepth], end: [kitchenLeftX - 0.2, B.receptionDepth + 5.0], thickness: 0.25, height: WALL_HEIGHT * 0.4, isExterior: true },

  // === INTERIOR WALLS ===
  // Reception right wall (upper portion - from top to corridor)
  { start: [B.receptionTopWidth, 0], end: [B.receptionTopWidth, 5.5], thickness: 0.2, height: WALL_HEIGHT, isExterior: false },
  // Wall between reception and kitchen/maid's area
  { start: [kitchenLeftX - 0.2, 5.5], end: [kitchenLeftX - 0.2, B.receptionDepth], thickness: 0.2, height: WALL_HEIGHT, isExterior: false },
  // Horizontal wall connecting reception right wall to right side rooms
  { start: [B.receptionTopWidth, 5.5], end: [kitchenLeftX - 0.2, 5.5], thickness: 0.2, height: WALL_HEIGHT, isExterior: false },
  
  // Kitchen top wall
  { start: [kitchenLeftX, kitchenTopZ], end: [B.rightX, kitchenTopZ], thickness: 0.2, height: WALL_HEIGHT, isExterior: false },
  // Kitchen left wall
  { start: [kitchenLeftX, kitchenTopZ], end: [kitchenLeftX, B.receptionDepth], thickness: 0.2, height: WALL_HEIGHT, isExterior: false },
  
  // Maid's room walls
  { start: [maidsRoomLeftX, maidsRoomTopZ], end: [maidsRoomLeftX + B.maidsRoomWidth, maidsRoomTopZ], thickness: 0.2, height: WALL_HEIGHT, isExterior: false },
  { start: [maidsRoomLeftX, maidsRoomTopZ], end: [maidsRoomLeftX, maidsRoomTopZ + B.maidsRoomDepth], thickness: 0.2, height: WALL_HEIGHT, isExterior: false },
  { start: [maidsRoomLeftX + B.maidsRoomWidth, maidsRoomTopZ], end: [maidsRoomLeftX + B.maidsRoomWidth, maidsRoomTopZ + B.maidsRoomDepth], thickness: 0.2, height: WALL_HEIGHT, isExterior: false },
  { start: [maidsRoomLeftX, maidsRoomTopZ + B.maidsRoomDepth], end: [maidsRoomLeftX + B.maidsRoomWidth, maidsRoomTopZ + B.maidsRoomDepth], thickness: 0.2, height: WALL_HEIGHT, isExterior: false },
  
  // Guest toilet walls
  { start: [guestToiletLeftX, guestToiletTopZ], end: [guestToiletLeftX + B.guestToiletWidth + 1.0, guestToiletTopZ], thickness: 0.2, height: WALL_HEIGHT, isExterior: false },
  { start: [guestToiletLeftX, guestToiletTopZ], end: [guestToiletLeftX, guestToiletTopZ + B.guestToiletDepth + 0.5], thickness: 0.2, height: WALL_HEIGHT, isExterior: false },
  { start: [guestToiletLeftX + B.guestToiletWidth + 1.0, guestToiletTopZ], end: [guestToiletLeftX + B.guestToiletWidth + 1.0, guestToiletTopZ + B.guestToiletDepth + 0.5], thickness: 0.2, height: WALL_HEIGHT, isExterior: false },
  { start: [guestToiletLeftX, guestToiletTopZ + B.guestToiletDepth + 0.5], end: [guestToiletLeftX + B.guestToiletWidth + 1.0, guestToiletTopZ + B.guestToiletDepth + 0.5], thickness: 0.2, height: WALL_HEIGHT, isExterior: false },
  
  // Staircase walls
  { start: [staircaseLeftX, 0], end: [staircaseLeftX, 3.5], thickness: 0.2, height: WALL_HEIGHT, isExterior: false },
  { start: [staircaseLeftX, 3.5], end: [B.rightX, 3.5], thickness: 0.2, height: WALL_HEIGHT, isExterior: false },
];

// ============================================================
// DOORS
// ============================================================
export const doors: DoorOpening[] = [
  // Main entrance - right side of building
  {
    position: [B.rightX, 5.0],
    width: 1.2,
    height: DOOR_HEIGHT,
    wallDirection: "z",
    swingAngle: Math.PI / 2,
  },
  // Door from reception to kitchen area
  {
    position: [kitchenLeftX - 0.2, 7.5],
    width: DOOR_WIDTH_STANDARD,
    height: DOOR_HEIGHT,
    wallDirection: "z",
  },
  // Door to maid's room
  {
    position: [maidsRoomLeftX, maidsRoomTopZ + 1.2],
    width: DOOR_WIDTH_STANDARD,
    height: DOOR_HEIGHT,
    wallDirection: "z",
  },
  // Door to guest toilet
  {
    position: [guestToiletLeftX, guestToiletTopZ + 0.7],
    width: 0.7,
    height: DOOR_HEIGHT,
    wallDirection: "z",
  },
  // Door to staircase
  {
    position: [staircaseLeftX, 1.5],
    width: DOOR_WIDTH_STANDARD,
    height: DOOR_HEIGHT,
    wallDirection: "z",
  },
  // Kitchen door
  {
    position: [kitchenLeftX + 1.5, kitchenTopZ],
    width: DOOR_WIDTH_STANDARD,
    height: DOOR_HEIGHT,
    wallDirection: "x",
  },
  // Garden sliding door from reception
  {
    position: [2.5, B.receptionDepth],
    width: 2.0,
    height: DOOR_HEIGHT,
    wallDirection: "x",
  },
];

// ============================================================
// WINDOWS
// ============================================================
export const windows: WindowOpening[] = [
  // Reception left wall windows (2 windows)
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
  // Kitchen bottom wall window
  {
    position: [kitchenLeftX + 2.0, B.receptionDepth],
    width: 1.2,
    height: WINDOW_HEIGHT,
    sillHeight: WINDOW_SILL_HEIGHT,
    wallDirection: "x",
  },
  // Maid's room window (right wall)
  {
    position: [maidsRoomLeftX + B.maidsRoomWidth, maidsRoomTopZ + 1.35],
    width: 1.0,
    height: WINDOW_HEIGHT,
    sillHeight: WINDOW_SILL_HEIGHT,
    wallDirection: "z",
  },
  // Staircase window
  {
    position: [B.rightX, 1.5],
    width: 1.0,
    height: WINDOW_HEIGHT,
    sillHeight: WINDOW_SILL_HEIGHT,
    wallDirection: "z",
  },
];
