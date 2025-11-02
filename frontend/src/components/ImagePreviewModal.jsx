import "./ImagePreviewModal.css";

const ImagePreviewModal = ({ slide, isOpen, onClose }) => {
  if (!isOpen || !slide) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <button className="close-btn" onClick={onClose}>
          ✕
        </button>

        <h2>{slide.filename}</h2>

        <div className="preview-container">
          {/* Original Image */}
          <div className="image-section">
            <h3>Original Slide</h3>
            <img src={slide.imageUrl} alt="Original" />
          </div>

          {/* Heatmap Overlay */}
          <div className="image-section">
            <h3>AI Analysis (Heatmap)</h3>
            <img
              src={`http://localhost:8000${slide.heatmapUrl}`}
              alt="Heatmap"
              className="preview-image" // You can reuse this class
            />
          </div>
        </div>

        {/* Metrics */}
        <div className="metrics">
          <p>
            <strong>Model Confidence:</strong> {slide.tumorConfidence}%
          </p>
          <p>
            <strong>Tissue Quality:</strong> {slide.tissueQuality}%
          </p>
          <p>
            <strong>Processing Time:</strong> {slide.processingTime}s
          </p>
          <p>
            <strong>Priority:</strong> {slide.priority?.toUpperCase()}
          </p>
        </div>
      </div>
    </div>
  );
};

export default ImagePreviewModal;
