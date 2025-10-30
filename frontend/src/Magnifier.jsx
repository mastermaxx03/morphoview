import React, { useEffect, useRef } from "react";
import "./Magnifier.css";

const Magnifier = () => {
  const lensRef = useRef(null);

  useEffect(() => {
    const lens = lensRef.current;

    const moveLens = (e) => {
      const x = e.clientX;
      const y = e.clientY;

      lens.style.display = "block";
      lens.style.left = `${x - lens.offsetWidth / 2}px`;
      lens.style.top = `${y - lens.offsetHeight / 2}px`;

      // Make the lens show zoomed content from the page
      lens.style.backgroundPosition = `-${x * 1.5 - 75}px -${y * 1.5 - 75}px`;
    };

    const updateLensBackground = () => {
      // Create snapshot of the page as the lens background
      lens.style.backgroundImage = `url(${window.location.origin})`;
    };

    const hideLens = () => {
      lens.style.display = "none";
    };

    document.addEventListener("mousemove", moveLens);
    document.addEventListener("mouseleave", hideLens);

    return () => {
      document.removeEventListener("mousemove", moveLens);
      document.removeEventListener("mouseleave", hideLens);
    };
  }, []);

  return <div ref={lensRef} className="magnifier"></div>;
};

export default Magnifier;
