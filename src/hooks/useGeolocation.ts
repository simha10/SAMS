import { useState, useEffect, useRef, useCallback } from 'react';

interface GeolocationState {
  latitude: number | null;
  longitude: number | null;
  accuracy: number | null;
  error: string | null;
  loading: boolean;
}

interface GeolocationOptions {
  enableHighAccuracy?: boolean;
  timeout?: number;
  maximumAge?: number;
}

export const useGeolocation = (options: GeolocationOptions = {}) => {
  const [state, setState] = useState<GeolocationState>({
    latitude: null,
    longitude: null,
    accuracy: null,
    error: null,
    loading: true,
  });

  // Refs to track state without causing re-renders
  const watchIdRef = useRef<number | null>(null);
  const hasPositionRef = useRef(false);
  const retryCountRef = useRef(0);
  const timeoutIdRef = useRef<number | null>(null);
  const isMountedRef = useRef(true);

  // Check geolocation support
  const isGeolocationSupported = (): boolean => {
    return 'geolocation' in navigator;
  };

  // Check permission status (with fallback for browsers that don't support permissions API)
  const checkPermission = async (): Promise<PermissionState | 'unknown'> => {
    if ('permissions' in navigator) {
      try {
        const result = await navigator.permissions.query({ name: 'geolocation' as PermissionName });
        return result.state;
      } catch (error) {
        // Some browsers don't support the permissions API
        return 'unknown';
      }
    }
    return 'unknown';
  };

  // Update state safely (only if component is still mounted)
  const updateState = useCallback((updates: Partial<GeolocationState>) => {
    if (isMountedRef.current) {
      setState(prev => ({ ...prev, ...updates }));
    }
  }, []);

  // Stop watching position
  const stopWatching = useCallback(() => {
    if (watchIdRef.current !== null) {
      navigator.geolocation.clearWatch(watchIdRef.current);
      watchIdRef.current = null;
    }
    if (timeoutIdRef.current !== null) {
      clearTimeout(timeoutIdRef.current);
      timeoutIdRef.current = null;
    }
  }, []);

  // Get position with progressive fallback strategy
  const getPositionWithFallback = useCallback(async (): Promise<GeolocationPosition | null> => {
    if (!isGeolocationSupported()) {
      return null;
    }

    // Strategy 1: Try high accuracy first (fastest, most accurate)
    const tryHighAccuracy = (): Promise<GeolocationPosition> => {
      return new Promise((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(
          resolve,
          reject,
          {
            enableHighAccuracy: true,
            timeout: 8000, // 8 seconds for high accuracy
            maximumAge: 5000, // Accept positions up to 5 seconds old
          }
        );
      });
    };

    // Strategy 2: Fallback to low accuracy (faster, less accurate)
    const tryLowAccuracy = (): Promise<GeolocationPosition> => {
      return new Promise((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(
          resolve,
          reject,
          {
            enableHighAccuracy: false,
            timeout: 5000, // 5 seconds for low accuracy
            maximumAge: 30000, // Accept positions up to 30 seconds old
          }
        );
      });
    };

    // Strategy 3: Use cached position if available
    const tryCached = (): Promise<GeolocationPosition> => {
      return new Promise((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(
          resolve,
          reject,
          {
            enableHighAccuracy: false,
            timeout: 2000,
            maximumAge: 60000, // Accept positions up to 1 minute old
          }
        );
      });
    };

    try {
      // Try high accuracy first
      return await tryHighAccuracy();
    } catch (error1) {
      console.log('High accuracy failed, trying low accuracy...');
      try {
        // Fallback to low accuracy
        return await tryLowAccuracy();
      } catch (error2) {
        console.log('Low accuracy failed, trying cached position...');
        try {
          // Last resort: use cached position
          return await tryCached();
        } catch (error3) {
          console.error('All geolocation strategies failed');
          return null;
        }
      }
    }
  }, []);

  // Initialize geolocation watching
  useEffect(() => {
    isMountedRef.current = true;
    hasPositionRef.current = false;
    retryCountRef.current = 0;

    const initializeGeolocation = async () => {
      // Check support
      if (!isGeolocationSupported()) {
        updateState({
          error: 'Geolocation is not supported by this browser.',
          loading: false,
        });
        return;
      }

      // Check permission (non-blocking)
      const permission = await checkPermission();
      if (permission === 'denied') {
        updateState({
          error: 'Location access has been denied. Please enable location access in your browser settings.',
          loading: false,
        });
        return;
      }

      // Try to get initial position quickly
      getPositionWithFallback()
        .then((position) => {
          if (position && isMountedRef.current) {
            hasPositionRef.current = true;
            updateState({
              latitude: position.coords.latitude,
              longitude: position.coords.longitude,
              accuracy: position.coords.accuracy,
              error: null,
              loading: false,
            });
          }
        })
        .catch(() => {
          // Continue with watchPosition even if initial getCurrentPosition fails
        });

      // Start watching for position updates with progressive accuracy
      let watchAttempts = 0;
      const maxWatchAttempts = 3;

      const startWatching = (useHighAccuracy: boolean) => {
        if (!isMountedRef.current || hasPositionRef.current) return;

        const geolocationOptions: PositionOptions = {
          enableHighAccuracy: useHighAccuracy,
          timeout: useHighAccuracy ? 10000 : 5000,
          maximumAge: useHighAccuracy ? 5000 : 30000,
          ...options,
        };

        const watchId = navigator.geolocation.watchPosition(
          (position) => {
            if (!isMountedRef.current) return;

            // Only update if we have a better or first position
            const isBetterPosition = !hasPositionRef.current || 
              (position.coords.accuracy && position.coords.accuracy < 50);

            if (isBetterPosition) {
              hasPositionRef.current = true;
              updateState({
                latitude: position.coords.latitude,
                longitude: position.coords.longitude,
                accuracy: position.coords.accuracy,
                error: null,
                loading: false,
              });

              // Stop watching if we have good accuracy (< 30m) or after getting any position
              if ((position.coords.accuracy && position.coords.accuracy < 30) || watchAttempts >= 2) {
                stopWatching();
              }
            }
          },
          (error) => {
            if (!isMountedRef.current) return;

            watchAttempts++;
            
            // Try fallback strategies
            if (watchAttempts < maxWatchAttempts && useHighAccuracy) {
              // Retry with low accuracy
              stopWatching();
              setTimeout(() => {
                if (isMountedRef.current && !hasPositionRef.current) {
                  startWatching(false);
                }
              }, 1000);
              return;
            }

            // Only set error if we haven't gotten any position
            if (!hasPositionRef.current) {
              let errorMessage = 'Unable to get your location. ';
              
              switch (error.code) {
                case error.PERMISSION_DENIED:
                  errorMessage += 'Please enable location access in your browser settings.';
                  break;
                case error.POSITION_UNAVAILABLE:
                  errorMessage += 'Location information is unavailable. Try moving to an area with better GPS reception.';
                  break;
                case error.TIMEOUT:
                  errorMessage += 'Location request timed out. Please try again.';
                  break;
                default:
                  errorMessage += 'Please try again or check your device settings.';
              }

              updateState({
                error: errorMessage,
                loading: false,
              });
            }

            // Stop watching after max attempts
            if (watchAttempts >= maxWatchAttempts) {
              stopWatching();
            }
          },
          geolocationOptions
        );

        watchIdRef.current = watchId;

        // Safety timeout: stop watching after 20 seconds maximum
        timeoutIdRef.current = window.setTimeout(() => {
          if (isMountedRef.current) {
            stopWatching();
            if (!hasPositionRef.current) {
              updateState({
                error: 'Location request timed out. Please try again.',
                loading: false,
              });
            }
          }
        }, 20000);
      };

      // Start with high accuracy
      startWatching(true);
    };

    initializeGeolocation();

    // Cleanup on unmount
    return () => {
      isMountedRef.current = false;
      stopWatching();
    };
  }, []); // Empty dependency array - only run once on mount

  // Manual getCurrentPosition function for explicit requests (e.g., check-in/check-out)
  const getCurrentPosition = useCallback((retryCount = 3): Promise<GeolocationPosition> => {
    return new Promise((resolve, reject) => {
      if (!isGeolocationSupported()) {
        reject(new Error('Geolocation is not supported'));
        return;
      }

      let attemptsLeft = retryCount;
      const attemptGetPosition = (useHighAccuracy: boolean) => {
        navigator.geolocation.getCurrentPosition(
          (position) => resolve(position),
          (error) => {
            attemptsLeft--;
            
            if (attemptsLeft > 0) {
              // Retry with different strategy
              const nextStrategy = useHighAccuracy ? false : true;
              setTimeout(() => {
                attemptGetPosition(nextStrategy);
              }, 1000);
            } else {
              // All attempts failed
              let errorMessage = 'Unable to get your location. ';
              
              switch (error.code) {
                case error.PERMISSION_DENIED:
                  errorMessage = 'Location access denied. Please enable location access in your browser settings.';
                  break;
                case error.POSITION_UNAVAILABLE:
                  errorMessage = 'Location information is unavailable. Please try again or move to an area with better GPS reception.';
                  break;
                case error.TIMEOUT:
                  errorMessage = 'Location request timed out. Please try again.';
                  break;
              }
              
              reject(new Error(errorMessage));
            }
          },
          {
            enableHighAccuracy: useHighAccuracy,
            timeout: useHighAccuracy ? 15000 : 8000,
            maximumAge: useHighAccuracy ? 5000 : 30000,
            ...options,
          }
        );
      };

      // Start with high accuracy
      attemptGetPosition(true);
    });
  }, [options]);

  return {
    ...state,
    getCurrentPosition,
  };
};