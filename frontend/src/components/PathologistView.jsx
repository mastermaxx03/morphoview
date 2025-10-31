import { useState } from "react";
import PathologistViewer from "./PathologistViewer";
import { Card } from "@/components/ui/card";

export default function PathologistView({ slides }) {
  const [selectedSlide, setSelectedSlide] = useState(null);

  // Only show completed/scanned slides
  const scannedSlides = slides
    .filter((s) => s.status === "completed")
    .sort((a, b) => {
      const priorityOrder = { high: 0, normal: 1, low: 2 };
      return (
        (priorityOrder[a.priority] || 1) - (priorityOrder[b.priority] || 1)
      );
    });

  if (selectedSlide) {
    return (
      <PathologistViewer
        slide={selectedSlide}
        onBack={() => setSelectedSlide(null)}
      />
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 p-8">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-4xl font-bold text-white mb-8">Slide Review</h1>

        {scannedSlides.length === 0 ? (
          <Card className="bg-gray-800 border-gray-700 p-12 text-center rounded-xl">
            <p className="text-gray-400 text-lg">No scanned slides available</p>
          </Card>
        ) : (
          <div className="grid grid-cols-3 gap-6">
            {scannedSlides.map((slide) => (
              <Card
                key={slide.file_id}
                onClick={() => setSelectedSlide(slide)}
                className="bg-gray-800 border-gray-700 p-4 rounded-xl cursor-pointer hover:border-gray-500 transition"
              >
                <img
                  src={slide.imageUrl}
                  alt={slide.filename}
                  className="w-full h-40 object-cover rounded mb-3"
                  onError={(e) =>
                    (e.target.src = "https://via.placeholder.com/150")
                  }
                />
                <h3 className="text-white font-semibold text-sm truncate">
                  {slide.filename}
                </h3>
                <p className="text-gray-400 text-xs mt-2">
                  Confidence:{" "}
                  <span className="text-red-400">{slide.tumorConfidence}%</span>
                </p>
                <p className="text-gray-400 text-xs">
                  Quality:{" "}
                  <span className="text-blue-400">{slide.wsiQuality}%</span>
                </p>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
