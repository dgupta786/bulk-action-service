// Global Jest setup file

// Mock environment variables
process.env.PORT = '3000';
process.env.MONGO_DB_URI = 'mongodb://localhost:27017/test';
process.env.BATCH_SIZE = '100';
process.env.KAFKA_BROKER = 'localhost:9092';
process.env.KAFKA_TOPIC = 'test_topic';
process.env.REDIS_URI = 'redis://localhost:6379';
process.env.RATE_LIMIT_MAX = '60';
process.env.RATE_LIMIT_WINDOW_MS = '60000';

// Global mocks setup can go here
