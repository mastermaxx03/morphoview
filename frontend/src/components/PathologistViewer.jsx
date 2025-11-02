import { useState, useRef, useEffect } from "react";
import OSDViewer from "openseadragon";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

export default function PathologistViewer({ slide, onBack }) {
  if (!slide || !slide.imageUrl) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <Button onClick={onBack} className="px-4 py-2 bg-gray-700">
          ← Back
        </Button>
      </div>
    );
  }

  const [showHeatmap, setShowHeatmap] = useState(false);
  const [annotations, setAnnotations] = useState([]);
  const [viewerState, setViewerState] = useState(null);
  const containerRef = useRef(null);
  const minimapRef = useRef(null);
  const canvasRef = useRef(null);

  useEffect(() => {
    if (!containerRef.current) return;

    const viewer = OSDViewer({
      // Your fix from last time is here
      element: containerRef.current,
      prefixUrl: "https://openseadragon.github.io/build/openseadragon/images/",

      // --- THIS IS THE NEW DEMO IMAGE ---
      // This is a real, tiled Whole Slide Image (demo)
      tileSources:
        "https://openseadragon.github.io/example-images/duomo/duomo.dzi",
      // ---
    });

    viewer.addOnceHandler("open", () => {
      setViewerState(viewer);
      viewer.addHandler("viewport-change", () => {
        updateMinimap(viewer);
      });
    });

    return () => viewer.destroy();
  }, [slide.imageUrl]);

  const updateMinimap = (viewer) => {
    if (!minimapRef.current) return;

    const ctx = minimapRef.current.getContext("2d");
    const bounds = viewer.viewport.getBounds();

    ctx.clearRect(0, 0, minimapRef.current.width, minimapRef.current.height);

    ctx.globalAlpha = 0.3;
    ctx.fillStyle = "#ddd";
    ctx.fillRect(0, 0, minimapRef.current.width, minimapRef.current.height);

    ctx.globalAlpha = 0.6;
    ctx.fillStyle = "#3b82f6";
    ctx.fillRect(
      bounds.x * minimapRef.current.width,
      bounds.y * minimapRef.current.height,
      bounds.width * minimapRef.current.width,
      bounds.height * minimapRef.current.height
    );

    ctx.globalAlpha = 1;
    ctx.strokeStyle = "#1e40af";
    ctx.lineWidth = 2;
    ctx.strokeRect(
      bounds.x * minimapRef.current.width,
      bounds.y * minimapRef.current.height,
      bounds.width * minimapRef.current.width,
      bounds.height * minimapRef.current.height
    );
  };

  const handleAnnotate = (e) => {
    if (!showHeatmap || !viewerState) return;

    const rect = canvasRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const ctx = canvasRef.current.getContext("2d");
    ctx.strokeStyle = "rgba(34, 197, 94, 0.9)";
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(x, y, 20, 0, Math.PI * 2);
    ctx.stroke();

    const label = prompt("Annotation label:");
    if (label) {
      setAnnotations([...annotations, { x, y, label }]);
      ctx.fillStyle = "rgba(34, 197, 94, 0.9)";
      ctx.font = "bold 12px Arial";
      ctx.fillText(label, x + 25, y);
    }
  };

  return (
    <div className="min-h-screen bg-gray-900 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-white">{slide.filename}</h1>
            <p className="text-gray-400 text-sm mt-1">
              Tumor Confidence:{" "}
              <span className="text-red-400 font-bold">
                {slide.tumorConfidence}%
              </span>
            </p>
          </div>
          <div className="space-x-2">
            <Button
              onClick={() => setShowHeatmap(!showHeatmap)}
              className={`${
                showHeatmap
                  ? "bg-red-600 hover:bg-red-700"
                  : "bg-gray-700 hover:bg-gray-600"
              }`}
            >
              {showHeatmap ? "✓ AI Predictions ON" : "Show AI Predictions"}
            </Button>
            <Button onClick={onBack} className="bg-gray-700 hover:bg-gray-600">
              ← Back
            </Button>
          </div>
        </div>

        <div className="flex gap-6">
          <div className="flex-1 relative bg-black rounded-lg overflow-hidden h-96 border border-gray-700">
            <div ref={containerRef} className="w-full h-full" />

            {showHeatmap && (
              <canvas
                ref={canvasRef}
                onClick={handleAnnotate}
                className="absolute top-0 left-0 w-full h-full cursor-crosshair"
                style={{
                  backgroundImage: `
                    radial-gradient(circle at 30% 40%, rgba(255, 100, 100, 0.5), transparent 40%),
                    radial-gradient(circle at 70% 60%, rgba(255, 200, 50, 0.4), transparent 50%)
                  `,
                }}
              />
            )}
          </div>

          <div className="w-64 space-y-4">
            <Card className="bg-gray-800 border-gray-700 p-3 rounded-lg">
              <p className="text-xs text-gray-400 font-medium mb-2">
                NAVIGATION
              </p>
              <canvas
                ref={minimapRef}
                width={240}
                height={240}
                className="w-full bg-gray-900 rounded border border-gray-700"
              />
              <p className="text-xs text-gray-500 mt-2">
                Blue area = explored region
              </p>
            </Card>

            <Card className="bg-gray-800 border-gray-700 p-4 rounded-lg space-y-3">
              <div>
                <p className="text-xs text-gray-500">Tissue Quality</p>
                <p className="text-lg font-bold text-blue-400">
                  {slide.tissueQuality}%
                </p>
              </div>
              <div>
                <p className="text-xs text-gray-500">Processing Time</p>
                <p className="text-lg font-bold text-amber-400">
                  {slide.processingTime}s
                </p>
              </div>
            </Card>
          </div>
        </div>

        {annotations.length > 0 && (
          <Card className="bg-gray-800 border-gray-700 p-4 rounded-lg">
            <h3 className="font-semibold text-white mb-3">Annotations</h3>
            <div className="space-y-2">
              {annotations.map((ann, idx) => (
                <div key={idx} className="text-sm text-gray-300">
                  ✓ {ann.label}
                </div>
              ))}
            </div>
          </Card>
        )}
      </div>
    </div>
  );
}
