export default function Header() {
  return (
    <header className="flex items-center justify-between px-8 py-4 bg-white shadow-sm border-b border-gray-100">
      <div className="flex items-center gap-3">
        <dotlottie-wc
          src="https://lottie.host/0a9028d8-4664-466e-8e27-77d40470ecae/fHnfcvCP7K.lottie"
          style={{ width: "60px", height: "60px" }}
          autoplay
          loop
        ></dotlottie-wc>
        <h1 className="text-2xl font-semibold text-gray-800 tracking-tight">
          Morpho<span className="text-blue-500">View</span>
        </h1>
      </div>

      <nav className="flex gap-6 text-gray-600 text-sm">
        <a href="#" className="hover:text-blue-500 transition">
          Upload
        </a>
        <a href="#" className="hover:text-blue-500 transition">
          Slides
        </a>
        <a href="#" className="hover:text-blue-500 transition">
          AI Analysis
        </a>
      </nav>
    </header>
  );
}
