/**
 * FloorPlan3D - Interactive 3D floor plan viewer
 * Architectural Blueprint Aesthetic with full touch/mobile support
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
} from "@/lib/sceneBuilder";

type ViewMode = "perspective" | "topdown";

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
  const dimensionGroupRef = useRef<THREE.Group | null>(null);
  const labelGroupRef = useRef<THREE.Group | null>(null);

  const initScene = useCallback(() => {
    if (!containerRef.current) return;

    const container = containerRef.current;
    const width = container.clientWidth;
    const height = container.clientHeight;

    // Scene
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x0d1117);
    scene.fog = new THREE.FogExp2(0x0d1117, 0.015);
    sceneRef.current = scene;

    // Camera
    const camera = new THREE.PerspectiveCamera(50, width / height, 0.1, 100);
    camera.position.set(12, 12, 12);
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

    // Controls - touch friendly
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.08;
    controls.minDistance = 3;
    controls.maxDistance = 35;
    controls.maxPolarAngle = Math.PI / 2.05;
    controls.target.set(0, 0, 0);
    controls.enablePan = true;
    controls.panSpeed = 0.8;
    controls.rotateSpeed = 0.6;
    controls.zoomSpeed = 1.0;
    // Touch settings
    controls.touches = {
      ONE: THREE.TOUCH.ROTATE,
      TWO: THREE.TOUCH.DOLLY_PAN,
    };
    controlsRef.current = controls;

    // Build scene
    setupLighting(scene);
    scene.add(createGrid());
    scene.add(createFloors());
    scene.add(createWalls());
    scene.add(createStairs());

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
    const startPos = { x: 20, y: 18, z: 20 };
    const endPos = { x: 10, y: 10, z: 10 };
    const duration = 1500;
    const startTime = Date.now();

    const animateIntro = () => {
      const elapsed = Date.now() - startTime;
      const t = Math.min(elapsed / duration, 1);
      const ease = 1 - Math.pow(1 - t, 3); // easeOutCubic

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

  // Toggle dimensions visibility
  useEffect(() => {
    if (dimensionGroupRef.current) {
      dimensionGroupRef.current.visible = showDimensions;
    }
  }, [showDimensions]);

  // Toggle labels visibility
  useEffect(() => {
    if (labelGroupRef.current) {
      labelGroupRef.current.visible = showLabels;
    }
  }, [showLabels]);

  // View mode switching
  const switchView = useCallback(
    (mode: ViewMode) => {
      if (!cameraRef.current || !controlsRef.current) return;
      const camera = cameraRef.current;
      const controls = controlsRef.current;

      setViewMode(mode);

      const targetPos =
        mode === "topdown"
          ? new THREE.Vector3(0, 20, 0.01)
          : new THREE.Vector3(10, 10, 10);

      // Smooth camera transition
      const startPos = camera.position.clone();
      const duration = 800;
      const startTime = Date.now();

      const animateView = () => {
        const elapsed = Date.now() - startTime;
        const t = Math.min(elapsed / duration, 1);
        const ease = 1 - Math.pow(1 - t, 3);

        camera.position.lerpVectors(startPos, targetPos, ease);
        controls.update();

        if (t < 1) {
          requestAnimationFrame(animateView);
        }
      };
      animateView();
    },
    []
  );

  const resetView = useCallback(() => {
    if (!cameraRef.current || !controlsRef.current) return;
    controlsRef.current.target.set(0, 0, 0);
    switchView("perspective");
  }, [switchView]);

  return (
    <div className="relative w-full h-full" style={{ touchAction: "none" }}>
      {/* 3D Canvas Container */}
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

      {/* Top-left: Title */}
      <div className="absolute top-3 left-3 sm:top-4 sm:left-4 z-10 pointer-events-none">
        <h1 className="text-white font-mono text-sm sm:text-base font-bold tracking-wider">
          TYPE DU1 — GROUND FLOOR
        </h1>
        <p className="text-cyan-400/70 font-mono text-[10px] sm:text-xs mt-0.5">
          Interactive 3D Model · True to Scale
        </p>
      </div>

      {/* Controls Panel - responsive */}
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

      {/* Legend - hidden on very small screens */}
      <div className="absolute top-3 right-3 sm:top-4 sm:right-4 z-10 hidden sm:block">
        <div className="bg-black/60 backdrop-blur-sm border border-gray-700/50 rounded-lg p-3 font-mono text-[11px]">
          <div className="text-gray-400 mb-2 font-bold text-xs">LEGEND</div>
          <div className="space-y-1.5">
            <LegendItem color="#1a5c3a" label="Reception" />
            <LegendItem color="#5c3a1a" label="Kitchen" />
            <LegendItem color="#3a1a5c" label="Maid's Room" />
            <LegendItem color="#1a3a5c" label="Guest Toilet" />
            <LegendItem color="#5c5c1a" label="Staircase" />
            <LegendItem color="#2a5c2a" label="Garden" />
            <div className="border-t border-gray-700/50 my-1.5" />
            <LegendItem color="#ffa500" label="Doors" />
            <LegendItem color="#4488ff" label="Windows" />
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

function LegendItem({ color, label }: { color: string; label: string }) {
  return (
    <div className="flex items-center gap-2">
      <div
        className="w-3 h-3 rounded-sm"
        style={{ backgroundColor: color, opacity: 0.7 }}
      />
      <span className="text-gray-300">{label}</span>
    </div>
  );
}
