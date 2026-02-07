/**
 * FloorPlan3D - Interactive 3D floor plan viewer
 * Supports toggling between schematic (wireframe) and realistic (textured + sun) modes.
 */
import { useEffect, useRef, useState, useCallback } from "react";
import * as THREE from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import {
  createGrid,
  createFloors,
  createWalls,
  createLabels,
  createDimensionLines,
  createStairs,
  setupLighting,
  createRealisticFloors,
  createRealisticWalls,
  createRealisticStairs,
  createRealisticGrid,
} from "@/lib/sceneBuilder";
import {
  createRealisticMaterials,
} from "@/lib/realisticMode";

type ViewMode = "perspective" | "topdown";
type RenderMode = "schematic" | "realistic";

export default function FloorPlan3D() {
  const containerRef = useRef<HTMLDivElement>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const controlsRef = useRef<OrbitControls | null>(null);
  const animFrameRef = useRef<number>(0);
  const [viewMode, setViewMode] = useState<ViewMode>("perspective");
  const [showDimensions, setShowDimensions] = useState(true);
  const [showLabels, setShowLabels] = useState(true);
  const [isLoaded, setIsLoaded] = useState(false);
  const [renderMode, setRenderMode] = useState<RenderMode>("schematic");
  const dimensionGroupRef = useRef<THREE.Group | null>(null);
  const labelGroupRef = useRef<THREE.Group | null>(null);

  // Groups for swapping modes
  const schematicGroupRef = useRef<THREE.Group | null>(null);
  const realisticGroupRef = useRef<THREE.Group | null>(null);
  const schematicLightsRef = useRef<THREE.Group | null>(null);
  const realisticLightsRef = useRef<THREE.Group | null>(null);

  const initScene = useCallback(() => {
    if (!containerRef.current) return;

    const container = containerRef.current;
    const width = container.clientWidth;
    const height = container.clientHeight;

    // Scene
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x0d1117);
    scene.fog = new THREE.FogExp2(0x0d1117, 0.012);
    sceneRef.current = scene;

    // Camera
    const camera = new THREE.PerspectiveCamera(50, width / height, 0.1, 100);
    camera.position.set(14, 14, 14);
    camera.lookAt(0, 0, 0);
    cameraRef.current = camera;

    // Renderer
    const renderer = new THREE.WebGLRenderer({
      antialias: true,
      alpha: false,
      powerPreference: "high-performance",
    });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.2;
    container.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    // Controls
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.08;
    controls.minDistance = 3;
    controls.maxDistance = 35;
    controls.maxPolarAngle = Math.PI / 2.05;
    controls.target.set(0, 0, 2);
    controls.enablePan = true;
    controls.panSpeed = 0.8;
    controls.rotateSpeed = 0.6;
    controls.zoomSpeed = 1.0;
    controls.touches = {
      ONE: THREE.TOUCH.ROTATE,
      TWO: THREE.TOUCH.DOLLY_PAN,
    };
    controlsRef.current = controls;

    // ── Build SCHEMATIC scene group ──
    const schematicGroup = new THREE.Group();
    schematicGroup.add(createGrid());
    schematicGroup.add(createFloors());
    schematicGroup.add(createWalls());
    schematicGroup.add(createStairs());
    schematicGroupRef.current = schematicGroup;
    scene.add(schematicGroup);

    // Schematic lighting
    const schematicLights = new THREE.Group();
    schematicLights.add(new THREE.AmbientLight(0x334466, 0.8));
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
    schematicLights.add(dir);
    const fill = new THREE.DirectionalLight(0x4488aa, 0.4);
    fill.position.set(-5, 8, -5);
    schematicLights.add(fill);
    schematicLights.add(new THREE.HemisphereLight(0x1a2a4a, 0x0a0a0a, 0.5));
    schematicLightsRef.current = schematicLights;
    scene.add(schematicLights);

    // ── Build REALISTIC scene group (hidden initially) ──
    const realisticMats = createRealisticMaterials();
    const realisticGroup = new THREE.Group();
    realisticGroup.add(createRealisticGrid());
    realisticGroup.add(createRealisticFloors(realisticMats));
    realisticGroup.add(createRealisticWalls(realisticMats));
    realisticGroup.add(createRealisticStairs());
    realisticGroup.visible = false;
    realisticGroupRef.current = realisticGroup;
    scene.add(realisticGroup);

    // Realistic lighting (hidden initially)
    const realisticLights = new THREE.Group();
    realisticLights.add(new THREE.AmbientLight(0xfff5e6, 0.5));
    const sun = new THREE.DirectionalLight(0xfff0d0, 1.8);
    sun.position.set(15, 20, 10);
    sun.castShadow = true;
    sun.shadow.mapSize.set(4096, 4096);
    sun.shadow.camera.near = 0.5;
    sun.shadow.camera.far = 60;
    sun.shadow.camera.left = -20;
    sun.shadow.camera.right = 20;
    sun.shadow.camera.top = 20;
    sun.shadow.camera.bottom = -20;
    sun.shadow.bias = -0.0005;
    sun.shadow.normalBias = 0.02;
    realisticLights.add(sun);
    const fillR = new THREE.DirectionalLight(0x8ab4f8, 0.4);
    fillR.position.set(-8, 12, -8);
    realisticLights.add(fillR);
    realisticLights.add(new THREE.HemisphereLight(0x87ceeb, 0x3a5a2a, 0.6));
    const interior = new THREE.PointLight(0xffe8c0, 0.3, 15);
    interior.position.set(0, 2.5, 3);
    realisticLights.add(interior);
    realisticLights.visible = false;
    realisticLightsRef.current = realisticLights;
    scene.add(realisticLights);

    // ── Labels & Dimensions (shared) ──
    const labels = createLabels();
    labelGroupRef.current = labels;
    scene.add(labels);

    const dimensions = createDimensionLines();
    dimensionGroupRef.current = dimensions;
    scene.add(dimensions);

    // Animate
    const animate = () => {
      animFrameRef.current = requestAnimationFrame(animate);
      controls.update();
      renderer.render(scene, camera);
    };
    animate();

    // Intro animation
    const startPos = { x: 22, y: 20, z: 22 };
    const endPos = { x: 12, y: 12, z: 12 };
    const duration = 1500;
    const startTime = Date.now();

    const animateIntro = () => {
      const elapsed = Date.now() - startTime;
      const t = Math.min(elapsed / duration, 1);
      const ease = 1 - Math.pow(1 - t, 3);
      camera.position.set(
        startPos.x + (endPos.x - startPos.x) * ease,
        startPos.y + (endPos.y - startPos.y) * ease,
        startPos.z + (endPos.z - startPos.z) * ease
      );
      if (t < 1) {
        requestAnimationFrame(animateIntro);
      } else {
        setIsLoaded(true);
      }
    };
    animateIntro();

    // Resize handler
    const handleResize = () => {
      if (!container || !camera || !renderer) return;
      const w = container.clientWidth;
      const h = container.clientHeight;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };
    window.addEventListener("resize", handleResize);

    return () => {
      window.removeEventListener("resize", handleResize);
      cancelAnimationFrame(animFrameRef.current);
      controls.dispose();
      renderer.dispose();
      if (container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }
    };
  }, []);

  useEffect(() => {
    const cleanup = initScene();
    return cleanup;
  }, [initScene]);

  // Toggle render mode
  useEffect(() => {
    const scene = sceneRef.current;
    const renderer = rendererRef.current;
    if (!scene || !renderer) return;

    const isRealistic = renderMode === "realistic";

    if (schematicGroupRef.current) schematicGroupRef.current.visible = !isRealistic;
    if (realisticGroupRef.current) realisticGroupRef.current.visible = isRealistic;
    if (schematicLightsRef.current) schematicLightsRef.current.visible = !isRealistic;
    if (realisticLightsRef.current) realisticLightsRef.current.visible = isRealistic;

    // Switch background & fog
    if (isRealistic) {
      scene.background = new THREE.Color(0x87ceeb);
      scene.fog = new THREE.FogExp2(0x87ceeb, 0.008);
      renderer.toneMappingExposure = 1.0;
    } else {
      scene.background = new THREE.Color(0x0d1117);
      scene.fog = new THREE.FogExp2(0x0d1117, 0.012);
      renderer.toneMappingExposure = 1.2;
    }
  }, [renderMode]);

  useEffect(() => {
    if (dimensionGroupRef.current) {
      dimensionGroupRef.current.visible = showDimensions;
    }
  }, [showDimensions]);

  useEffect(() => {
    if (labelGroupRef.current) {
      labelGroupRef.current.visible = showLabels;
    }
  }, [showLabels]);

  const switchView = useCallback((mode: ViewMode) => {
    if (!cameraRef.current || !controlsRef.current) return;
    const camera = cameraRef.current;
    const controls = controlsRef.current;
    setViewMode(mode);
    const targetPos = mode === "topdown"
      ? new THREE.Vector3(0, 22, 0.01)
      : new THREE.Vector3(12, 12, 12);
    const startPos = camera.position.clone();
    const duration = 800;
    const startTime = Date.now();
    const animateView = () => {
      const elapsed = Date.now() - startTime;
      const t = Math.min(elapsed / duration, 1);
      const ease = 1 - Math.pow(1 - t, 3);
      camera.position.lerpVectors(startPos, targetPos, ease);
      controls.update();
      if (t < 1) requestAnimationFrame(animateView);
    };
    animateView();
  }, []);

  const resetView = useCallback(() => {
    if (!cameraRef.current || !controlsRef.current) return;
    controlsRef.current.target.set(0, 0, 2);
    switchView("perspective");
  }, [switchView]);

  const toggleRenderMode = useCallback(() => {
    setRenderMode((m) => (m === "schematic" ? "realistic" : "schematic"));
  }, []);

  return (
    <div className="relative w-full h-full" style={{ touchAction: "none" }}>
      <div ref={containerRef} className="w-full h-full" />

      {/* Loading overlay */}
      {!isLoaded && (
        <div className="absolute inset-0 flex items-center justify-center bg-[#0d1117] z-20">
          <div className="text-center">
            <div className="w-12 h-12 border-2 border-cyan-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
            <p className="text-cyan-400 font-mono text-sm">Loading 3D Model...</p>
          </div>
        </div>
      )}

      {/* Title */}
      <div className="absolute top-3 left-3 sm:top-4 sm:left-4 z-10 pointer-events-none">
        <h1 className={`font-mono text-sm sm:text-base font-bold tracking-wider ${renderMode === "realistic" ? "text-gray-800" : "text-white"}`}>
          TYPE DU1 — GROUND FLOOR
        </h1>
        <p className={`font-mono text-[10px] sm:text-xs mt-0.5 ${renderMode === "realistic" ? "text-gray-600" : "text-cyan-400/70"}`}>
          Interactive 3D Model · {renderMode === "realistic" ? "Realistic View" : "Schematic View"}
        </p>
      </div>

      {/* Controls */}
      <div className="absolute bottom-3 left-3 right-3 sm:bottom-4 sm:left-4 sm:right-auto z-10 flex flex-wrap gap-1.5 sm:gap-2">
        <button
          onClick={() => switchView("perspective")}
          className={`px-2.5 py-1.5 sm:px-3 sm:py-1.5 rounded font-mono text-[11px] sm:text-xs transition-all ${
            viewMode === "perspective"
              ? "bg-cyan-500/30 text-cyan-300 border border-cyan-500/50"
              : "bg-black/50 text-gray-400 border border-gray-700/50 hover:text-gray-200"
          }`}
        >
          3D View
        </button>
        <button
          onClick={() => switchView("topdown")}
          className={`px-2.5 py-1.5 sm:px-3 sm:py-1.5 rounded font-mono text-[11px] sm:text-xs transition-all ${
            viewMode === "topdown"
              ? "bg-cyan-500/30 text-cyan-300 border border-cyan-500/50"
              : "bg-black/50 text-gray-400 border border-gray-700/50 hover:text-gray-200"
          }`}
        >
          Top Down
        </button>
        <button
          onClick={resetView}
          className="px-2.5 py-1.5 sm:px-3 sm:py-1.5 rounded font-mono text-[11px] sm:text-xs bg-black/50 text-gray-400 border border-gray-700/50 hover:text-gray-200 transition-all"
        >
          Reset
        </button>
        <button
          onClick={toggleRenderMode}
          className={`px-2.5 py-1.5 sm:px-3 sm:py-1.5 rounded font-mono text-[11px] sm:text-xs transition-all ${
            renderMode === "realistic"
              ? "bg-amber-500/30 text-amber-300 border border-amber-500/50"
              : "bg-black/50 text-gray-400 border border-gray-700/50 hover:text-gray-200"
          }`}
        >
          {renderMode === "realistic" ? "☀ Realistic" : "⬡ Schematic"}
        </button>
        <button
          onClick={() => setShowDimensions((d) => !d)}
          className={`px-2.5 py-1.5 sm:px-3 sm:py-1.5 rounded font-mono text-[11px] sm:text-xs transition-all ${
            showDimensions
              ? "bg-cyan-500/20 text-cyan-400 border border-cyan-500/40"
              : "bg-black/50 text-gray-500 border border-gray-700/50"
          }`}
        >
          Dims
        </button>
        <button
          onClick={() => setShowLabels((l) => !l)}
          className={`px-2.5 py-1.5 sm:px-3 sm:py-1.5 rounded font-mono text-[11px] sm:text-xs transition-all ${
            showLabels
              ? "bg-cyan-500/20 text-cyan-400 border border-cyan-500/40"
              : "bg-black/50 text-gray-500 border border-gray-700/50"
          }`}
        >
          Labels
        </button>
      </div>

      {/* Legend */}
      <div className="absolute top-3 right-3 sm:top-4 sm:right-4 z-10 hidden sm:block">
        <div className={`backdrop-blur-sm border rounded-lg p-3 font-mono text-[11px] ${
          renderMode === "realistic"
            ? "bg-white/70 border-gray-300/50"
            : "bg-black/60 border-gray-700/50"
        }`}>
          <div className={`mb-2 font-bold text-xs ${renderMode === "realistic" ? "text-gray-700" : "text-gray-400"}`}>LEGEND</div>
          <div className="space-y-1.5">
            <LegendItem color={renderMode === "realistic" ? "#d4c4a8" : "#1a5c3a"} label="Reception" dark={renderMode !== "realistic"} />
            <LegendItem color={renderMode === "realistic" ? "#c8b898" : "#5c3a1a"} label="Kitchen" dark={renderMode !== "realistic"} />
            <LegendItem color={renderMode === "realistic" ? "#d8c8a8" : "#3a1a5c"} label="Maid's Room" dark={renderMode !== "realistic"} />
            <LegendItem color={renderMode === "realistic" ? "#e0e8f0" : "#1a3a5c"} label="Guest Toilet" dark={renderMode !== "realistic"} />
            <LegendItem color={renderMode === "realistic" ? "#3a7a3a" : "#2a5c2a"} label="Garden" dark={renderMode !== "realistic"} />
            <div className={`border-t my-1.5 ${renderMode === "realistic" ? "border-gray-300/50" : "border-gray-700/50"}`} />
            <LegendItem color="#888888" label="Stairs" dark={renderMode !== "realistic"} />
            <LegendItem color="#ffa500" label="Doors" dark={renderMode !== "realistic"} />
            <LegendItem color="#4488ff" label="Windows" dark={renderMode !== "realistic"} />
          </div>
        </div>
      </div>

      {/* Mobile touch hint */}
      {isLoaded && (
        <div className="absolute bottom-16 left-1/2 -translate-x-1/2 z-10 sm:hidden pointer-events-none animate-fade-out">
          <p className="text-gray-500 font-mono text-[10px] bg-black/40 px-3 py-1 rounded-full">
            Swipe to rotate · Pinch to zoom
          </p>
        </div>
      )}

      {/* Compass */}
      <div className="absolute bottom-3 right-3 sm:bottom-4 sm:right-4 z-10">
        <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full border border-gray-700/50 bg-black/50 flex items-center justify-center">
          <span className="text-cyan-400 font-mono text-[10px] sm:text-xs font-bold">N</span>
        </div>
      </div>
    </div>
  );
}

function LegendItem({ color, label, dark }: { color: string; label: string; dark: boolean }) {
  return (
    <div className="flex items-center gap-2">
      <div className="w-3 h-3 rounded-sm" style={{ backgroundColor: color, opacity: 0.8 }} />
      <span className={dark ? "text-gray-300" : "text-gray-700"}>{label}</span>
    </div>
  );
}
