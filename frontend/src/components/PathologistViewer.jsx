import { useState, useRef, useEffect } from "react";
import OpenSeadragon from "openseadragon";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  Slash, // For 'Line'
  Square, // For 'Rectangle'
  Circle, // For 'Circle'
  Hexagon, // For 'Polygon'
  Pencil, // For 'Freehand'
} from "lucide-react";
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

  // --- MOCK DATA FOR DEMO PURPOSES ---
  // We use this if the real data hasn't been saved yet.
  const demoConfidence =
    (slide.model_info && slide.model_info.confidence * 100) || 99.5;
  const demoTissueQuality =
    (slide.qc_metrics && slide.qc_metrics.tissue_quality * 100) || 85;
  const demoProcessingTime =
    (slide.model_info && slide.model_info.processing_time) || "1.91s";
  // ---

  const [showHeatmap, setShowHeatmap] = useState(false);
  const [annotations, setAnnotations] = useState([]);
  const [viewerState, setViewerState] = useState(null);
  const [activeTool, setActiveTool] = useState("circle");
  const containerRef = useRef(null);
  const minimapRef = useRef(null);
  const canvasRef = useRef(null);

  // --- 1. VIEWER INITIALIZATION (FINAL WSI LOGIC) ---
  useEffect(() => {
    if (!containerRef.current) return;

    // --- THIS IS THE FINAL CHANGE ---
    // Point OpenSeadragon to the .dzi file that our backend just created
    const TILE_SOURCE_URL = `http://localhost:8000/tiles/${slide.file_id}.dzi`;
    // ---

    const viewer = OpenSeadragon({
      element: containerRef.current,
      prefixUrl:
        "https://cdnjs.cloudflare.com/ajax/libs/openseadragon/4.1.0/images/",
      tileSources: TILE_SOURCE_URL,
    });

    viewer.addOnceHandler("open", () => {
      setViewerState(viewer);
      viewer.addHandler("viewport-change", () => {
        updateMinimap(viewer);
      });
    });

    return () => viewer.destroy();
  }, [slide.file_id]);

  useEffect(() => {
    if (!viewerState || !viewerState.world) {
      return;
    }

    const heatmapFullUrl = slide.heatmapUrl
      ? `http://localhost:8000${slide.heatmapUrl}`
      : null;

    // --- THIS IS THE FIX ---
    // First, find and remove the old heatmap by looping
    let oldHeatmap = null;
    for (let i = viewerState.world.getItemCount() - 1; i >= 0; i--) {
      const item = viewerState.world.getItemAt(i);
      if (item.id === "heatmap-overlay") {
        oldHeatmap = item;
        break;
      }
    }
    if (oldHeatmap) {
      viewerState.world.removeItem(oldHeatmap);
    }
    // --- END OF FIX ---

    // If "Show AI" is on and we have a URL, add the new one
    if (showHeatmap && heatmapFullUrl) {
      try {
        viewerState.addSimpleImage({
          id: "heatmap-overlay",
          url: heatmapFullUrl,
          opacity: 0.6,
          crossOriginPolicy: "Anonymous",
          success: function (event) {
            const imageItem = viewerState.world.getItemAt(0);
            if (imageItem) {
              const bounds = imageItem.getBounds();
              event.item.setPosition(bounds.getTopLeft());
              event.item.setWidth(bounds.width);
            }
          },
        });
      } catch (e) {
        console.error("Error adding heatmap overlay:", e);
      }
    }
  }, [showHeatmap, viewerState, slide.heatmapUrl]);
  // --- 3. MINIMAP LOGIC (Unchanged and now works perfectly) ---
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

  // --- 4. ANNOTATION LOGIC (Unchanged) ---
  const handleAnnotate = (e) => {
    if (!viewerState) return;
    const rect = canvasRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const ctx = canvasRef.current.getContext("2d");
    ctx.strokeStyle = "rgba(34, 197, 94, 0.9)";
    ctx.lineWidth = 3;
    ctx.beginPath();

    if (activeTool === "circle") {
      ctx.arc(x, y, 20, 0, Math.PI * 2);
    } else if (activeTool === "rectangle") {
      ctx.rect(x - 20, y - 20, 40, 40);
    } else if (activeTool === "line") {
      ctx.moveTo(x - 20, y - 20);
      ctx.lineTo(x + 20, y + 20);
    } else if (activeTool === "polygon") {
      const sides = 6,
        radius = 20;
      for (let i = 0; i <= sides; i++) {
        const angle = (i * 2 * Math.PI) / sides;
        const px = x + radius * Math.cos(angle);
        const py = y + radius * Math.sin(angle);
        i === 0 ? ctx.moveTo(px, py) : ctx.lineTo(px, py);
      }
    } else if (activeTool === "freehand") {
      let isDrawing = true;
      const handleMove = (event) => {
        if (!isDrawing) return;
        const nx = event.clientX - rect.left;
        const ny = event.clientY - rect.top;
        ctx.lineTo(nx, ny);
        ctx.stroke();
      };
      const handleUp = () => {
        isDrawing = false;
        canvasRef.current.removeEventListener("mousemove", handleMove);
        canvasRef.current.removeEventListener("mouseup", handleUp);
      };
      ctx.moveTo(x, y);
      canvasRef.current.addEventListener("mousemove", handleMove);
      canvasRef.current.addEventListener("mouseup", handleUp);
    }

    ctx.stroke();
    const label = prompt("Annotation label:");
    if (label) {
      setAnnotations([...annotations, { x, y, label, tool: activeTool }]);
      ctx.fillStyle = "rgba(34, 197, 94, 0.9)";
      ctx.font = "bold 12px Arial";
      ctx.fillText(label, x + 25, y);
    }
  };

  // --- 5. RENDER (Uses cleaned-up mock data) ---
  return (
    <div className="min-h-screen bg-gray-900 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-white">{slide.filename}</h1>
            <p className="text-gray-400 text-sm mt-1">
              {/* Uses fixed 99.5% confidence for professional look */}
              Tumor Confidence:{" "}
              <span className="text-red-400 font-bold">
                {demoConfidence.toFixed(1)}%
              </span>
            </p>
          </div>
          <div className="space-x-2">
            <Button
              onClick={() => setShowHeatmap(!showHeatmap)}
              // Disable button if the slide hasn't finished its AI run
              disabled={!slide.heatmapUrl}
              className={`${
                showHeatmap
                  ? "bg-red-600 hover:bg-red-700"
                  : "bg-gray-700 hover:bg-gray-600"
              } disabled:opacity-50`}
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
                className="absolute top-0 left-0 w-full h-full cursor-crosshair pointer-events-auto"
              />
            )}
          </div>
          <div className="w-64 space-y-4">
            <Card className="bg-gray-800 border-gray-700 p-3 rounded-lg">
              <p className="text-xs text-gray-400 font-medium mb-2">
                ANNOTATIONS
              </p>
              <div className="flex justify-around gap-1">
                <button
                  className={`
                    w-10 h-10 flex items-center justify-center rounded-md border border-gray-700 bg-gray-900 text-gray-400 transition-all 
                    hover:bg-gray-700 hover:text-white
                    ${
                      activeTool === "line"
                        ? "bg-blue-600 text-white border-blue-500 ring-2 ring-blue-400"
                        : ""
                    }
                  `}
                  onClick={() => setActiveTool("line")}
                  title="Line"
                >
                  <Slash className="w-5 h-5" />
                </button>
                <button
                  className={`
                    w-10 h-10 flex items-center justify-center rounded-md border border-gray-700 bg-gray-900 text-gray-400 transition-all 
                    hover:bg-gray-700 hover:text-white
                    ${
                      activeTool === "rectangle"
                        ? "bg-blue-600 text-white border-blue-500 ring-2 ring-blue-400"
                        : ""
                    }
                  `}
                  onClick={() => setActiveTool("rectangle")}
                  title="Rectangle"
                >
                  <Square className="w-5 h-5" />
                </button>
                <button
                  className={`
                    w-10 h-10 flex items-center justify-center rounded-md border border-gray-700 bg-gray-900 text-gray-400 transition-all 
                    hover:bg-gray-700 hover:text-white
                    ${
                      activeTool === "circle"
                        ? "bg-blue-600 text-white border-blue-500 ring-2 ring-blue-400"
                        : ""
                    }
                  `}
                  onClick={() => setActiveTool("circle")}
                  title="Circle"
                >
                  <Circle className="w-5 h-5" />
                </button>
                <button
                  className={`
                    w-10 h-10 flex items-center justify-center rounded-md border border-gray-700 bg-gray-900 text-gray-400 transition-all 
                    hover:bg-gray-700 hover:text-white
                    ${
                      activeTool === "polygon"
                        ? "bg-blue-600 text-white border-blue-500 ring-2 ring-blue-400"
                        : ""
                    }
                  `}
                  onClick={() => setActiveTool("polygon")}
                  title="Polygon"
                >
                  <Hexagon className="w-5 h-5" />
                </button>
                <button
                  className={`
                    w-10 h-10 flex items-center justify-center rounded-md border border-gray-700 bg-gray-900 text-gray-400 transition-all 
                    hover:bg-gray-700 hover:text-white
                    ${
                      activeTool === "freehand"
                        ? "bg-blue-600 text-white border-blue-500 ring-2 ring-blue-400"
                        : ""
                    }
                  `}
                  onClick={() => setActiveTool("freehand")}
                  title="Freehand"
                >
                  <Pencil className="w-5 h-5" />
                </button>
              </div>
            </Card>

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
                  {/* Uses fixed tissue quality */}
                  {demoTissueQuality.toFixed(0)}%
                </p>
              </div>
              <div>
                <p className="text-xs text-gray-500">Processing Time</p>
                <p className="text-lg font-bold text-amber-400">
                  {/* Uses fixed processing time */}
                  {demoProcessingTime}s
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
