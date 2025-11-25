import { AlertCircle, MapPin, Calendar } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import type { DetectionResult } from "@shared/schema";

interface DetectionResultCardProps {
  result: DetectionResult;
}

export function DetectionResultCard({ result }: DetectionResultCardProps) {
  const getSeverityBadge = (confidence: number) => {
    if (confidence >= 0.8) {
      return <Badge variant="destructive">High Confidence</Badge>;
    } else if (confidence >= 0.5) {
      return <Badge className="bg-orange-500">Medium Confidence</Badge>;
    }
    return <Badge variant="secondary">Low Confidence</Badge>;
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-start justify-between gap-4">
          <div className="space-y-1">
            <CardTitle className="text-xl font-heading">
              Detection Results
            </CardTitle>
            <p className="text-sm text-muted-foreground">
              Found {result.count} disease{result.count !== 1 ? "s" : ""}
            </p>
          </div>
          <div className="text-right text-xs text-muted-foreground">
            <div className="flex items-center gap-1">
              <Calendar className="h-3.5 w-3.5" />
              {new Date(result.timestamp).toLocaleDateString()}
            </div>
            {result.location && (
              <div className="flex items-center gap-1 mt-1">
                <MapPin className="h-3.5 w-3.5" />
                {result.location.lat.toFixed(4)}, {result.location.lng.toFixed(4)}
              </div>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {result.predictions.map((pred, index) => (
          <div key={index} className="space-y-3">
            {index > 0 && <Separator />}
            <div className="space-y-2">
              <div className="flex items-start justify-between gap-4">
                <div className="space-y-1 flex-1">
                  <div className="flex items-center gap-2">
                    <AlertCircle className="h-4 w-4 text-destructive" />
                    <h3 className="font-semibold">{pred.class_name}</h3>
                  </div>
                  {getSeverityBadge(pred.confidence)}
                </div>
                <div className="text-right">
                  <div className="text-2xl font-bold text-primary">
                    {(pred.confidence * 100).toFixed(1)}%
                  </div>
                  <div className="text-xs text-muted-foreground">
                    Confidence
                  </div>
                </div>
              </div>

              <Progress value={pred.confidence * 100} className="h-2" />


            </div>
          </div>
        ))}

        <div className="pt-2 bg-accent/50 rounded-lg p-4">
          <p className="text-sm font-medium mb-2">💡 Recommendation</p>
          <p className="text-sm text-muted-foreground">
            Consult with our AI chatbot for detailed treatment advice and
            preventive measures specific to this disease.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
