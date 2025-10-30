import { useState } from "react";
import "./Gallery.css";

const Gallery = ({ slides, onSlideClick }) => {
  const [priorities, setPriorities] = useState({});
  const [statuses, setStatuses] = useState({});

  const handlePriorityChange = (slideId, priority) => {
    setPriorities({ ...priorities, [slideId]: priority });
  };

  if (slides.length === 0) return null;

  return (
    <div className="gallery">
      <h2>Slide Queue ({slides.length})</h2>

      <div className="queue-list">
        {slides.map((slide, index) => {
          const status = statuses[slide.file_id] || "queued";
          const priority = priorities[slide.file_id] || "normal";

          return (
            <div
              key={slide.file_id}
              className={`queue-item priority-${priority}`}
            >
              {/* Priority Bar */}
              <div className={`priority-bar priority-${priority}`}></div>

              {/* Slide ID */}
              <div className="slide-id">L15-{50 + index}</div>

              {/* Preview */}
              <div className="slide-preview">
                <img
                  src={`http://localhost:8000/uploads/${slide.saved_as}`}
                  alt={slide.filename}
                  onError={(e) => (e.target.style.display = "none")}
                />
                <div className="scan-status">
                  <div className="spinner-small"></div>
                  <span>Scan Queued</span>
                </div>
              </div>

              {/* Barcode */}
              <div className="barcode">
                <div className="barcode-lines"></div>
                <span>{600 + index * 100}</span>
              </div>

              {/* Actions */}
              <div className="queue-actions">
                <button
                  className="action-btn"
                  onClick={() => handlePriorityChange(slide.file_id, "urgent")}
                >
                  Prioritise Task
                </button>
                <button className="action-btn cancel">Cancel Task</button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default Gallery;
