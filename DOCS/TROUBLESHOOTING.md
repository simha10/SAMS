# Troubleshooting Guide

This guide helps resolve common issues encountered when using or developing SAMS v2.0.

## Table of Contents

- [Frontend Issues](#frontend-issues)
- [Backend Issues](#backend-issues)
- [Geolocation Issues](#geolocation-issues)
- [Authentication Issues](#authentication-issues)
- [Performance Issues](#performance-issues)
- [Deployment Issues](#deployment-issues)

## Frontend Issues

### Dashboard Not Loading

**Symptoms**: Dashboard component fails to load, console shows ReferenceError.

**Possible Causes**:
- Function hoisting issues
- Missing dependencies
- Build errors

**Solutions**:
1. Clear browser cache and reload
2. Check browser console for specific errors
3. Verify all dependencies are installed: `pnpm install`
4. Rebuild the project: `pnpm run build`
5. Check that `fetchTodayStatus` is defined before use in Dashboard component

### Excessive API Calls

**Symptoms**: Network tab shows multiple requests to same endpoint, slow performance.

**Possible Causes**:
- Missing request deduplication
- Incorrect useEffect dependencies
- Multiple components triggering same API calls

**Solutions**:
1. Check for `isFetchingRef` implementation in components
2. Verify useEffect dependencies are correct
3. Ensure request deduplication is working
4. Check API interceptors for proper throttling

### Service Worker Double Refresh

**Symptoms**: Page loads twice, especially in development.

**Possible Causes**:
- Service worker enabled in development
- Aggressive cache clearing
- Service worker update conflicts

**Solutions**:
1. Verify service worker is disabled in development (`vite.config.ts`)
2. Clear browser cache and service worker
3. Check `src/service-worker.ts` for environment-aware behavior
4. In development, service worker should be disabled

### Build Errors

**Symptoms**: Build fails with missing module or type errors.

**Possible Causes**:
- Missing dependencies
- TypeScript errors
- Incorrect imports

**Solutions**:
1. Install missing dependencies: `pnpm install`
2. Check TypeScript errors: `pnpm run lint`
3. Verify all imports are correct
4. For browser types, use `number | null` instead of `NodeJS.Timeout`

## Backend Issues

### Database Connection Failed

**Symptoms**: Backend can't connect to MongoDB, errors in logs.

**Possible Causes**:
- Incorrect MONGO_URI
- Network access restrictions
- Database credentials incorrect

**Solutions**:
1. Verify MongoDB Atlas connection string in `.env`
2. Check network access whitelist in MongoDB Atlas
3. Ensure database user has proper permissions
4. Test connection: `mongosh "your-connection-string"`

### Redis Connection Issues

**Symptoms**: Rate limiting not working, Redis errors in logs.

**Possible Causes**:
- Redis not running
- Incorrect Redis configuration
- Network connectivity issues

**Solutions**:
1. Verify Redis is running: `redis-cli ping` (should return PONG)
2. Check Redis configuration in `.env`:
   - Modern: `REDIS_URL=redis://localhost:6379`
   - Legacy: `REDIS_HOST`, `REDIS_PORT`, `REDIS_PASSWORD`
3. Test Redis connection: `npm run test:redis`
4. For production, ensure Redis service is accessible

### Rate Limiting Not Working

**Symptoms**: Too many requests not being blocked.

**Possible Causes**:
- Redis not connected
- Rate limiter middleware not applied
- Configuration issues

**Solutions**:
1. Verify Redis is connected and working
2. Check rate limiter middleware is applied to routes
3. Review rate limit configuration in `backend/src/middleware/redisRateLimiter.js`
4. Check logs for rate limit hits

### Token Validation Errors

**Symptoms**: Users getting logged out unexpectedly, 401 errors.

**Possible Causes**:
- Token expired
- JWT_SECRET mismatch
- Cookie issues

**Solutions**:
1. Verify JWT_SECRET is consistent across environments
2. Check token expiration settings (90 days default)
3. Verify cookie configuration (HTTP-only, Secure in production)
4. Check CORS settings for cookie handling

## Geolocation Issues

### Location Not Acquiring

**Symptoms**: Geolocation fails, error messages shown.

**Possible Causes**:
- Location services disabled
- Browser permission denied
- Poor GPS signal
- Network issues

**Solutions**:
1. **Check Browser Settings**:
   - Chrome: Settings → Privacy and security → Site settings → Location
   - Firefox: Preferences → Privacy & Security → Permissions → Location
   - Safari: Preferences → Websites → Location Services

2. **Ensure HTTPS in Production**: Geolocation requires HTTPS (except localhost)

3. **Check Device Settings**:
   - Enable location services on device
   - Ensure GPS is enabled
   - Check location permissions for browser

4. **Try Different Location**:
   - Move to area with better GPS reception
   - Try outdoor location
   - Wait for GPS fix (can take 10-30 seconds)

5. **System Automatically Tries**:
   - High accuracy (8s timeout)
   - Low accuracy (5s timeout)
   - Cached position (2s timeout)

### Inaccurate Location

**Symptoms**: Location coordinates are far from actual position.

**Possible Causes**:
- Using network-based location (low accuracy)
- GPS signal interference
- Device GPS calibration issues

**Solutions**:
1. Wait for high-accuracy GPS fix (accuracy < 30m)
2. Move to open area with clear sky view
3. Ensure device GPS is calibrated
4. Check device location settings
5. System will automatically use best available accuracy

### Slow Location Acquisition

**Symptoms**: Location takes too long to acquire.

**Possible Causes**:
- Poor GPS signal
- Network latency
- Device performance issues

**Solutions**:
1. System automatically uses fallback strategies
2. Cached positions provide instant response
3. Wait for GPS fix (usually 3-8 seconds)
4. Check network connectivity
5. Ensure device has good GPS signal

### Location Permission Denied

**Symptoms**: Error message about location access denied.

**Solutions**:
1. **Enable in Browser**:
   - Click lock icon in address bar
   - Select "Allow" for location
   - Or go to browser settings and enable location

2. **Check System Settings**:
   - Enable location services in OS settings
   - Grant browser permission to access location

3. **For Production**:
   - Ensure site is served over HTTPS
   - Check browser console for specific errors

## Authentication Issues

### Login Fails

**Symptoms**: Can't log in, error messages.

**Possible Causes**:
- Incorrect credentials
- User account deactivated
- Database connection issues
- Rate limiting

**Solutions**:
1. Verify credentials are correct
2. Check user account is active in database
3. Verify database connection
4. Check rate limiting (wait if rate limited)
5. Check backend logs for specific errors

### Session Expired Unexpectedly

**Symptoms**: User logged out without action.

**Possible Causes**:
- Token expired (90 days)
- JWT_SECRET changed
- Cookie issues

**Solutions**:
1. Tokens expire after 90 days (by design)
2. Verify JWT_SECRET hasn't changed
3. Check cookie settings (HTTP-only, Secure)
4. Clear cookies and log in again
5. Check CORS settings

### Can't Stay Logged In

**Symptoms**: Forced to log in frequently.

**Possible Causes**:
- Token refresh not working
- Cookie expiration issues
- CORS problems

**Solutions**:
1. Verify token refresh is working (automatic after 30 days)
2. Check cookie maxAge is set correctly (90 days)
3. Verify CORS allows credentials
4. Check browser cookie settings
5. Ensure backend token utilities are working

## Performance Issues

### Slow Page Loads

**Symptoms**: Pages take long to load.

**Possible Causes**:
- Too many API calls
- Large bundle size
- Network latency
- Database queries slow

**Solutions**:
1. Check network tab for excessive API calls
2. Verify request deduplication is working
3. Check bundle size: `pnpm run build`
4. Review database query performance
5. Check Redis caching is working

### High Server Load

**Symptoms**: Server slow, high CPU/memory usage.

**Possible Causes**:
- Too many requests
- Inefficient queries
- No caching
- Rate limiting not working

**Solutions**:
1. Verify rate limiting is active
2. Check Redis caching is working
3. Review database query performance
4. Check for inefficient code
5. Monitor server logs for slow queries

### Memory Leaks

**Symptoms**: Application slows down over time, high memory usage.

**Possible Causes**:
- Event listeners not cleaned up
- Timers not cleared
- Geolocation watchers not stopped
- State updates after unmount

**Solutions**:
1. Ensure all useEffect hooks have cleanup functions
2. Clear all timeouts and intervals
3. Stop geolocation watchers on unmount
4. Check for state updates after component unmount
5. Use refs for values that shouldn't trigger re-renders

## Deployment Issues

### Build Fails

**Symptoms**: Deployment build fails.

**Possible Causes**:
- Missing dependencies
- TypeScript errors
- Environment variables missing
- Build configuration issues

**Solutions**:
1. Test build locally: `pnpm run build`
2. Check all dependencies are in package.json
3. Verify environment variables are set
4. Check build logs for specific errors
5. Ensure Node.js version matches requirements

### Service Worker Issues in Production

**Symptoms**: Users not seeing updates, cache issues.

**Possible Causes**:
- Service worker not updating
- Aggressive caching
- Cache version conflicts

**Solutions**:
1. Clear service worker and cache
2. Check service worker update logic
3. Verify cache versioning
4. Test service worker updates
5. Check browser console for service worker errors

### CORS Errors

**Symptoms**: API calls fail with CORS errors.

**Possible Causes**:
- FRONTEND_URL not set correctly
- CORS configuration incorrect
- Credentials not allowed

**Solutions**:
1. Verify FRONTEND_URL in backend `.env`
2. Check CORS configuration in backend
3. Ensure credentials are allowed
4. Verify frontend URL matches backend CORS whitelist
5. Check browser console for specific CORS errors

## Getting Help

If you encounter issues not covered in this guide:

1. **Check Logs**:
   - Frontend: Browser console
   - Backend: Winston logs in `backend/logs/`

2. **Review Documentation**:
   - [Performance Optimizations](PERFORMANCE.md)
   - [Geolocation Implementation](GEOLOCATION.md)
   - [Recent Fixes](RECENT_FIXES.md)

3. **Common Commands**:
   ```bash
   # Frontend
   pnpm install
   pnpm run build
   pnpm run lint
   
   # Backend
   npm install
   npm test
   npm run test:redis
   ```

4. **Debug Mode**:
   - Enable verbose logging
   - Check network tab for API calls
   - Review browser console for errors
   - Check backend logs for server errors

## Prevention

To prevent common issues:

1. **Keep Dependencies Updated**: Regularly update packages
2. **Test Locally**: Always test before deploying
3. **Monitor Logs**: Regularly check logs for errors
4. **Follow Best Practices**: Use proper error handling
5. **Document Changes**: Document any custom configurations

