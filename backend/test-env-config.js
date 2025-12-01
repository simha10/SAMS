// Test script to verify environment variable configuration
if (!process.env.JEST_WORKER_ID) {
    require('dotenv').config();
} else {
    // In Jest environment, dotenv is already loaded
    if (!process.env.MONGO_URI) {
        require('dotenv').config();
    }
}

console.log('=== Environment Variable Test ===');
console.log('MONGO_URI:', process.env.MONGO_URI || 'Not set (will use default)');
console.log('NODE_ENV:', process.env.NODE_ENV || 'Not set');
console.log('PORT:', process.env.PORT || 'Not set');
console.log('===============================');