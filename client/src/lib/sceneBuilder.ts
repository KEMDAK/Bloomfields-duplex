/**
 * Scene Builder - Constructs the 3D floor plan from data (CORRECTED)
 * - L-shaped garden
 * - Internal staircase inside reception
 * - Ground/grid only within property bounds
 */
import * as THREE from "three";
import {
  walls,
  doors,
  windows,
  rooms,
  internalStairs,
  propertyBounds,
  COLORS,
  WALL_HEIGHT,
  type WallSegment,
} from "./floorPlanData";

// Center offset: center the property in the scene
const CENTER_X = (propertyBounds.minX + propertyBounds.maxX) / 2;
const CENTER_Z = (propertyBounds.minZ + propertyBounds.maxZ) / 2;

function toWorld(x: number, z: number): [number, number] {
  return [x - CENTER_X, z - CENTER_Z];
}

/**
 * Create ground plane ONLY within the property bounds
 */
export function createGrid(): THREE.Group {
  const group = new THREE.Group();

  const propW = propertyBounds.maxX - propertyBounds.minX;
  const propD = propertyBounds.maxZ - propertyBounds.minZ;
  const [cx, cz] = toWorld(
    (propertyBounds.minX + propertyBounds.maxX) / 2,
    (propertyBounds.minZ + propertyBounds.maxZ) / 2
  );

  // Ground plane sized to property
  const groundGeo = new THREE.PlaneGeometry(propW + 1, propD + 1);
  const groundMat = new THREE.MeshStandardMaterial({
    color: 0x0d1117,
    roughness: 0.9,
    metalness: 0.1,
  });
  const ground = new THREE.Mesh(groundGeo, groundMat);
  ground.rotation.x = -Math.PI / 2;
  ground.position.set(cx, -0.01, cz);
  ground.receiveShadow = true;
  group.add(ground);

  // Grid helper sized to property
  const gridSize = Math.max(propW, propD) + 2;
  const gridDivisions = Math.round(gridSize);
  const gridHelper = new THREE.GridHelper(gridSize, gridDivisions, 0x1a2a3a, 0x111a24);
  gridHelper.position.set(cx, 0.0, cz);
  group.add(gridHelper);

  return group;
}

/**
 * Create floor polygons for each room
 */
export function createFloors(): THREE.Group {
  const group = new THREE.Group();

  rooms.forEach((room) => {
    const shape = new THREE.Shape();
    const [sx, sz] = toWorld(room.vertices[0][0], room.vertices[0][1]);
    shape.moveTo(sx, -sz);
    for (let i = 1; i < room.vertices.length; i++) {
      const [vx, vz] = toWorld(room.vertices[i][0], room.vertices[i][1]);
      shape.lineTo(vx, -vz);
    }
    shape.closePath();

    const geo = new THREE.ShapeGeometry(shape);
    const mat = new THREE.MeshStandardMaterial({
      color: room.color,
      transparent: true,
      opacity: 0.4,
      roughness: 0.8,
      side: THREE.DoubleSide,
    });
    const mesh = new THREE.Mesh(geo, mat);
    mesh.rotation.x = -Math.PI / 2;
    mesh.position.y = 0.01;
    mesh.receiveShadow = true;
    mesh.userData = { type: "floor", room: room.name };
    group.add(mesh);
  });

  return group;
}

/**
 * Create wall meshes with door and window cutouts
 */
export function createWalls(): THREE.Group {
  const group = new THREE.Group();
  walls.forEach((wall) => {
    createWallWithOpenings(wall, group);
  });
  return group;
}

function createWallWithOpenings(wall: WallSegment, group: THREE.Group) {
  const [sx, sz] = toWorld(wall.start[0], wall.start[1]);
  const [ex, ez] = toWorld(wall.end[0], wall.end[1]);

  const dx = ex - sx;
  const dz = ez - sz;
  const length = Math.sqrt(dx * dx + dz * dz);
  const angle = Math.atan2(dz, dx);

  const wallOpenings = findOpeningsOnWall(wall);

  if (wallOpenings.length === 0) {
    const geo = new THREE.BoxGeometry(length, wall.height, wall.thickness);
    const mat = new THREE.MeshStandardMaterial({
      color: wall.isExterior ? COLORS.wallExterior : COLORS.wallInterior,
      transparent: true,
      opacity: 0.7,
      roughness: 0.6,
    });
    const mesh = new THREE.Mesh(geo, mat);
    mesh.position.set(sx + dx / 2, wall.height / 2, sz + dz / 2);
    mesh.rotation.y = -angle;
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    group.add(mesh);
    addWallEdges(mesh, length, wall.height, wall.thickness, wall.isExterior);
  } else {
    createSegmentedWall(wall, wallOpenings, sx, sz, dx, dz, length, angle, group);
  }
}

interface WallOpening {
  type: "door" | "window";
  positionAlongWall: number;
  width: number;
  height: number;
  bottomY: number;
}

function findOpeningsOnWall(wall: WallSegment): WallOpening[] {
  const openings: WallOpening[] = [];

  doors.forEach((door) => {
    const t = projectOntoWall(door.position, wall);
    if (t !== null) {
      openings.push({
        type: "door",
        positionAlongWall: t,
        width: door.width,
        height: door.height,
        bottomY: 0,
      });
    }
  });

  windows.forEach((win) => {
    const t = projectOntoWall(win.position, wall);
    if (t !== null) {
      openings.push({
        type: "window",
        positionAlongWall: t,
        width: win.width,
        height: win.height,
        bottomY: win.sillHeight,
      });
    }
  });

  openings.sort((a, b) => a.positionAlongWall - b.positionAlongWall);
  return openings;
}

function projectOntoWall(point: [number, number], wall: WallSegment): number | null {
  const [px, pz] = point;
  const [wsx, wsz] = wall.start;
  const [wex, wez] = wall.end;
  const wdx = wex - wsx;
  const wdz = wez - wsz;
  const wallLen = Math.sqrt(wdx * wdx + wdz * wdz);

  const t = ((px - wsx) * wdx + (pz - wsz) * wdz) / (wallLen * wallLen);
  const closestX = wsx + t * wdx;
  const closestZ = wsz + t * wdz;
  const dist = Math.sqrt((px - closestX) ** 2 + (pz - closestZ) ** 2);

  if (dist < 0.3 && t >= -0.05 && t <= 1.05) {
    return Math.max(0, Math.min(1, t));
  }
  return null;
}

function createSegmentedWall(
  wall: WallSegment,
  openings: WallOpening[],
  sx: number, sz: number,
  dx: number, dz: number,
  totalLength: number,
  angle: number,
  group: THREE.Group
) {
  const mat = new THREE.MeshStandardMaterial({
    color: wall.isExterior ? COLORS.wallExterior : COLORS.wallInterior,
    transparent: true,
    opacity: 0.7,
    roughness: 0.6,
  });

  let currentT = 0;

  openings.forEach((opening) => {
    const openingHalfWidth = opening.width / (2 * totalLength);
    const openingStart = opening.positionAlongWall - openingHalfWidth;
    const openingEnd = opening.positionAlongWall + openingHalfWidth;

    if (openingStart > currentT + 0.01) {
      const segLen = (openingStart - currentT) * totalLength;
      const segMidT = (currentT + openingStart) / 2;
      createWallSegment(sx + segMidT * dx, sz + segMidT * dz, segLen, wall.height, wall.thickness, angle, mat, wall.isExterior, group);
    }

    const segLen = opening.width;
    const segMidT = opening.positionAlongWall;
    const posX = sx + segMidT * dx;
    const posZ = sz + segMidT * dz;

    if (opening.type === "window") {
      if (opening.bottomY > 0.05) {
        createWallSegment(posX, posZ, segLen, opening.bottomY, wall.thickness, angle, mat, wall.isExterior, group, 0);
      }
      const topOfWindow = opening.bottomY + opening.height;
      if (topOfWindow < wall.height - 0.05) {
        createWallSegment(posX, posZ, segLen, wall.height - topOfWindow, wall.thickness, angle, mat, wall.isExterior, group, topOfWindow);
      }
      createWindowMesh(posX, posZ, segLen, opening.height, opening.bottomY, angle, group);
    }

    if (opening.type === "door") {
      if (opening.height < wall.height - 0.05) {
        createWallSegment(posX, posZ, segLen, wall.height - opening.height, wall.thickness, angle, mat, wall.isExterior, group, opening.height);
      }
      createDoorFrame(posX, posZ, segLen, opening.height, angle, group);
    }

    currentT = openingEnd;
  });

  if (currentT < 0.99) {
    const segLen = (1 - currentT) * totalLength;
    const segMidT = (currentT + 1) / 2;
    createWallSegment(sx + segMidT * dx, sz + segMidT * dz, segLen, wall.height, wall.thickness, angle, mat, wall.isExterior, group);
  }
}

function createWallSegment(
  x: number, z: number,
  length: number, height: number, thickness: number,
  angle: number, material: THREE.Material,
  isExterior: boolean, group: THREE.Group,
  baseY: number = 0
) {
  const geo = new THREE.BoxGeometry(length, height, thickness);
  const mesh = new THREE.Mesh(geo, material);
  mesh.position.set(x, baseY + height / 2, z);
  mesh.rotation.y = -angle;
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  group.add(mesh);
  addWallEdges(mesh, length, height, thickness, isExterior);
}

function addWallEdges(parent: THREE.Mesh, length: number, height: number, thickness: number, isExterior: boolean) {
  const edgesGeo = new THREE.EdgesGeometry(new THREE.BoxGeometry(length + 0.01, height + 0.01, thickness + 0.01));
  const edgesMat = new THREE.LineBasicMaterial({
    color: isExterior ? COLORS.wallEdge : 0x336688,
    transparent: true,
    opacity: isExterior ? 0.6 : 0.3,
  });
  parent.add(new THREE.LineSegments(edgesGeo, edgesMat));
}

function createWindowMesh(x: number, z: number, width: number, height: number, sillHeight: number, angle: number, group: THREE.Group) {
  const geo = new THREE.PlaneGeometry(width, height);
  const mat = new THREE.MeshStandardMaterial({
    color: COLORS.windowGlass,
    transparent: true,
    opacity: 0.3,
    side: THREE.DoubleSide,
    roughness: 0.1,
    metalness: 0.5,
  });
  const mesh = new THREE.Mesh(geo, mat);
  mesh.position.set(x, sillHeight + height / 2, z);
  mesh.rotation.y = -angle;
  group.add(mesh);

  const frameGeo = new THREE.EdgesGeometry(new THREE.PlaneGeometry(width, height));
  const frameMat = new THREE.LineBasicMaterial({ color: COLORS.window, linewidth: 2 });
  mesh.add(new THREE.LineSegments(frameGeo, frameMat));

  // Cross bars
  const barMat = new THREE.LineBasicMaterial({ color: COLORS.window, transparent: true, opacity: 0.6 });
  const hGeo = new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(-width / 2, 0, 0.01), new THREE.Vector3(width / 2, 0, 0.01)]);
  mesh.add(new THREE.Line(hGeo, barMat));
  const vGeo = new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(0, -height / 2, 0.01), new THREE.Vector3(0, height / 2, 0.01)]);
  mesh.add(new THREE.Line(vGeo, barMat));
}

function createDoorFrame(x: number, z: number, width: number, height: number, angle: number, group: THREE.Group) {
  // Door panel (slightly open)
  const panelGeo = new THREE.PlaneGeometry(width * 0.95, height * 0.95);
  const panelMat = new THREE.MeshStandardMaterial({
    color: 0x8B6914,
    transparent: true,
    opacity: 0.5,
    side: THREE.DoubleSide,
    roughness: 0.7,
  });
  const panel = new THREE.Mesh(panelGeo, panelMat);
  panel.position.set(x, height / 2, z);
  panel.rotation.y = -angle + 0.4;
  group.add(panel);

  // Door frame outline
  const frameShape = new THREE.Shape();
  frameShape.moveTo(-width / 2, 0);
  frameShape.lineTo(-width / 2, height);
  frameShape.lineTo(width / 2, height);
  frameShape.lineTo(width / 2, 0);
  const framePoints = frameShape.getPoints(20);
  const frameGeo = new THREE.BufferGeometry().setFromPoints(framePoints.map((p) => new THREE.Vector3(p.x, p.y, 0)));
  const frameLine = new THREE.Line(frameGeo, new THREE.LineBasicMaterial({ color: COLORS.door }));
  frameLine.position.set(x, 0, z);
  frameLine.rotation.y = -angle;
  group.add(frameLine);
}

/**
 * Create internal staircase inside the reception
 */
export function createStairs(): THREE.Group {
  const group = new THREE.Group();

  const s = internalStairs;
  const [baseX, baseZ] = toWorld(s.x, s.z);
  const stepCount = s.stepCount;
  const stepWidth = s.width;
  const stepDepth = s.depth / stepCount;
  const stepHeight = WALL_HEIGHT / stepCount;

  const stepMat = new THREE.MeshStandardMaterial({
    color: COLORS.stairs,
    roughness: 0.7,
  });

  for (let i = 0; i < stepCount; i++) {
    const geo = new THREE.BoxGeometry(stepWidth, stepHeight, stepDepth * 0.9);
    const step = new THREE.Mesh(geo, stepMat);
    step.position.set(
      baseX + stepWidth / 2,
      stepHeight * i + stepHeight / 2,
      baseZ + i * stepDepth + stepDepth / 2
    );
    step.castShadow = true;
    step.receiveShadow = true;
    group.add(step);

    // Step edge highlight
    const edgeGeo = new THREE.EdgesGeometry(geo);
    const edgeMat = new THREE.LineBasicMaterial({ color: 0x667788, transparent: true, opacity: 0.4 });
    step.add(new THREE.LineSegments(edgeGeo, edgeMat));
  }

  // Staircase outline (dashed rectangle on floor)
  const [outlineX, outlineZ] = toWorld(s.x, s.z);
  const [outlineX2, outlineZ2] = toWorld(s.x + s.width, s.z + s.depth);
  const outlinePoints = [
    new THREE.Vector3(outlineX, 0.02, outlineZ),
    new THREE.Vector3(outlineX2, 0.02, outlineZ),
    new THREE.Vector3(outlineX2, 0.02, outlineZ2),
    new THREE.Vector3(outlineX, 0.02, outlineZ2),
    new THREE.Vector3(outlineX, 0.02, outlineZ),
  ];
  const outlineGeo = new THREE.BufferGeometry().setFromPoints(outlinePoints);
  const outlineMat = new THREE.LineDashedMaterial({
    color: 0x00d4ff,
    dashSize: 0.3,
    gapSize: 0.15,
    transparent: true,
    opacity: 0.5,
  });
  const outline = new THREE.Line(outlineGeo, outlineMat);
  outline.computeLineDistances();
  group.add(outline);

  // "Stairs" label
  const sprite = makeTextSprite("Internal Stairs", {
    fontSize: 36,
    fontWeight: "bold",
    color: "#a0aec0",
    backgroundColor: "rgba(0,0,0,0.4)",
    padding: 8,
  });
  const [labelX, labelZ] = toWorld(s.x + s.width / 2, s.z + s.depth / 2);
  sprite.position.set(labelX, 1.8, labelZ);
  sprite.scale.set(2.5, 0.8, 1);
  group.add(sprite);

  return group;
}

/**
 * Create room labels as sprites
 */
export function createLabels(): THREE.Group {
  const group = new THREE.Group();

  rooms.forEach((room) => {
    const [lx, lz] = toWorld(room.labelPosition[0], room.labelPosition[1]);

    const nameSprite = makeTextSprite(room.name, {
      fontSize: 48,
      fontWeight: "bold",
      color: "#ffffff",
      backgroundColor: "rgba(0,0,0,0.5)",
      padding: 12,
    });
    nameSprite.position.set(lx, 0.15, lz);
    nameSprite.scale.set(2.5, 1.0, 1);
    group.add(nameSprite);

    if (room.dimensions) {
      const dimSprite = makeTextSprite(room.dimensions, {
        fontSize: 32,
        color: "#00d4ff",
        backgroundColor: "rgba(0,0,0,0.3)",
        padding: 8,
      });
      dimSprite.position.set(lx, 0.1, lz + 0.6);
      dimSprite.scale.set(2.0, 0.6, 1);
      group.add(dimSprite);
    }
  });

  return group;
}

interface SpriteOptions {
  fontSize?: number;
  fontWeight?: string;
  color?: string;
  backgroundColor?: string;
  padding?: number;
}

function makeTextSprite(text: string, opts: SpriteOptions = {}): THREE.Sprite {
  const { fontSize = 36, fontWeight = "normal", color = "#ffffff", backgroundColor = "rgba(0,0,0,0.5)", padding = 10 } = opts;

  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d")!;

  ctx.font = `${fontWeight} ${fontSize}px 'JetBrains Mono', 'Courier New', monospace`;
  const metrics = ctx.measureText(text);
  const textWidth = metrics.width;

  canvas.width = textWidth + padding * 2;
  canvas.height = fontSize + padding * 2;

  ctx.fillStyle = backgroundColor;
  ctx.roundRect(0, 0, canvas.width, canvas.height, 6);
  ctx.fill();

  ctx.font = `${fontWeight} ${fontSize}px 'JetBrains Mono', 'Courier New', monospace`;
  ctx.fillStyle = color;
  ctx.textBaseline = "middle";
  ctx.textAlign = "center";
  ctx.fillText(text, canvas.width / 2, canvas.height / 2);

  const texture = new THREE.CanvasTexture(canvas);
  texture.minFilter = THREE.LinearFilter;

  const mat = new THREE.SpriteMaterial({ map: texture, transparent: true, depthTest: false });
  return new THREE.Sprite(mat);
}

/**
 * Create dimension lines in 3D space
 */
export function createDimensionLines(): THREE.Group {
  const group = new THREE.Group();

  const dimensionData = [
    { start: [0, 0] as [number, number], end: [5.78, 0] as [number, number], label: "5.78m", offset: -0.8 },
    { start: [0, 0] as [number, number], end: [0, 11.72] as [number, number], label: "11.72m", offset: -0.8 },
    { start: [5.88, 11.72] as [number, number], end: [10.0, 11.72] as [number, number], label: "4.12m", offset: 0.8 },
    { start: [10.0, 8.41] as [number, number], end: [10.0, 11.72] as [number, number], label: "3.31m", offset: 0.8 },
    { start: [5.88, 5.5] as [number, number], end: [8.59, 5.5] as [number, number], label: "2.71m", offset: -0.5 },
    { start: [0.8, 10.65] as [number, number], end: [4.73, 10.65] as [number, number], label: "3.93m", offset: 0.5 },
    { start: [2.0, 5.5] as [number, number], end: [2.0, 10.65] as [number, number], label: "5.15m", offset: -0.5 },
  ];

  dimensionData.forEach((dim) => {
    const [sx, sz] = toWorld(dim.start[0], dim.start[1]);
    const [ex, ez] = toWorld(dim.end[0], dim.end[1]);

    const isHorizontal = Math.abs(sz - ez) < 0.1;
    const offsetX = isHorizontal ? 0 : dim.offset;
    const offsetZ = isHorizontal ? dim.offset : 0;

    const points = [
      new THREE.Vector3(sx + offsetX, 0.05, sz + offsetZ),
      new THREE.Vector3(ex + offsetX, 0.05, ez + offsetZ),
    ];
    const lineGeo = new THREE.BufferGeometry().setFromPoints(points);
    const lineMat = new THREE.LineBasicMaterial({ color: 0x00d4ff, transparent: true, opacity: 0.5 });
    group.add(new THREE.Line(lineGeo, lineMat));

    // Extension lines
    const extMat = new THREE.LineBasicMaterial({ color: 0x00d4ff, transparent: true, opacity: 0.3 });
    group.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints([
      new THREE.Vector3(sx, 0.05, sz),
      new THREE.Vector3(sx + offsetX, 0.05, sz + offsetZ),
    ]), extMat));
    group.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints([
      new THREE.Vector3(ex, 0.05, ez),
      new THREE.Vector3(ex + offsetX, 0.05, ez + offsetZ),
    ]), extMat));

    // Label
    const midX = (sx + ex) / 2 + offsetX;
    const midZ = (sz + ez) / 2 + offsetZ;
    const sprite = makeTextSprite(dim.label, {
      fontSize: 28,
      color: "#00d4ff",
      backgroundColor: "rgba(13,17,23,0.8)",
      padding: 6,
    });
    sprite.position.set(midX, 0.2, midZ);
    sprite.scale.set(1.5, 0.5, 1);
    group.add(sprite);
  });

  return group;
}

/**
 * Setup scene lighting
 */
export function setupLighting(scene: THREE.Scene) {
  const ambient = new THREE.AmbientLight(0x334466, 0.8);
  scene.add(ambient);

  const dirLight = new THREE.DirectionalLight(0xffffff, 1.0);
  dirLight.position.set(10, 15, 10);
  dirLight.castShadow = true;
  dirLight.shadow.mapSize.width = 2048;
  dirLight.shadow.mapSize.height = 2048;
  dirLight.shadow.camera.near = 0.5;
  dirLight.shadow.camera.far = 50;
  dirLight.shadow.camera.left = -15;
  dirLight.shadow.camera.right = 15;
  dirLight.shadow.camera.top = 15;
  dirLight.shadow.camera.bottom = -15;
  scene.add(dirLight);

  const fillLight = new THREE.DirectionalLight(0x4488aa, 0.4);
  fillLight.position.set(-5, 8, -5);
  scene.add(fillLight);

  const hemiLight = new THREE.HemisphereLight(0x1a2a4a, 0x0a0a0a, 0.5);
  scene.add(hemiLight);
}
