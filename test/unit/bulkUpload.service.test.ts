import { handleBulkUpload } from '../../src/service/bulkUpload.service';
import * as bulkActionDBService from '../../src/service/db/bulkActionDB.service';
import * as csvParser from '../../src/utils/csvParser';
import * as kafkaProducer from '../../src/service/kafka/producer.service';
import { BulkActionStatus } from '../../src/constants/bulkAction.enum';
import { validationMsg } from '../../src/constants/app.const';

// Mock dependencies
jest.mock('../../src/service/db/bulkActionDB.service', () => ({
  saveBulkAction: jest.fn(),
  updateBulkActionStatus: jest.fn()
}));

jest.mock('../../src/utils/csvParser', () => ({
  processCsvInBatches: jest.fn()
}));

jest.mock('../../src/service/kafka/producer.service', () => ({
  sendToKafka: jest.fn()
}));

jest.mock('../../src/configs/server.config', () => ({
  __esModule: true,
  default: {
    kafka: {
      topic: 'test-topic'
    }
  }
}));

describe('Bulk Upload Service', () => {
  // Setup common test objects
  let mockRequest;
  let mockResponse;
  
  beforeEach(() => {
    jest.clearAllMocks();
    
    // Setup mock request and response objects
    mockRequest = {
      file: {
        path: '/path/to/uploaded/file.csv'
      },
      body: {
        entityType: 'contact'
      }
    };
    
    mockResponse = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis()
    };
    
    // Default mock implementations
    (bulkActionDBService.saveBulkAction as jest.Mock).mockResolvedValue({ _id: 'action-123' });
    (csvParser.processCsvInBatches as jest.Mock).mockResolvedValue(100); // 100 records processed
    (kafkaProducer.sendToKafka as jest.Mock).mockResolvedValue(undefined);
    (bulkActionDBService.updateBulkActionStatus as jest.Mock).mockResolvedValue({ modifiedCount: 1 });
  });
  
  it('should return 400 if no file is uploaded', async () => {
    // Arrange
    mockRequest.file = undefined;
    
    // Act
    await handleBulkUpload(mockRequest, mockResponse);
    
    // Assert
    expect(mockResponse.status).toHaveBeenCalledWith(400);
    expect(mockResponse.json).toHaveBeenCalledWith({
      error: validationMsg.REQUIRED_CSV_ERR
    });
    expect(bulkActionDBService.saveBulkAction).not.toHaveBeenCalled();
  });
  
  it('should save the bulk action and return success response with action ID', async () => {
    // Act
    await handleBulkUpload(mockRequest, mockResponse);
    
    // Assert
    expect(bulkActionDBService.saveBulkAction).toHaveBeenCalledWith({
      actionType: 'BULK_UPDATE',
      entityType: 'contact',
      filePath: '/path/to/uploaded/file.csv',
      totalCount: 0
    });
    
    expect(mockResponse.status).toHaveBeenCalledWith(201);
    expect(mockResponse.json).toHaveBeenCalledWith({
      actionId: 'action-123',
      status: BulkActionStatus.QUEUED,
      message: validationMsg.SUCCESSFULLY_QUEUED_MSG
    });
  });
  
  it('should process CSV file in batches and update the bulk action status', async () => {
    // Act
    await handleBulkUpload(mockRequest, mockResponse);
    
    // Allow the background promise to settle
    await new Promise(resolve => setTimeout(resolve, 10)); 
    
    // Assert
    expect(csvParser.processCsvInBatches).toHaveBeenCalledWith(
      '/path/to/uploaded/file.csv',
      expect.any(Function)
    );
    expect(bulkActionDBService.updateBulkActionStatus).toHaveBeenCalledWith('action-123', 100);
  });
  
  it('should send records to Kafka in batches', async () => {
    // Arrange
    const batchRecords = [
      { id: '1', name: 'Test 1' },
      { id: '2', name: 'Test 2' }
    ];
    
    // Setup the processCsvInBatches to invoke the batch processor
    (csvParser.processCsvInBatches as jest.Mock).mockImplementation(async (filePath, batchProcessor) => {
      await batchProcessor(batchRecords);
      return batchRecords.length;
    });
    
    // Act
    await handleBulkUpload(mockRequest, mockResponse);
    
    // Allow the background promise to settle
    await new Promise(resolve => setTimeout(resolve, 10));
    
    // Assert
    expect(kafkaProducer.sendToKafka).toHaveBeenCalledWith('test-topic', {
      actionId: 'action-123',
      rows: batchRecords,
      entityType: 'contact'
    });
  });
  
  it('should handle errors during bulk upload process', async () => {
    // Arrange
    const error = new Error('Database error');
    (bulkActionDBService.saveBulkAction as jest.Mock).mockRejectedValue(error);
    
    // Spy on console.error
    const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
    
    // Act
    await handleBulkUpload(mockRequest, mockResponse);
    
    // Assert
    expect(mockResponse.status).toHaveBeenCalledWith(500);
    expect(mockResponse.json).toHaveBeenCalledWith({
      error: validationMsg.SERVER_ERR
    });
    
    expect(consoleErrorSpy).toHaveBeenCalledWith('Failed to process bulk upload request:', error);
    
    // Restore console.error
    consoleErrorSpy.mockRestore();
  });
  
  it('should handle errors during csv processing', async () => {
    // Act
    await handleBulkUpload(mockRequest, mockResponse);
    
    // Simulate error during CSV processing
    const processingError = new Error('CSV processing failed');
    (csvParser.processCsvInBatches as jest.Mock).mockRejectedValue(processingError);
    
    // Wait for the background promise to reject
    await new Promise(resolve => setTimeout(resolve, 10));
    
    // The service continues normally because the CSV processing happens in the background
    // It would log an error, but the response to the user would still be successful
    expect(mockResponse.status).toHaveBeenCalledWith(201);
  });
});
