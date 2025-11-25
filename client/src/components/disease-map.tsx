import { useEffect, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { DetectionResult } from "@shared/schema";

interface DiseaseMapProps {
  detections: DetectionResult[];
}

export function DiseaseMap({ detections }: DiseaseMapProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);

  useEffect(() => {
    if (!mapRef.current || typeof window === "undefined" || !(window as any).L) return;

    const L = (window as any).L;

    if (!mapInstanceRef.current) {
      const map = L.map(mapRef.current).setView([20.5937, 78.9629], 5);

      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: '&copy; OpenStreetMap contributors',
      }).addTo(map);

      mapInstanceRef.current = map;
    }

    const map = mapInstanceRef.current;
    
    map.eachLayer((layer: any) => {
      if (layer instanceof L.Marker) {
        map.removeLayer(layer);
      }
    });

    const validDetections = detections.filter((d) => d.location && d.count > 0);

    if (validDetections.length > 0) {
      const bounds: any[] = [];

      validDetections.forEach((detection) => {
        if (detection.location) {
          const { lat, lng } = detection.location;
          bounds.push([lat, lng]);

          const color = detection.count > 0 ? "red" : "green";
          const marker = L.circleMarker([lat, lng], {
            color: color,
            fillColor: color,
            fillOpacity: 0.5,
            radius: 8,
          }).addTo(map);

          marker.bindPopup(`
            <div style="font-family: sans-serif;">
              <strong>${detection.predictions[0]?.class_name || "Detection"}</strong><br/>
              <small>${new Date(detection.timestamp).toLocaleDateString()}</small><br/>
              Confidence: ${((detection.predictions[0]?.confidence || 0) * 100).toFixed(0)}%
            </div>
          `);
        }
      });

      if (bounds.length > 0) {
        map.fitBounds(bounds, { padding: [50, 50] });
      }
    } else {
      map.setView([20.5937, 78.9629], 5);
    }

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, [detections]);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg font-heading">Disease Hotspot Map</CardTitle>
        <p className="text-sm text-muted-foreground">
          Red markers indicate detected diseases
        </p>
      </CardHeader>
      <CardContent>
        <div
          ref={mapRef}
          className="h-[400px] rounded-lg overflow-hidden"
          data-testid="disease-map"
        />
      </CardContent>
    </Card>
  );
}
