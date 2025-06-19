import { Request, Response, NextFunction } from 'express';
import { rateLimitMiddleware } from '../../src/middleware/rateLimit.middleware';
import redisService from '../../src/service/redis/redis.service';

// We'll use the global mock for redisService from jest.setup.ts

describe('Rate Limit Middleware', () => {
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;
  let nextFunction: NextFunction;
  let mockRedisClient: any;
  
  beforeEach(() => {
    mockRequest = {
      headers: {}
    };
    
    mockResponse = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
      setHeader: jest.fn()
    };
    
    nextFunction = jest.fn();
    
    mockRedisClient = {
      get: jest.fn(),
      set: jest.fn(),
      incr: jest.fn(),
      pTTL: jest.fn()
    };
    
    (redisService.getClient as jest.Mock).mockResolvedValue(mockRedisClient);
  });
  
  afterEach(() => {
    jest.clearAllMocks();
  });
  
  it('should skip rate limiting if no accountId is provided', async () => {
    // Arrange
    mockRequest.headers = {}; // No accountId
    
    // Act
    await rateLimitMiddleware(mockRequest as Request, mockResponse as Response, nextFunction);
    
    // Assert
    expect(nextFunction).toHaveBeenCalled();
    expect(redisService.getClient).not.toHaveBeenCalled();
  });
  
  it('should proceed if request count is below the limit', async () => {
    // Arrange
    mockRequest.headers = { accountid: 'test-account-123' };
    mockRedisClient.get.mockResolvedValue('5'); // Below default limit of 60
    mockRedisClient.pTTL.mockResolvedValue(30000); // 30 seconds left
    
    // Act
    await rateLimitMiddleware(mockRequest as Request, mockResponse as Response, nextFunction);
    
    // Assert
    expect(nextFunction).toHaveBeenCalled();
    expect(mockRedisClient.incr).toHaveBeenCalledWith('ratelimit:test-account-123');
    expect(mockResponse.setHeader).toHaveBeenCalledWith('X-RateLimit-Limit', '60');
    expect(mockResponse.setHeader).toHaveBeenCalledWith('X-RateLimit-Remaining', '54');
  });
  
  it('should reject if request count exceeds the limit', async () => {
    // Arrange
    mockRequest.headers = { accountid: 'test-account-123' };
    mockRedisClient.get.mockResolvedValue('60'); // Equals the default limit
    mockRedisClient.pTTL.mockResolvedValue(30000); // 30 seconds left
    
    // Act
    await rateLimitMiddleware(mockRequest as Request, mockResponse as Response, nextFunction);
    
    // Assert
    expect(nextFunction).not.toHaveBeenCalled();
    expect(mockResponse.status).toHaveBeenCalledWith(429);
    expect(mockResponse.json).toHaveBeenCalledWith(
      expect.objectContaining({
        error: 'Too Many Requests',
        retryAfter: 30 // 30 seconds in this test
      })
    );
  });
  
  it('should initialize counter for first request', async () => {
    // Arrange
    mockRequest.headers = { accountid: 'test-account-123' };
    mockRedisClient.get.mockResolvedValue(null); // First request
    mockRedisClient.pTTL.mockResolvedValue(60000); // Full window remaining
    
    // Act
    await rateLimitMiddleware(mockRequest as Request, mockResponse as Response, nextFunction);
    
    // Assert
    expect(nextFunction).toHaveBeenCalled();
    expect(mockRedisClient.set).toHaveBeenCalledWith(
      'ratelimit:test-account-123',
      '1',
      expect.objectContaining({ PX: 60000 })
    );
  });
  
  it('should bypass rate limiting if redis fails and continue processing', async () => {
    // Arrange
    mockRequest.headers = { accountid: 'test-account-123' };
    (redisService.getClient as jest.Mock).mockRejectedValue(new Error('Redis connection failed'));
    
    // Act
    await rateLimitMiddleware(mockRequest as Request, mockResponse as Response, nextFunction);
    
    // Assert
    expect(nextFunction).toHaveBeenCalled();
    expect(mockResponse.setHeader).toHaveBeenCalledWith(
      'X-Rate-Limit-Bypass-Reason',
      'Redis unavailable'
    );
  });
});
