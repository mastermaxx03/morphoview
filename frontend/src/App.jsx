import { useState, useEffect } from "react";
import Logo from "./components/Logo";
import Upload from "./components/Upload";
import ScanQueue from "./components/ScanQueue";
import "./App.css";
import Header from "./components/Header";
import EngineerView from "./components/EngineerView";
import PathologistView from "./components/PathologistView";
import {
  saveSlideMeta,
  loadSlideMeta,
  hydrateSlidesWithMeta,
} from "./lib/storageUtils";

function App() {
  const [slides, setSlides] = useState([]);
  const [activeRole, setActiveRole] = useState(null);

  // Load existing slides on mount
  useEffect(() => {
    loadSlides();
  }, []);

  // Save metadata whenever slides change

  const loadSlides = async () => {
    try {
      const response = await fetch("http://localhost:8000/slides");
      const data = await response.json();

      // Load saved metadata from LocalStorage
      const metadataResponse = await fetch(
        "http://localhost:8000/slides/metadata/all"
      );
      const savedMeta = await metadataResponse.json();

      // Build slides from backend
      const backendSlides = data.slides.map((filename) => ({
        file_id: filename.split(".")[0],
        filename: filename,
        saved_as: filename,
        imageUrl: `http://localhost:8000/uploads/${filename}`,
        tumorConfidence: (Math.random() * 15 + 85).toFixed(1),
        wsiQuality: (Math.random() * 15 + 80).toFixed(1),
        processingTime: (Math.random() * 2 + 1.5).toFixed(2),
        tissueQuality: (Math.random() * 15 + 80).toFixed(1),
      }));

      // Hydrate with saved metadata (priority, status, uploadTime)
      const hydratedSlides = hydrateSlidesWithMeta(backendSlides, savedMeta);

      setSlides(hydratedSlides);
    } catch (error) {
      console.error("Failed to load slides:", error);
    }
  };

  const handleUploadComplete = (result) => {
    console.log("New slide uploaded:", result);

    const newSlide = {
      file_id: result.file_id,
      filename: result.filename,
      saved_as: result.saved_as,
      status: "queued",
      priority: "normal",
      uploadTime: Date.now(),
      imageUrl: `http://localhost:8000/uploads/${result.saved_as}`,
      tumorConfidence: (Math.random() * 15 + 85).toFixed(1),
      wsiQuality: (Math.random() * 15 + 80).toFixed(1),
      processingTime: (Math.random() * 2 + 1.5).toFixed(2),
      tissueQuality: (Math.random() * 15 + 80).toFixed(1),
    };

    // Add to state (which triggers useEffect to save to LocalStorage)
    setSlides((prevSlides) => [...prevSlides, newSlide]);
    saveSlideMeta([newSlide]);
  };

  return (
    <div className="app">
      <>
        <Header onRoleSelect={setActiveRole} />
        {activeRole === "pathologist" && <PathologistView slides={slides} />}
        {activeRole === "engineer" && <EngineerView slides={slides} />}
      </>

      {!activeRole && (
        <main>
          <Upload onUploadComplete={handleUploadComplete} />
          <ScanQueue slides={slides} setSlides={setSlides} />
        </main>
      )}
    </div>
  );
}

export default App;
