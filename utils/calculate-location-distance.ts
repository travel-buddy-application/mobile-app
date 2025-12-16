import haversine from "haversine-distance";

export function calculateDistance(
  loc1: { lat: number; lng: number },
  loc2: { lat: number; lng: number }
): number {
  const dist = haversine(
    { lat: loc1.lat, lon: loc1.lng },
    { lat: loc2.lat, lon: loc2.lng }
  );
  console.log("haversine", dist)
  return dist;
}
