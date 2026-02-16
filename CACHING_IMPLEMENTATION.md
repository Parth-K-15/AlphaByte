# Redis Caching Implementation Guide

## 📋 Overview

This document tracks the Redis caching implementation for the Planix Event Management System. The goal is to reduce database queries and improve response times by 50-70% for frequently accessed data.

---

## 🎯 Why Redis?

- **In-memory storage**: Sub-millisecond response times
- **TTL support**: Automatic cache expiration
- **Pub/Sub**: Real-time cache invalidation capability
- **Persistence options**: Data durability if needed
- **Scalable**: Handles high concurrent requests efficiently

---

## 🏗️ Architecture

```
┌─────────────┐
│   Request   │
└──────┬──────┘
       │
       ▼
┌─────────────────┐
│  Check Redis    │ ◄─── Cache Hit (Return cached data)
└──────┬──────────┘
       │ Cache Miss
       ▼
┌─────────────────┐
│  Query MongoDB  │
└──────┬──────────┘
       │
       ▼
┌─────────────────┐
│  Store in Redis │
│  with TTL       │
└──────┬──────────┘
       │
       ▼
┌─────────────────┐
│  Return Response│
└─────────────────┘
```

---

## ✅ Implementation Status

### **Phase 1: Infrastructure** ✅ COMPLETED

| Component | Status | File Path |
|-----------|--------|-----------|
| Redis Client Setup | ✅ Done | `Server/config/redis.js` |
| Cache Middleware | ✅ Done | `Server/middleware/cache.js` |
| Cache Key Generator | ✅ Done | `Server/utils/cacheKeys.js` |
| Cache Invalidation Utils | ✅ Done | `Server/utils/cacheInvalidation.js` |
| Redis Dependency | ✅ Done | `Server/package.json` |
| Redis Initialization | ✅ Done | `Server/app.js` |

### **Phase 2: Route Caching Implementation**

#### ✅ **Completed Routes**
| Route | TTL | Cache Key | Status |
|-------|-----|-----------|--------|
| `GET /api/participant/events` | 5 min | `events:list:{filters}` | ✅ Done |
| `GET /api/participant/events/:id` | 10 min | `event:{id}` | ✅ Done |

#### 🚧 **Routes Pending Implementation**
| Priority | Route | Recommended TTL | Cache Key | Status |
|----------|-------|-----------------|-----------|--------|
| **HIGH** | `GET /api/dashboard/stats` | 2 min | `dashboard:stats` | ⏳ Pending |
| **HIGH** | `GET /api/reports/analytics` | 5 min | `analytics:{filters}` | ⏳ Pending |
| **MEDIUM** | `GET /api/finance/budget/:eventId` | 5 min | `finance:{eventId}:budget` | ⏳ Pending |
| **MEDIUM** | `GET /api/finance/expenses/:eventId` | 3 min | `finance:{eventId}:expenses` | ⏳ Pending |
| **MEDIUM** | `GET /api/auth/me` | 15 min | `user:{userId}:profile` | ⏳ Pending |
| **LOW** | `GET /api/organizer/events` | 3 min | `user:{userId}:events` | ⏳ Pending |
| **LOW** | `GET /api/organizer/events/:id` | 10 min | `event:{id}` | ⏳ Pending |

### **Phase 3: Cache Invalidation** ⏳ PENDING

Cache invalidation needs to be added to mutation routes (POST/PUT/DELETE):

| Mutation Type | Routes to Invalidate | Invalidation Pattern |
|---------------|---------------------|---------------------|
| Event Updates | POST/PUT/DELETE `/api/events/*` | `event:*`, `events:list*` |
| Registrations | POST `/api/participant/register` | `event:{id}:*`, `events:list*` |
| Budget/Expenses | POST/PUT/DELETE `/api/finance/*` | `finance:{eventId}:*` |
| Profile Updates | PUT `/api/auth/profile` | `user:{userId}:*` |
| Dashboard Changes | Any data-modifying operation | `dashboard:*`, `analytics*` |

---

## 📁 File Structure

```
Server/
├── config/
│   └── redis.js              ✅ Redis client configuration
├── middleware/
│   └── cache.js              ✅ Caching middleware functions
├── utils/
│   ├── cacheKeys.js          ✅ Cache key generators
│   └── cacheInvalidation.js  ✅ Cache invalidation helpers
├── routes/
│   ├── participants.js       ✅ Partially cached
│   ├── organizer.js          🚧 Not cached yet
│   ├── dashboard.js          🚧 Not cached yet
│   ├── finance.js            🚧 Not cached yet
│   ├── auth.js               🚧 Not cached yet
│   └── reports.js            🚧 Not cached yet
└── app.js                    ✅ Redis initialized
```

---

## 🔧 Configuration

### Environment Variables

Add these to your `.env` file:

```env
# Redis Configuration
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=
REDIS_DB=0
CACHE_ENABLED=true
CACHE_DEFAULT_TTL=300
```

### TTL (Time To Live) Definitions

Defined in `Server/utils/cacheKeys.js`:

```javascript
export const CacheTTL = {
  SHORT: 120,      // 2 minutes - frequently changing data
  MEDIUM: 300,     // 5 minutes - moderately stable data
  LONG: 600,       // 10 minutes - stable data
  VERY_LONG: 900,  // 15 minutes - rarely changing data
  HOUR: 3600,      // 1 hour - very stable data
};
```

---

## 📝 Implementation Guide

### How to Add Caching to a GET Route

**Step 1**: Import cache middleware and utilities

```javascript
import { cache } from '../middleware/cache.js';
import { CacheKeys, CacheTTL } from '../utils/cacheKeys.js';
```

**Step 2**: Add cache middleware to the route

```javascript
router.get(
  '/route-path',
  cache(CacheTTL.MEDIUM, (req) => CacheKeys.yourCacheKey(req.params.id)),
  async (req, res) => {
    // Your existing route handler
  }
);
```

**Example**: Caching event list

```javascript
router.get(
  '/events',
  cache(CacheTTL.MEDIUM, (req) => 
    CacheKeys.eventList({
      search: req.query.search,
      status: req.query.status,
    })
  ),
  async (req, res) => {
    // Fetch events from database
    const events = await Event.find(filter);
    res.json({ success: true, data: events });
  }
);
```

### How to Add Cache Invalidation

**Step 1**: Import invalidation helpers

```javascript
import { invalidateEventCache, invalidateDashboardCache } from '../utils/cacheInvalidation.js';
```

**Step 2**: Call invalidation after data mutation

```javascript
router.put('/events/:id', async (req, res) => {
  try {
    const event = await Event.findByIdAndUpdate(req.params.id, req.body);
    
    // Invalidate cache
    await invalidateEventCache(req.params.id);
    await invalidateDashboardCache();
    
    res.json({ success: true, data: event });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});
```

---

## 🎯 Next Steps

### Immediate Actions (In Order)

1. **Dashboard Routes** - Most computation-heavy
   - Add caching to `GET /api/dashboard/stats`
   - Add caching to `GET /api/dashboard/activity`

2. **Reports Routes** - Complex analytics queries
   - Add caching to `GET /api/reports/analytics`
   - Add caching to `GET /api/reports/events`

3. **Finance Routes** - Important for organizers
   - Add caching to `GET /api/finance/budget/:eventId`
   - Add caching to `GET /api/finance/expenses/:eventId`

4. **Auth Routes** - Frequently accessed
   - Add caching to `GET /api/auth/me`

5. **Cache Invalidation** - Critical for data consistency
   - Add invalidation to event mutation routes
   - Add invalidation to finance mutation routes
   - Add invalidation to registration routes

6. **Environment Setup**
   - Ensure Redis is running locally
   - Add Redis env variables to `.env`
   - Test Redis connection

---

## 🧪 Testing Strategy

### Manual Testing Checklist

- [ ] **Cache Hit Test**: Make same request twice, second should be faster
- [ ] **Cache Invalidation Test**: Update data, verify cache is cleared
- [ ] **TTL Test**: Wait for TTL expiry, verify fresh data is fetched
- [ ] **Redis Down Test**: Verify app works without Redis (graceful degradation)
- [ ] **Performance Test**: Compare response times with/without cache

### Testing Commands

```bash
# Check if Redis is running
redis-cli ping
# Expected: PONG

# View all cached keys
redis-cli KEYS "*"

# View specific cache value
redis-cli GET "event:123"

# Clear all cache (for testing)
redis-cli FLUSHDB

# Monitor Redis in real-time
redis-cli MONITOR
```

---

## 📊 Expected Performance Gains

| Metric | Before | After | Improvement |
|--------|--------|-------|-------------|
| Database Load | 100% | 20-40% | 60-80% reduction |
| Response Time (Cached) | 200-500ms | 10-50ms | 75-95% faster |
| Concurrent Users | 100 | 300-500 | 3-5x increase |
| Server CPU Usage | High | Medium | 30-40% reduction |

---

## 🚨 Common Issues & Solutions

### Issue 1: Redis Connection Error
```
Error: Redis Client Error: connect ECONNREFUSED
```
**Solution**: 
1. Install Redis: Download from https://redis.io/download
2. Start Redis: `redis-server`
3. Or disable caching: `CACHE_ENABLED=false` in `.env`

### Issue 2: Cache Not Invalidating
**Solution**: 
- Check if invalidation helpers are called after mutations
- Verify cache patterns match key generators

### Issue 3: Stale Data Returned
**Solution**: 
- Reduce TTL for that route
- Add proper cache invalidation on related mutations

---

## 📚 Resources

- [Redis Documentation](https://redis.io/docs/)
- [Redis Node Client](https://github.com/redis/node-redis)
- [Caching Best Practices](https://docs.aws.amazon.com/AmazonElastiCache/latest/red-ug/BestPractices.html)

---

## 🎉 Completion Criteria

Caching implementation is complete when:

- ✅ All infrastructure files created
- ⏳ All high-priority GET routes cached
- ⏳ Cache invalidation added to all mutation routes
- ⏳ Environment variables configured
- ⏳ Redis running in development
- ⏳ Performance improvements verified
- ⏳ Tests passing

---

## 📞 Support

If you encounter issues:
1. Check Redis connection: `redis-cli ping`
2. Review logs for Redis errors
3. Verify `.env` configuration
4. Check if `CACHE_ENABLED=true`

---

**Last Updated**: February 16, 2026  
**Implementation Progress**: 30% Complete  
**Next Task**: Add caching to dashboard routes
