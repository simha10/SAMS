// Office geofence configuration
export const OFFICE_LAT = import.meta.env.VITE_OFFICE_LAT ? parseFloat(import.meta.env.VITE_OFFICE_LAT) : 26.913595;
export const OFFICE_LNG = import.meta.env.VITE_OFFICE_LNG ? parseFloat(import.meta.env.VITE_OFFICE_LNG) : 80.953481;
export const ALLOWED_RADIUS = import.meta.env.VITE_OFFICE_RADIUS ? parseInt(import.meta.env.VITE_OFFICE_RADIUS) : 50; // Updated to 50 meters

// This file is intentionally left empty as the geofence validation is now handled by the backend
// All geofence-related logic has been moved to the server-side multi-branch system
export { };