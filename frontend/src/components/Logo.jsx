import { Player } from "@lottiefiles/react-lottie-player";
import dnaAnimation from "../assets/dna.json";

export default function Header() {
  return (
    <div
      className="rounded-full flex items-center justify-center"
      style={{
        backgroundColor: "#000",
        padding: "2px",
      }}
    >
      <Player
        src={dnaAnimation}
        loop
        autoplay
        style={{
          height: "80px",
          width: "100px",
          filter:
            "brightness(0) saturate(100%) invert(84%) sepia(73%) saturate(1100%) hue-rotate(350deg) brightness(104%) contrast(103%)",
        }}
      />
    </div>
  );
}
