import { TrendingUp, AlertTriangle, CheckCircle, Activity } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { DetectionResult } from "@shared/schema";

interface AnalyticsDashboardProps {
  detections: DetectionResult[];
}

export function AnalyticsDashboard({ detections }: AnalyticsDashboardProps) {
  const totalDetections = detections.length;
  const diseasesFound = detections.filter((d) => d.count > 0).length;
  const avgConfidence =
    detections.reduce((acc, d) => {
      const avg =
        d.predictions.reduce((sum, p) => sum + p.confidence, 0) /
        (d.predictions.length || 1);
      return acc + avg;
    }, 0) / (detections.length || 1);

  const recentDetections = detections.slice(0, 7).length;

  const stats = [
    {
      title: "Total Scans",
      value: totalDetections,
      icon: Activity,
      color: "text-blue-500",
      bgColor: "bg-blue-500/10",
    },
    {
      title: "Diseases Found",
      value: diseasesFound,
      icon: AlertTriangle,
      color: "text-destructive",
      bgColor: "bg-destructive/10",
    },
    {
      title: "Healthy Crops",
      value: totalDetections - diseasesFound,
      icon: CheckCircle,
      color: "text-green-500",
      bgColor: "bg-green-500/10",
    },
    {
      title: "Avg. Confidence",
      value: `${(avgConfidence * 100).toFixed(0)}%`,
      icon: TrendingUp,
      color: "text-primary",
      bgColor: "bg-primary/10",
    },
  ];

  return (
    <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
      {stats.map((stat, index) => (
        <Card key={index}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{stat.title}</CardTitle>
            <div className={`rounded-lg p-2 ${stat.bgColor}`}>
              <stat.icon className={`h-4 w-4 ${stat.color}`} />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stat.value}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Last 7 days: {recentDetections}
            </p>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
