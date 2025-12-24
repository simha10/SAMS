# Geolocation Implementation

This document describes the robust geolocation implementation in SAMS v2.0.

## Overview

The geolocation system uses a progressive fallback strategy to ensure reliable location acquisition across different devices and network conditions.

## Architecture

### Progressive Fallback Strategy

The system implements a three-tier fallback approach:

1. **High Accuracy** (Primary)
   - Uses GPS/Wi-Fi triangulation
   - Timeout: 8 seconds
   - Maximum age: 5 seconds
   - Best for: Initial location acquisition

2. **Low Accuracy** (Fallback)
   - Uses network-based location
   - Timeout: 5 seconds
   - Maximum age: 30 seconds
   - Best for: Quick location when GPS unavailable

3. **Cached Position** (Last Resort)
   - Uses previously acquired position
   - Timeout: 2 seconds
   - Maximum age: 60 seconds
   - Best for: Fast response when other methods fail

## Implementation Details

### Hook: `useGeolocation`

Located in `src/hooks/useGeolocation.ts`

**Features**:
- Automatic permission checking
- Progressive fallback strategy
- Automatic cleanup after accurate position
- Mount-safe state updates
- Error handling with specific messages

**State Management**:
```typescript
interface GeolocationState {
  latitude: number | null;
  longitude: number | null;
  accuracy: number | null;
  error: string | null;
  loading: boolean;
}
```

**Key Functions**:

1. **`getPositionWithFallback()`**: Tries all three strategies sequentially
2. **`getCurrentPosition()`**: Manual position request with retry logic
3. **`stopWatching()`**: Cleans up geolocation watcher

### Automatic Cleanup

The system automatically stops watching position when:
- Accuracy < 30 meters is achieved
- Maximum timeout (20 seconds) is reached
- Component unmounts
- Error occurs after max attempts

### Permission Handling

**Supported Browsers**:
- Chrome/Edge: Full permissions API support
- Firefox: Full permissions API support
- Safari: Limited permissions API (graceful fallback)
- Mobile browsers: Device-specific handling

**Permission States**:
- `granted`: Location access allowed
- `denied`: Location access blocked (shows error)
- `prompt`: Will prompt user (proceeds normally)
- `unknown`: Permissions API unavailable (proceeds with fallback)

## Usage in Components

### Dashboard Component

```typescript
const {
  latitude,
  longitude,
  accuracy,
  error: geoError,
  loading: geoLoading,
  getCurrentPosition,
} = useGeolocation();
```

**Features**:
- Continuous position updates for UI display
- Manual position request for check-in/check-out
- Error handling with user-friendly messages
- Debounced distance calculations

### Check-in/Check-out Flow

1. User clicks check-in/check-out button
2. System uses cached position if available
3. If not available, calls `getCurrentPosition()` with retry
4. Calculates distance to selected branch
5. Proceeds with attendance action

## Error Handling

### Error Types

1. **Permission Denied**
   - Message: "Location access denied. Please enable location access in your browser settings."
   - Action: User must enable location in browser settings

2. **Position Unavailable**
   - Message: "Location information is unavailable. Try moving to an area with better GPS reception."
   - Action: System retries with fallback strategies

3. **Timeout**
   - Message: "Location request timed out. Please try again."
   - Action: System automatically tries next strategy

### Error Recovery

- Automatic retry with different strategies
- User-friendly error messages
- Graceful degradation (continues with cached data if available)

## Performance Optimizations

### Debounced Updates

Distance calculations are debounced to prevent excessive UI updates:

```typescript
const distanceCalculationTimeoutRef = useRef<number | null>(null);

// Debounce by 1 second
setTimeout(() => {
  calculateDistance();
}, 1000);
```

### Early Stopping

Geolocation watcher stops immediately when:
- High accuracy position (< 30m) is obtained
- Sufficient position samples collected
- Maximum timeout reached

### Resource Cleanup

Proper cleanup prevents:
- Memory leaks
- Battery drain
- Multiple watchers running simultaneously

## Browser Compatibility

### Desktop Browsers

| Browser | Support | Notes |
|---------|---------|-------|
| Chrome | ✅ Full | Best support |
| Firefox | ✅ Full | Good support |
| Edge | ✅ Full | Chromium-based |
| Safari | ⚠️ Limited | Permissions API limited |

### Mobile Browsers

| Platform | Support | Notes |
|----------|---------|-------|
| iOS Safari | ✅ Good | Requires HTTPS |
| Chrome Mobile | ✅ Full | Best mobile support |
| Firefox Mobile | ✅ Full | Good support |
| Samsung Internet | ✅ Good | Android default |

## Best Practices

1. **Always check for geolocation support** before using
2. **Handle permission states** gracefully
3. **Implement fallback strategies** for reliability
4. **Clean up watchers** to prevent resource leaks
5. **Debounce expensive operations** like distance calculations
6. **Provide user feedback** during location acquisition
7. **Use cached positions** when appropriate

## Troubleshooting

### Location Not Acquiring

**Possible Causes**:
- Location services disabled on device
- Browser permission denied
- Poor GPS signal
- Network issues

**Solutions**:
1. Check browser location settings
2. Ensure HTTPS in production
3. Move to area with better GPS reception
4. Check network connectivity

### Inaccurate Location

**Possible Causes**:
- Using network-based location (low accuracy)
- GPS signal interference
- Device GPS calibration issues

**Solutions**:
1. Wait for high-accuracy GPS fix
2. Move to open area
3. Ensure device GPS is calibrated
4. Check device location settings

### Slow Location Acquisition

**Possible Causes**:
- Poor GPS signal
- Network latency
- Device performance issues

**Solutions**:
1. System automatically uses fallback strategies
2. Cached positions provide instant response
3. Consider reducing timeout values for faster fallback

## Future Improvements

- [ ] Add location history for offline support
- [ ] Implement location smoothing algorithms
- [ ] Add location accuracy indicators in UI
- [ ] Support for indoor positioning
- [ ] Battery usage optimization
- [ ] Location sharing between devices

## API Reference

### `useGeolocation(options?)`

**Parameters**:
- `options.enableHighAccuracy`: boolean (default: true)
- `options.timeout`: number (default: varies by strategy)
- `options.maximumAge`: number (default: varies by strategy)

**Returns**:
```typescript
{
  latitude: number | null;
  longitude: number | null;
  accuracy: number | null;
  error: string | null;
  loading: boolean;
  getCurrentPosition: (retryCount?: number) => Promise<GeolocationPosition>;
}
```

### `getCurrentPosition(retryCount?)`

**Parameters**:
- `retryCount`: number (default: 3) - Number of retry attempts

**Returns**: `Promise<GeolocationPosition>`

**Throws**: Error with descriptive message if all attempts fail

