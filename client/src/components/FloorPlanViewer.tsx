/**
 * FloorPlanViewer — Unified 2D / 3D floor plan viewer
 *
 * Features:
 * - Smooth toggle between 2D (top-down canvas) and 3D (Three.js perspective)
 * - Ruler scale along edges in 2D mode
 * - Pan, zoom, orbit (touch-friendly)
 * - U-shaped staircase rendering
 * - Top-left notch (C area excluded)
 * - Dimension lines, labels, legend
 */
import { useEffect, useRef, useState, useCallback } from "react";
import * as THREE from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import {
  rooms,
  walls,
  doors,
  windows,
  dimensionLines,
  receptionVoid,
  internalStairs,
  propertyBounds,
  COLORS,
  WALL_HEIGHT,
  APT_DIMS,
  type WallSegment,
} from "@/lib/floorPlanData";
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
import { createRealisticMaterials } from "@/lib/realisticMode";
import { POVController } from "@/lib/povController";

type ViewMode = "2d" | "3d";

// ═══════════════════════════════════════════════════════════════
// 2D COLORS
// ═══════════════════════════════════════════════════════════════
const COLORS_2D: Record<string, string> = {
  Reception: "#1a4d2a",
  "Guest Toilet": "#1a3a5c",
  "Maid's Bathroom": "#1a4a6c",
  Corridor: "#2a3a4a",
  Stairs: "#4a5568",
  "Maid's Room": "#3a1a5c",
  Kitchen: "#5c3a1a",
  Garden: "#1a4a1a",
};

const LABEL_COLORS: Record<string, string> = {
  Reception: "#88dd88",
  "Guest Toilet": "#88aadd",
  "Maid's Bathroom": "#88bbdd",
  Corridor: "#aabbcc",
  Stairs: "#aabbcc",
  "Maid's Room": "#bb88dd",
  Kitchen: "#ddaa88",
  Garden: "#88cc88",
};

const RULER_SIZE = 30; // pixels for ruler bar

export default function FloorPlanViewer() {
  const [mode, setMode] = useState<ViewMode>("2d");
  const [showDims, setShowDims] = useState(true);
  const [showLabels, setShowLabels] = useState(true);
  const [isLoaded, setIsLoaded] = useState(false);
  const [realistic, setRealistic] = useState(false);
  const [povMode, setPovMode] = useState(false);
  const [povActive, setPovActive] = useState(false); // true when pointer is locked

  return (
    <div className="relative w-full overflow-hidden" style={{ height: "100dvh", backgroundColor: "#0d1117" }}>
      {/* 2D Layer */}
      <div
        className="absolute inset-0 transition-opacity duration-500"
        style={{ opacity: mode === "2d" ? 1 : 0, pointerEvents: mode === "2d" ? "auto" : "none", zIndex: mode === "2d" ? 5 : 1 }}
      >
        <Canvas2D showDims={showDims} showLabels={showLabels} />
      </div>

      {/* 3D Layer */}
      <div
        className="absolute inset-0 transition-opacity duration-500"
        style={{ opacity: mode === "3d" ? 1 : 0, pointerEvents: mode === "3d" ? "auto" : "none", zIndex: mode === "3d" ? 5 : 1 }}
      >
        <Scene3D
          showDims={showDims}
          showLabels={showLabels}
          active={mode === "3d"}
          realistic={realistic}
          povMode={povMode}
          onPovLock={() => setPovActive(true)}
          onPovUnlock={() => { setPovActive(false); setPovMode(false); }}
          onLoaded={() => setIsLoaded(true)}
        />
      </div>

      {/* ── UI Overlay ── */}
      <div className="absolute inset-0 z-10 pointer-events-none">
        {/* Title */}
        <div className="absolute top-3 left-3 sm:top-4 sm:left-4">
          <h1 className="text-white font-mono text-sm sm:text-base font-bold tracking-wider">
            TYPE DU1 — GROUND FLOOR
          </h1>
          <p className="text-cyan-400/70 font-mono text-[10px] sm:text-xs mt-0.5">
            {mode === "2d" ? "2D Plan View" : "3D Interactive Model"} · True to Scale
          </p>
        </div>

        {/* Legend */}
        <div className="absolute top-3 right-3 sm:top-4 sm:right-4 hidden sm:block pointer-events-auto">
          <div className="bg-black/60 backdrop-blur-sm border border-gray-700/50 rounded-lg p-3 font-mono text-[11px]">
            <div className="text-gray-400 mb-2 font-bold text-xs">LEGEND</div>
            <div className="space-y-1.5">
              {Object.entries(COLORS_2D)
                .filter(([n]) => n !== "Garden")
                .map(([name, color]) => (
                  <div key={name} className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-sm" style={{ backgroundColor: color, opacity: 0.7 }} />
                    <span style={{ color: LABEL_COLORS[name] || "#ccc" }}>{name}</span>
                  </div>
                ))}
              <div className="border-t border-gray-700/50 my-1.5" />
              <div className="flex items-center gap-2">
                <div className="w-3 h-1 bg-orange-500 rounded" />
                <span className="text-orange-400">Doors</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-1 bg-blue-500 rounded" />
                <span className="text-blue-400">Windows</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 border border-dashed border-cyan-400 rounded-sm" style={{ opacity: 0.5 }} />
                <span className="text-cyan-400/50">Void (dashed)</span>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom controls */}
        <div className="absolute bottom-3 left-3 right-3 sm:bottom-4 sm:left-4 sm:right-auto flex flex-wrap gap-1.5 sm:gap-2 pointer-events-auto">
          {/* Mode toggle */}
          <div className="flex rounded overflow-hidden border border-gray-700/50">
            <button
              onClick={() => setMode("2d")}
              className={`px-3 py-1.5 font-mono text-[11px] sm:text-xs transition-all ${
                mode === "2d"
                  ? "bg-cyan-500/30 text-cyan-300"
                  : "bg-black/50 text-gray-400 hover:text-gray-200"
              }`}
            >
              2D
            </button>
            <button
              onClick={() => setMode("3d")}
              className={`px-3 py-1.5 font-mono text-[11px] sm:text-xs transition-all ${
                mode === "3d"
                  ? "bg-cyan-500/30 text-cyan-300"
                  : "bg-black/50 text-gray-400 hover:text-gray-200"
              }`}
            >
              3D
            </button>
          </div>

          {mode === "3d" && !povActive && (
            <>
              <button
                onClick={() => setRealistic((r) => !r)}
                className={`px-2.5 py-1.5 rounded font-mono text-[11px] sm:text-xs transition-all ${
                  realistic
                    ? "bg-amber-500/30 text-amber-300 border border-amber-500/50"
                    : "bg-black/50 text-gray-400 border border-gray-700/50 hover:text-gray-200"
                }`}
              >
                {realistic ? "\u2600 Realistic" : "\u2B21 Schematic"}
              </button>
              <button
                onClick={() => setPovMode(true)}
                className="px-2.5 py-1.5 rounded font-mono text-[11px] sm:text-xs transition-all bg-emerald-500/30 text-emerald-300 border border-emerald-500/50 hover:bg-emerald-500/40"
              >
                🚶 Walk
              </button>
            </>
          )}

          <button
            onClick={() => setShowDims((d) => !d)}
            className={`px-2.5 py-1.5 rounded font-mono text-[11px] sm:text-xs transition-all ${
              showDims
                ? "bg-cyan-500/20 text-cyan-400 border border-cyan-500/40"
                : "bg-black/50 text-gray-500 border border-gray-700/50"
            }`}
          >
            Dims
          </button>
          <button
            onClick={() => setShowLabels((l) => !l)}
            className={`px-2.5 py-1.5 rounded font-mono text-[11px] sm:text-xs transition-all ${
              showLabels
                ? "bg-cyan-500/20 text-cyan-400 border border-cyan-500/40"
                : "bg-black/50 text-gray-500 border border-gray-700/50"
            }`}
          >
            Labels
          </button>
        </div>

        {/* Compass */}
        <div className="absolute bottom-3 right-3 sm:bottom-4 sm:right-4">
          <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full border border-gray-700/50 bg-black/50 flex items-center justify-center">
            <span className="text-cyan-400 font-mono text-[10px] sm:text-xs font-bold">N</span>
          </div>
        </div>

        {/* Scroll hint (2D) */}
        {mode === "2d" && (
          <div className="absolute bottom-14 right-3 sm:bottom-16 sm:right-4 text-gray-500 font-mono text-[10px]">
            Scroll to zoom · Drag to pan
          </div>
        )}

        {/* Touch hint (3D, mobile) */}
        {mode === "3d" && !povActive && (
          <div className="absolute bottom-14 left-1/2 -translate-x-1/2 sm:hidden">
            <p className="text-gray-500 font-mono text-[10px] bg-black/40 px-3 py-1 rounded-full">
              Swipe to rotate · Pinch to zoom
            </p>
          </div>
        )}

        {/* POV Mode Overlay */}
        {povActive && (
          <>
            {/* Crosshair */}
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <div className="relative w-6 h-6">
                <div className="absolute top-1/2 left-0 right-0 h-px bg-white/40" />
                <div className="absolute left-1/2 top-0 bottom-0 w-px bg-white/40" />
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-1.5 h-1.5 rounded-full bg-white/60" />
              </div>
            </div>
            {/* Controls hint - desktop */}
            <div className="absolute top-16 left-1/2 -translate-x-1/2 pointer-events-none hidden sm:block">
              <div className="bg-black/70 backdrop-blur-sm border border-gray-600/50 rounded-lg px-4 py-2 font-mono text-[11px] text-gray-300 text-center">
                <span className="text-emerald-400">WASD</span> Move &nbsp;·&nbsp; <span className="text-emerald-400">Mouse</span> Look &nbsp;·&nbsp; <span className="text-emerald-400">ESC</span> Exit
              </div>
            </div>
            {/* Controls hint - mobile */}
            <div className="absolute top-16 left-1/2 -translate-x-1/2 pointer-events-none sm:hidden">
              <div className="bg-black/70 backdrop-blur-sm border border-gray-600/50 rounded-lg px-4 py-2 font-mono text-[11px] text-gray-300 text-center">
                <span className="text-emerald-400">Joystick</span> Move &nbsp;·&nbsp; <span className="text-emerald-400">Drag</span> Look &nbsp;·&nbsp; <span className="text-red-400">✕</span> Exit
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
// 2D CANVAS COMPONENT
// ═══════════════════════════════════════════════════════════════
function Canvas2D({ showDims, showLabels }: { showDims: boolean; showLabels: boolean }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const animFrameRef = useRef<number>(0);

  const stateRef = useRef({
    scale: 40,
    offsetX: 0,
    offsetY: 0,
    isPanning: false,
    lastX: 0,
    lastY: 0,
    lastPinchDist: 0,
  });

  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    const W = canvas.width / dpr;
    const H = canvas.height / dpr;
    if (W <= 0 || H <= 0) return;

    const { scale, offsetX, offsetY } = stateRef.current;

    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.fillStyle = "#0d1117";
    ctx.fillRect(0, 0, W, H);

    // Compute transform (leave room for rulers)
    const drawW = W - RULER_SIZE;
    const drawH = H - RULER_SIZE;
    const propW = propertyBounds.maxX - propertyBounds.minX;
    const propH = propertyBounds.maxZ - propertyBounds.minZ;
    const baseOffX = RULER_SIZE + (drawW - propW * scale) / 2 - propertyBounds.minX * scale;
    const baseOffY = (drawH - propH * scale) / 2 - propertyBounds.minZ * scale;

    const tx = (x: number) => x * scale + baseOffX + offsetX;
    const ty = (z: number) => z * scale + baseOffY + offsetY;

    // ── Clip drawing area (exclude ruler zone) ──
    ctx.save();
    ctx.beginPath();
    ctx.rect(RULER_SIZE, 0, drawW, drawH);
    ctx.clip();

    // ── Room fills ──
    for (const room of rooms) {
      ctx.fillStyle = COLORS_2D[room.name] || "#1a2a3a";
      ctx.globalAlpha = 0.5;
      ctx.beginPath();
      ctx.moveTo(tx(room.vertices[0][0]), ty(room.vertices[0][1]));
      for (let i = 1; i < room.vertices.length; i++) {
        ctx.lineTo(tx(room.vertices[i][0]), ty(room.vertices[i][1]));
      }
      ctx.closePath();
      ctx.fill();
      ctx.globalAlpha = 1;
    }

    // (Reception void removed per user request)

    // ── U-shaped Stair treads ──
    drawUShapedStairs(ctx, tx, ty, scale);

    // ── Walls ──
    for (const wall of walls) {
      const [sx, sz] = wall.start;
      const [ex, ez] = wall.end;
      const dx = ex - sx;
      const dz = ez - sz;
      const len = Math.sqrt(dx * dx + dz * dz);
      if (len < 0.01) continue;
      const nx = -dz / len;
      const nz2 = dx / len;
      const ht = wall.thickness / 2;

      ctx.fillStyle = wall.isExterior ? "#334466" : "#2a3a4a";
      ctx.globalAlpha = 0.9;
      ctx.beginPath();
      ctx.moveTo(tx(sx + nx * ht), ty(sz + nz2 * ht));
      ctx.lineTo(tx(ex + nx * ht), ty(ez + nz2 * ht));
      ctx.lineTo(tx(ex - nx * ht), ty(ez - nz2 * ht));
      ctx.lineTo(tx(sx - nx * ht), ty(sz - nz2 * ht));
      ctx.closePath();
      ctx.fill();

      ctx.strokeStyle = wall.isExterior ? "#00d4ff" : "#336688";
      ctx.lineWidth = wall.isExterior ? 2 : 1;
      ctx.globalAlpha = wall.isExterior ? 0.8 : 0.5;
      ctx.stroke();
      ctx.globalAlpha = 1;
    }

    // ── Doors ──
    for (const door of doors) {
      const [px, pz] = door.position;
      const hw = door.width / 2;
      ctx.fillStyle = "#ff8800";
      ctx.globalAlpha = 0.8;
      if (door.wallDirection === "x") {
        ctx.fillRect(tx(px - hw), ty(pz) - 2, hw * 2 * scale, 4);
        ctx.strokeStyle = "#ff8800";
        ctx.lineWidth = 1.5;
        ctx.globalAlpha = 0.5;
        ctx.beginPath();
        ctx.arc(tx(px - hw), ty(pz), hw * scale, -Math.PI / 2, 0);
        ctx.stroke();
      } else {
        ctx.fillRect(tx(px) - 2, ty(pz - hw), 4, hw * 2 * scale);
        ctx.strokeStyle = "#ff8800";
        ctx.lineWidth = 1.5;
        ctx.globalAlpha = 0.5;
        ctx.beginPath();
        ctx.arc(tx(px), ty(pz - hw), hw * scale, 0, Math.PI / 2);
        ctx.stroke();
      }
      ctx.globalAlpha = 1;
    }

    // ── Windows ──
    for (const win of windows) {
      const [px, pz] = win.position;
      const hw = win.width / 2;
      ctx.strokeStyle = "#4488ff";
      ctx.lineWidth = 3;
      ctx.globalAlpha = 0.8;
      if (win.wallDirection === "x") {
        ctx.beginPath();
        ctx.moveTo(tx(px - hw), ty(pz));
        ctx.lineTo(tx(px + hw), ty(pz));
        ctx.stroke();
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(tx(px - hw), ty(pz) - 3);
        ctx.lineTo(tx(px + hw), ty(pz) - 3);
        ctx.moveTo(tx(px - hw), ty(pz) + 3);
        ctx.lineTo(tx(px + hw), ty(pz) + 3);
        ctx.stroke();
      } else {
        ctx.beginPath();
        ctx.moveTo(tx(px), ty(pz - hw));
        ctx.lineTo(tx(px), ty(pz + hw));
        ctx.stroke();
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(tx(px) - 3, ty(pz - hw));
        ctx.lineTo(tx(px) - 3, ty(pz + hw));
        ctx.moveTo(tx(px) + 3, ty(pz - hw));
        ctx.lineTo(tx(px) + 3, ty(pz + hw));
        ctx.stroke();
      }
      ctx.globalAlpha = 1;
    }

    // ── Room labels ──
    if (showLabels) {
      for (const room of rooms) {
        const [lx, lz] = room.labelPosition;
        const cx = tx(lx);
        const cy = ty(lz);
        ctx.font = `bold ${Math.max(11, Math.min(14, scale * 0.35))}px 'JetBrains Mono', monospace`;
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillStyle = LABEL_COLORS[room.name] || "#ffffff";
        ctx.fillText(room.name, cx, cy - 8);
        if (room.dimensions) {
          ctx.font = `${Math.max(9, Math.min(12, scale * 0.28))}px 'JetBrains Mono', monospace`;
          ctx.fillStyle = "#00d4ff";
          ctx.globalAlpha = 0.7;
          ctx.fillText(room.dimensions, cx, cy + 8);
          ctx.globalAlpha = 1;
        }
      }
    }

    // ── Dimension lines ──
    if (showDims) {
      for (const dim of dimensionLines) {
        const [sx2, sz2] = dim.start;
        const [ex2, ez2] = dim.end;
        const isH = Math.abs(sz2 - ez2) < 0.1;
        const offX2 = isH ? 0 : dim.offset;
        const offZ2 = isH ? dim.offset : 0;
        const x1d = tx(sx2 + offX2);
        const y1d = ty(sz2 + offZ2);
        const x2d = tx(ex2 + offX2);
        const y2d = ty(ez2 + offZ2);

        ctx.strokeStyle = "#00d4ff";
        ctx.lineWidth = 1;
        ctx.globalAlpha = 0.5;
        ctx.beginPath();
        ctx.moveTo(x1d, y1d);
        ctx.lineTo(x2d, y2d);
        ctx.stroke();

        ctx.globalAlpha = 0.3;
        ctx.beginPath();
        ctx.moveTo(tx(sx2), ty(sz2));
        ctx.lineTo(x1d, y1d);
        ctx.moveTo(tx(ex2), ty(ez2));
        ctx.lineTo(x2d, y2d);
        ctx.stroke();

        const tickPx = 6;
        ctx.globalAlpha = 0.6;
        if (isH) {
          ctx.beginPath();
          ctx.moveTo(x1d, y1d - tickPx);
          ctx.lineTo(x1d, y1d + tickPx);
          ctx.moveTo(x2d, y2d - tickPx);
          ctx.lineTo(x2d, y2d + tickPx);
          ctx.stroke();
        } else {
          ctx.beginPath();
          ctx.moveTo(x1d - tickPx, y1d);
          ctx.lineTo(x1d + tickPx, y1d);
          ctx.moveTo(x2d - tickPx, y2d);
          ctx.lineTo(x2d + tickPx, y2d);
          ctx.stroke();
        }

        const mx = (x1d + x2d) / 2;
        const my = (y1d + y2d) / 2;
        ctx.font = "10px 'JetBrains Mono', monospace";
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillStyle = "#0d1117";
        ctx.globalAlpha = 0.85;
        const tw = ctx.measureText(dim.label).width + 8;
        ctx.fillRect(mx - tw / 2, my - 8, tw, 16);
        ctx.globalAlpha = 1;
        ctx.fillStyle = "#00d4ff";
        ctx.fillText(dim.label, mx, my);
      }
      ctx.globalAlpha = 1;
    }

    ctx.restore(); // end clip

    // ═══ RULERS ═══
    drawRulers(ctx, W, H, scale, baseOffX, baseOffY, offsetX, offsetY);

  }, [showDims, showLabels]);

  const setupCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;

    const rect = container.getBoundingClientRect();
    const dpr = window.devicePixelRatio || 1;
    const w = rect.width;
    const h = rect.height;
    if (w <= 0 || h <= 0) return;

    canvas.width = w * dpr;
    canvas.height = h * dpr;
    canvas.style.width = w + "px";
    canvas.style.height = h + "px";

    const drawW = w - RULER_SIZE;
    const drawH = h - RULER_SIZE;
    const propW = propertyBounds.maxX - propertyBounds.minX;
    const propH = propertyBounds.maxZ - propertyBounds.minZ;
    const fitScale = Math.min((drawW - 80) / propW, (drawH - 80) / propH);
    stateRef.current.scale = fitScale;
    stateRef.current.offsetX = 0;
    stateRef.current.offsetY = 0;
    draw();
  }, [draw]);

  useEffect(() => {
    const timer = setTimeout(setupCanvas, 50);
    window.addEventListener("resize", setupCanvas);
    return () => {
      clearTimeout(timer);
      window.removeEventListener("resize", setupCanvas);
    };
  }, [setupCanvas]);

  useEffect(() => { draw(); }, [draw, showDims, showLabels]);

  // Pan & zoom handlers
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const st = stateRef.current;
    const requestDraw = () => {
      cancelAnimationFrame(animFrameRef.current);
      animFrameRef.current = requestAnimationFrame(draw);
    };

    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      const factor = e.deltaY > 0 ? 0.9 : 1.1;
      st.scale *= factor;
      st.scale = Math.max(10, Math.min(200, st.scale));
      requestDraw();
    };
    const onMouseDown = (e: MouseEvent) => { st.isPanning = true; st.lastX = e.clientX; st.lastY = e.clientY; };
    const onMouseMove = (e: MouseEvent) => {
      if (!st.isPanning) return;
      st.offsetX += e.clientX - st.lastX;
      st.offsetY += e.clientY - st.lastY;
      st.lastX = e.clientX;
      st.lastY = e.clientY;
      requestDraw();
    };
    const onMouseUp = () => { st.isPanning = false; };
    const onTouchStart = (e: TouchEvent) => {
      if (e.touches.length === 1) { st.isPanning = true; st.lastX = e.touches[0].clientX; st.lastY = e.touches[0].clientY; }
      else if (e.touches.length === 2) {
        st.isPanning = false;
        const dx = e.touches[0].clientX - e.touches[1].clientX;
        const dy = e.touches[0].clientY - e.touches[1].clientY;
        st.lastPinchDist = Math.sqrt(dx * dx + dy * dy);
      }
    };
    const onTouchMove = (e: TouchEvent) => {
      e.preventDefault();
      if (e.touches.length === 1 && st.isPanning) {
        st.offsetX += e.touches[0].clientX - st.lastX;
        st.offsetY += e.touches[0].clientY - st.lastY;
        st.lastX = e.touches[0].clientX;
        st.lastY = e.touches[0].clientY;
        requestDraw();
      } else if (e.touches.length === 2) {
        const dx = e.touches[0].clientX - e.touches[1].clientX;
        const dy = e.touches[0].clientY - e.touches[1].clientY;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (st.lastPinchDist > 0) { st.scale *= dist / st.lastPinchDist; st.scale = Math.max(10, Math.min(200, st.scale)); requestDraw(); }
        st.lastPinchDist = dist;
      }
    };
    const onTouchEnd = () => { st.isPanning = false; st.lastPinchDist = 0; };

    canvas.addEventListener("wheel", onWheel, { passive: false });
    canvas.addEventListener("mousedown", onMouseDown);
    window.addEventListener("mousemove", onMouseMove);
    window.addEventListener("mouseup", onMouseUp);
    canvas.addEventListener("touchstart", onTouchStart, { passive: true });
    canvas.addEventListener("touchmove", onTouchMove, { passive: false });
    canvas.addEventListener("touchend", onTouchEnd);
    return () => {
      canvas.removeEventListener("wheel", onWheel);
      canvas.removeEventListener("mousedown", onMouseDown);
      window.removeEventListener("mousemove", onMouseMove);
      window.removeEventListener("mouseup", onMouseUp);
      canvas.removeEventListener("touchstart", onTouchStart);
      canvas.removeEventListener("touchmove", onTouchMove);
      canvas.removeEventListener("touchend", onTouchEnd);
      cancelAnimationFrame(animFrameRef.current);
    };
  }, [draw]);

  return (
    <div ref={containerRef} className="w-full h-full" style={{ touchAction: "none" }}>
      <canvas ref={canvasRef} style={{ display: "block", width: "100%", height: "100%" }} />
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
// U-SHAPED STAIR DRAWING (2D)
// ═══════════════════════════════════════════════════════════════
function drawUShapedStairs(
  ctx: CanvasRenderingContext2D,
  tx: (x: number) => number,
  ty: (z: number) => number,
  scale: number,
) {
  const s = internalStairs;
  const x0 = s.x;
  const z0 = s.z;
  const totalW = s.width;
  const totalD = s.depth;
  const landingD = s.landingDepth;
  const flightW = s.leftFlightWidth;
  const centralGap = totalW - flightW * 2; // gap between two flights

  // Left flight: goes from bottom (south) to landing (north)
  // Runs from z0+totalD up to z0+landingD
  const leftFlightDepth = totalD - landingD;
  const stepsPerFlight = Math.floor(s.stepCount / 2);
  const stepD = leftFlightDepth / stepsPerFlight;

  ctx.strokeStyle = "#8899aa";
  ctx.lineWidth = 1;
  ctx.globalAlpha = 0.7;

  // Left flight treads (going north/up from bottom)
  for (let i = 0; i <= stepsPerFlight; i++) {
    const z = z0 + totalD - i * stepD;
    ctx.beginPath();
    ctx.moveTo(tx(x0), ty(z));
    ctx.lineTo(tx(x0 + flightW), ty(z));
    ctx.stroke();
  }

  // Right flight treads (going south/down from landing)
  for (let i = 0; i <= stepsPerFlight; i++) {
    const z = z0 + landingD + i * stepD;
    ctx.beginPath();
    ctx.moveTo(tx(x0 + totalW - flightW), ty(z));
    ctx.lineTo(tx(x0 + totalW), ty(z));
    ctx.stroke();
  }

  // Landing area (top, between the two flights)
  ctx.setLineDash([4, 3]);
  ctx.strokeStyle = "#8899aa";
  ctx.lineWidth = 1;
  ctx.globalAlpha = 0.5;
  ctx.strokeRect(
    tx(x0), ty(z0),
    totalW * scale, landingD * scale
  );
  ctx.setLineDash([]);
  ctx.globalAlpha = 1;

  // Central dividing wall between flights
  ctx.strokeStyle = "#667788";
  ctx.lineWidth = 2;
  ctx.globalAlpha = 0.6;
  ctx.beginPath();
  ctx.moveTo(tx(x0 + flightW), ty(z0 + landingD));
  ctx.lineTo(tx(x0 + flightW), ty(z0 + totalD));
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(tx(x0 + totalW - flightW), ty(z0 + landingD));
  ctx.lineTo(tx(x0 + totalW - flightW), ty(z0 + totalD));
  ctx.stroke();
  ctx.globalAlpha = 1;

  // UP arrow on left flight
  const arrowZ = z0 + totalD - leftFlightDepth * 0.4;
  const arrowX = x0 + flightW / 2;
  ctx.fillStyle = "#aabbcc";
  ctx.globalAlpha = 0.7;
  ctx.beginPath();
  ctx.moveTo(tx(arrowX), ty(z0 + landingD + 0.1));
  ctx.lineTo(tx(arrowX - 0.2), ty(arrowZ));
  ctx.lineTo(tx(arrowX + 0.2), ty(arrowZ));
  ctx.closePath();
  ctx.fill();
  ctx.globalAlpha = 1;

  // DOWN arrow on right flight
  const arrowZ2 = z0 + landingD + leftFlightDepth * 0.4;
  const arrowX2 = x0 + totalW - flightW / 2;
  ctx.fillStyle = "#aabbcc";
  ctx.globalAlpha = 0.7;
  ctx.beginPath();
  ctx.moveTo(tx(arrowX2), ty(z0 + totalD - 0.1));
  ctx.lineTo(tx(arrowX2 - 0.2), ty(arrowZ2));
  ctx.lineTo(tx(arrowX2 + 0.2), ty(arrowZ2));
  ctx.closePath();
  ctx.fill();
  ctx.globalAlpha = 1;

  // "UP" / "DN" labels
  ctx.font = "9px 'JetBrains Mono', monospace";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillStyle = "#aabbcc";
  ctx.globalAlpha = 0.6;
  ctx.fillText("UP", tx(arrowX), ty(z0 + totalD * 0.7));
  ctx.fillText("DN", tx(arrowX2), ty(z0 + totalD * 0.7));
  ctx.globalAlpha = 1;
}

// ═══════════════════════════════════════════════════════════════
// RULER DRAWING
// ═══════════════════════════════════════════════════════════════
function drawRulers(
  ctx: CanvasRenderingContext2D,
  W: number, H: number,
  scale: number,
  baseOffX: number, baseOffY: number,
  offsetX: number, offsetY: number,
) {
  const RS = RULER_SIZE;

  // ── Horizontal ruler (bottom) ──
  ctx.fillStyle = "#111820";
  ctx.fillRect(RS, H - RS, W - RS, RS);

  // ── Vertical ruler (left) ──
  ctx.fillStyle = "#111820";
  ctx.fillRect(0, 0, RS, H - RS);

  // ── Corner square ──
  ctx.fillStyle = "#0a0e14";
  ctx.fillRect(0, H - RS, RS, RS);

  // Determine tick interval based on scale
  let tickInterval = 1; // meters
  if (scale < 20) tickInterval = 5;
  else if (scale < 40) tickInterval = 2;
  else if (scale > 100) tickInterval = 0.5;

  const totalTx = (x: number) => x * scale + baseOffX + offsetX;
  const totalTy = (z: number) => z * scale + baseOffY + offsetY;

  ctx.font = "9px 'JetBrains Mono', monospace";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";

  // ── Vertical ruler ticks (left side, showing Z/depth in meters) ──
  const zMin = Math.floor(((0 - baseOffY - offsetY) / scale) / tickInterval) * tickInterval;
  const zMax = Math.ceil(((H - RS - baseOffY - offsetY) / scale) / tickInterval) * tickInterval;

  for (let z = zMin; z <= zMax; z += tickInterval) {
    const py = totalTy(z);
    if (py < 0 || py > H - RS) continue;

    ctx.strokeStyle = "#334455";
    ctx.lineWidth = 1;
    ctx.globalAlpha = 0.6;
    ctx.beginPath();
    ctx.moveTo(RS - 8, py);
    ctx.lineTo(RS, py);
    ctx.stroke();

    ctx.fillStyle = "#667788";
    ctx.globalAlpha = 0.8;
    ctx.save();
    ctx.translate(RS / 2, py);
    ctx.fillText(`${z.toFixed(tickInterval < 1 ? 1 : 0)}`, 0, 0);
    ctx.restore();
  }

  // Sub-ticks
  const subInterval = tickInterval / 5;
  for (let z = zMin; z <= zMax; z += subInterval) {
    const py = totalTy(z);
    if (py < 0 || py > H - RS) continue;
    ctx.strokeStyle = "#223344";
    ctx.lineWidth = 0.5;
    ctx.globalAlpha = 0.4;
    ctx.beginPath();
    ctx.moveTo(RS - 4, py);
    ctx.lineTo(RS, py);
    ctx.stroke();
  }

  // ── Horizontal ruler ticks (bottom, showing X/width in meters) ──
  const xMin = Math.floor(((RS - baseOffX - offsetX) / scale) / tickInterval) * tickInterval;
  const xMax = Math.ceil(((W - baseOffX - offsetX) / scale) / tickInterval) * tickInterval;

  for (let x = xMin; x <= xMax; x += tickInterval) {
    const px = totalTx(x);
    if (px < RS || px > W) continue;

    ctx.strokeStyle = "#334455";
    ctx.lineWidth = 1;
    ctx.globalAlpha = 0.6;
    ctx.beginPath();
    ctx.moveTo(px, H - RS);
    ctx.lineTo(px, H - RS + 8);
    ctx.stroke();

    ctx.fillStyle = "#667788";
    ctx.globalAlpha = 0.8;
    ctx.fillText(`${x.toFixed(tickInterval < 1 ? 1 : 0)}`, px, H - RS / 2);
  }

  // Sub-ticks
  for (let x = xMin; x <= xMax; x += subInterval) {
    const px = totalTx(x);
    if (px < RS || px > W) continue;
    ctx.strokeStyle = "#223344";
    ctx.lineWidth = 0.5;
    ctx.globalAlpha = 0.4;
    ctx.beginPath();
    ctx.moveTo(px, H - RS);
    ctx.lineTo(px, H - RS + 4);
    ctx.stroke();
  }

  // ── Unit label in corner ──
  ctx.globalAlpha = 0.6;
  ctx.fillStyle = "#556677";
  ctx.font = "8px 'JetBrains Mono', monospace";
  ctx.fillText("m", RS / 2, H - RS / 2);

  // ── Ruler border lines ──
  ctx.strokeStyle = "#334455";
  ctx.lineWidth = 1;
  ctx.globalAlpha = 0.5;
  ctx.beginPath();
  ctx.moveTo(RS, 0);
  ctx.lineTo(RS, H - RS);
  ctx.lineTo(W, H - RS);
  ctx.stroke();

  ctx.globalAlpha = 1;
}

// ═══════════════════════════════════════════════════════════════
// 3D SCENE COMPONENT
// ═══════════════════════════════════════════════════════════════
function Scene3D({
  showDims,
  showLabels,
  active,
  realistic,
  povMode,
  onPovLock,
  onPovUnlock,
  onLoaded,
}: {
  showDims: boolean;
  showLabels: boolean;
  active: boolean;
  realistic: boolean;
  povMode: boolean;
  onPovLock: () => void;
  onPovUnlock: () => void;
  onLoaded: () => void;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const controlsRef = useRef<OrbitControls | null>(null);
  const animFrameRef = useRef<number>(0);
  const dimensionGroupRef = useRef<THREE.Group | null>(null);
  const labelGroupRef = useRef<THREE.Group | null>(null);
  const initRef = useRef(false);
  const povControllerRef = useRef<POVController | null>(null);
  const savedCamPos = useRef(new THREE.Vector3(14, 14, 14));
  const savedCamTarget = useRef(new THREE.Vector3(0, 0, 2));

  // Groups for mode switching
  const schematicGroupRef = useRef<THREE.Group | null>(null);
  const realisticGroupRef = useRef<THREE.Group | null>(null);
  const schematicLightsRef = useRef<THREE.Group | null>(null);
  const realisticLightsRef = useRef<THREE.Group | null>(null);
  const ceilingGroupRef = useRef<THREE.Group | null>(null);
  const originalOpacities = useRef<Map<THREE.Material, { opacity: number; transparent: boolean }>>(new Map());

  const initScene = useCallback(() => {
    if (!containerRef.current || initRef.current) return;
    initRef.current = true;

    const container = containerRef.current;
    const width = container.clientWidth;
    const height = container.clientHeight;

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x0d1117);
    scene.fog = new THREE.FogExp2(0x0d1117, 0.012);
    sceneRef.current = scene;

    const camera = new THREE.PerspectiveCamera(50, width / height, 0.1, 100);
    camera.position.set(14, 14, 14);
    camera.lookAt(0, 0, 0);
    cameraRef.current = camera;

    let renderer: THREE.WebGLRenderer;
    try {
      renderer = new THREE.WebGLRenderer({
        antialias: true,
        alpha: false,
        powerPreference: "high-performance",
      });
    } catch (e) {
      console.error('WebGL not available:', e);
      initRef.current = false;
      return;
    }
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.2;
    container.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    // Handle context lost
    renderer.domElement.addEventListener('webglcontextlost', (e) => {
      e.preventDefault();
      console.warn('WebGL context lost');
      cancelAnimationFrame(animFrameRef.current);
    });
    renderer.domElement.addEventListener('webglcontextrestored', () => {
      console.log('WebGL context restored');
    });

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
    controls.touches = { ONE: THREE.TOUCH.ROTATE, TWO: THREE.TOUCH.DOLLY_PAN };
    controlsRef.current = controls;

    // ── Schematic mode ──
    const schematicGroup = new THREE.Group();
    schematicGroup.add(createGrid());
    schematicGroup.add(createFloors());
    schematicGroup.add(createWalls());
    schematicGroup.add(createStairs());
    schematicGroupRef.current = schematicGroup;
    scene.add(schematicGroup);

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

    // ── Realistic mode (lazy-initialized on first toggle) ──
    // Groups created on demand to avoid memory crash

    // ── Labels & Dimensions (shared) ──
    const labels = createLabels();
    labelGroupRef.current = labels;
    scene.add(labels);

    const dimensions = createDimensionLines();
    dimensionGroupRef.current = dimensions;
    scene.add(dimensions);

    const animate = () => {
      animFrameRef.current = requestAnimationFrame(animate);
      const pov = povControllerRef.current;
      if (pov && pov.enabled) {
        pov.update();
      } else {
        controls.update();
      }
      renderer.render(scene, camera);
    };
    animate();

    onLoaded();

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
      if (povControllerRef.current) {
        povControllerRef.current.dispose();
        povControllerRef.current = null;
      }
      controls.dispose();
      renderer.dispose();
      if (container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }
    };
  }, [onLoaded]);

  // Initialize 3D scene when first activated
  useEffect(() => {
    if (active && !initRef.current) {
      const timer = setTimeout(initScene, 100);
      return () => clearTimeout(timer);
    }
  }, [active, initScene]);

  // Toggle realistic mode (lazy init)
  useEffect(() => {
    const scene = sceneRef.current;
    const renderer = rendererRef.current;
    if (!scene || !renderer) return;

    // Lazy-create realistic group on first toggle
    if (realistic && !realisticGroupRef.current) {
      try {
        const realisticMats = createRealisticMaterials();
        const realisticGroup = new THREE.Group();
        realisticGroup.add(createRealisticGrid());
        realisticGroup.add(createRealisticFloors(realisticMats));
        realisticGroup.add(createRealisticWalls(realisticMats));
        realisticGroup.add(createRealisticStairs());
        realisticGroupRef.current = realisticGroup;
        scene.add(realisticGroup);

        const realisticLights = new THREE.Group();
        realisticLights.add(new THREE.AmbientLight(0xfff5e6, 0.5));
        const sun = new THREE.DirectionalLight(0xfff0d0, 1.6);
        sun.position.set(15, 20, 10);
        sun.castShadow = true;
        sun.shadow.mapSize.set(1024, 1024);
        sun.shadow.camera.near = 0.5;
        sun.shadow.camera.far = 50;
        sun.shadow.camera.left = -15;
        sun.shadow.camera.right = 15;
        sun.shadow.camera.top = 15;
        sun.shadow.camera.bottom = -15;
        sun.shadow.bias = -0.001;
        realisticLights.add(sun);
        const fillR = new THREE.DirectionalLight(0x8ab4f8, 0.3);
        fillR.position.set(-8, 12, -8);
        realisticLights.add(fillR);
        realisticLights.add(new THREE.HemisphereLight(0x87ceeb, 0x3a5a2a, 0.5));
        realisticLightsRef.current = realisticLights;
        scene.add(realisticLights);
      } catch (err) {
        console.error('Failed to create realistic scene:', err);
        return;
      }
    }

    if (schematicGroupRef.current) schematicGroupRef.current.visible = !realistic;
    if (realisticGroupRef.current) realisticGroupRef.current.visible = realistic;
    if (schematicLightsRef.current) schematicLightsRef.current.visible = !realistic;
    if (realisticLightsRef.current) realisticLightsRef.current.visible = realistic;

    if (realistic) {
      scene.background = new THREE.Color(0x87ceeb);
      scene.fog = new THREE.FogExp2(0x87ceeb, 0.008);
      renderer.toneMappingExposure = 1.0;
    } else {
      scene.background = new THREE.Color(0x0d1117);
      scene.fog = new THREE.FogExp2(0x0d1117, 0.012);
      renderer.toneMappingExposure = 1.2;
    }
  }, [realistic]);

  useEffect(() => {
    if (dimensionGroupRef.current) dimensionGroupRef.current.visible = showDims;
  }, [showDims]);

  useEffect(() => {
    if (labelGroupRef.current) labelGroupRef.current.visible = showLabels;
  }, [showLabels]);

  // POV mode toggle
  useEffect(() => {
    const camera = cameraRef.current;
    const controls = controlsRef.current;
    const container = containerRef.current;
    if (!camera || !controls || !container) return;

    if (povMode) {
      // Save current orbit camera state
      savedCamPos.current.copy(camera.position);
      savedCamTarget.current.copy(controls.target);

      // Disable orbit controls
      controls.enabled = false;

      // Create POV controller if not exists
      if (!povControllerRef.current) {
        povControllerRef.current = new POVController(camera, container);
      }
      const pov = povControllerRef.current;
      pov.onLock = onPovLock;
      pov.onUnlock = () => {
        // Restore orbit camera
        if (controlsRef.current && cameraRef.current) {
          cameraRef.current.position.copy(savedCamPos.current);
          controlsRef.current.target.copy(savedCamTarget.current);
          controlsRef.current.enabled = true;
          cameraRef.current.lookAt(savedCamTarget.current);
        }
        onPovUnlock();
      };

      // Widen FOV for immersion
      camera.fov = 70;
      camera.near = 0.05;
      camera.updateProjectionMatrix();

      // Make walls and floors opaque for immersive feel
      const scene = sceneRef.current;
      if (scene) {
        originalOpacities.current.clear();
        scene.traverse((obj) => {
          if (obj instanceof THREE.Mesh && obj.material instanceof THREE.MeshStandardMaterial) {
            const mat = obj.material;
            originalOpacities.current.set(mat, { opacity: mat.opacity, transparent: mat.transparent });
            if (mat.opacity < 1.0 && mat.opacity >= 0.3) {
              mat.opacity = Math.min(1.0, mat.opacity + 0.4);
              mat.transparent = mat.opacity < 1.0;
              mat.needsUpdate = true;
            }
          }
        });

        // Add ceiling
        if (!ceilingGroupRef.current) {
          const ceilingGroup = new THREE.Group();
          const ceilingMat = new THREE.MeshStandardMaterial({
            color: 0xf5f5f0,
            roughness: 0.9,
            side: THREE.DoubleSide,
          });
          // Create ceiling planes for each room
          const cx = (propertyBounds.minX + propertyBounds.maxX) / 2;
          const cz = (propertyBounds.minZ + propertyBounds.maxZ) / 2;
          for (const room of rooms) {
            if (room.name === 'Garden') continue;
            const shape = new THREE.Shape();
            const sv = room.vertices[0];
            shape.moveTo(sv[0] - cx, -(sv[1] - cz));
            for (let i = 1; i < room.vertices.length; i++) {
              const v = room.vertices[i];
              shape.lineTo(v[0] - cx, -(v[1] - cz));
            }
            shape.closePath();
            const geo = new THREE.ShapeGeometry(shape);
            const mesh = new THREE.Mesh(geo, ceilingMat);
            mesh.rotation.x = -Math.PI / 2;
            mesh.position.y = 3.0; // WALL_HEIGHT
            ceilingGroup.add(mesh);
          }
          ceilingGroupRef.current = ceilingGroup;
        }
        scene.add(ceilingGroupRef.current);

        // Remove fog for indoor feel
        scene.fog = null;
      }

      pov.enable();
    } else {
      // Disable POV
      if (povControllerRef.current && povControllerRef.current.enabled) {
        povControllerRef.current.disable();
      }

      // Restore material opacities
      originalOpacities.current.forEach((saved, mat) => {
        if (mat instanceof THREE.MeshStandardMaterial) {
          mat.opacity = saved.opacity;
          mat.transparent = saved.transparent;
          mat.needsUpdate = true;
        }
      });
      originalOpacities.current.clear();

      // Remove ceiling
      if (ceilingGroupRef.current && sceneRef.current) {
        sceneRef.current.remove(ceilingGroupRef.current);
      }

      // Restore fog
      if (sceneRef.current) {
        sceneRef.current.fog = new THREE.FogExp2(0x0d1117, 0.012);
      }

      // Restore orbit
      camera.fov = 50;
      camera.near = 0.1;
      camera.updateProjectionMatrix();
      camera.position.copy(savedCamPos.current);
      controls.target.copy(savedCamTarget.current);
      controls.enabled = true;
    }
  }, [povMode, onPovLock, onPovUnlock]);

  return (
    <div ref={containerRef} className="w-full h-full" style={{ touchAction: "none" }} />
  );
}
