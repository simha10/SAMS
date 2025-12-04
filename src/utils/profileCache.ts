// Utility functions for caching profile data to eliminate unnecessary API calls

interface CachedProfileData {
    profile: any;
    timestamp: number;
}

const CACHE_KEY = 'profile_data_cache';
const CACHE_EXPIRY = 3 * 24 * 60 * 60 * 1000; // 3 days in milliseconds

/**
 * Save profile data to localStorage cache
 */
export const saveProfileToCache = (data: any) => {
    try {
        const cacheData: CachedProfileData = {
            profile: data,
            timestamp: Date.now()
        };
        localStorage.setItem(CACHE_KEY, JSON.stringify(cacheData));
    } catch (error) {
        console.error('Failed to save profile to cache:', error);
    }
};

/**
 * Load profile data from localStorage cache
 */
export const loadProfileFromCache = (): any | null => {
    try {
        const cachedData = localStorage.getItem(CACHE_KEY);
        if (!cachedData) return null;

        const parsedData: CachedProfileData = JSON.parse(cachedData);

        // Check if cache is expired (3 days)
        const isExpired = Date.now() - parsedData.timestamp > CACHE_EXPIRY;
        console.log(`Profile cache check - Expired: ${isExpired}, Age: ${Date.now() - parsedData.timestamp}ms, Max Age: ${CACHE_EXPIRY}ms`);
        if (isExpired) {
            // Remove expired cache
            localStorage.removeItem(CACHE_KEY);
            return null;
        }

        return parsedData.profile;
    } catch (error) {
        console.error('Failed to load profile from cache:', error);
        // Remove corrupted cache
        localStorage.removeItem(CACHE_KEY);
        return null;
    }
};

/**
 * Clear profile data cache
 */
export const clearProfileCache = () => {
    try {
        localStorage.removeItem(CACHE_KEY);
    } catch (error) {
        console.error('Failed to clear profile cache:', error);
    }
};