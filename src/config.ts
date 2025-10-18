// Office geofence configuration
export const OFFICE_LAT = import.meta.env.VITE_OFFICE_LAT ? parseFloat(import.meta.env.VITE_OFFICE_LAT) : 26.913595;
export const OFFICE_LNG = import.meta.env.VITE_OFFICE_LNG ? parseFloat(import.meta.env.VITE_OFFICE_LNG) : 80.953481;
export const ALLOWED_RADIUS = import.meta.env.VITE_OFFICE_RADIUS ? parseInt(import.meta.env.VITE_OFFICE_RADIUS) : 50; // Updated to 50 meters

// Haversine formula to calculate distance between two points in meters with improved precision
export function haversine(lat1: number, lon1: number, lat2: number, lon2: number): number {
  // Use higher precision for calculations
  const R = 6371000; // Earth's radius in meters (more precise)
  
  // Convert degrees to radians with full precision
  const φ1 = lat1 * Math.PI / 180;
  const φ2 = lat2 * Math.PI / 180;
  const Δφ = (lat2 - lat1) * Math.PI / 180;
  const Δλ = (lon2 - lon1) * Math.PI / 180;

  // Haversine formula with full precision
  const a = Math.sin(Δφ/2) * Math.sin(Δφ/2) +
          Math.cos(φ1) * Math.cos(φ2) *
          Math.sin(Δλ/2) * Math.sin(Δλ/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));

  // Calculate distance without rounding to maintain precision
  const distance = R * c;
  
  return distance; // Return precise distance in meters
}