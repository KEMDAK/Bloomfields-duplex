/**
 * Realistic Mode - Lightweight materials & natural sun lighting
 * Uses plain colored MeshStandardMaterials for performance.
 */
import * as THREE from "three";

// ─── Material Sets ──────────────────────────────────────────

export interface RealisticMaterials {
  receptionFloor: THREE.MeshStandardMaterial;
  kitchenFloor: THREE.MeshStandardMaterial;
  bathroomFloor: THREE.MeshStandardMaterial;
  bedroomFloor: THREE.MeshStandardMaterial;
  gardenFloor: THREE.MeshStandardMaterial;
  corridorFloor: THREE.MeshStandardMaterial;
  stairsFloor: THREE.MeshStandardMaterial;
  exteriorWall: THREE.MeshStandardMaterial;
  interiorWall: THREE.MeshStandardMaterial;
  gardenWall: THREE.MeshStandardMaterial;
  ground: THREE.MeshStandardMaterial;
}

export function createRealisticMaterials(): RealisticMaterials {
  return {
    receptionFloor: new THREE.MeshStandardMaterial({
      color: 0xd4c4a8,
      roughness: 0.4,
      metalness: 0.05,
      side: THREE.DoubleSide,
    }),
    kitchenFloor: new THREE.MeshStandardMaterial({
      color: 0xc8b898,
      roughness: 0.3,
      metalness: 0.05,
      side: THREE.DoubleSide,
    }),
    bathroomFloor: new THREE.MeshStandardMaterial({
      color: 0xe0e8f0,
      roughness: 0.2,
      metalness: 0.1,
      side: THREE.DoubleSide,
    }),
    bedroomFloor: new THREE.MeshStandardMaterial({
      color: 0xd8c8a8,
      roughness: 0.5,
      metalness: 0.0,
      side: THREE.DoubleSide,
    }),
    gardenFloor: new THREE.MeshStandardMaterial({
      color: 0x4a8a4a,
      roughness: 0.9,
      metalness: 0.0,
      side: THREE.DoubleSide,
    }),
    corridorFloor: new THREE.MeshStandardMaterial({
      color: 0xc0b090,
      roughness: 0.4,
      metalness: 0.05,
      side: THREE.DoubleSide,
    }),
    stairsFloor: new THREE.MeshStandardMaterial({
      color: 0xa09888,
      roughness: 0.7,
      metalness: 0.0,
      side: THREE.DoubleSide,
    }),
    exteriorWall: new THREE.MeshStandardMaterial({
      color: 0xe8e0d0,
      roughness: 0.7,
      metalness: 0.0,
    }),
    interiorWall: new THREE.MeshStandardMaterial({
      color: 0xf0ece4,
      roughness: 0.8,
      metalness: 0.0,
    }),
    gardenWall: new THREE.MeshStandardMaterial({
      color: 0xc8c0b0,
      roughness: 0.8,
      metalness: 0.0,
    }),
    ground: new THREE.MeshStandardMaterial({
      color: 0x888888,
      roughness: 0.9,
      metalness: 0.0,
    }),
  };
}

// ─── Room name to material mapping ──────────────────────────

export function getFloorMaterial(roomName: string, materials: RealisticMaterials): THREE.MeshStandardMaterial {
  const name = roomName.toLowerCase();
  if (name.includes("reception")) return materials.receptionFloor;
  if (name.includes("kitchen")) return materials.kitchenFloor;
  if (name.includes("bathroom") || name.includes("toilet")) return materials.bathroomFloor;
  if (name.includes("maid") && name.includes("room")) return materials.bedroomFloor;
  if (name.includes("garden")) return materials.gardenFloor;
  if (name.includes("corridor")) return materials.corridorFloor;
  if (name.includes("stair")) return materials.stairsFloor;
  return materials.receptionFloor;
}
