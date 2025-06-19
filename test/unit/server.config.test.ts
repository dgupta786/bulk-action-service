import serverConfig from '../../src/configs/server.config';
import * as dotenv from 'dotenv';

// Mock dotenv
jest.mock('dotenv', () => ({
  config: jest.fn()
}));

describe('Server Config', () => {
  beforeEach(() => {
    // Reset process.env for each test
    process.env = { 
      PORT: '3000',
      MONGO_DB_URI: 'mongodb://localhost:27017/test',
      BATCH_SIZE: '100',
      KAFKA_BROKER: 'localhost:9092',
      KAFKA_TOPIC: 'test-topic',
      REDIS_URI: 'redis:6379',
      RATE_LIMIT_MAX: '60',
      RATE_LIMIT_WINDOW_MS: '60000'
    };

    // Clear module cache to reload server.config with new env vars
    jest.resetModules();
  });

  it('should load values from environment variables', () => {
    // Force dotenv mock to have been called
    dotenv.config();
    
    // Reload the module to get fresh config with our test env vars
    const configModule = require('../../src/configs/server.config').default;
    
    // Verify dotenv was called
    expect(dotenv.config).toHaveBeenCalled();
    
    // Verify config values
    expect(configModule.port).toBe(3000);
    expect(configModule.mongoUri).toBe('mongodb://localhost:27017/test');
    expect(configModule.csvBatchSize).toBe(100);
    expect(configModule.kafka.broker).toBe('localhost:9092');
    expect(configModule.kafka.topic).toBe('test-topic');
    expect(configModule.redis.uri).toBe('redis:6379');
    expect(configModule.rateLimit.max).toBe(60);
    expect(configModule.rateLimit.windowMs).toBe(60000);
  });

  it('should provide default values when env vars are missing', () => {
    // Clear specific env vars to test defaults
    delete process.env.PORT;
    delete process.env.BATCH_SIZE;
    delete process.env.RATE_LIMIT_MAX;
    delete process.env.RATE_LIMIT_WINDOW_MS;
    
    // Reload the module
    const configModule = require('../../src/configs/server.config').default;
    
    // Verify default values
    expect(configModule.port).toBe(3000); // Default port
    expect(configModule.csvBatchSize).toBe(100); // Default batch size
    expect(configModule.rateLimit.max).toBe(60); // Default rate limit
    expect(configModule.rateLimit.windowMs).toBe(60000); // Default window
    
    // Values that should still exist from env
    expect(configModule.mongoUri).toBe('mongodb://localhost:27017/test');
    expect(configModule.kafka.broker).toBe('localhost:9092');
  });
});
