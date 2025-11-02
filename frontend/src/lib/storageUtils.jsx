// No more localStorage! Use backend API instead

export async function saveSlideMeta(slides) {
  /**
   * When slide priority/status changes, save to backend
   */
  for (const slide of slides) {
    try {
      await fetch(`http://localhost:8000/slides/${slide.file_id}/metadata`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          priority: slide.priority,
          status: slide.status,
        }),
      });
    } catch (error) {
      console.error(`Failed to save metadata for ${slide.file_id}:`, error);
    }
  }
}

export async function loadSlideMeta() {
  /**
   * Load all metadata from backend
   * (Not used directly, loaded in App.jsx instead)
   */
  try {
    const response = await fetch("http://localhost:8000/slides/metadata/all");
    return await response.json();
  } catch (error) {
    console.error("Failed to load metadata:", error);
    return {};
  }
}

export function hydrateSlidesWithMeta(backendSlides, savedMeta) {
  /**
   * Merge backend slide data with metadata
   */
  return backendSlides.map((slide) => ({
    ...slide,
    priority: savedMeta[slide.file_id]?.priority || "normal",
    status: savedMeta[slide.file_id]?.status || "queued",
    uploadTime: savedMeta[slide.file_id]?.uploadTime || Date.now(),
  }));
}
