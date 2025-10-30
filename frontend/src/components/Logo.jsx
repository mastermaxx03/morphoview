import { Player } from "@lottiefiles/react-lottie-player";
import dnaAnimation from "../assets/dna.json";

export default function Header() {
  return (
    <header className="flex items-center gap-3 p-4 bg-black text-white shadow-md">
      {/* DNA Icon with Yellow tones */}
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
            height: "70px",
            width: "100px",
            filter:
              "brightness(0) saturate(100%) invert(84%) sepia(73%) saturate(1100%) hue-rotate(350deg) brightness(104%) contrast(103%)",
          }}
        />
      </div>

      {/* Text Section */}
      <div className="flex flex-col">
        <h1 className="text-2xl font-bold text-gray-200 tracking-wide"></h1>
        <p className="text-sm"></p>
      </div>
    </header>
  );
}
