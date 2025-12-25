#!/usr/bin/env node

/**
 * Script to clear all Redis session data
 * This should be run when deploying updates that might cause authentication conflicts
 */

const redis = require('redis');

// Load environment variables only when PLATFORM is not 'gcp'
if (process.env.PLATFORM !== 'gcp') {
    require('dotenv').config();
}

async function clearRedisSessions() {
  console.log('=== CLEARING REDIS SESSION DATA ===');
  
  // Create Redis client using split configuration (same as main Redis setup)
  const client = redis.createClient({
    username: process.env.REDIS_USERNAME || 'default',
    password: process.env.REDIS_PASSWORD,
    socket: {
      host: process.env.REDIS_HOST || 'localhost',
      port: parseInt(process.env.REDIS_PORT) || 6379
    }
  });
  
  try {
    // Connect to Redis
    await client.connect();
    console.log('✓ Connected to Redis');
    
    // Get all keys matching auth patterns
    const authKeys = await client.keys('auth:*');
    const sessionKeys = await client.keys('session:*');
    const rateLimitKeys = await client.keys('rate-limit:*');
    const tokenKeys = await client.keys('token:*');
    
    const allKeys = [...authKeys, ...sessionKeys, ...rateLimitKeys, ...tokenKeys];
    
    if (allKeys.length > 0) {
      console.log(`Found ${allKeys.length} authentication-related keys`);
      
      // Delete all keys
      const result = await client.del(allKeys);
      console.log(`✓ Deleted ${result} keys from Redis`);
    } else {
      console.log('No authentication-related keys found in Redis');
    }
    
    // Flush Redis database (optional - uncomment if needed)
    // await client.flushDb();
    // console.log('✓ Redis database flushed');
    
  } catch (error) {
    console.error('✗ Redis operation failed:', error.message);
  } finally {
    // Close Redis connection
    await client.quit();
    console.log('✓ Redis connection closed');
  }
  
  console.log('=== REDIS SESSION CLEAR COMPLETE ===');
}

// Run the script
if (require.main === module) {
  clearRedisSessions().catch(console.error);
}

module.exports = { clearRedisSessions };