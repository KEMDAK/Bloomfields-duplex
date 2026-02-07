/**
 * POV (First-Person) Controller
 * Provides WASD movement + mouse look for walking through the floor plan.
 * On desktop: uses pointer lock for immersive mouse look.
 * On mobile: uses touch controls (drag to look, virtual joystick to move).
 * No wall collision — user can walk freely through all walls.
 */
import * as THREE from "three";
import { propertyBounds } from "./floorPlanData";

// Center offset (same as sceneBuilder)
const CENTER_X = (propertyBounds.minX + propertyBounds.maxX) / 2;
const CENTER_Z = (propertyBounds.minZ + propertyBounds.maxZ) / 2;

function toWorld(x: number, z: number): [number, number] {
  return [x - CENTER_X, z - CENTER_Z];
}

const EYE_HEIGHT = 1.6;
const MOVE_SPEED = 3.0; // meters per second
const MOUSE_SENSITIVITY = 0.002;
const TOUCH_LOOK_SENSITIVITY = 0.004;

// Detect mobile/touch device
function isMobileDevice(): boolean {
  return (
    "ontouchstart" in window ||
    navigator.maxTouchPoints > 0 ||
    /Android|iPhone|iPad|iPod/i.test(navigator.userAgent)
  );
}

// Check if pointer lock is supported
function isPointerLockSupported(): boolean {
  return "pointerLockElement" in document && !isMobileDevice();
}

// Virtual joystick overlay for mobile
function createMobileOverlay(onExit: () => void): {
  container: HTMLDivElement;
  exitBtn: HTMLDivElement;
  moveVec: { x: number; z: number };
  destroy: () => void;
} {
  const moveVec = { x: 0, z: 0 };

  // Joystick base
  const container = document.createElement("div");
  container.id = "pov-joystick";
  container.style.cssText = `
    position: fixed; bottom: 30px; left: 30px; width: 120px; height: 120px;
    border-radius: 50%; background: rgba(255,255,255,0.15);
    border: 2px solid rgba(255,255,255,0.3); z-index: 10000;
    touch-action: none; user-select: none;
  `;

  const knob = document.createElement("div");
  knob.style.cssText = `
    position: absolute; top: 50%; left: 50%; width: 40px; height: 40px;
    margin: -20px 0 0 -20px; border-radius: 50%;
    background: rgba(52,211,153,0.7); border: 2px solid rgba(52,211,153,0.9);
    transition: none;
  `;
  container.appendChild(knob);

  // Exit button — large and obvious
  const exitBtn = document.createElement("div");
  exitBtn.id = "pov-exit-btn";
  exitBtn.style.cssText = `
    position: fixed; top: 20px; right: 20px; width: 56px; height: 56px;
    border-radius: 50%; background: rgba(239,68,68,0.85);
    border: 3px solid rgba(255,255,255,0.8); z-index: 10000;
    display: flex; align-items: center; justify-content: center;
    font-size: 24px; color: white; font-weight: bold;
    touch-action: none; user-select: none; cursor: pointer;
  `;
  exitBtn.textContent = "✕";

  // Wire up exit button with both touch and click
  const handleExit = (e: Event) => {
    e.preventDefault();
    e.stopPropagation();
    onExit();
  };
  exitBtn.addEventListener("click", handleExit);
  exitBtn.addEventListener("touchend", handleExit);

  const centerX = 60;
  const centerY = 60;
  const maxDist = 40;

  let activeTouch: number | null = null;

  const handleTouchStart = (e: TouchEvent) => {
    e.preventDefault();
    if (activeTouch !== null) return;
    const touch = e.changedTouches[0];
    activeTouch = touch.identifier;
  };

  const handleTouchMove = (e: TouchEvent) => {
    e.preventDefault();
    for (let i = 0; i < e.changedTouches.length; i++) {
      const touch = e.changedTouches[i];
      if (touch.identifier === activeTouch) {
        const rect = container.getBoundingClientRect();
        let dx = touch.clientX - rect.left - centerX;
        let dy = touch.clientY - rect.top - centerY;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist > maxDist) {
          dx = (dx / dist) * maxDist;
          dy = (dy / dist) * maxDist;
        }
        knob.style.marginLeft = `${-20 + dx}px`;
        knob.style.marginTop = `${-20 + dy}px`;
        moveVec.x = dx / maxDist;
        moveVec.z = dy / maxDist;
      }
    }
  };

  const handleTouchEnd = (e: TouchEvent) => {
    for (let i = 0; i < e.changedTouches.length; i++) {
      if (e.changedTouches[i].identifier === activeTouch) {
        activeTouch = null;
        knob.style.marginLeft = "-20px";
        knob.style.marginTop = "-20px";
        moveVec.x = 0;
        moveVec.z = 0;
      }
    }
  };

  container.addEventListener("touchstart", handleTouchStart, { passive: false });
  container.addEventListener("touchmove", handleTouchMove, { passive: false });
  container.addEventListener("touchend", handleTouchEnd);
  container.addEventListener("touchcancel", handleTouchEnd);

  document.body.appendChild(container);
  document.body.appendChild(exitBtn);

  const destroy = () => {
    exitBtn.removeEventListener("click", handleExit);
    exitBtn.removeEventListener("touchend", handleExit);
    container.removeEventListener("touchstart", handleTouchStart);
    container.removeEventListener("touchmove", handleTouchMove);
    container.removeEventListener("touchend", handleTouchEnd);
    container.removeEventListener("touchcancel", handleTouchEnd);
    container.remove();
    exitBtn.remove();
  };

  return { container, exitBtn, moveVec, destroy };
}

export class POVController {
  camera: THREE.PerspectiveCamera;
  domElement: HTMLElement;
  enabled = false;
  isMobile: boolean;

  private euler = new THREE.Euler(0, 0, 0, "YXZ");
  private velocity = new THREE.Vector3();
  private direction = new THREE.Vector3();
  private moveForward = false;
  private moveBackward = false;
  private moveLeft = false;
  private moveRight = false;
  private clock = new THREE.Clock();
  private isLocked = false;

  // Mobile touch state
  private mobileOverlay: ReturnType<typeof createMobileOverlay> | null = null;
  private lookTouchId: number | null = null;
  private lastLookX = 0;
  private lastLookY = 0;

  // Callbacks
  onLock: (() => void) | null = null;
  onUnlock: (() => void) | null = null;

  constructor(camera: THREE.PerspectiveCamera, domElement: HTMLElement) {
    this.camera = camera;
    this.domElement = domElement;
    this.isMobile = isMobileDevice();

    this.onMouseMove = this.onMouseMove.bind(this);
    this.onKeyDown = this.onKeyDown.bind(this);
    this.onKeyUp = this.onKeyUp.bind(this);
    this.onPointerLockChange = this.onPointerLockChange.bind(this);
    this.onPointerLockError = this.onPointerLockError.bind(this);
    this.onTouchStart = this.onTouchStart.bind(this);
    this.onTouchMove = this.onTouchMove.bind(this);
    this.onTouchEnd = this.onTouchEnd.bind(this);
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

    if (this.isMobile) {
      // Mobile: use touch controls with exit callback
      this.mobileOverlay = createMobileOverlay(() => {
        this.exitPOV();
      });

      // Touch look on the main canvas area
      this.domElement.addEventListener("touchstart", this.onTouchStart, { passive: false });
      this.domElement.addEventListener("touchmove", this.onTouchMove, { passive: false });
      this.domElement.addEventListener("touchend", this.onTouchEnd);
      this.domElement.addEventListener("touchcancel", this.onTouchEnd);

      this.isLocked = true;
      this.onLock?.();
    } else {
      // Desktop: use pointer lock + keyboard
      document.addEventListener("mousemove", this.onMouseMove);
      document.addEventListener("keydown", this.onKeyDown);
      document.addEventListener("keyup", this.onKeyUp);
      document.addEventListener("pointerlockchange", this.onPointerLockChange);
      document.addEventListener("pointerlockerror", this.onPointerLockError);

      if (isPointerLockSupported()) {
        try {
          this.domElement.requestPointerLock();
        } catch (err) {
          console.warn("Pointer lock request failed:", err);
          this.isLocked = true;
          this.onLock?.();
        }
      } else {
        this.isLocked = true;
        this.onLock?.();
      }
    }
  }

  /** Clean exit from POV mode — calls disable + onUnlock */
  private exitPOV() {
    this.disable();
    this.onUnlock?.();
  }

  disable() {
    this.enabled = false;
    this.moveForward = false;
    this.moveBackward = false;
    this.moveLeft = false;
    this.moveRight = false;

    if (this.isMobile) {
      // Clean up mobile controls
      if (this.mobileOverlay) {
        this.mobileOverlay.destroy();
        this.mobileOverlay = null;
      }
      this.domElement.removeEventListener("touchstart", this.onTouchStart);
      this.domElement.removeEventListener("touchmove", this.onTouchMove);
      this.domElement.removeEventListener("touchend", this.onTouchEnd);
      this.domElement.removeEventListener("touchcancel", this.onTouchEnd);
      this.lookTouchId = null;
    } else {
      // Clean up desktop controls
      document.removeEventListener("mousemove", this.onMouseMove);
      document.removeEventListener("keydown", this.onKeyDown);
      document.removeEventListener("keyup", this.onKeyUp);
      document.removeEventListener("pointerlockchange", this.onPointerLockChange);
      document.removeEventListener("pointerlockerror", this.onPointerLockError);

      try {
        if (document.pointerLockElement) {
          document.exitPointerLock();
        }
      } catch {
        // ignore
      }
    }
    this.isLocked = false;
  }

  update(): boolean {
    if (!this.enabled) return false;

    const delta = Math.min(this.clock.getDelta(), 0.1);

    // Decelerate
    this.velocity.x -= this.velocity.x * 10.0 * delta;
    this.velocity.z -= this.velocity.z * 10.0 * delta;

    if (this.isMobile && this.mobileOverlay) {
      // Mobile: use joystick input
      const jx = this.mobileOverlay.moveVec.x;
      const jz = this.mobileOverlay.moveVec.z;
      if (Math.abs(jx) > 0.1 || Math.abs(jz) > 0.1) {
        this.velocity.x = -jx * MOVE_SPEED * 0.5;
        this.velocity.z = -jz * MOVE_SPEED * 0.5;
      }
    } else {
      // Desktop: use keyboard input
      this.direction.z = Number(this.moveForward) - Number(this.moveBackward);
      this.direction.x = Number(this.moveRight) - Number(this.moveLeft);
      this.direction.normalize();

      if (this.moveForward || this.moveBackward) {
        this.velocity.z -= this.direction.z * MOVE_SPEED * delta * 20;
      }
      if (this.moveLeft || this.moveRight) {
        this.velocity.x -= this.direction.x * MOVE_SPEED * delta * 20;
      }
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

    // Move freely — no wall collision
    this.camera.position.x += moveX;
    this.camera.position.z += moveZ;

    // Keep at eye height
    this.camera.position.y = EYE_HEIGHT;

    return true;
  }

  // ── Desktop: Mouse Look ──
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
        // Manually exit POV on ESC (backup for pointer lock)
        this.exitPOV();
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
      // When pointer lock is released (e.g. pressing ESC), exit POV
      if (this.enabled) {
        this.exitPOV();
      }
    }
  }

  private onPointerLockError() {
    console.warn("Pointer lock error — falling back to non-locked mode");
    // Still allow the mode to work without pointer lock
    this.isLocked = true;
    this.onLock?.();
  }

  // ── Mobile: Touch Look ──
  private onTouchStart(event: TouchEvent) {
    // Only capture touches on the right half of the screen (left half is joystick)
    for (let i = 0; i < event.changedTouches.length; i++) {
      const touch = event.changedTouches[i];
      if (touch.clientX > window.innerWidth * 0.35 && this.lookTouchId === null) {
        this.lookTouchId = touch.identifier;
        this.lastLookX = touch.clientX;
        this.lastLookY = touch.clientY;
        event.preventDefault();
      }
    }
  }

  private onTouchMove(event: TouchEvent) {
    for (let i = 0; i < event.changedTouches.length; i++) {
      const touch = event.changedTouches[i];
      if (touch.identifier === this.lookTouchId) {
        const dx = touch.clientX - this.lastLookX;
        const dy = touch.clientY - this.lastLookY;
        this.lastLookX = touch.clientX;
        this.lastLookY = touch.clientY;

        this.euler.setFromQuaternion(this.camera.quaternion);
        this.euler.y -= dx * TOUCH_LOOK_SENSITIVITY;
        this.euler.x -= dy * TOUCH_LOOK_SENSITIVITY;
        this.euler.x = Math.max(-Math.PI / 2.5, Math.min(Math.PI / 2.5, this.euler.x));
        this.camera.quaternion.setFromEuler(this.euler);
        event.preventDefault();
      }
    }
  }

  private onTouchEnd(event: TouchEvent) {
    for (let i = 0; i < event.changedTouches.length; i++) {
      if (event.changedTouches[i].identifier === this.lookTouchId) {
        this.lookTouchId = null;
      }
    }
  }

  dispose() {
    this.disable();
  }
}
