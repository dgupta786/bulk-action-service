// This file runs before all tests to set up mocks and global test variables
import mongoose from 'mongoose';

// Create a global beforeAll hook to set up test environment
beforeAll(() => {
  // Silence console logs during tests
  jest.spyOn(console, 'log').mockImplementation(() => {});
  
  // Set default timeout for tests to be 10000ms
  jest.setTimeout(10000);
});

// Create a global afterAll hook to clean up after tests
afterAll(() => {
  // Restore all mocks after tests
  jest.restoreAllMocks();
});

// Set up global mock objects for individual test files to use
global.mockBulkActionDocument = {
  save: jest.fn().mockResolvedValue({ 
    _id: 'mock-id',
    toObject: jest.fn().mockReturnValue({
      _id: 'mock-id',
      actionType: 'UPDATE',
      entityType: 'contact',
      status: 'PENDING',
      createdAt: new Date(),
      updatedAt: new Date()
    })
  })
};

global.BulkActionDocumentMock = jest.fn().mockImplementation(() => global.mockBulkActionDocument);

// Mock mongoose to prevent actual database connections in tests
jest.mock('mongoose', () => {
  // Create a mock document class
  const mockDocument = {
    save: jest.fn().mockResolvedValue({ _id: 'mock-id' })
  };
  
  // Create a mock model class
  const mockModelClass = {
    find: jest.fn().mockReturnValue({
      sort: jest.fn().mockResolvedValue([])
    }),
    findOne: jest.fn().mockResolvedValue(null),
    findById: jest.fn().mockResolvedValue(null),
    updateOne: jest.fn().mockResolvedValue({ modifiedCount: 1 }),
    deleteOne: jest.fn().mockResolvedValue({ deletedCount: 1 }),
    create: jest.fn().mockResolvedValue(mockDocument)
  };
  
  return {
    connect: jest.fn().mockResolvedValue(undefined),
    connection: {
      on: jest.fn(),
      once: jest.fn(),
      db: {
        collection: jest.fn().mockReturnValue({
          find: jest.fn().mockReturnValue({
            toArray: jest.fn().mockResolvedValue([])
          }),
          findOne: jest.fn().mockResolvedValue(null),
          insertOne: jest.fn().mockResolvedValue({ insertedId: 'mock-id' }),
          updateOne: jest.fn().mockResolvedValue({ modifiedCount: 1 }),
          deleteOne: jest.fn().mockResolvedValue({ deletedCount: 1 }),
          bulkWrite: jest.fn().mockResolvedValue({
            insertedCount: 0,
            matchedCount: 0,
            modifiedCount: 0,
            deletedCount: 0,
            upsertedCount: 0
          })
        })
      }
    },
    Schema: jest.fn().mockReturnValue({}),
    model: jest.fn().mockReturnValue(mockModelClass)
  };
});

// Mock redis
jest.mock('redis', () => {
  const mockClient = {
    connect: jest.fn().mockResolvedValue(undefined),
    disconnect: jest.fn().mockResolvedValue(undefined),
    quit: jest.fn().mockResolvedValue(undefined),
    on: jest.fn().mockImplementation((event, callback) => {
      if (event === 'error' && global.triggerRedisError) {
        callback(new Error('Redis error'));
      }
      return mockClient;
    }),
    get: jest.fn().mockResolvedValue(null),
    set: jest.fn().mockResolvedValue('OK'),
    incr: jest.fn().mockResolvedValue(1),
    expire: jest.fn().mockResolvedValue(1),
    pTTL: jest.fn().mockResolvedValue(60000)
  };
  
  return {
    createClient: jest.fn().mockReturnValue(mockClient)
  };
});

// Mock Redis service
jest.mock('../src/service/redis/redis.service', () => {
  const mockRedisClient = {
    get: jest.fn().mockResolvedValue(null),
    set: jest.fn().mockResolvedValue('OK'),
    incr: jest.fn().mockResolvedValue(1),
    expire: jest.fn().mockResolvedValue(1),
    pTTL: jest.fn().mockResolvedValue(60000)
  };

  return {
    __esModule: true,
    default: {
      getClient: jest.fn().mockResolvedValue(mockRedisClient),
      initialized: true,
      close: jest.fn().mockResolvedValue(undefined)
    }
  };
});

// Mock Kafka
jest.mock('kafkajs', () => {
  const mockProducer = {
    connect: jest.fn().mockResolvedValue(undefined),
    disconnect: jest.fn().mockResolvedValue(undefined),
    send: jest.fn().mockResolvedValue({})
  };
  
  const mockConsumer = {
    connect: jest.fn().mockResolvedValue(undefined),
    disconnect: jest.fn().mockResolvedValue(undefined),
    subscribe: jest.fn().mockResolvedValue(undefined),
    run: jest.fn().mockImplementation(async (options) => {
      if (options && options.eachMessage && typeof options.eachMessage === 'function') {
        // Store the callback for tests to access
        (global as any).kafkaEachMessageCallback = options.eachMessage;
      }
      return undefined;
    })
  };
  
  const mockKafka = {
    producer: jest.fn().mockReturnValue(mockProducer),
    consumer: jest.fn().mockReturnValue(mockConsumer)
  };
  
  return {
    Kafka: jest.fn().mockImplementation(() => mockKafka),
    Producer: jest.fn(),
    Consumer: jest.fn()
  };
});

// Mock Kafka service
jest.mock('../src/service/kafka/kafka.service', () => {
  // Create mock consumer and producer
  const mockProducer = {
    connect: jest.fn().mockResolvedValue(undefined),
    disconnect: jest.fn().mockResolvedValue(undefined),
    send: jest.fn().mockResolvedValue({}),
    sendMessage: jest.fn().mockResolvedValue({})
  };
  
  const mockConsumer = {
    connect: jest.fn().mockResolvedValue(undefined),
    disconnect: jest.fn().mockResolvedValue(undefined),
    subscribe: jest.fn().mockResolvedValue(undefined),
    run: jest.fn().mockImplementation(async (options) => {
      if (options && options.eachMessage) {
        (global as any).eachMessageCallback = options.eachMessage;
      }
      return undefined;
    })
  };
  
  // Create a mock Kafka class that will be the default export
  const mockKafkaService = {
    kafka: {
      producer: jest.fn().mockReturnValue(mockProducer),
      consumer: jest.fn().mockReturnValue(mockConsumer)
    },
    producer: null,
    consumer: null,
    isProducerConnected: false,
    getKafkaProducer: jest.fn().mockImplementation(async (topic) => {
      return {
        sendMessage: jest.fn().mockResolvedValue(undefined)
      };
    }),
    getKafkaConsumer: jest.fn().mockImplementation(async (topic, groupId, callback) => {
      // Store the callback for tests to access
      (global as any).kafkaMessageCallback = callback;
      return mockConsumer;
    })
  };
  
  // Also expose the mock objects for tests to use
  (global as any).mockKafka = mockKafkaService.kafka;
  (global as any).mockProducer = mockProducer;
  (global as any).mockConsumer = mockConsumer;
  
  return Object.assign(mockKafkaService, {
    __esModule: true,
    default: mockKafkaService
  });
});

// Mock multer file uploads
jest.mock('multer', () => {
  // Create the mock function
  const multerInstance = {
    single: jest.fn().mockReturnValue((req, res, next) => next())
  };
  
  // Create the main multer function that returns the instance
  const multerMock = jest.fn().mockReturnValue(multerInstance);
  
  // Add diskStorage property to the function object
  Object.defineProperty(multerMock, 'diskStorage', {
    value: jest.fn().mockReturnValue({
      destination: jest.fn(),
      filename: jest.fn()
    })
  });
  
  return multerMock;
});

// Mock fs module
jest.mock('fs', () => ({
  createReadStream: jest.fn().mockImplementation(() => ({
    pipe: jest.fn().mockReturnThis()
  })),
  existsSync: jest.fn().mockReturnValue(true),
  mkdirSync: jest.fn()
}));

// Mock environment variables
process.env = {
  ...process.env,
  MONGO_DB_URI: 'mongodb://localhost:27017/test',
  PORT: '3000',
  BATCH_SIZE: '100',
  KAFKA_BROKER: 'localhost:9092',
  KAFKA_TOPIC: 'test-topic',
  REDIS_URI: 'localhost:6379',
  RATE_LIMIT_MAX: '60',
  RATE_LIMIT_WINDOW_MS: '60000'
};
