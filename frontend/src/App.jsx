import { useState, useEffect } from "react";
import Logo from "./components/Logo";
import Upload from "./components/Upload";
import ScanQueue from "./components/ScanQueue";
import "./App.css";
import Header from "./components/Header";

function App() {
  const [slides, setSlides] = useState([]);
  const [activeRole, setActiveRole] = useState(null);
  // Load existing slides on mount
  useEffect(() => {
    loadSlides();
  }, []);

  const loadSlides = async () => {
    try {
      const response = await fetch("http://localhost:8000/slides");
      const data = await response.json();
      const loadedSlides = data.slides.map((filename, index) => ({
        file_id: filename.split(".")[0],
        filename: filename,
        saved_as: filename,
        status: "queued",
        priority: "normal",
        uploadTime: Date.now() - index * 1000,
      }));
      setSlides(loadedSlides);
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
    };

    // Add to state
    setSlides((prevSlides) => [...prevSlides, newSlide]);
  };

  return (
    <div className="app">
      <Header onRoleSelect={setActiveRole} />

      <main>
        <Upload onUploadComplete={handleUploadComplete} />
        <ScanQueue slides={slides} setSlides={setSlides} />
      </main>
    </div>
  );
}

export default App;
