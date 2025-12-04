// Utility functions for caching branch data to eliminate unnecessary API calls

interface CachedBranchData {
    branches: any[];
    timestamp: number;
}

const CACHE_KEY = 'branch_data_cache';
const CACHE_EXPIRY = 3 * 24 * 60 * 60 * 1000; // 3 days in milliseconds

/**
 * Save branch data to localStorage cache
 */
export const saveBranchesToCache = (data: any[]) => {
    try {
        const cacheData: CachedBranchData = {
            branches: data,
            timestamp: Date.now()
        };
        localStorage.setItem(CACHE_KEY, JSON.stringify(cacheData));
    } catch (error) {
        console.error('Failed to save branches to cache:', error);
    }
};

/**
 * Load branch data from localStorage cache
 */
export const loadBranchesFromCache = (): any[] | null => {
    try {
        const cachedData = localStorage.getItem(CACHE_KEY);
        if (!cachedData) return null;

        const parsedData: CachedBranchData = JSON.parse(cachedData);

        // Check if cache is expired (3 days)
        const isExpired = Date.now() - parsedData.timestamp > CACHE_EXPIRY;
        console.log(`Branch cache check - Expired: ${isExpired}, Age: ${Date.now() - parsedData.timestamp}ms, Max Age: ${CACHE_EXPIRY}ms`);
        if (isExpired) {
            // Remove expired cache
            localStorage.removeItem(CACHE_KEY);
            return null;
        }

        return parsedData.branches;
    } catch (error) {
        console.error('Failed to load branches from cache:', error);
        // Remove corrupted cache
        localStorage.removeItem(CACHE_KEY);
        return null;
    }
};

/**
 * Clear branch data cache
 */
export const clearBranchCache = () => {
    try {
        localStorage.removeItem(CACHE_KEY);
    } catch (error) {
        console.error('Failed to clear branch cache:', error);
    }
};