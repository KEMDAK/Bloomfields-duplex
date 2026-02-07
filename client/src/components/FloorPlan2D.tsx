import { useEffect, useRef, useState, useCallback } from "react";
import {
  rooms,
  walls,
  doors,
  windows,
  dimensionLines,
  receptionVoid,
  internalStairs,
  propertyBounds,
} from "@/lib/floorPlanData";

/**
 * 2D Top-Down Floor Plan Viewer
 * Interactive canvas with pan & zoom for verifying layout accuracy.
 * Robust rendering that handles DPR and mobile devices.
 */

const COLORS_2D: Record<string, string> = {
  Reception: "#1a4d2a",
  "Guest Toilet": "#1a3a5c",
  Corridor: "#2a3a4a",
  "Internal Stairs": "#4a5568",
  "Maid's Room": "#3a1a5c",
  Kitchen: "#5c3a1a",
  Garden: "#1a4a1a",
};

const LABEL_COLORS: Record<string, string> = {
  Reception: "#88dd88",
  "Guest Toilet": "#88aadd",
  Corridor: "#aabbcc",
  "Internal Stairs": "#aabbcc",
  "Maid's Room": "#bb88dd",
  Kitchen: "#ddaa88",
  Garden: "#88cc88",
};

export default function FloorPlan2D() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [showDims, setShowDims] = useState(true);
  const [showLabels, setShowLabels] = useState(true);
  const [canvasSize, setCanvasSize] = useState({ w: 0, h: 0 });
  const animFrameRef = useRef<number>(0);

  // Pan & zoom state
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

    // Reset transform and clear
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.fillStyle = "#0d1117";
    ctx.fillRect(0, 0, W, H);

    // Transform: center the property in the canvas
    const propW = propertyBounds.maxX - propertyBounds.minX;
    const propH = propertyBounds.maxZ - propertyBounds.minZ;
    const baseOffX = (W - propW * scale) / 2 - propertyBounds.minX * scale;
    const baseOffY = (H - propH * scale) / 2 - propertyBounds.minZ * scale;

    const tx = (x: number) => x * scale + baseOffX + offsetX;
    const ty = (z: number) => z * scale + baseOffY + offsetY;

    // ── Draw room fills ──
    for (const room of rooms) {
      ctx.fillStyle = COLORS_2D[room.name] || "#1a2a3a";
      ctx.globalAlpha = 0.5;
      ctx.beginPath();
      const v0 = room.vertices[0];
      ctx.moveTo(tx(v0[0]), ty(v0[1]));
      for (let i = 1; i < room.vertices.length; i++) {
        ctx.lineTo(tx(room.vertices[i][0]), ty(room.vertices[i][1]));
      }
      ctx.closePath();
      ctx.fill();
      ctx.globalAlpha = 1;
    }

    // (Reception void removed per user request)

    // ── Draw stair treads ──
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
    // Arrow showing direction up
    const arrowZ = s.z + s.depth * 0.3;
    const arrowX = s.x + s.width / 2;
    ctx.fillStyle = "#aabbcc";
    ctx.beginPath();
    ctx.moveTo(tx(arrowX), ty(s.z + 0.1));
    ctx.lineTo(tx(arrowX - 0.3), ty(arrowZ));
    ctx.lineTo(tx(arrowX + 0.3), ty(arrowZ));
    ctx.closePath();
    ctx.fill();

    // ── Draw walls ──
    for (const wall of walls) {
      const [sx, sz] = wall.start;
      const [ex, ez] = wall.end;
      const dx = ex - sx;
      const dz = ez - sz;
      const len = Math.sqrt(dx * dx + dz * dz);
      if (len < 0.01) continue;

      const nx = -dz / len;
      const nz = dx / len;
      const ht = wall.thickness / 2;

      const x1 = tx(sx + nx * ht);
      const y1 = ty(sz + nz * ht);
      const x2 = tx(ex + nx * ht);
      const y2 = ty(ez + nz * ht);
      const x3 = tx(ex - nx * ht);
      const y3 = ty(ez - nz * ht);
      const x4 = tx(sx - nx * ht);
      const y4 = ty(sz - nz * ht);

      ctx.fillStyle = wall.isExterior ? "#334466" : "#2a3a4a";
      ctx.globalAlpha = 0.9;
      ctx.beginPath();
      ctx.moveTo(x1, y1);
      ctx.lineTo(x2, y2);
      ctx.lineTo(x3, y3);
      ctx.lineTo(x4, y4);
      ctx.closePath();
      ctx.fill();

      ctx.strokeStyle = wall.isExterior ? "#00d4ff" : "#336688";
      ctx.lineWidth = wall.isExterior ? 2 : 1;
      ctx.globalAlpha = wall.isExterior ? 0.8 : 0.5;
      ctx.stroke();
      ctx.globalAlpha = 1;
    }

    // ── Draw doors ──
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

    // ── Draw windows ──
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

    // ── Draw room labels ──
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

    // ── Draw dimension lines ──
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

    // ── North arrow ──
    const nax = W - 40;
    const nay = H - 40;
    ctx.fillStyle = "#00d4ff";
    ctx.beginPath();
    ctx.moveTo(nax, nay - 18);
    ctx.lineTo(nax - 8, nay + 8);
    ctx.lineTo(nax + 8, nay + 8);
    ctx.closePath();
    ctx.fill();
    ctx.font = "bold 12px 'JetBrains Mono', monospace";
    ctx.textAlign = "center";
    ctx.fillText("N", nax, nay - 22);

    // ── Scale bar ──
    const sbY = H - 25;
    const sbX = 20;
    const sbLen = 1 * scale;
    ctx.strokeStyle = "#00d4ff";
    ctx.lineWidth = 2;
    ctx.globalAlpha = 0.7;
    ctx.beginPath();
    ctx.moveTo(sbX, sbY);
    ctx.lineTo(sbX + sbLen, sbY);
    ctx.moveTo(sbX, sbY - 4);
    ctx.lineTo(sbX, sbY + 4);
    ctx.moveTo(sbX + sbLen, sbY - 4);
    ctx.lineTo(sbX + sbLen, sbY + 4);
    ctx.stroke();
    ctx.font = "10px 'JetBrains Mono', monospace";
    ctx.textAlign = "center";
    ctx.fillStyle = "#00d4ff";
    ctx.fillText("1m", sbX + sbLen / 2, sbY - 8);
    ctx.globalAlpha = 1;
  }, [showDims, showLabels]);

  // Setup canvas and handle resize
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

    // Auto-fit scale
    const propW = propertyBounds.maxX - propertyBounds.minX;
    const propH = propertyBounds.maxZ - propertyBounds.minZ;
    const padding = 60;
    const fitScale = Math.min(
      (w - padding * 2) / propW,
      (h - padding * 2) / propH
    );
    stateRef.current.scale = fitScale;
    stateRef.current.offsetX = 0;
    stateRef.current.offsetY = 0;

    setCanvasSize({ w, h });
    draw();
  }, [draw]);

  // Initial setup + resize listener
  useEffect(() => {
    // Delay initial draw slightly to ensure container is laid out
    const timer = setTimeout(setupCanvas, 50);
    window.addEventListener("resize", setupCanvas);
    return () => {
      clearTimeout(timer);
      window.removeEventListener("resize", setupCanvas);
    };
  }, [setupCanvas]);

  // Redraw on toggle changes
  useEffect(() => {
    draw();
  }, [draw, showDims, showLabels]);

  // Mouse/touch handlers for pan & zoom
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

    const onMouseDown = (e: MouseEvent) => {
      st.isPanning = true;
      st.lastX = e.clientX;
      st.lastY = e.clientY;
    };
    const onMouseMove = (e: MouseEvent) => {
      if (!st.isPanning) return;
      st.offsetX += e.clientX - st.lastX;
      st.offsetY += e.clientY - st.lastY;
      st.lastX = e.clientX;
      st.lastY = e.clientY;
      requestDraw();
    };
    const onMouseUp = () => {
      st.isPanning = false;
    };

    const onTouchStart = (e: TouchEvent) => {
      if (e.touches.length === 1) {
        st.isPanning = true;
        st.lastX = e.touches[0].clientX;
        st.lastY = e.touches[0].clientY;
      } else if (e.touches.length === 2) {
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
        if (st.lastPinchDist > 0) {
          const factor = dist / st.lastPinchDist;
          st.scale *= factor;
          st.scale = Math.max(10, Math.min(200, st.scale));
          requestDraw();
        }
        st.lastPinchDist = dist;
      }
    };
    const onTouchEnd = () => {
      st.isPanning = false;
      st.lastPinchDist = 0;
    };

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
    <div
      ref={containerRef}
      className="relative w-full overflow-hidden"
      style={{
        height: "100dvh",
        backgroundColor: "#0d1117",
        touchAction: "none",
      }}
    >
      <canvas
        ref={canvasRef}
        style={{
          display: "block",
          width: "100%",
          height: "100%",
        }}
      />

      {/* Title */}
      <div className="absolute top-3 left-3 z-10 sm:top-4 sm:left-4">
        <h1
          className="text-white text-sm sm:text-lg font-bold tracking-wider"
          style={{ fontFamily: "'JetBrains Mono', monospace" }}
        >
          TYPE DU1 — GROUND FLOOR
        </h1>
        <p
          className="text-cyan-400 text-[10px] sm:text-xs mt-1"
          style={{ fontFamily: "'JetBrains Mono', monospace" }}
        >
          2D Verification View · True to Scale
        </p>
      </div>

      {/* Controls */}
      <div className="absolute bottom-3 left-3 z-10 flex gap-2 sm:bottom-4 sm:left-4">
        <button
          onClick={() => setShowDims((v) => !v)}
          className={`px-2 py-1 sm:px-3 sm:py-1.5 text-[10px] sm:text-xs font-mono rounded border transition-colors ${
            showDims
              ? "bg-cyan-900/50 border-cyan-500 text-cyan-300"
              : "bg-gray-900/50 border-gray-600 text-gray-400"
          }`}
        >
          Dims
        </button>
        <button
          onClick={() => setShowLabels((v) => !v)}
          className={`px-2 py-1 sm:px-3 sm:py-1.5 text-[10px] sm:text-xs font-mono rounded border transition-colors ${
            showLabels
              ? "bg-cyan-900/50 border-cyan-500 text-cyan-300"
              : "bg-gray-900/50 border-gray-600 text-gray-400"
          }`}
        >
          Labels
        </button>
        <button
          onClick={setupCanvas}
          className="px-2 py-1 sm:px-3 sm:py-1.5 text-[10px] sm:text-xs font-mono rounded border bg-gray-900/50 border-gray-600 text-gray-400 hover:border-cyan-500 hover:text-cyan-300 transition-colors"
        >
          Reset
        </button>
      </div>

      {/* Legend - hidden on very small screens */}
      <div
        className="absolute top-3 right-3 z-10 bg-gray-900/80 border border-gray-700 rounded-lg p-2 sm:p-3 text-[10px] sm:text-xs hidden sm:block"
        style={{ fontFamily: "'JetBrains Mono', monospace" }}
      >
        <div className="text-gray-300 font-bold mb-2">LEGEND</div>
        {Object.entries(COLORS_2D)
          .filter(([name]) => name !== "Garden")
          .map(([name, color]) => (
            <div key={name} className="flex items-center gap-2 mb-1">
              <div
                className="w-3 h-3 rounded-sm"
                style={{ backgroundColor: color, opacity: 0.7 }}
              />
              <span style={{ color: LABEL_COLORS[name] || "#ccc" }}>{name}</span>
            </div>
          ))}
        <div className="flex items-center gap-2 mb-1 mt-2">
          <div className="w-3 h-1 bg-orange-500 rounded" />
          <span className="text-orange-400">Doors</span>
        </div>
        <div className="flex items-center gap-2 mb-1">
          <div className="w-3 h-1 bg-blue-500 rounded" />
          <span className="text-blue-400">Windows</span>
        </div>
        <div className="flex items-center gap-2">
          <div
            className="w-3 h-3 border border-dashed border-cyan-400 rounded-sm"
            style={{ opacity: 0.5 }}
          />
          <span className="text-cyan-400/50">Void (dashed)</span>
        </div>
      </div>

      {/* Instructions */}
      <div
        className="absolute bottom-3 right-3 z-10 text-gray-500 text-[10px] sm:text-xs sm:bottom-4 sm:right-4"
        style={{ fontFamily: "'JetBrains Mono', monospace" }}
      >
        Scroll to zoom · Drag to pan
      </div>
    </div>
  );
}
