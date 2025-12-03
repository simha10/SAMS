const { redisClient, connectRedis, disconnectRedis } = require('../src/config/redis');

async function testRedis() {
    try {
        console.log('=== REDIS CONFIGURATION TEST ===');

        // Display current configuration approach
        if (process.env.REDIS_URL) {
            console.log('🔧 Using REDIS_URL configuration');
            console.log('🔗 URL:', process.env.REDIS_URL.replace(/:[^:@]+@/, ':***@')); // Hide password
        } else {
            console.log('🔧 Using legacy configuration');
            console.log('🖥️  Host:', process.env.REDIS_HOST || '127.0.0.1');
            console.log('🔌 Port:', process.env.REDIS_PORT || 6379);
            console.log('🔐 Password:', process.env.REDIS_PASSWORD ? '***' : 'Not set');
        }

        // Connect to Redis
        await connectRedis();
        console.log('✅ Connected to Redis successfully');

        // Test basic Redis operations
        console.log('\n=== BASIC OPERATIONS TEST ===');

        // Set a test key
        await redisClient.set('test_key', 'Hello Redis!');
        console.log('✓ Set test key');

        // Get the test key
        const value = await redisClient.get('test_key');
        console.log('✓ Retrieved test key:', value);

        // Test rate limiting simulation
        console.log('\n=== RATE LIMITING SIMULATION ===');
        const userId = 'test_user_123';
        const now = Date.now();
        const windowMs = 60000; // 1 minute

        // Add some requests to simulate rate limiting
        for (let i = 0; i < 5; i++) {
            await redisClient.zAdd(`rate_limit:user:${userId}`, {
                score: now - (i * 10000),
                value: `request_${i}`
            });
        }

        // Count requests in window
        const windowStart = now - windowMs;
        await redisClient.zRemRangeByScore(`rate_limit:user:${userId}`, 0, windowStart);
        const count = await redisClient.zCard(`rate_limit:user:${userId}`);

        console.log(`✓ Simulated rate limiting: ${count} requests in current window`);

        // Test caching simulation
        console.log('\n=== CACHING SIMULATION ===');
        const cacheKey = 'cache:test_data';
        const testData = { message: 'This is cached data', timestamp: new Date().toISOString() };

        // Cache data
        await redisClient.setEx(cacheKey, 30, JSON.stringify(testData));
        console.log('✓ Cached test data');

        // Retrieve cached data
        const cachedData = await redisClient.get(cacheKey);
        console.log('✓ Retrieved cached data:', JSON.parse(cachedData));

        // Test connection info
        console.log('\n=== CONNECTION INFO ===');
        try {
            const info = await redisClient.info();
            const lines = info.split('\n');
            const versionLine = lines.find(line => line.startsWith('redis_version:'));
            const modeLine = lines.find(line => line.startsWith('redis_mode:'));

            if (versionLine) {
                console.log('📊 Redis Version:', versionLine.split(':')[1].trim());
            }
            if (modeLine) {
                console.log('🖥️  Redis Mode:', modeLine.split(':')[1].trim());
            }
        } catch (infoErr) {
            console.log('ℹ️  Could not retrieve Redis info (might be restricted in some cloud providers)');
        }

        // Clean up test keys
        await redisClient.del('test_key', cacheKey, `rate_limit:user:${userId}`);
        console.log('✓ Cleaned up test keys');

        // Disconnect
        await disconnectRedis();
        console.log('✅ Disconnected from Redis successfully');

        console.log('\n🎉 All Redis tests passed!');
        console.log('✅ Redis is properly configured and ready for use');

        if (!process.env.REDIS_URL) {
            console.log('\n💡 Recommendation: Consider migrating to REDIS_URL for production deployments');
            console.log('   Set REDIS_URL=redis://default:<password>@<host>:<port> in your environment');
        }

        process.exit(0);
    } catch (error) {
        console.error('❌ Redis test failed:', error.message);
        console.error('🔧 Error details:', error);

        // Try to disconnect even if there was an error
        try {
            await disconnectRedis();
        } catch (disconnectErr) {
            console.error('❌ Error during disconnect:', disconnectErr.message);
        }

        process.exit(1);
    }
}

testRedis();