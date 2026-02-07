/**
 * FloorPlanViewer — Unified 2D / 3D floor plan viewer
 *
 * Features:
 * - Smooth toggle between 2D (top-down canvas) and 3D (Three.js perspective)
 * - Ruler scale along edges in 2D mode
 * - Pan, zoom, orbit (touch-friendly)
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
} from "@/lib/sceneBuilder";

type ViewMode = "2d" | "3d";

// ═══════════════════════════════════════════════════════════════
// 2D COLORS
// ═══════════════════════════════════════════════════════════════
const COLORS_2D: Record<string, string> = {
  Reception: "#1a4d2a",
  "Guest Toilet": "#1a3a5c",
  "Male Toilet": "#1a4a6c",
  Corridor: "#2a3a4a",
  Stairs: "#4a5568",
  "Maid's Room": "#3a1a5c",
  Kitchen: "#5c3a1a",
  Garden: "#1a4a1a",
};

const LABEL_COLORS: Record<string, string> = {
  Reception: "#88dd88",
  "Guest Toilet": "#88aadd",
  "Male Toilet": "#88bbdd",
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
        {mode === "3d" && (
          <div className="absolute bottom-14 left-1/2 -translate-x-1/2 sm:hidden">
            <p className="text-gray-500 font-mono text-[10px] bg-black/40 px-3 py-1 rounded-full">
              Swipe to rotate · Pinch to zoom
            </p>
          </div>
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

    // ── Void (dashed) ──
    ctx.setLineDash([8, 4]);
    ctx.strokeStyle = "#00d4ff";
    ctx.lineWidth = 1.5;
    ctx.globalAlpha = 0.4;
    ctx.strokeRect(tx(receptionVoid.x), ty(receptionVoid.z), receptionVoid.width * scale, receptionVoid.depth * scale);
    ctx.setLineDash([]);
    ctx.globalAlpha = 1;

    // ── Stair treads ──
    const s = internalStairs;
    const stepH = s.depth / s.stepCount;
    ctx.strokeStyle = "#8899aa";
    ctx.lineWidth = 1;
    for (let i = 0; i <= s.stepCount; i++) {
      const z = s.z + i * stepH;
      ctx.beginPath();
      ctx.moveTo(tx(s.x), ty(z));
      ctx.lineTo(tx(s.x + s.width), ty(z));
      ctx.stroke();
    }
    // Arrow
    const arrowZ = s.z + s.depth * 0.3;
    const arrowX = s.x + s.width / 2;
    ctx.fillStyle = "#aabbcc";
    ctx.beginPath();
    ctx.moveTo(tx(arrowX), ty(s.z + 0.1));
    ctx.lineTo(tx(arrowX - 0.3), ty(arrowZ));
    ctx.lineTo(tx(arrowX + 0.3), ty(arrowZ));
    ctx.closePath();
    ctx.fill();

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

  // ── Horizontal ruler (top) ──
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
  onLoaded,
}: {
  showDims: boolean;
  showLabels: boolean;
  active: boolean;
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

    const animate = () => {
      animFrameRef.current = requestAnimationFrame(animate);
      controls.update();
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

  useEffect(() => {
    if (dimensionGroupRef.current) dimensionGroupRef.current.visible = showDims;
  }, [showDims]);

  useEffect(() => {
    if (labelGroupRef.current) labelGroupRef.current.visible = showLabels;
  }, [showLabels]);

  return (
    <div ref={containerRef} className="w-full h-full" style={{ touchAction: "none" }} />
  );
}
