// Mock services without using jest directly to avoid type errors
export const mockMongoDBService = {
  connect: async () => {},
  getCollection: () => ({
    findOne: async () => ({}),
    find: () => ({
      toArray: async () => [],
      count: async () => 0,
    }),
    insertOne: async () => ({ insertedId: 'mock-id' }),
    updateOne: async () => ({ modifiedCount: 1 }),
    deleteOne: async () => ({ deletedCount: 1 }),
  }),
  close: async () => {},
};

// Mock for Redis service
export const mockRedisService = {
  connect: async () => {},
  get: async () => null,
  set: async () => 'OK',
  incr: async () => 1,
  expire: async () => true,
  disconnect: async () => {},
};

// Mock for Kafka Producer
export const mockProducer = {
  connect: async () => {},
  send: async () => ({ 
    topicName: 'test-topic', 
    partition: 0, 
    errorCode: 0 
  }),
  disconnect: async () => {},
};

// Mock for Kafka Consumer
export const mockConsumer = {
  connect: async () => {},
  subscribe: async () => {},
  run: async (config: any) => {},
  disconnect: async () => {},
};

// Mock for Kafka Admin
export const mockAdmin = {
  connect: async () => {},
  createTopics: async () => {},
  disconnect: async () => {},
};

export const mockKafkaService = {
  producer: mockProducer,
  consumer: mockConsumer,
  admin: mockAdmin,
};

export const mockCSVData = [
  { id: '1', name: 'Test 1', email: 'test1@example.com' },
  { id: '2', name: 'Test 2', email: 'test2@example.com' },
  { id: '3', name: 'Test 3', email: 'test3@example.com' },
];

export const mockFile = {
  fieldname: 'file',
  originalname: 'test.csv',
  encoding: '7bit',
  mimetype: 'text/csv',
  buffer: Buffer.from('id,name,email\n1,Test 1,test1@example.com\n2,Test 2,test2@example.com\n3,Test 3,test3@example.com'),
  size: 82,
};
