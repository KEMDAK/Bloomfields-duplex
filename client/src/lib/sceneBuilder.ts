/**
 * Scene Builder - Constructs the 3D floor plan from data
 * Architectural Blueprint Aesthetic: dark canvas, cyan wireframes, color-coded rooms
 */
import * as THREE from "three";
import {
  walls,
  doors,
  windows,
  rooms,
  COLORS,
  WALL_HEIGHT,
  type WallSegment,
  type DoorOpening,
  type WindowOpening,
} from "./floorPlanData";

// Center offset to place the building centered at origin
const CENTER_X = 5.0;
const CENTER_Z = 6.0;

function toWorld(x: number, z: number): [number, number] {
  return [x - CENTER_X, z - CENTER_Z];
}

/**
 * Create the ground grid plane
 */
export function createGrid(): THREE.Group {
  const group = new THREE.Group();

  // Large ground plane
  const groundGeo = new THREE.PlaneGeometry(40, 40);
  const groundMat = new THREE.MeshStandardMaterial({
    color: 0x0d1117,
    roughness: 0.9,
    metalness: 0.1,
  });
  const ground = new THREE.Mesh(groundGeo, groundMat);
  ground.rotation.x = -Math.PI / 2;
  ground.position.y = -0.01;
  ground.receiveShadow = true;
  group.add(ground);

  // Grid helper
  const gridHelper = new THREE.GridHelper(40, 40, 0x1a2a3a, 0x111a24);
  gridHelper.position.y = 0.0;
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

  // Find openings (doors and windows) that intersect this wall
  const wallOpenings = findOpeningsOnWall(wall);

  if (wallOpenings.length === 0) {
    // Simple wall without openings
    const geo = new THREE.BoxGeometry(length, wall.height, wall.thickness);
    const mat = new THREE.MeshStandardMaterial({
      color: wall.isExterior ? COLORS.wallExterior : COLORS.wallInterior,
      transparent: true,
      opacity: 0.7,
      roughness: 0.6,
    });
    const mesh = new THREE.Mesh(geo, mat);
    mesh.position.set(
      sx + dx / 2,
      wall.height / 2,
      sz + dz / 2
    );
    mesh.rotation.y = -angle;
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    mesh.userData = { type: "wall" };
    group.add(mesh);

    // Edge glow lines
    addWallEdges(mesh, length, wall.height, wall.thickness, wall.isExterior);
  } else {
    // Wall with openings - create segments between openings
    createSegmentedWall(wall, wallOpenings, sx, sz, dx, dz, length, angle, group);
  }
}

interface WallOpening {
  type: "door" | "window";
  positionAlongWall: number; // 0 to 1 fraction along wall
  width: number;
  height: number;
  bottomY: number; // 0 for doors, sillHeight for windows
}

function findOpeningsOnWall(wall: WallSegment): WallOpening[] {
  const openings: WallOpening[] = [];
  const [wsx, wsz] = wall.start;
  const [wex, wez] = wall.end;
  const wdx = wex - wsx;
  const wdz = wez - wsz;
  const wallLen = Math.sqrt(wdx * wdx + wdz * wdz);

  // Check doors
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

  // Check windows
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

function projectOntoWall(
  point: [number, number],
  wall: WallSegment
): number | null {
  const [px, pz] = point;
  const [wsx, wsz] = wall.start;
  const [wex, wez] = wall.end;
  const wdx = wex - wsx;
  const wdz = wez - wsz;
  const wallLen = Math.sqrt(wdx * wdx + wdz * wdz);

  // Project point onto wall line
  const t = ((px - wsx) * wdx + (pz - wsz) * wdz) / (wallLen * wallLen);

  // Check perpendicular distance
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
  sx: number,
  sz: number,
  dx: number,
  dz: number,
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

  // Create wall segments between openings
  let currentT = 0;

  openings.forEach((opening) => {
    const openingHalfWidth = opening.width / (2 * totalLength);
    const openingStart = opening.positionAlongWall - openingHalfWidth;
    const openingEnd = opening.positionAlongWall + openingHalfWidth;

    // Wall segment before this opening
    if (openingStart > currentT + 0.01) {
      const segLen = (openingStart - currentT) * totalLength;
      const segMidT = (currentT + openingStart) / 2;
      createWallSegment(
        sx + segMidT * dx,
        sz + segMidT * dz,
        segLen,
        wall.height,
        wall.thickness,
        angle,
        mat,
        wall.isExterior,
        group
      );
    }

    // For windows, create wall below and above
    if (opening.type === "window") {
      const segLen = opening.width;
      const segMidT = opening.positionAlongWall;
      const posX = sx + segMidT * dx;
      const posZ = sz + segMidT * dz;

      // Wall below window (sill)
      if (opening.bottomY > 0.05) {
        createWallSegment(
          posX,
          posZ,
          segLen,
          opening.bottomY,
          wall.thickness,
          angle,
          mat,
          wall.isExterior,
          group,
          0
        );
      }

      // Wall above window
      const topOfWindow = opening.bottomY + opening.height;
      if (topOfWindow < wall.height - 0.05) {
        const aboveHeight = wall.height - topOfWindow;
        createWallSegment(
          posX,
          posZ,
          segLen,
          aboveHeight,
          wall.thickness,
          angle,
          mat,
          wall.isExterior,
          group,
          topOfWindow
        );
      }

      // Window glass
      createWindowMesh(posX, posZ, segLen, opening.height, opening.bottomY, angle, group);
    }

    // For doors, create wall above door
    if (opening.type === "door") {
      const segLen = opening.width;
      const segMidT = opening.positionAlongWall;
      const posX = sx + segMidT * dx;
      const posZ = sz + segMidT * dz;

      if (opening.height < wall.height - 0.05) {
        const aboveHeight = wall.height - opening.height;
        createWallSegment(
          posX,
          posZ,
          segLen,
          aboveHeight,
          wall.thickness,
          angle,
          mat,
          wall.isExterior,
          group,
          opening.height
        );
      }

      // Door frame
      createDoorFrame(posX, posZ, segLen, opening.height, angle, group);
    }

    currentT = openingEnd;
  });

  // Wall segment after last opening
  if (currentT < 0.99) {
    const segLen = (1 - currentT) * totalLength;
    const segMidT = (currentT + 1) / 2;
    createWallSegment(
      sx + segMidT * dx,
      sz + segMidT * dz,
      segLen,
      wall.height,
      wall.thickness,
      angle,
      mat,
      wall.isExterior,
      group
    );
  }
}

function createWallSegment(
  x: number,
  z: number,
  length: number,
  height: number,
  thickness: number,
  angle: number,
  material: THREE.Material,
  isExterior: boolean,
  group: THREE.Group,
  baseY: number = 0
) {
  const geo = new THREE.BoxGeometry(length, height, thickness);
  const mesh = new THREE.Mesh(geo, material);
  mesh.position.set(x, baseY + height / 2, z);
  mesh.rotation.y = -angle;
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  mesh.userData = { type: "wall" };
  group.add(mesh);

  addWallEdges(mesh, length, height, thickness, isExterior);
}

function addWallEdges(
  parent: THREE.Mesh,
  length: number,
  height: number,
  thickness: number,
  isExterior: boolean
) {
  const edgesGeo = new THREE.EdgesGeometry(
    new THREE.BoxGeometry(length + 0.01, height + 0.01, thickness + 0.01)
  );
  const edgesMat = new THREE.LineBasicMaterial({
    color: isExterior ? COLORS.wallEdge : 0x336688,
    transparent: true,
    opacity: isExterior ? 0.6 : 0.3,
  });
  const edges = new THREE.LineSegments(edgesGeo, edgesMat);
  parent.add(edges);
}

function createWindowMesh(
  x: number,
  z: number,
  width: number,
  height: number,
  sillHeight: number,
  angle: number,
  group: THREE.Group
) {
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
  mesh.userData = { type: "window" };
  group.add(mesh);

  // Window frame
  const frameGeo = new THREE.EdgesGeometry(new THREE.PlaneGeometry(width, height));
  const frameMat = new THREE.LineBasicMaterial({
    color: COLORS.window,
    linewidth: 2,
  });
  const frame = new THREE.LineSegments(frameGeo, frameMat);
  mesh.add(frame);

  // Cross bars
  const barMat = new THREE.LineBasicMaterial({ color: COLORS.window, transparent: true, opacity: 0.6 });
  
  // Horizontal bar
  const hPoints = [new THREE.Vector3(-width / 2, 0, 0.01), new THREE.Vector3(width / 2, 0, 0.01)];
  const hGeo = new THREE.BufferGeometry().setFromPoints(hPoints);
  mesh.add(new THREE.Line(hGeo, barMat));

  // Vertical bar
  const vPoints = [new THREE.Vector3(0, -height / 2, 0.01), new THREE.Vector3(0, height / 2, 0.01)];
  const vGeo = new THREE.BufferGeometry().setFromPoints(vPoints);
  mesh.add(new THREE.Line(vGeo, barMat));
}

function createDoorFrame(
  x: number,
  z: number,
  width: number,
  height: number,
  angle: number,
  group: THREE.Group
) {
  const frameMat = new THREE.MeshStandardMaterial({
    color: COLORS.door,
    roughness: 0.5,
  });

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
  panel.rotation.y = -angle + 0.4; // Slightly open
  panel.userData = { type: "door" };
  group.add(panel);

  // Door frame outline
  const frameShape = new THREE.Shape();
  frameShape.moveTo(-width / 2, 0);
  frameShape.lineTo(-width / 2, height);
  frameShape.lineTo(width / 2, height);
  frameShape.lineTo(width / 2, 0);

  const framePoints = frameShape.getPoints(20);
  const frameGeo = new THREE.BufferGeometry().setFromPoints(
    framePoints.map((p) => new THREE.Vector3(p.x, p.y, 0))
  );
  const frameLineMat = new THREE.LineBasicMaterial({
    color: COLORS.door,
  });
  const frameLine = new THREE.Line(frameGeo, frameLineMat);
  frameLine.position.set(x, 0, z);
  frameLine.rotation.y = -angle;
  group.add(frameLine);
}

/**
 * Create room labels as sprites
 */
export function createLabels(): THREE.Group {
  const group = new THREE.Group();

  rooms.forEach((room) => {
    const [lx, lz] = toWorld(room.labelPosition[0], room.labelPosition[1]);

    // Room name label
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

    // Dimensions label
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
  const {
    fontSize = 36,
    fontWeight = "normal",
    color = "#ffffff",
    backgroundColor = "rgba(0,0,0,0.5)",
    padding = 10,
  } = opts;

  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d")!;

  // Measure text
  ctx.font = `${fontWeight} ${fontSize}px 'JetBrains Mono', 'Courier New', monospace`;
  const metrics = ctx.measureText(text);
  const textWidth = metrics.width;

  canvas.width = textWidth + padding * 2;
  canvas.height = fontSize + padding * 2;

  // Background
  ctx.fillStyle = backgroundColor;
  ctx.roundRect(0, 0, canvas.width, canvas.height, 6);
  ctx.fill();

  // Text
  ctx.font = `${fontWeight} ${fontSize}px 'JetBrains Mono', 'Courier New', monospace`;
  ctx.fillStyle = color;
  ctx.textBaseline = "middle";
  ctx.textAlign = "center";
  ctx.fillText(text, canvas.width / 2, canvas.height / 2);

  const texture = new THREE.CanvasTexture(canvas);
  texture.minFilter = THREE.LinearFilter;

  const mat = new THREE.SpriteMaterial({
    map: texture,
    transparent: true,
    depthTest: false,
  });
  return new THREE.Sprite(mat);
}

/**
 * Create dimension lines in 3D space
 */
export function createDimensionLines(): THREE.Group {
  const group = new THREE.Group();

  // Main dimension lines
  const dimensionData = [
    // Reception top width
    { start: [0, 0] as [number, number], end: [5.78, 0] as [number, number], label: "5.78m", offset: -0.8 },
    // Reception depth (left side)
    { start: [0, 0] as [number, number], end: [0, 11.72] as [number, number], label: "11.72m", offset: -0.8 },
    // Kitchen width
    { start: [5.88, 11.72] as [number, number], end: [10.0, 11.72] as [number, number], label: "4.12m", offset: 0.8 },
    // Kitchen depth
    { start: [10.0, 8.41] as [number, number], end: [10.0, 11.72] as [number, number], label: "3.31m", offset: 0.8 },
    // Maid's room width
    { start: [5.88, 5.2] as [number, number], end: [8.59, 5.2] as [number, number], label: "2.71m", offset: -0.5 },
    // Dining area
    { start: [0.5, 9.0] as [number, number], end: [4.43, 9.0] as [number, number], label: "3.93m", offset: 0.5 },
  ];

  dimensionData.forEach((dim) => {
    const [sx, sz] = toWorld(dim.start[0], dim.start[1]);
    const [ex, ez] = toWorld(dim.end[0], dim.end[1]);

    const isHorizontal = Math.abs(sz - ez) < 0.1;
    const offsetX = isHorizontal ? 0 : dim.offset;
    const offsetZ = isHorizontal ? dim.offset : 0;

    // Dimension line
    const points = [
      new THREE.Vector3(sx + offsetX, 0.05, sz + offsetZ),
      new THREE.Vector3(ex + offsetX, 0.05, ez + offsetZ),
    ];
    const lineGeo = new THREE.BufferGeometry().setFromPoints(points);
    const lineMat = new THREE.LineBasicMaterial({
      color: 0x00d4ff,
      transparent: true,
      opacity: 0.5,
    });
    const line = new THREE.Line(lineGeo, lineMat);
    group.add(line);

    // Extension lines
    const ext1Points = [
      new THREE.Vector3(sx, 0.05, sz),
      new THREE.Vector3(sx + offsetX, 0.05, sz + offsetZ),
    ];
    const ext2Points = [
      new THREE.Vector3(ex, 0.05, ez),
      new THREE.Vector3(ex + offsetX, 0.05, ez + offsetZ),
    ];
    const ext1Geo = new THREE.BufferGeometry().setFromPoints(ext1Points);
    const ext2Geo = new THREE.BufferGeometry().setFromPoints(ext2Points);
    const extMat = new THREE.LineBasicMaterial({
      color: 0x00d4ff,
      transparent: true,
      opacity: 0.3,
    });
    group.add(new THREE.Line(ext1Geo, extMat));
    group.add(new THREE.Line(ext2Geo, extMat));

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
 * Create staircase steps
 */
export function createStairs(): THREE.Group {
  const group = new THREE.Group();
  const [baseX, baseZ] = toWorld(8.02, 0.3);
  const stepCount = 12;
  const stepWidth = 1.6;
  const stepDepth = 0.25;
  const stepHeight = WALL_HEIGHT / stepCount;

  const stepMat = new THREE.MeshStandardMaterial({
    color: 0x4a5568,
    roughness: 0.7,
  });

  for (let i = 0; i < stepCount; i++) {
    const geo = new THREE.BoxGeometry(stepWidth, stepHeight, stepDepth);
    const step = new THREE.Mesh(geo, stepMat);
    step.position.set(baseX + stepWidth / 2, stepHeight * i + stepHeight / 2, baseZ + i * stepDepth);
    step.castShadow = true;
    step.receiveShadow = true;
    group.add(step);

    // Step edge
    const edgeGeo = new THREE.EdgesGeometry(geo);
    const edgeMat = new THREE.LineBasicMaterial({ color: 0x667788, transparent: true, opacity: 0.4 });
    step.add(new THREE.LineSegments(edgeGeo, edgeMat));
  }

  return group;
}

/**
 * Setup scene lighting
 */
export function setupLighting(scene: THREE.Scene) {
  // Ambient light
  const ambient = new THREE.AmbientLight(0x334466, 0.8);
  scene.add(ambient);

  // Main directional light (sun-like)
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

  // Fill light
  const fillLight = new THREE.DirectionalLight(0x4488aa, 0.4);
  fillLight.position.set(-5, 8, -5);
  scene.add(fillLight);

  // Hemisphere light for sky/ground color
  const hemiLight = new THREE.HemisphereLight(0x1a2a4a, 0x0a0a0a, 0.5);
  scene.add(hemiLight);
}
