const Redis = require('ioredis');
const redis = new Redis({
  host: '127.0.0.1', // Redis server host
  port: 6379, // Default Redis port
  // password: 'yourpassword', // Uncomment if Redis is password-protected
});

redis.on('error', (err) => {
  console.error('Redis error:', err);
});

module.exports = redis;
