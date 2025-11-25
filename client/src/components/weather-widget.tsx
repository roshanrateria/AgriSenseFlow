import { Cloud, Droplets, Wind, Gauge, ThermometerSun } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import type { WeatherData } from "@shared/schema";

interface WeatherWidgetProps {
  data: WeatherData | null;
  isLoading: boolean;
}

export function WeatherWidget({ data, isLoading }: WeatherWidgetProps) {
  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-lg font-heading">Weather Conditions</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Skeleton className="h-24 w-full" />
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[1, 2, 3, 4].map((i) => (
              <Skeleton key={i} className="h-20" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!data) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-lg font-heading">Weather Conditions</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Enable location to view weather data
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg font-heading flex items-center justify-between">
          Weather Conditions
          <span className="text-sm font-normal text-muted-foreground">
            {data.location}
          </span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Current Weather */}
        <div className="flex items-center justify-between p-6 bg-gradient-to-br from-primary/10 to-primary/5 rounded-lg">
          <div>
            <div className="text-5xl font-bold">{Math.round(data.temperature)}°C</div>
            <p className="text-sm text-muted-foreground mt-1">
              Feels like {Math.round(data.feels_like)}°C
            </p>
            <p className="text-sm font-medium mt-2 capitalize">{data.description}</p>
          </div>
          <Cloud className="h-16 w-16 text-primary/30" />
        </div>

        {/* Metrics Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-muted-foreground">
              <Droplets className="h-4 w-4" />
              <span className="text-xs font-medium">Humidity</span>
            </div>
            <p className="text-2xl font-bold">{data.humidity}%</p>
          </div>

          <div className="space-y-2">
            <div className="flex items-center gap-2 text-muted-foreground">
              <Wind className="h-4 w-4" />
              <span className="text-xs font-medium">Wind Speed</span>
            </div>
            <p className="text-2xl font-bold">{data.wind_speed} m/s</p>
          </div>

          <div className="space-y-2">
            <div className="flex items-center gap-2 text-muted-foreground">
              <Gauge className="h-4 w-4" />
              <span className="text-xs font-medium">Pressure</span>
            </div>
            <p className="text-2xl font-bold">{data.pressure} hPa</p>
          </div>

          <div className="space-y-2">
            <div className="flex items-center gap-2 text-muted-foreground">
              <ThermometerSun className="h-4 w-4" />
              <span className="text-xs font-medium">Condition</span>
            </div>
            <p className="text-sm font-medium truncate capitalize">{data.description}</p>
          </div>
        </div>

        {/* Forecast */}
        {data.forecast && data.forecast.length > 0 && (
          <div>
            <h4 className="text-sm font-semibold mb-3">5-Day Forecast</h4>
            <div className="grid grid-cols-5 gap-2">
              {data.forecast.slice(0, 5).map((day, i) => (
                <div
                  key={i}
                  className="text-center p-3 bg-muted rounded-lg space-y-1"
                >
                  <p className="text-xs font-medium">{day.date}</p>
                  <p className="text-lg font-bold">{Math.round(day.temp_max)}°</p>
                  <p className="text-xs text-muted-foreground">
                    {Math.round(day.temp_min)}°
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
