// Storage helper - saves and loads slide metadata from LocalStorage

const STORAGE_KEY = "morphoview:slidesMeta";

// Save metadata for all slides
export const saveSlideMeta = (slides) => {
  const metadata = {};

  slides.forEach((slide) => {
    metadata[slide.file_id] = {
      priority: slide.priority,
      status: slide.status,
      uploadTime: slide.uploadTime,
    };
  });

  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(metadata));
  } catch (error) {
    console.error("Failed to save slide metadata:", error);
  }
};

// Load metadata from LocalStorage
export const loadSlideMeta = () => {
  try {
    const data = localStorage.getItem(STORAGE_KEY);
    return data ? JSON.parse(data) : {};
  } catch (error) {
    console.error("Failed to load slide metadata:", error);
    return {};
  }
};

// Merge backend slides with saved metadata
export const hydrateSlidesWithMeta = (backendSlides, savedMeta) => {
  return backendSlides.map((slide, index) => {
    const saved = savedMeta[slide.file_id];

    return {
      ...slide,
      priority: saved?.priority || "normal",
      status: saved?.status || "completed",
      uploadTime: saved?.uploadTime || Date.now() - index * 1000,
    };
  });
};
