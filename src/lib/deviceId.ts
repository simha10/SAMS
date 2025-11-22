/**
 * Device ID Management Utility
 * Generates and stores a unique device identifier in localStorage
 * This ID is used for tracking sessions across different users on the same device
 */

const DEVICE_ID_KEY = 'sams_device_id';

/**
 * Generate a unique device ID using UUID v4 format
 * @returns {string} UUID v4 string
 */
function generateUUID(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

/**
 * Get or create device ID
 * - First checks localStorage for existing ID
 * - If not found, generates new UUID and stores it
 * - Returns the device ID
 * 
 * @returns {string} Device ID (UUID format)
 */
export function getDeviceId(): string {
  try {
    // Try to get existing device ID from localStorage
    let deviceId = localStorage.getItem(DEVICE_ID_KEY);
    
    if (!deviceId) {
      // Generate new device ID
      deviceId = generateUUID();
      
      // Store in localStorage
      localStorage.setItem(DEVICE_ID_KEY, deviceId);
      
      console.log('[DeviceId] Generated new device ID:', deviceId);
    } else {
      console.log('[DeviceId] Using existing device ID:', deviceId);
    }
    
    return deviceId;
  } catch (error) {
    // Fallback if localStorage is not available
    console.error('[DeviceId] Error accessing localStorage:', error);
    
    // Return a session-based UUID (will be different each browser session)
    return generateUUID();
  }
}

/**
 * Clear device ID from localStorage
 * Useful for testing or administrative purposes
 */
export function clearDeviceId(): void {
  try {
    localStorage.removeItem(DEVICE_ID_KEY);
    console.log('[DeviceId] Device ID cleared');
  } catch (error) {
    console.error('[DeviceId] Error clearing device ID:', error);
  }
}

/**
 * Get device ID key for direct access
 * @returns {string} localStorage key
 */
export function getDeviceIdKey(): string {
  return DEVICE_ID_KEY;
}
