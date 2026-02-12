"use client";
import { Map, MapControls } from "@/components/ui/map";
import { Card } from "@/components/ui/card";
import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";

export default function MyMap() {
  const [center, setCenter] = useState<[number, number] | undefined>();
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!navigator.geolocation) {
      setError("Geolocation not supported");
      setLoading(false);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setCenter([
          position.coords.latitude,
          position.coords.longitude,
        ]);
        setLoading(false);
      },
      (err) => {
        setError(err.message);
        setLoading(false);
      }
    );
  }, []);

  if (loading) {
    return (
      <Card className="p-6 flex items-center gap-2">
        <Loader2 className="w-4 h-4 animate-spin" />
        Getting your location...
      </Card>
    );
  }

  if (error) {
    return <Card className="p-6 text-red-500">{error}</Card>;
  }

  if (!center) return null;

  return (
    <Card className="h-full w-full p-0 overflow-hidden">
      <Map center={center} zoom={20}>
        <MapControls />
      </Map>
    </Card>
  );
}