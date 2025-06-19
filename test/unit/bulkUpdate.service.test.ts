// Create mocks first, before importing any modules
const mockBulkWrite = jest.fn().mockResolvedValue({
  upsertedCount: 2,
  modifiedCount: 3,
  insertedCount: 0,
  matchedCount: 5
});

const mockCollection = {
  bulkWrite: mockBulkWrite
};

const mockDb = {
  collection: jest.fn().mockReturnValue(mockCollection)
};

// Mock mongoose
jest.mock('mongoose', () => ({
  __esModule: true,  // This is important
  default: {
    connection: {
      db: mockDb,
      on: jest.fn(),
      once: jest.fn()
    }
  }
}));

// Mock database service
jest.mock('../../src/service/db/bulkActionDB.service', () => ({
  updateBulkActionProgress: jest.fn().mockResolvedValue(undefined)
}));

// Mock collection mapping
jest.mock('../../src/models/entityCollections.const', () => ({
  collectionMapping: {
    contact: 'contacts',
    lead: 'leads'
  }
}));

// Now import after all mocks are set up
import { processBulkUpdate } from '../../src/service/bulkUpdate.service';
import { updateBulkActionProgress } from '../../src/service/db/bulkActionDB.service';
import mongoose from 'mongoose';
import { UpdateMessage } from '../../src/interfaces/update-message.interface';

describe('Bulk Update Service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Reset the bulk write mock
    mockBulkWrite.mockClear();
    mockBulkWrite.mockResolvedValue({
      upsertedCount: 2,
      modifiedCount: 3,
      insertedCount: 0,
      matchedCount: 5
    });
    mockDb.collection.mockReturnValue(mockCollection);
  });

  describe('processBulkUpdate', () => {
    it('should process update message and update progress', async () => {
      // Arrange
      const updateMessage: UpdateMessage = {
        actionId: 'test-action-123',
        entityType: 'contact',
        rows: [
          { id: '1', name: 'Test 1', email: 'test1@example.com', status: 'active' },
          { id: '2', name: 'Test 2', email: 'test2@example.com', status: 'active' }
        ]
      };

      // Act
      await processBulkUpdate(updateMessage);

      // Assert
      expect(updateBulkActionProgress).toHaveBeenCalledWith(
        'test-action-123',
        2,  // Number of rows
        5   // Success count (upsertedCount + modifiedCount)
      );
    });

    it('should throw error if bulk write operation fails', async () => {
      // Arrange
      const updateMessage: UpdateMessage = {
        actionId: 'test-action-123',
        entityType: 'contact',
        rows: [
          { id: '1', name: 'Test 1', email: 'test1@example.com', status: 'active' }
        ]
      };

      // Mock the mongoose bulkWrite to throw an error
      const mockError = new Error('Bulk write failed');
      mockBulkWrite.mockRejectedValueOnce(mockError);

      // Act & Assert
      await expect(processBulkUpdate(updateMessage)).rejects.toThrow();
      expect(updateBulkActionProgress).not.toHaveBeenCalled();
    });

    it('should throw error for unsupported entity type', async () => {
      // Arrange
      const updateMessage = {
        actionId: 'test-action-123',
        entityType: 'unsupported', // This type is not in the mocked mapping
        rows: [
          { id: '1', name: 'Test 1', email: 'test1@example.com', status: 'active' }
        ]
      } as UpdateMessage;

      // Act & Assert
      await expect(processBulkUpdate(updateMessage)).rejects.toThrow(/Unsupported entity type/);
      expect(updateBulkActionProgress).not.toHaveBeenCalled();
    });
  });
});
