/**
 * POV (First-Person) Controller
 * Provides WASD movement + mouse look for walking through the floor plan.
 * Uses pointer lock for immersive mouse look.
 */
import * as THREE from "three";
import { walls, propertyBounds, type WallSegment } from "./floorPlanData";

// Center offset (same as sceneBuilder)
const CENTER_X = (propertyBounds.minX + propertyBounds.maxX) / 2;
const CENTER_Z = (propertyBounds.minZ + propertyBounds.maxZ) / 2;

function toWorld(x: number, z: number): [number, number] {
  return [x - CENTER_X, z - CENTER_Z];
}

const EYE_HEIGHT = 1.6;
const MOVE_SPEED = 3.0; // meters per second
const MOUSE_SENSITIVITY = 0.002;
const COLLISION_RADIUS = 0.25; // meters from wall center

// Build wall segments in world coordinates for collision
interface CollisionWall {
  x1: number;
  z1: number;
  x2: number;
  z2: number;
  thickness: number;
}

function buildCollisionWalls(): CollisionWall[] {
  return walls
    .filter((w: WallSegment) => w.height > 1.0) // only full-height walls
    .map((w: WallSegment) => {
      const [x1, z1] = toWorld(w.start[0], w.start[1]);
      const [x2, z2] = toWorld(w.end[0], w.end[1]);
      return { x1, z1, x2, z2, thickness: w.thickness };
    });
}

// Point-to-segment distance for collision
function pointToSegmentDist(
  px: number, pz: number,
  x1: number, z1: number,
  x2: number, z2: number
): number {
  const dx = x2 - x1;
  const dz = z2 - z1;
  const lenSq = dx * dx + dz * dz;
  if (lenSq < 0.0001) {
    return Math.sqrt((px - x1) ** 2 + (pz - z1) ** 2);
  }
  let t = ((px - x1) * dx + (pz - z1) * dz) / lenSq;
  t = Math.max(0, Math.min(1, t));
  const cx = x1 + t * dx;
  const cz = z1 + t * dz;
  return Math.sqrt((px - cx) ** 2 + (pz - cz) ** 2);
}

export class POVController {
  camera: THREE.PerspectiveCamera;
  domElement: HTMLElement;
  enabled = false;

  private euler = new THREE.Euler(0, 0, 0, "YXZ");
  private velocity = new THREE.Vector3();
  private direction = new THREE.Vector3();
  private moveForward = false;
  private moveBackward = false;
  private moveLeft = false;
  private moveRight = false;
  private collisionWalls: CollisionWall[];
  private clock = new THREE.Clock();
  private isLocked = false;

  // Callbacks
  onLock: (() => void) | null = null;
  onUnlock: (() => void) | null = null;

  constructor(camera: THREE.PerspectiveCamera, domElement: HTMLElement) {
    this.camera = camera;
    this.domElement = domElement;
    this.collisionWalls = buildCollisionWalls();

    this.onMouseMove = this.onMouseMove.bind(this);
    this.onKeyDown = this.onKeyDown.bind(this);
    this.onKeyUp = this.onKeyUp.bind(this);
    this.onPointerLockChange = this.onPointerLockChange.bind(this);
    this.onPointerLockError = this.onPointerLockError.bind(this);
  }

  enable(startPosition?: THREE.Vector3) {
    this.enabled = true;
    this.clock.start();

    // Set camera to eye height at a good starting position (reception center)
    if (startPosition) {
      this.camera.position.copy(startPosition);
    } else {
      // Default: center of reception
      const [rx, rz] = toWorld(3.5, 5.0);
      this.camera.position.set(rx, EYE_HEIGHT, rz);
    }
    this.camera.position.y = EYE_HEIGHT;

    // Reset rotation
    this.euler.set(0, 0, 0, "YXZ");
    this.camera.quaternion.setFromEuler(this.euler);

    // Reset movement
    this.moveForward = false;
    this.moveBackward = false;
    this.moveLeft = false;
    this.moveRight = false;
    this.velocity.set(0, 0, 0);

    // Add listeners
    document.addEventListener("mousemove", this.onMouseMove);
    document.addEventListener("keydown", this.onKeyDown);
    document.addEventListener("keyup", this.onKeyUp);
    document.addEventListener("pointerlockchange", this.onPointerLockChange);
    document.addEventListener("pointerlockerror", this.onPointerLockError);

    // Request pointer lock
    this.domElement.requestPointerLock();
  }

  disable() {
    this.enabled = false;
    this.moveForward = false;
    this.moveBackward = false;
    this.moveLeft = false;
    this.moveRight = false;

    document.removeEventListener("mousemove", this.onMouseMove);
    document.removeEventListener("keydown", this.onKeyDown);
    document.removeEventListener("keyup", this.onKeyUp);
    document.removeEventListener("pointerlockchange", this.onPointerLockChange);
    document.removeEventListener("pointerlockerror", this.onPointerLockError);

    if (document.pointerLockElement) {
      document.exitPointerLock();
    }
    this.isLocked = false;
  }

  update(): boolean {
    if (!this.enabled) return false;

    const delta = Math.min(this.clock.getDelta(), 0.1);

    // Decelerate
    this.velocity.x -= this.velocity.x * 10.0 * delta;
    this.velocity.z -= this.velocity.z * 10.0 * delta;

    // Direction from keys
    this.direction.z = Number(this.moveForward) - Number(this.moveBackward);
    this.direction.x = Number(this.moveRight) - Number(this.moveLeft);
    this.direction.normalize();

    if (this.moveForward || this.moveBackward) {
      this.velocity.z -= this.direction.z * MOVE_SPEED * delta * 20;
    }
    if (this.moveLeft || this.moveRight) {
      this.velocity.x -= this.direction.x * MOVE_SPEED * delta * 20;
    }

    // Calculate movement in camera space
    const forward = new THREE.Vector3();
    this.camera.getWorldDirection(forward);
    forward.y = 0;
    forward.normalize();

    const right = new THREE.Vector3();
    right.crossVectors(forward, new THREE.Vector3(0, 1, 0)).normalize();

    const moveX = right.x * (-this.velocity.x * delta) + forward.x * (-this.velocity.z * delta);
    const moveZ = right.z * (-this.velocity.x * delta) + forward.z * (-this.velocity.z * delta);

    // Try to move, with collision detection
    const newX = this.camera.position.x + moveX;
    const newZ = this.camera.position.z + moveZ;

    if (!this.checkCollision(newX, newZ)) {
      this.camera.position.x = newX;
      this.camera.position.z = newZ;
    } else {
      // Try sliding along walls: try X only, then Z only
      if (!this.checkCollision(newX, this.camera.position.z)) {
        this.camera.position.x = newX;
      } else if (!this.checkCollision(this.camera.position.x, newZ)) {
        this.camera.position.z = newZ;
      }
      // else: stuck, don't move
    }

    // Keep at eye height
    this.camera.position.y = EYE_HEIGHT;

    return true;
  }

  private checkCollision(x: number, z: number): boolean {
    for (const wall of this.collisionWalls) {
      const dist = pointToSegmentDist(x, z, wall.x1, wall.z1, wall.x2, wall.z2);
      if (dist < COLLISION_RADIUS + wall.thickness / 2) {
        return true;
      }
    }
    return false;
  }

  private onMouseMove(event: MouseEvent) {
    if (!this.isLocked || !this.enabled) return;

    const movementX = event.movementX || 0;
    const movementY = event.movementY || 0;

    this.euler.setFromQuaternion(this.camera.quaternion);
    this.euler.y -= movementX * MOUSE_SENSITIVITY;
    this.euler.x -= movementY * MOUSE_SENSITIVITY;
    // Clamp vertical look
    this.euler.x = Math.max(-Math.PI / 2.5, Math.min(Math.PI / 2.5, this.euler.x));
    this.camera.quaternion.setFromEuler(this.euler);
  }

  private onKeyDown(event: KeyboardEvent) {
    if (!this.enabled) return;
    switch (event.code) {
      case "KeyW":
      case "ArrowUp":
        this.moveForward = true;
        break;
      case "KeyS":
      case "ArrowDown":
        this.moveBackward = true;
        break;
      case "KeyA":
      case "ArrowLeft":
        this.moveLeft = true;
        break;
      case "KeyD":
      case "ArrowRight":
        this.moveRight = true;
        break;
      case "Escape":
        // Escape is handled by pointer lock automatically
        break;
    }
  }

  private onKeyUp(event: KeyboardEvent) {
    if (!this.enabled) return;
    switch (event.code) {
      case "KeyW":
      case "ArrowUp":
        this.moveForward = false;
        break;
      case "KeyS":
      case "ArrowDown":
        this.moveBackward = false;
        break;
      case "KeyA":
      case "ArrowLeft":
        this.moveLeft = false;
        break;
      case "KeyD":
      case "ArrowRight":
        this.moveRight = false;
        break;
    }
  }

  private onPointerLockChange() {
    if (document.pointerLockElement === this.domElement) {
      this.isLocked = true;
      this.onLock?.();
    } else {
      this.isLocked = false;
      this.onUnlock?.();
    }
  }

  private onPointerLockError() {
    console.warn("Pointer lock error");
  }

  dispose() {
    this.disable();
  }
}
