// Mock for mongoose
const mockMongoose = {
  Schema: jest.fn().mockImplementation(() => ({
    index: jest.fn().mockReturnThis()
  })),
  model: jest.fn().mockReturnValue('MockedModel'),
  connect: jest.fn().mockResolvedValue(undefined),
  connection: {
    on: jest.fn(),
    once: jest.fn()
  }
};

export default mockMongoose;
