import Logo from "./components/Logo";
import Magnifier from "./Magnifier";
function App() {
  return (
    <div>
      <Magnifier />
      <div className="min-h-screen bg-white">
        {/* Header */}
        <header className="flex items-center justify-between p-4 shadow-sm">
          <Logo />
        </header>

        {/* Main Content (you can build on this later) */}
        <main className="p-8">
          <h2 className="text-xl font-semibold text-gray-600">
            Welcome to MorphoView 🧬
          </h2>
          <p className="text-gray-500 mt-2">
            Upload and visualize your digital pathology slides here.
          </p>
        </main>
      </div>
    </div>
  );
}

export default App;
