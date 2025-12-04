// Utility functions for caching attendance status to eliminate UI flicker
// This cache is designed to expire at the end of each day to ensure proper date transitions

interface CachedAttendanceStatus {
    date: string;
    attendance: any;
    timestamp: number;
}

const CACHE_KEY = 'attendance_status_cache';
// Cache expiry set to end of day to ensure proper date transitions
const getCacheExpiry = () => {
    const now = new Date();
    const endOfDay = new Date(now);
    endOfDay.setHours(23, 59, 59, 999); // End of current day
    return endOfDay.getTime() - now.getTime(); // Time until end of day
};

const CACHE_EXPIRY = 60 * 60 * 1000; // 1 hour in milliseconds (fallback)

/**
 * Save attendance status to localStorage cache
 */
export const saveAttendanceToCache = (data: any) => {
    try {
        const today = new Date().toISOString().split('T')[0]; // Today's date in YYYY-MM-DD format
        const cacheData: CachedAttendanceStatus = {
            date: today,
            attendance: data,
            timestamp: Date.now()
        };
        localStorage.setItem(CACHE_KEY, JSON.stringify(cacheData));
    } catch (error) {
        console.error('Failed to save attendance to cache:', error);
    }
};

/**
 * Load attendance status from localStorage cache
 */
export const loadAttendanceFromCache = (): CachedAttendanceStatus | null => {
    try {
        const cached = localStorage.getItem(CACHE_KEY);
        if (!cached) return null;

        const cacheData: CachedAttendanceStatus = JSON.parse(cached);

        // Check if cache is for today
        const today = new Date().toISOString().split('T')[0];
        if (cacheData.date !== today) {
            // Remove outdated cache
            localStorage.removeItem(CACHE_KEY);
            return null;
        }

        // Check if cache is expired (older than 1 hour or past end of day)
        const cacheAge = Date.now() - cacheData.timestamp;
        const maxCacheAge = Math.min(CACHE_EXPIRY, getCacheExpiry());
        if (cacheAge > maxCacheAge) {
            // Remove expired cache
            localStorage.removeItem(CACHE_KEY);
            return null;
        }

        return cacheData;
    } catch (error) {
        console.error('Failed to load attendance from cache:', error);
        return null;
    }
};

/**
 * Clear attendance status cache
 */
export const clearAttendanceCache = () => {
    try {
        localStorage.removeItem(CACHE_KEY);
    } catch (error) {
        console.error('Failed to clear attendance cache:', error);
    }
};