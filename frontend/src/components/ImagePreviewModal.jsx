import "./ImagePreviewModal.css";

const ImagePreviewModal = ({ slide, isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <button className="close-btn" onClick={onClose}>
          ✕
        </button>

        <div className="preview-container">
          <img
            src={`http://localhost:8000/uploads/${slide.saved_as}`}
            alt={slide.filename}
            className="preview-image"
          />
        </div>

        <div className="preview-info">
          <h2>{slide.filename}</h2>
          <p>
            Status: <span className="status-badge">✓ Complete</span>
          </p>
          <button className="close-modal-btn" onClick={onClose}>
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default ImagePreviewModal;
