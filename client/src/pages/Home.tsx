/**
 * Home Page - Full-screen 3D Floor Plan Viewer
 * Architectural Blueprint Aesthetic: dark canvas, cyan wireframes, color-coded rooms
 */
import FloorPlan3D from "@/components/FloorPlan3D";

export default function Home() {
  return (
    <div className="w-screen h-screen overflow-hidden bg-[#0d1117]">
      <FloorPlan3D />
    </div>
  );
}
