import { startBulkUpdateConsumer } from '../../src/service/kafka/consumer.service';
import KafkaService from '../../src/service/kafka/kafka.service';
import * as bulkUpdateService from '../../src/service/bulkUpdate.service';

// Use the global mock for KafkaService from jest.setup.ts
// But we need to ensure it's properly loaded and configured
jest.mock('../../src/service/kafka/kafka.service');

jest.mock('../../src/service/bulkUpdate.service', () => ({
  processBulkUpdate: jest.fn().mockResolvedValue(undefined)
}));

jest.mock('../../src/configs/server.config', () => ({
  __esModule: true,
  default: {
    kafka: {
      topic: 'test-topic'
    }
  }
}));

describe('Kafka Consumer Service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should initialize Kafka consumer with correct parameters', async () => {
    // Act
    await startBulkUpdateConsumer();

    // Assert - using the mockImplementation provided in jest.setup.ts
    expect(KafkaService.getKafkaConsumer).toHaveBeenCalledWith(
      'test-topic',
      'bulk-processing-group',
      expect.any(Function)
    );
  });

  it('should process valid messages received from Kafka', async () => {
    // Arrange
    await startBulkUpdateConsumer();
    // Use the global kafkaMessageCallback set in the mock
    const callback = (global as any).kafkaMessageCallback;
    
    const mockMessage = JSON.stringify({
      actionId: 'test-action-123',
      entityType: 'contact',
      rows: [{ id: '1', name: 'Test 1' }]
    });

    // Act
    await callback(mockMessage);

    // Assert
    expect(bulkUpdateService.processBulkUpdate).toHaveBeenCalledWith({
      actionId: 'test-action-123',
      entityType: 'contact',
      rows: [{ id: '1', name: 'Test 1' }]
    });
  });

  it('should handle JSON parsing errors', async () => {
    // Arrange
    await startBulkUpdateConsumer();
    const callback = (global as any).kafkaMessageCallback;
    const invalidMessage = 'not-json';
    
    // Spy on console.error
    const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

    // Act
    await callback(invalidMessage);

    // Assert
    expect(bulkUpdateService.processBulkUpdate).not.toHaveBeenCalled();
    expect(consoleErrorSpy).toHaveBeenCalledWith(
      'Error processing bulk update:',
      expect.any(Error)
    );
    
    // Restore console.error
    consoleErrorSpy.mockRestore();
  });

  it('should handle processing errors', async () => {
    // Arrange
    await startBulkUpdateConsumer();
    const callback = (global as any).kafkaMessageCallback;
    
    const mockMessage = JSON.stringify({
      actionId: 'test-action-123',
      entityType: 'contact',
      rows: [{ id: '1', name: 'Test 1' }]
    });
    
    const processingError = new Error('Processing failed');
    (bulkUpdateService.processBulkUpdate as jest.Mock).mockRejectedValueOnce(processingError);
    
    // Spy on console.error
    const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

    // Act
    await callback(mockMessage);

    // Assert
    expect(bulkUpdateService.processBulkUpdate).toHaveBeenCalled();
    expect(consoleErrorSpy).toHaveBeenCalledWith(
      'Error processing bulk update:',
      processingError
    );
    
    // Restore console.error
    consoleErrorSpy.mockRestore();
  });

  it('should handle Kafka consumer initialization errors', async () => {
    // Arrange
    const error = new Error('Kafka connection failed');
    // Use the mock as it's available from our modified jest.setup.ts
    (KafkaService.getKafkaConsumer as jest.Mock).mockRejectedValueOnce(error);
    
    // Spy on console.error
    const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

    // Act
    await startBulkUpdateConsumer();

    // Assert
    expect(consoleErrorSpy).toHaveBeenCalledWith(
      'Error starting Kafka consumer:',
      error
    );
    
    // Restore console.error
    consoleErrorSpy.mockRestore();
  });
});
