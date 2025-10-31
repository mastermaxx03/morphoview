import { useCallback, useState } from "react";
import { useDropzone } from "react-dropzone";
import "./Upload.css";

const Upload = ({ onUploadComplete }) => {
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploading, setUploading] = useState(false);

  const onDrop = useCallback(
    async (acceptedFiles) => {
      setUploading(true);

      const uploadFile = async (file, index) => {
        const formData = new FormData();
        formData.append("file", file);

        try {
          // Show progress
          setUploadProgress(
            Math.floor(((index + 1) / acceptedFiles.length) * 100)
          );

          const response = await fetch("http://localhost:8000/upload", {
            method: "POST",
            body: formData,
          });
          await new Promise((resolve) => setTimeout(resolve, 600));
          const result = await response.json();
          console.log("Uploaded:", result);
          if (onUploadComplete) onUploadComplete(result);
        } catch (error) {
          console.error("Upload failed:", error);
        }
      };

      // Upload all files sequentially
      for (let i = 0; i < acceptedFiles.length; i++) {
        await uploadFile(acceptedFiles[i], i);
      }

      setUploading(false);
      setUploadProgress(0);
    },
    [onUploadComplete]
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { "image/*": [".png", ".jpg", ".jpeg", ".tiff"] },
    multiple: true,
    disabled: uploading,
  });

  return (
    <div className="upload-container">
      <h1>Welcome to MorphoView</h1>
      <p className="subtitle">AI-Assisted Digital Pathology Platform</p>

      <div
        {...getRootProps()}
        className={`dropzone ${isDragActive ? "active" : ""} ${
          uploading ? "uploading" : ""
        }`}
      >
        <input {...getInputProps()} />

        {uploading ? (
          <div className="upload-status">
            <div className="spinner"></div>
            <p>Uploading {uploadProgress}%</p>
            <div className="progress-bar">
              <div
                className="progress-fill"
                style={{ width: `${uploadProgress}%` }}
              ></div>
            </div>
          </div>
        ) : (
          <>
            <div className="upload-icon">📤</div>
            <p className="upload-text">
              {isDragActive
                ? "Drop your slides here"
                : "Drag & drop slides here, or click to browse"}
            </p>
            <p className="upload-hint">Supported: PNG, JPG, TIFF</p>
          </>
        )}
      </div>
    </div>
  );
};

export default Upload;
