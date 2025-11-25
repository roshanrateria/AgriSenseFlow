import { Calendar, MapPin, AlertCircle, Trash2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import type { DetectionResult } from "@shared/schema";
import emptyStateImg from "@assets/generated_images/farmer_with_smartphone_illustration.png";

interface DetectionHistoryProps {
  detections: DetectionResult[];
  onClearHistory: () => void;
  onSelectDetection?: (detection: DetectionResult) => void;
}

export function DetectionHistory({
  detections,
  onClearHistory,
  onSelectDetection,
}: DetectionHistoryProps) {
  if (detections.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-lg font-heading">Detection History</CardTitle>
        </CardHeader>
        <CardContent className="py-12">
          <div className="text-center space-y-4">
            <img
              src={emptyStateImg}
              alt="No detections"
              className="w-32 h-32 mx-auto opacity-50"
            />
            <div>
              <p className="font-medium">No detections yet</p>
              <p className="text-sm text-muted-foreground mt-1">
                Upload or capture crop images to start detecting diseases
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg font-heading">
            Detection History ({detections.length})
          </CardTitle>
          <Button
            variant="ghost"
            size="sm"
            onClick={onClearHistory}
            data-testid="button-clear-history"
          >
            <Trash2 className="h-4 w-4 mr-2" />
            Clear
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-[400px] pr-4">
          <div className="space-y-3">
            {detections.map((detection) => (
              <div
                key={detection.id}
                className="p-4 border rounded-lg hover-elevate cursor-pointer transition-all"
                onClick={() => onSelectDetection?.(detection)}
                data-testid={`detection-item-${detection.id}`}
              >
                <div className="flex gap-4">
                  {detection.imageUrl && (
                    <div className="w-20 h-20 rounded-lg overflow-hidden flex-shrink-0 bg-muted">
                      <img
                        src={detection.imageUrl}
                        alt="Detection"
                        className="w-full h-full object-cover"
                      />
                    </div>
                  )}
                  <div className="flex-1 space-y-2 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-sm truncate">
                          {detection.imageName}
                        </p>
                        <div className="flex items-center gap-4 text-xs text-muted-foreground mt-1">
                          <span className="flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            {new Date(detection.timestamp).toLocaleDateString()}
                          </span>
                          {detection.location && (
                            <span className="flex items-center gap-1">
                              <MapPin className="h-3 w-3" />
                              Location
                            </span>
                          )}
                        </div>
                      </div>
                      <Badge variant={detection.count > 0 ? "destructive" : "secondary"}>
                        {detection.count} found
                      </Badge>
                    </div>
                    {detection.predictions.length > 0 && (
                      <div className="flex items-center gap-2">
                        <AlertCircle className="h-3.5 w-3.5 text-destructive" />
                        <p className="text-xs font-medium truncate">
                          {detection.predictions[0].class_name}
                        </p>
                        <span className="text-xs text-muted-foreground">
                          {(detection.predictions[0].confidence * 100).toFixed(0)}%
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}
