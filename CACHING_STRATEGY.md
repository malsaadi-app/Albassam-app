# 🚀 Caching Strategy - Albassam Schools App

**Phase:** Phase 2 - Performance & Optimization  
**Implementation Date:** February 24, 2026  
**Cache Provider:** Upstash Redis (Serverless)

---

## Overview

This document outlines the caching strategy for Albassam Schools App to improve performance and reduce database load.

**Goals:**
- Reduce response time by 50%
- Decrease database queries by 60%
- Improve user experience
- Scale efficiently

---

## Cache Provider: Upstash Redis

**Why Upstash?**
- ✅ Serverless (no infrastructure management)
- ✅ Free tier (10,000 commands/day)
- ✅ REST API (works in serverless environments)
- ✅ Global replication
- ✅ No connection pool issues

**Free Tier Limits:**
- 10,000 commands per day
- 256 MB storage
- Global replication (1 region)

**Pricing:** $0.2 per 100K commands (after free tier)

---

## Setup

### 1. Create Upstash Account

1. Go to: https://upstash.com
2. Sign up (free)
3. Create new database:
   - **Name:** albassam-cache
   - **Region:** Europe (Ireland) - closest to Supabase
   - **Type:** Regional (Free tier)

### 2. Get Credentials

After creating database:
1. Go to **REST API** tab
2. Copy:
   - `UPSTASH_REDIS_REST_URL`
   - `UPSTASH_REDIS_REST_TOKEN`

### 3. Configure Environment

Add to `.env`:
```bash
UPSTASH_REDIS_REST_URL="https://your-redis-url.upstash.io"
UPSTASH_REDIS_REST_TOKEN="your_token_here"
```

### 4. Verify Installation

```bash
cd /data/.openclaw/workspace/albassam-tasks
npm install  # @upstash/redis already installed
npm run build
```

---

## Cache Structure

### Cache Keys

Format: `prefix:identifier:subkey`

**Examples:**
```
dashboard:user123:stats
employee:emp456:details
attendance:2026-02-24:list
branch:br789:details
department:dept101:employees
```

### Cache TTL (Time To Live)

| Data Type | TTL | Reason |
|-----------|-----|--------|
| Dashboard Stats | 5 min | Frequently changes |
| User Data | 15 min | Semi-static |
| List Data | 10 min | Balance freshness/performance |
| Reference Data | 1 hour | Rarely changes (branches, departments) |
| Reports | 30 min | Expensive to generate |

---

## What to Cache

### ✅ High Priority (Implemented)

#### 1. Dashboard Statistics
**Cache Key:** `dashboard:{userId}:stats`  
**TTL:** 5 minutes  
**Why:** Most accessed page, expensive aggregations

```typescript
// Example
const stats = await withCache(
  buildCacheKey(CACHE_PREFIX.DASHBOARD, userId),
  async () => {
    // Fetch from database
    return {
      totalTasks: await prisma.task.count({ where: { assignedTo: userId } }),
      completedTasks: await prisma.task.count({ where: { assignedTo: userId, status: 'COMPLETED' } }),
      // ... more stats
    }
  },
  CACHE_TTL.DASHBOARD_STATS
)
```

#### 2. Employee Lists
**Cache Key:** `employee:list:{filters}`  
**TTL:** 10 minutes  
**Why:** Frequently accessed, large datasets

#### 3. Attendance Today
**Cache Key:** `attendance:{date}:summary`  
**TTL:** 5 minutes  
**Why:** Real-time but can tolerate slight delay

#### 4. Reference Data
**Cache Key:** `branch:{id}` / `department:{id}`  
**TTL:** 1 hour  
**Why:** Rarely changes, frequently accessed

---

### 📋 Medium Priority (Phase 3)

#### 5. Task Lists
**Cache Key:** `task:list:{userId}:{filters}`  
**TTL:** 10 minutes

#### 6. Reports
**Cache Key:** `report:{type}:{params}`  
**TTL:** 30 minutes

#### 7. Search Results
**Cache Key:** `search:{query}:{filters}`  
**TTL:** 15 minutes

---

### ❌ What NOT to Cache

**Don't cache:**
- Authentication tokens (use sessions)
- Real-time attendance check-in/out
- Financial transactions
- Audit logs
- User passwords (obviously)
- Sensitive personal data

**Reason:** Security, data integrity, real-time requirements

---

## Cache Invalidation

### When to Invalidate

**Rule:** Invalidate immediately after data modification

#### Employee Data
```typescript
// After creating/updating employee
await prisma.employee.create({ ... })
await invalidateEmployeeCache(employeeId)  // Specific employee
await invalidateEmployeeCache()  // List cache
```

#### Dashboard Stats
```typescript
// After task status change
await prisma.task.update({ ... })
await invalidateDashboardCache(userId)
```

#### Attendance
```typescript
// After check-in/out
await prisma.attendance.create({ ... })
await invalidateAttendanceCache(today)
```

### Invalidation Strategies

1. **Immediate Invalidation** (Recommended)
   - Invalidate cache right after write
   - Simple, reliable
   - Slight overhead on writes

2. **TTL-Based** (Current)
   - Cache expires automatically
   - No invalidation logic needed
   - May serve stale data briefly

3. **Versioning** (Future)
   - Append version to key
   - Increment version on write
   - No deletion needed

---

## Implementation Guide

### Step 1: Basic Caching

```typescript
// In your API route
import { withCache, buildCacheKey, CACHE_PREFIX, CACHE_TTL } from '@/lib/cache'

export async function GET(req: Request) {
  const userId = 'user123' // from session
  
  // Use cache wrapper
  const stats = await withCache(
    buildCacheKey(CACHE_PREFIX.DASHBOARD, userId),
    async () => {
      // Expensive database query
      return await fetchDashboardStats(userId)
    },
    CACHE_TTL.DASHBOARD_STATS
  )
  
  return Response.json(stats)
}
```

### Step 2: Cache Invalidation

```typescript
// In your update API route
import { invalidateDashboardCache } from '@/lib/cache'

export async function POST(req: Request) {
  const userId = 'user123'
  
  // Update data
  await prisma.task.update({ ... })
  
  // Invalidate cache
  await invalidateDashboardCache(userId)
  
  return Response.json({ success: true })
}
```

### Step 3: Graceful Degradation

**Cache is optional!** App works without Redis:

```typescript
// lib/cache.ts already handles this
if (!redis) {
  // Falls back to direct database query
  return await fetchFn()
}
```

---

## Monitoring

### Cache Hit Rate

Track cache effectiveness:

```typescript
let cacheHits = 0
let cacheMisses = 0

export async function getCached<T>(key: string): Promise<T | null> {
  const value = await redis.get<T>(key)
  
  if (value !== null) {
    cacheHits++
  } else {
    cacheMisses++
  }
  
  return value
}

export function getCacheHitRate(): number {
  const total = cacheHits + cacheMisses
  return total > 0 ? (cacheHits / total) * 100 : 0
}
```

**Target:** > 60% hit rate

### Upstash Dashboard

Monitor at: https://console.upstash.com

**Metrics:**
- Commands per day
- Storage used
- Latency
- Error rate

**Alerts:**
- Approaching free tier limit (8,000/10,000 commands)
- High error rate
- High latency

---

## Performance Impact

### Expected Improvements

| Metric | Before | After | Improvement |
|--------|--------|-------|-------------|
| Dashboard Load | 800ms | 200ms | 75% faster |
| Employee List | 600ms | 150ms | 75% faster |
| Database Queries | 100/min | 40/min | 60% reduction |
| API Response Time | 500ms | 150ms | 70% faster |

### Cost Analysis

**Free Tier Usage (Estimated):**
- Dashboard loads: 1,000/day × 2 commands = 2,000
- Employee lists: 500/day × 2 commands = 1,000
- Attendance: 300/day × 2 commands = 600
- Reference data: 200/day × 1 command = 200
- **Total: 3,800 commands/day** (well within 10,000 limit)

**Paid Tier (if needed):**
- 100,000 commands/month = ~3,300/day
- Cost: $0.2 per 100K = **$0.20/month**

**Conclusion:** Free tier is sufficient for current scale

---

## Migration Plan

### Phase 1: Dashboard (Day 1)
- ✅ Setup Redis connection
- ✅ Cache dashboard stats
- ✅ Test performance
- ✅ Deploy

### Phase 2: Lists (Day 2)
- Cache employee lists
- Cache task lists
- Cache attendance lists
- Measure impact

### Phase 3: Reference Data (Day 2)
- Cache branches
- Cache departments
- Cache job titles
- Long TTL (1 hour)

### Phase 4: Reports (Optional)
- Cache generated reports
- Cache search results
- Optimize heavy queries

---

## Testing

### Local Testing (Without Redis)

App works fine without Redis:
```bash
# Don't set UPSTASH_REDIS_REST_URL
npm run dev
# Cache disabled, falls back to direct queries
```

### With Redis

```bash
# Set environment variables
export UPSTASH_REDIS_REST_URL="..."
export UPSTASH_REDIS_REST_TOKEN="..."

npm run dev

# Test cache hit
curl http://localhost:3000/api/dashboard
# Check logs: "Cache HIT" or "Cache MISS"
```

### Production Testing

1. Deploy with Redis enabled
2. Monitor Upstash dashboard
3. Check cache hit rate
4. Measure performance improvements
5. Verify invalidation works

---

## Troubleshooting

### Cache Not Working

**Check:**
1. Environment variables set correctly
2. Upstash database is active
3. Network connectivity to Upstash
4. Check logs for errors

**Fallback:**
- App continues to work (direct DB queries)
- No degradation in functionality
- Slightly higher response times

### High Cache Miss Rate

**Causes:**
- TTL too short
- Cache being invalidated too frequently
- Keys not matching (typos)
- Low traffic (cache expires before reuse)

**Solutions:**
- Increase TTL (carefully)
- Review invalidation logic
- Debug key generation
- Monitor usage patterns

### Approaching Free Tier Limit

**Actions:**
1. Review cache usage (Upstash dashboard)
2. Increase TTL (reduce refreshes)
3. Remove unnecessary cache operations
4. Consider paid tier ($0.20/month for 100K commands)

---

## Best Practices

### Do's ✅
- ✅ Cache read-heavy operations
- ✅ Invalidate immediately after writes
- ✅ Use appropriate TTLs
- ✅ Monitor cache hit rate
- ✅ Graceful degradation (fallback to DB)

### Don'ts ❌
- ❌ Don't cache sensitive data (passwords, tokens)
- ❌ Don't cache real-time data (live attendance)
- ❌ Don't use as primary storage
- ❌ Don't over-cache (waste of memory)
- ❌ Don't forget to invalidate

---

## Future Enhancements

### Phase 3+
- Redis Pub/Sub for real-time invalidation
- Cache warming (pre-populate on startup)
- Advanced invalidation patterns
- Cache analytics dashboard
- A/B testing (cache vs no cache)

---

## References

- Upstash Docs: https://docs.upstash.com/redis
- Redis Best Practices: https://redis.io/docs/manual/patterns/
- Next.js Caching: https://nextjs.org/docs/app/building-your-application/caching

---

**Prepared by:** Khalid (خالد)  
**Date:** February 24, 2026  
**Status:** 🚧 In Progress (Phase 2 - Day 1)  
**Next Review:** After Phase 2 completion
