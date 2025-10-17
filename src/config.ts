// Office geofence configuration
export const OFFICE_LAT = import.meta.env.VITE_OFFICE_LAT ? parseFloat(import.meta.env.VITE_OFFICE_LAT) : 26.91359535056058;
export const OFFICE_LNG = import.meta.env.VITE_OFFICE_LNG ? parseFloat(import.meta.env.VITE_OFFICE_LNG) : 80.95348145976982;
export const ALLOWED_RADIUS = import.meta.env.VITE_OFFICE_RADIUS ? parseInt(import.meta.env.VITE_OFFICE_RADIUS) : 100; // meters

// Haversine formula to calculate distance between two points in meters
export function haversine(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371; // Radius of the Earth in kilometers
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const distance = R * c * 1000; // Convert to meters
  return distance;
}
