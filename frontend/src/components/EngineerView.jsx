// EngineerView.jsx
import { Card } from "@/components/ui/card";
import { TrendingUp, Clock, Zap } from "lucide-react";
import ScanQueue from "./ScanQueue";

export default function EngineerView({ slides, setSlides }) {
  const metrics = [
    {
      label: "Model Accuracy",
      value: "94.2%",
      icon: TrendingUp,
      color: "text-green-500",
      insight: "Model performs well on recent scans.",
    },
    {
      label: "Avg Processing Time",
      value: "2.3s",
      icon: Clock,
      color: "text-blue-500",
      insight: "Optimal speed. Scale safely to 50 concurrent.",
    },
    {
      label: "Tissue Quality",
      value: "87%",
      icon: Zap,
      color: "text-amber-500",
      insight: "Quality threshold acceptable.",
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-950 to-gray-900 p-8">
      <div className="max-w-7xl mx-auto">
        {/* Metrics Grid */}
        <div className="grid grid-cols-3 gap-6 mb-8">
          {metrics.map((metric, idx) => {
            const IconComponent = metric.icon;
            return (
              <Card key={idx} className="bg-gray-900 border-gray-800 p-6">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <p className="text-gray-400 text-sm">{metric.label}</p>
                    <h2 className={`text-4xl font-bold ${metric.color}`}>
                      {metric.value}
                    </h2>
                  </div>
                  <IconComponent className={`${metric.color} w-6 h-6`} />
                </div>
                <p className="text-sm text-gray-400">{metric.insight}</p>
              </Card>
            );
          })}
        </div>

        {/* ScanQueue Component */}
        <ScanQueue slides={slides} setSlides={setSlides} />
      </div>
    </div>
  );
}
