import dotenv from 'dotenv';
import { getRedisClient, initRedis, isRedisConnected } from '../config/redis.js';

// Load environment variables
dotenv.config();

/**
 * Inspect Redis database - see all keys, values, and TTLs
 */
async function inspectRedis() {
  console.log('\n🔍 Redis Database Inspector\n');
  console.log('=' .repeat(60));

  try {
    // Initialize Redis connection
    await initRedis();

    if (!isRedisConnected()) {
      console.log('❌ Redis is not connected. Make sure Redis is running.');
      process.exit(1);
    }

    const redisClient = getRedisClient();

    // Get all keys
    console.log('\n📋 Fetching all keys...\n');
    const keys = await redisClient.keys('*');

    if (keys.length === 0) {
      console.log('✨ Redis database is empty - no cached data found.');
      console.log('\n💡 Tip: Make some API requests to populate the cache.');
      await cleanup(redisClient);
      return;
    }

    console.log(`📦 Found ${keys.length} cached items\n`);
    console.log('=' .repeat(60));

    // Group keys by pattern
    const keyGroups = groupKeysByPattern(keys);

    // Display statistics
    console.log('\n📊 Cache Statistics:\n');
    for (const [pattern, groupKeys] of Object.entries(keyGroups)) {
      console.log(`   ${pattern}: ${groupKeys.length} keys`);
    }

    console.log('\n' + '='.repeat(60));
    console.log('\n📝 Detailed Key-Value Pairs:\n');

    // Display each key with its value and TTL
    for (let i = 0; i < keys.length; i++) {
      const key = keys[i];
      
      try {
        // Get value
        const value = await redisClient.get(key);
        
        // Get TTL (time to live)
        const ttl = await redisClient.ttl(key);
        
        // Get memory usage
        const memoryUsage = await redisClient.memoryUsage(key);

        console.log(`\n${i + 1}. Key: ${key}`);
        console.log(`   TTL: ${formatTTL(ttl)}`);
        console.log(`   Size: ${formatBytes(memoryUsage || 0)}`);
        
        // Try to parse and display value
        try {
          const parsedValue = JSON.parse(value);
          console.log(`   Type: ${getDataType(parsedValue)}`);
          console.log(`   Preview: ${formatPreview(parsedValue)}`);
        } catch {
          console.log(`   Value: ${value.substring(0, 100)}${value.length > 100 ? '...' : ''}`);
        }
        
        console.log('   ' + '-'.repeat(58));
      } catch (error) {
        console.log(`   ⚠️  Error reading key: ${error.message}`);
      }
    }

    console.log('\n' + '='.repeat(60));
    
    // Offer options
    console.log('\n🔧 Available Actions:\n');
    console.log('   To clear all cache: npm run clear-cache');
    console.log('   To clear specific pattern: Use deleteCachePattern() in code');
    console.log('   To view a specific key: redisClient.get(key)');

    await cleanup(redisClient);

  } catch (error) {
    console.error('\n❌ Error inspecting Redis:', error);
    process.exit(1);
  }
}

/**
 * Group keys by pattern for better organization
 */
function groupKeysByPattern(keys) {
  const groups = {};

  keys.forEach(key => {
    // Extract pattern from key
    const parts = key.split(':');
    const pattern = parts[0] + (parts[1] ? ':*' : '');

    if (!groups[pattern]) {
      groups[pattern] = [];
    }
    groups[pattern].push(key);
  });

  return groups;
}

/**
 * Format TTL for display
 */
function formatTTL(ttl) {
  if (ttl === -1) return 'No expiration';
  if (ttl === -2) return 'Key does not exist';
  
  const minutes = Math.floor(ttl / 60);
  const seconds = ttl % 60;
  
  if (minutes > 0) {
    return `${minutes}m ${seconds}s remaining`;
  }
  return `${seconds}s remaining`;
}

/**
 * Format bytes for display
 */
function formatBytes(bytes) {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

/**
 * Determine data type
 */
function getDataType(data) {
  if (Array.isArray(data)) {
    return `Array (${data.length} items)`;
  }
  if (data && typeof data === 'object') {
    const keys = Object.keys(data);
    return `Object (${keys.length} properties)`;
  }
  return typeof data;
}

/**
 * Format data preview
 */
function formatPreview(data) {
  if (Array.isArray(data)) {
    return `[${data.length} items] ${data.length > 0 ? JSON.stringify(data[0]).substring(0, 50) + '...' : ''}`;
  }
  
  if (data && typeof data === 'object') {
    // Show first few properties
    const keys = Object.keys(data).slice(0, 3);
    const preview = keys.map(k => `${k}: ${JSON.stringify(data[k]).substring(0, 20)}`).join(', ');
    return preview + (Object.keys(data).length > 3 ? '...' : '');
  }
  
  const str = JSON.stringify(data);
  return str.substring(0, 100) + (str.length > 100 ? '...' : '');
}

/**
 * Cleanup and exit
 */
async function cleanup(redisClient) {
  if (redisClient) {
    await redisClient.quit();
  }
  process.exit(0);
}

// Run the inspector
inspectRedis();
