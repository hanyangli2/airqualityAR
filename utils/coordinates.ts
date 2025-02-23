const EARTH_RADIUS = 6371000; // meters

function toRadians(degrees: number): number {
  return degrees * (Math.PI / 180);
}

export function gpsToARCoordinates(
  sensorLat: number, 
  sensorLng: number, 
  userLat: number, 
  userLng: number,
  scale: number = 0.1 // Scale factor to make distances manageable in AR
): [number, number, number] {
  // Convert to radians
  const φ1 = toRadians(userLat);
  const φ2 = toRadians(sensorLat);
  const Δφ = toRadians(sensorLat - userLat);
  const Δλ = toRadians(sensorLng - userLng);

  // Calculate distance (Haversine formula)
  const a = Math.sin(Δφ/2)**2 + 
           Math.cos(φ1) * Math.cos(φ2) * 
           Math.sin(Δλ/2)**2;
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  const distance = EARTH_RADIUS * c;

  // Calculate bearing
  const y = Math.sin(Δλ) * Math.cos(φ2);
  const x = Math.cos(φ1) * Math.sin(φ2) - 
           Math.sin(φ1) * Math.cos(φ2) * Math.cos(Δλ);
  const bearing = Math.atan2(y, x);

  // Convert to local ENU coordinates
  const localX = distance * Math.sin(-bearing) * scale;
  const localZ = distance * Math.cos(-bearing) * scale;
  const localY = 2; // Fixed height above ground

  return [localX, localY, localZ];
} 