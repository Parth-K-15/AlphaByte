# How to Install Redis

## Quick Fix (Current)
✅ **I've set `CACHE_ENABLED=false` in your `.env` file**  
Your app will run normally without Redis caching.

---

## When You're Ready to Enable Caching

### Option 1: Install Redis with Docker (Recommended - Easiest)

```bash
# Install Docker Desktop from: https://www.docker.com/products/docker-desktop

# Then run Redis:
docker run -d -p 6379:6379 --name redis redis:alpine

# Verify it's running:
docker ps

# Test connection:
redis-cli ping
# Should return: PONG
```

### Option 2: Install Redis on Windows

**Download:**
- Get Redis for Windows from: https://github.com/tporadowski/redis/releases
- Download `Redis-x64-5.0.14.1.msi` (or latest version)
- Run the installer

**Start Redis:**
```bash
# Redis will start as a Windows service automatically
# Or manually start it:
redis-server
```

**Verify:**
```bash
redis-cli ping
# Should return: PONG
```

### Option 3: Use WSL (Windows Subsystem for Linux)

```bash
# In WSL terminal:
sudo apt-get update
sudo apt-get install redis-server

# Start Redis:
sudo service redis-server start

# Verify:
redis-cli ping
```

---

## After Installing Redis

1. **Set `CACHE_ENABLED=true` in `.env`:**
   ```env
   CACHE_ENABLED=true
   ```

2. **Restart your server:**
   ```bash
   npm run dev
   ```

3. **You should see:**
   ```
   ✅ Redis connected successfully
      Host: localhost:6379
   ```

---

## Quick Test

Once Redis is running, test the cache:

```bash
# Make the same request twice - second should be much faster
curl http://localhost:5000/api/dashboard/stats
curl http://localhost:5000/api/dashboard/stats
```

---

## Useful Redis Commands

```bash
# Check if Redis is running
redis-cli ping

# View all cached keys
redis-cli KEYS "*"

# Clear all cache
redis-cli FLUSHDB

# Monitor Redis in real-time
redis-cli MONITOR

# Stop Redis (Docker)
docker stop redis

# Start Redis (Docker)
docker start redis
```

---

## Current Status

- ❌ Redis not installed
- ✅ App running without cache
- ⏳ Install Redis when ready
- 🚀 Enable caching by setting `CACHE_ENABLED=true`

The app works perfectly without Redis - caching is just an optional performance optimization!
