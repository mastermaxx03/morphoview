import { useState, useEffect } from "react";
import ImagePreviewModal from "./ImagePreviewModal";

import "./ScanQueue.css";

const ScanQueue = ({ slides, setSlides }) => {
  const [currentlyScanning, setCurrentlyScanning] = useState(null);
  const [scanProgress, setScanProgress] = useState(0);
  const [selectedSlide, setSelectedSlide] = useState(null);

  // Auto-scan logic
  useEffect(() => {
    const scanNext = () => {
      // Get queued slides sorted by priority (don't include currently scanning)
      const queued = slides
        .filter((s) => s.status === "queued")
        .sort((a, b) => {
          const priorityOrder = { urgent: 0, normal: 1, low: 2 };
          if (priorityOrder[a.priority] !== priorityOrder[b.priority]) {
            return priorityOrder[a.priority] - priorityOrder[b.priority];
          }
          return a.uploadTime - b.uploadTime;
        });

      if (queued.length > 0 && !currentlyScanning) {
        const nextSlide = queued[0];
        setCurrentlyScanning(nextSlide.file_id);

        // Update status to scanning
        setSlides(
          slides.map((s) =>
            s.file_id === nextSlide.file_id ? { ...s, status: "scanning" } : s
          )
        );
      }
    };

    const timer = setInterval(scanNext, 1500); // Increased to 2 seconds
    return () => clearInterval(timer);
  }, [slides, currentlyScanning, setSlides]);

  useEffect(() => {
    if (currentlyScanning) {
      setScanProgress(0);
      const progressTimer = setInterval(() => {
        setScanProgress((prev) => {
          if (prev >= 100) {
            clearInterval(progressTimer);

            // Mark as complete
            setSlides((prevSlides) =>
              prevSlides.map((s) =>
                s.file_id === currentlyScanning
                  ? { ...s, status: "complete" }
                  : s
              )
            );
            setCurrentlyScanning(null);
            return 0;
          }
          return prev + 1.15;
        });
      }, 80);

      return () => clearInterval(progressTimer);
    }
  }, [currentlyScanning, setSlides]);
  const handleDelete = (slideId) => {
    fetch(`http://localhost:8000/upload/${slideId}`, { method: "DELETE" })
      .then((res) => res.json())
      .then(() => {
        setSlides((prevSlides) =>
          prevSlides.filter((s) => s.file_id !== slideId)
        );
      })
      .catch((err) => console.error("Delete failed:", err));
  };
  const handlePrioritise = (slideId) => {
    setSlides((prevSlides) =>
      prevSlides.map((s) =>
        s.file_id === slideId ? { ...s, priority: "urgent" } : s
      )
    );
  };

  const handleCancel = (slideId) => {
    setSlides((prevSlides) => prevSlides.filter((s) => s.file_id !== slideId));
  };

  const queuedSlides = slides.filter(
    (s) => s.status === "queued" || s.status === "scanning"
  );
  const completedSlides = slides.filter((s) => s.status === "complete");

  if (slides.length === 0) return null;

  return (
    <div className="scan-queue-container">
      {/* Left: Queue */}
      <div className="queue-section">
        <h2>Scan Queue ({queuedSlides.length})</h2>

        <div className="queue-list">
          {queuedSlides.map((slide, index) => (
            <div
              key={slide.file_id}
              className={`queue-item priority-${slide.priority}`}
            >
              <div className={`priority-bar priority-${slide.priority}`}></div>

              <div className="slide-id">L15-{50 + index}</div>

              <div className="slide-preview">
                <img
                  src={`http://localhost:8000/uploads/${slide.saved_as}`}
                  alt={slide.filename}
                />

                {slide.status === "scanning" &&
                slide.file_id === currentlyScanning ? (
                  <div className="scan-status scanning">
                    <div className="progress-bar-scan">
                      <div
                        className="progress-fill-scan"
                        style={{ width: `${scanProgress}%` }}
                      ></div>
                    </div>
                    <span>Scanning... {Math.floor(scanProgress)}%</span>
                  </div>
                ) : (
                  <div className="scan-status">
                    <div className="spinner-small"></div>
                    <span>Scan Queued</span>
                  </div>
                )}
              </div>

              <div className="barcode">
                <div className="barcode-lines"></div>
                <span>{600 + index * 100}</span>
              </div>

              <div className="queue-actions">
                <button
                  className="action-btn"
                  onClick={() => handlePrioritise(slide.file_id)}
                  disabled={slide.priority === "urgent"}
                >
                  {slide.priority === "urgent"
                    ? "🔴 Urgent"
                    : "Prioritise Task"}
                </button>
                <button
                  className="action-btn cancel"
                  onClick={() => handleCancel(slide.file_id)}
                >
                  Cancel Task
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Right: Completed */}
      <div className="completed-section">
        <h2>Scanned Slides ({completedSlides.length})</h2>

        <div className="completed-grid">
          {completedSlides.map((slide, index) => (
            <div key={slide.file_id} className="completed-card">
              <div className="completed-thumbnail">
                <img
                  src={`http://localhost:8000/uploads/${slide.saved_as}`}
                  alt={slide.filename}
                />
              </div>
              <div className="completed-info">
                <h3>{slide.filename}</h3>

                {/* Priority Badge */}
                <span className={`priority-badge priority-${slide.priority}`}>
                  {slide.priority === "urgent" && "🔴 URGENT"}
                  {slide.priority === "normal" && "🟡 NORMAL"}
                  {slide.priority === "low" && "🟢 LOW"}
                </span>

                <div className="card-actions">
                  <button
                    className="view-btn"
                    onClick={() => setSelectedSlide(slide)}
                  >
                    View Slide
                  </button>
                  <button
                    className="delete-btn"
                    onClick={() => handleDelete(slide.file_id)}
                  >
                    🗑️ Delete
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
      <ImagePreviewModal
        slide={selectedSlide}
        isOpen={!!selectedSlide}
        onClose={() => setSelectedSlide(null)}
      />
    </div>
  );
};

export default ScanQueue;
