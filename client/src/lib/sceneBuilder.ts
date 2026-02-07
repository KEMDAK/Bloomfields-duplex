/**
 * Scene Builder - Constructs the 3D floor plan (FINAL PRECISE VERSION)
 * All geometry derived from floorPlanData coordinates.
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

// Center the property in the scene
const CENTER_X = (propertyBounds.minX + propertyBounds.maxX) / 2;
const CENTER_Z = (propertyBounds.minZ + propertyBounds.maxZ) / 2;

function toWorld(x: number, z: number): [number, number] {
  return [x - CENTER_X, z - CENTER_Z];
}

// ─── Ground & Grid ───────────────────────────────────────────

export function createGrid(): THREE.Group {
  const group = new THREE.Group();
  const propW = propertyBounds.maxX - propertyBounds.minX;
  const propD = propertyBounds.maxZ - propertyBounds.minZ;
  const [cx, cz] = toWorld(
    (propertyBounds.minX + propertyBounds.maxX) / 2,
    (propertyBounds.minZ + propertyBounds.maxZ) / 2
  );

  // Ground plane (only covers property)
  const groundGeo = new THREE.PlaneGeometry(propW + 0.5, propD + 0.5);
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

  // Grid
  const gridSize = Math.ceil(Math.max(propW, propD)) + 2;
  const gridHelper = new THREE.GridHelper(gridSize, gridSize * 2, 0x1a2a3a, 0x111a24);
  gridHelper.position.set(cx, 0.0, cz);
  group.add(gridHelper);

  return group;
}

// ─── Floors ──────────────────────────────────────────────────

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
    group.add(mesh);
  });

  return group;
}

// ─── Walls ───────────────────────────────────────────────────

export function createWalls(): THREE.Group {
  const group = new THREE.Group();
  walls.forEach((wall) => buildWall(wall, group));
  return group;
}

function buildWall(wall: WallSegment, group: THREE.Group) {
  const [sx, sz] = toWorld(wall.start[0], wall.start[1]);
  const [ex, ez] = toWorld(wall.end[0], wall.end[1]);
  const dx = ex - sx;
  const dz = ez - sz;
  const length = Math.sqrt(dx * dx + dz * dz);
  const angle = Math.atan2(dz, dx);

  const openings = findOpeningsOnWall(wall);

  if (openings.length === 0) {
    addSolidWall(sx, sz, dx, dz, length, angle, wall, group);
  } else {
    addWallWithOpenings(sx, sz, dx, dz, length, angle, wall, openings, group);
  }
}

function addSolidWall(
  sx: number, sz: number, dx: number, dz: number,
  length: number, angle: number, wall: WallSegment, group: THREE.Group
) {
  const geo = new THREE.BoxGeometry(length, wall.height, wall.thickness);
  const mat = wallMaterial(wall.isExterior);
  const mesh = new THREE.Mesh(geo, mat);
  mesh.position.set(sx + dx / 2, wall.height / 2, sz + dz / 2);
  mesh.rotation.y = -angle;
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  group.add(mesh);
  addEdges(mesh, length, wall.height, wall.thickness, wall.isExterior);
}

interface Opening {
  type: "door" | "window";
  t: number;
  width: number;
  height: number;
  bottomY: number;
}

function findOpeningsOnWall(wall: WallSegment): Opening[] {
  const out: Opening[] = [];
  const [wsx, wsz] = wall.start;
  const [wex, wez] = wall.end;
  const wdx = wex - wsx;
  const wdz = wez - wsz;
  const wLen = Math.sqrt(wdx * wdx + wdz * wdz);

  for (const d of doors) {
    const t = project(d.position, wsx, wsz, wdx, wdz, wLen);
    if (t !== null) out.push({ type: "door", t, width: d.width, height: d.height, bottomY: 0 });
  }
  for (const w of windows) {
    const t = project(w.position, wsx, wsz, wdx, wdz, wLen);
    if (t !== null) out.push({ type: "window", t, width: w.width, height: w.height, bottomY: w.sillHeight });
  }
  out.sort((a, b) => a.t - b.t);
  return out;
}

function project(
  pt: [number, number],
  wsx: number, wsz: number, wdx: number, wdz: number, wLen: number
): number | null {
  const t = ((pt[0] - wsx) * wdx + (pt[1] - wsz) * wdz) / (wLen * wLen);
  const cx = wsx + t * wdx;
  const cz = wsz + t * wdz;
  const dist = Math.hypot(pt[0] - cx, pt[1] - cz);
  if (dist < 0.35 && t >= -0.05 && t <= 1.05) return Math.max(0, Math.min(1, t));
  return null;
}

function addWallWithOpenings(
  sx: number, sz: number, dx: number, dz: number,
  totalLen: number, angle: number, wall: WallSegment,
  openings: Opening[], group: THREE.Group
) {
  const mat = wallMaterial(wall.isExterior);
  let curT = 0;

  for (const op of openings) {
    const halfW = op.width / (2 * totalLen);
    const opStart = Math.max(0, op.t - halfW);
    const opEnd = Math.min(1, op.t + halfW);

    if (opStart > curT + 0.005) {
      const len = (opStart - curT) * totalLen;
      const midT = (curT + opStart) / 2;
      addSegment(sx + midT * dx, sz + midT * dz, len, wall.height, wall.thickness, angle, mat, wall.isExterior, group);
    }

    const posX = sx + op.t * dx;
    const posZ = sz + op.t * dz;

    if (op.type === "window") {
      if (op.bottomY > 0.05)
        addSegment(posX, posZ, op.width, op.bottomY, wall.thickness, angle, mat, wall.isExterior, group, 0);
      const topY = op.bottomY + op.height;
      if (topY < wall.height - 0.05)
        addSegment(posX, posZ, op.width, wall.height - topY, wall.thickness, angle, mat, wall.isExterior, group, topY);
      addWindowGlass(posX, posZ, op.width, op.height, op.bottomY, angle, group);
    }

    if (op.type === "door") {
      if (op.height < wall.height - 0.05)
        addSegment(posX, posZ, op.width, wall.height - op.height, wall.thickness, angle, mat, wall.isExterior, group, op.height);
      addDoorPanel(posX, posZ, op.width, op.height, angle, group);
    }

    curT = opEnd;
  }

  if (curT < 0.995) {
    const len = (1 - curT) * totalLen;
    const midT = (curT + 1) / 2;
    addSegment(sx + midT * dx, sz + midT * dz, len, wall.height, wall.thickness, angle, mat, wall.isExterior, group);
  }
}

function wallMaterial(isExterior: boolean) {
  return new THREE.MeshStandardMaterial({
    color: isExterior ? COLORS.wallExterior : COLORS.wallInterior,
    transparent: true,
    opacity: 0.7,
    roughness: 0.6,
  });
}

function addSegment(
  x: number, z: number, length: number, height: number, thickness: number,
  angle: number, material: THREE.Material, isExterior: boolean,
  group: THREE.Group, baseY = 0
) {
  const geo = new THREE.BoxGeometry(length, height, thickness);
  const mesh = new THREE.Mesh(geo, material);
  mesh.position.set(x, baseY + height / 2, z);
  mesh.rotation.y = -angle;
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  group.add(mesh);
  addEdges(mesh, length, height, thickness, isExterior);
}

function addEdges(parent: THREE.Mesh, l: number, h: number, t: number, isExt: boolean) {
  const geo = new THREE.EdgesGeometry(new THREE.BoxGeometry(l + 0.01, h + 0.01, t + 0.01));
  const mat = new THREE.LineBasicMaterial({
    color: isExt ? COLORS.wallEdge : 0x336688,
    transparent: true,
    opacity: isExt ? 0.6 : 0.3,
  });
  parent.add(new THREE.LineSegments(geo, mat));
}

function addWindowGlass(x: number, z: number, w: number, h: number, sill: number, angle: number, group: THREE.Group) {
  const geo = new THREE.PlaneGeometry(w, h);
  const mat = new THREE.MeshStandardMaterial({
    color: COLORS.windowGlass, transparent: true, opacity: 0.3,
    side: THREE.DoubleSide, roughness: 0.1, metalness: 0.5,
  });
  const mesh = new THREE.Mesh(geo, mat);
  mesh.position.set(x, sill + h / 2, z);
  mesh.rotation.y = -angle;
  group.add(mesh);

  mesh.add(new THREE.LineSegments(
    new THREE.EdgesGeometry(new THREE.PlaneGeometry(w, h)),
    new THREE.LineBasicMaterial({ color: COLORS.window })
  ));
  const barMat = new THREE.LineBasicMaterial({ color: COLORS.window, transparent: true, opacity: 0.6 });
  mesh.add(new THREE.Line(
    new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(-w / 2, 0, 0.01), new THREE.Vector3(w / 2, 0, 0.01)]),
    barMat
  ));
  mesh.add(new THREE.Line(
    new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(0, -h / 2, 0.01), new THREE.Vector3(0, h / 2, 0.01)]),
    barMat
  ));
}

function addDoorPanel(x: number, z: number, w: number, h: number, angle: number, group: THREE.Group) {
  const panelMat = new THREE.MeshStandardMaterial({
    color: 0x8B6914, transparent: true, opacity: 0.5,
    side: THREE.DoubleSide, roughness: 0.7,
  });
  const panel = new THREE.Mesh(new THREE.PlaneGeometry(w * 0.95, h * 0.95), panelMat);
  panel.position.set(x, h / 2, z);
  panel.rotation.y = -angle + 0.4;
  group.add(panel);

  const pts = [
    new THREE.Vector3(-w / 2, 0, 0), new THREE.Vector3(-w / 2, h, 0),
    new THREE.Vector3(w / 2, h, 0), new THREE.Vector3(w / 2, 0, 0),
  ];
  const frameGeo = new THREE.BufferGeometry().setFromPoints(pts);
  const frame = new THREE.Line(frameGeo, new THREE.LineBasicMaterial({ color: COLORS.door }));
  frame.position.set(x, 0, z);
  frame.rotation.y = -angle;
  group.add(frame);
}

// ─── Internal Staircase ──────────────────────────────────────

export function createStairs(): THREE.Group {
  const group = new THREE.Group();
  const s = internalStairs;
  const [baseX, baseZ] = toWorld(s.x, s.z);
  const stepDepth = s.treadsDepth / s.stepCount;
  const stepHeight = WALL_HEIGHT / s.stepCount;

  const stepMat = new THREE.MeshStandardMaterial({ color: COLORS.stairs, roughness: 0.7 });

  // Render stair treads
  for (let i = 0; i < s.stepCount; i++) {
    const geo = new THREE.BoxGeometry(s.width * 0.9, stepHeight, stepDepth * 0.85);
    const step = new THREE.Mesh(geo, stepMat);
    step.position.set(
      baseX + s.width / 2,
      stepHeight * i + stepHeight / 2,
      baseZ + i * stepDepth + stepDepth / 2
    );
    step.castShadow = true;
    step.receiveShadow = true;
    group.add(step);
    step.add(new THREE.LineSegments(
      new THREE.EdgesGeometry(geo),
      new THREE.LineBasicMaterial({ color: 0x667788, transparent: true, opacity: 0.4 })
    ));
  }

  // Dashed outline on floor (full void rectangle)
  const [ox1, oz1] = toWorld(s.x, s.z);
  const [ox2, oz2] = toWorld(s.x + s.width, s.z + s.depth);
  const outlinePts = [
    new THREE.Vector3(ox1, 0.02, oz1),
    new THREE.Vector3(ox2, 0.02, oz1),
    new THREE.Vector3(ox2, 0.02, oz2),
    new THREE.Vector3(ox1, 0.02, oz2),
    new THREE.Vector3(ox1, 0.02, oz1),
  ];
  const outlineGeo = new THREE.BufferGeometry().setFromPoints(outlinePts);
  const outlineLine = new THREE.Line(outlineGeo, new THREE.LineDashedMaterial({
    color: 0x00d4ff, dashSize: 0.3, gapSize: 0.15, transparent: true, opacity: 0.5,
  }));
  outlineLine.computeLineDistances();
  group.add(outlineLine);

  // Label
  const [lx, lz] = toWorld(s.x + s.width / 2, s.z + s.treadsDepth / 2);
  const sprite = makeTextSprite("Internal Stairs", {
    fontSize: 36, fontWeight: "bold", color: "#a0aec0",
    backgroundColor: "rgba(0,0,0,0.4)", padding: 8,
  });
  sprite.position.set(lx, 2.0, lz);
  sprite.scale.set(2.5, 0.8, 1);
  group.add(sprite);

  return group;
}

// ─── Labels ──────────────────────────────────────────────────

export function createLabels(): THREE.Group {
  const group = new THREE.Group();

  rooms.forEach((room) => {
    const [lx, lz] = toWorld(room.labelPosition[0], room.labelPosition[1]);

    const nameSprite = makeTextSprite(room.name, {
      fontSize: 48, fontWeight: "bold", color: "#ffffff",
      backgroundColor: "rgba(0,0,0,0.5)", padding: 12,
    });
    nameSprite.position.set(lx, 0.15, lz);
    nameSprite.scale.set(2.5, 1.0, 1);
    group.add(nameSprite);

    if (room.dimensions && room.dimensions !== room.name) {
      const dimSprite = makeTextSprite(room.dimensions, {
        fontSize: 32, color: "#00d4ff",
        backgroundColor: "rgba(0,0,0,0.3)", padding: 8,
      });
      dimSprite.position.set(lx, 0.1, lz + 0.6);
      dimSprite.scale.set(2.0, 0.6, 1);
      group.add(dimSprite);
    }
  });

  return group;
}

// ─── Dimension Lines ─────────────────────────────────────────

export function createDimensionLines(): THREE.Group {
  const group = new THREE.Group();

  const dims: { s: [number, number]; e: [number, number]; label: string; off: number }[] = [
    // Reception top width: 5.78m
    { s: [0, 0], e: [5.78, 0], label: "5.78m", off: -0.6 },
    // Apartment full depth: 11.72m
    { s: [0, 0], e: [0, 11.72], label: "11.72m", off: -0.8 },
    // Kitchen width: 4.12m
    { s: [5.98, 11.72], e: [10.10, 11.72], label: "4.12m", off: 0.6 },
    // Kitchen depth: 3.31m
    { s: [10.10, 8.41], e: [10.10, 11.72], label: "3.31m", off: 0.6 },
    // Maid's room width: 2.71m
    { s: [7.40, 2.18], e: [10.11, 2.18], label: "2.71m", off: -0.4 },
    // Maid's room depth: 2.71m
    { s: [10.11, 2.18], e: [10.11, 4.89], label: "2.71m", off: 0.5 },
    // Stair void width: 5.15m
    { s: [0.30, 0.80], e: [5.45, 0.80], label: "5.15m", off: -0.4 },
    // Corridor width: 1.22m
    { s: [5.98, 4.0], e: [7.20, 4.0], label: "1.22m", off: -0.3 },
    // Dining area width: 3.93m
    { s: [0.5, 10.0], e: [4.43, 10.0], label: "3.93m", off: 0.4 },
    // Guest toilet: 1.98m
    { s: [5.98, 0], e: [5.98, 1.98], label: "1.98m", off: -0.4 },
  ];

  dims.forEach((d) => {
    const [sx, sz] = toWorld(d.s[0], d.s[1]);
    const [ex, ez] = toWorld(d.e[0], d.e[1]);
    const isH = Math.abs(sz - ez) < 0.1;
    const offX = isH ? 0 : d.off;
    const offZ = isH ? d.off : 0;

    // Main line
    group.add(new THREE.Line(
      new THREE.BufferGeometry().setFromPoints([
        new THREE.Vector3(sx + offX, 0.05, sz + offZ),
        new THREE.Vector3(ex + offX, 0.05, ez + offZ),
      ]),
      new THREE.LineBasicMaterial({ color: 0x00d4ff, transparent: true, opacity: 0.5 })
    ));

    // Extension lines
    const extMat = new THREE.LineBasicMaterial({ color: 0x00d4ff, transparent: true, opacity: 0.3 });
    group.add(new THREE.Line(
      new THREE.BufferGeometry().setFromPoints([
        new THREE.Vector3(sx, 0.05, sz), new THREE.Vector3(sx + offX, 0.05, sz + offZ),
      ]), extMat
    ));
    group.add(new THREE.Line(
      new THREE.BufferGeometry().setFromPoints([
        new THREE.Vector3(ex, 0.05, ez), new THREE.Vector3(ex + offX, 0.05, ez + offZ),
      ]), extMat
    ));

    // End ticks
    const tickLen = 0.15;
    const tickMat = new THREE.LineBasicMaterial({ color: 0x00d4ff, transparent: true, opacity: 0.6 });
    if (isH) {
      group.add(new THREE.Line(
        new THREE.BufferGeometry().setFromPoints([
          new THREE.Vector3(sx + offX, 0.05, sz + offZ - tickLen),
          new THREE.Vector3(sx + offX, 0.05, sz + offZ + tickLen),
        ]), tickMat
      ));
      group.add(new THREE.Line(
        new THREE.BufferGeometry().setFromPoints([
          new THREE.Vector3(ex + offX, 0.05, ez + offZ - tickLen),
          new THREE.Vector3(ex + offX, 0.05, ez + offZ + tickLen),
        ]), tickMat
      ));
    } else {
      group.add(new THREE.Line(
        new THREE.BufferGeometry().setFromPoints([
          new THREE.Vector3(sx + offX - tickLen, 0.05, sz + offZ),
          new THREE.Vector3(sx + offX + tickLen, 0.05, sz + offZ),
        ]), tickMat
      ));
      group.add(new THREE.Line(
        new THREE.BufferGeometry().setFromPoints([
          new THREE.Vector3(ex + offX - tickLen, 0.05, ez + offZ),
          new THREE.Vector3(ex + offX + tickLen, 0.05, ez + offZ),
        ]), tickMat
      ));
    }

    // Label
    const mx = (sx + ex) / 2 + offX;
    const mz = (sz + ez) / 2 + offZ;
    const sprite = makeTextSprite(d.label, {
      fontSize: 28, color: "#00d4ff",
      backgroundColor: "rgba(13,17,23,0.85)", padding: 6,
    });
    sprite.position.set(mx, 0.2, mz);
    sprite.scale.set(1.5, 0.5, 1);
    group.add(sprite);
  });

  return group;
}

// ─── Lighting ────────────────────────────────────────────────

export function setupLighting(scene: THREE.Scene) {
  scene.add(new THREE.AmbientLight(0x334466, 0.8));

  const dir = new THREE.DirectionalLight(0xffffff, 1.0);
  dir.position.set(10, 15, 10);
  dir.castShadow = true;
  dir.shadow.mapSize.set(2048, 2048);
  dir.shadow.camera.near = 0.5;
  dir.shadow.camera.far = 50;
  dir.shadow.camera.left = -15;
  dir.shadow.camera.right = 15;
  dir.shadow.camera.top = 15;
  dir.shadow.camera.bottom = -15;
  scene.add(dir);

  const fill = new THREE.DirectionalLight(0x4488aa, 0.4);
  fill.position.set(-5, 8, -5);
  scene.add(fill);

  scene.add(new THREE.HemisphereLight(0x1a2a4a, 0x0a0a0a, 0.5));
}

// ─── Text Sprite Helper ─────────────────────────────────────

interface SpriteOpts {
  fontSize?: number;
  fontWeight?: string;
  color?: string;
  backgroundColor?: string;
  padding?: number;
}

function makeTextSprite(text: string, opts: SpriteOpts = {}): THREE.Sprite {
  const { fontSize = 36, fontWeight = "normal", color = "#fff", backgroundColor = "rgba(0,0,0,0.5)", padding = 10 } = opts;
  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d")!;
  ctx.font = `${fontWeight} ${fontSize}px 'JetBrains Mono','Courier New',monospace`;
  const tw = ctx.measureText(text).width;
  canvas.width = tw + padding * 2;
  canvas.height = fontSize + padding * 2;
  ctx.fillStyle = backgroundColor;
  ctx.roundRect(0, 0, canvas.width, canvas.height, 6);
  ctx.fill();
  ctx.font = `${fontWeight} ${fontSize}px 'JetBrains Mono','Courier New',monospace`;
  ctx.fillStyle = color;
  ctx.textBaseline = "middle";
  ctx.textAlign = "center";
  ctx.fillText(text, canvas.width / 2, canvas.height / 2);
  const tex = new THREE.CanvasTexture(canvas);
  tex.minFilter = THREE.LinearFilter;
  return new THREE.Sprite(new THREE.SpriteMaterial({ map: tex, transparent: true, depthTest: false }));
}
