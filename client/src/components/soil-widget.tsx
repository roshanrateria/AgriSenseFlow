import { Leaf, Droplet, Mountain } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Progress } from "@/components/ui/progress";
import type { SoilData } from "@shared/schema";

interface SoilWidgetProps {
  data: SoilData | null;
  isLoading: boolean;
}

export function SoilWidget({ data, isLoading }: SoilWidgetProps) {
  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-lg font-heading">Soil Composition</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-16 w-full" />
          ))}
        </CardContent>
      </Card>
    );
  }

  if (!data) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-lg font-heading">Soil Composition</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Enable location to view soil data
          </p>
        </CardContent>
      </Card>
    );
  }

  const props = data.properties;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg font-heading">Soil Composition</CardTitle>
        <p className="text-xs text-muted-foreground">
          Location: {data.location.lat.toFixed(2)}, {data.location.lng.toFixed(2)}
        </p>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* pH Level */}
        {props.ph && (
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Droplet className="h-4 w-4 text-blue-500" />
                <span className="text-sm font-medium">pH Level</span>
              </div>
              <span className="text-lg font-bold">{props.ph.toFixed(1)}</span>
            </div>
            <Progress value={(props.ph / 14) * 100} className="h-2" />
            <p className="text-xs text-muted-foreground">
              {props.ph < 6.5 ? "Acidic" : props.ph > 7.5 ? "Alkaline" : "Neutral"}
            </p>
          </div>
        )}

        {/* Composition */}
        <div className="space-y-4">
          <h4 className="text-sm font-semibold">Texture Composition</h4>
          
          {props.clay !== undefined && (
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="flex items-center gap-2">
                  <Mountain className="h-4 w-4 text-orange-500" />
                  Clay
                </span>
                <span className="font-bold">{props.clay.toFixed(1)}%</span>
              </div>
              <Progress value={props.clay} className="h-2" />
            </div>
          )}

          {props.sand !== undefined && (
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="flex items-center gap-2">
                  <Mountain className="h-4 w-4 text-yellow-600" />
                  Sand
                </span>
                <span className="font-bold">{props.sand.toFixed(1)}%</span>
              </div>
              <Progress value={props.sand} className="h-2" />
            </div>
          )}

          {props.silt !== undefined && (
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="flex items-center gap-2">
                  <Mountain className="h-4 w-4 text-amber-700" />
                  Silt
                </span>
                <span className="font-bold">{props.silt.toFixed(1)}%</span>
              </div>
              <Progress value={props.silt} className="h-2" />
            </div>
          )}
        </div>

        {/* Nutrients */}
        <div className="grid grid-cols-2 gap-4">
          {props.nitrogen !== undefined && (
            <div className="p-3 bg-muted rounded-lg">
              <div className="flex items-center gap-2 mb-1">
                <Leaf className="h-4 w-4 text-green-600" />
                <span className="text-xs font-medium">Nitrogen</span>
              </div>
              <p className="text-lg font-bold">{props.nitrogen.toFixed(2)}</p>
            </div>
          )}

          {props.organic_carbon !== undefined && (
            <div className="p-3 bg-muted rounded-lg">
              <div className="flex items-center gap-2 mb-1">
                <Leaf className="h-4 w-4 text-primary" />
                <span className="text-xs font-medium">Organic C</span>
              </div>
              <p className="text-lg font-bold">{props.organic_carbon.toFixed(2)}</p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
