import { Request, Response, NextFunction } from 'express';
import serverConfig from '../configs/server.config';
import redisService from '../service/redis/redis.service';

/**
 * Rate limiting middleware based on accountId
 * Limits requests per account ID within a configured time window
 * 
 * Uses Redis to track and limit requests based on:
 * - RATE_LIMIT_MAX: Maximum number of requests per window (default: 60)
 * - RATE_LIMIT_WINDOW_MS: Time window in milliseconds (default: 60000 = 1 minute)
 */
export const rateLimitMiddleware = async (req: Request, res: Response, next: NextFunction): Promise<any> => {
  try {
    // Get accountId from headers
    const accountId = req.headers['accountid'];

    // If no accountId provided, skip rate limiting
    if (!accountId || typeof accountId !== 'string') {
      console.warn('No valid accountId found in request headers, skipping rate limiting');
      return next();
    }

    // Get rate limit settings from config
    const { max, windowMs } = serverConfig.rateLimit;

    // Create a unique key for this accountId
    const key = `ratelimit:${accountId}`;

    try {
      // Ensure Redis client is connected
      const client = await redisService.getClient();

      // Get current count for this accountId
      const currentCount = await client.get(key);
      const requestCount = currentCount ? parseInt(currentCount, 10) : 0;

      // Check if request count exceeds the limit
      if (requestCount >= max) {
        // Get time remaining for the window in seconds
        const ttl = await client.pTTL(key);
        const resetTime = Math.ceil(ttl / 1000) || 1; // Default to 1 second if TTL is not available

        return res.status(429).json({
          error: 'Too Many Requests',
          message: `Rate limit of ${max} requests per minute exceeded for account ID ${accountId}. Please try again in ${resetTime} seconds.`,
          retryAfter: resetTime
        });
      }

      if (requestCount === 0) {
        // First request within window, set the key with expiration
        await client.set(key, '1', {
          PX: windowMs // Set expiry in milliseconds
        });
      } else {
        // Increment existing counter
        await client.incr(key);
      }

      // Add rate limit headers to the response
      const ttl = await client.pTTL(key);
      const remaining = Math.max(0, max - requestCount - 1);
      
      res.setHeader('X-RateLimit-Limit', max.toString());
      res.setHeader('X-RateLimit-Remaining', remaining.toString());
      res.setHeader('Retry-After', Math.ceil(ttl / 1000).toString());

    } catch (redisError) {
      // Log Redis error but continue processing the request
      console.error('Redis error during rate limiting:', redisError);
      res.setHeader('X-Rate-Limit-Bypass-Reason', 'Redis unavailable');
    }

    // Proceed to next middleware/route handler
    next();
  } catch (error) {
    console.error('Rate limiting middleware error:', error);
    // If there's an unexpected error in the middleware, allow the request through
    next();
  }
};
