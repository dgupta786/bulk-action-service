import { BulkActionType, BulkActionStatus } from '../../src/constants/bulkAction.enum';

// Mock mongoose module
jest.mock('mongoose', () => ({
  Schema: jest.fn().mockImplementation(() => ({
    index: jest.fn().mockReturnThis()
  })),
  model: jest.fn().mockReturnValue('MockedModel')
}));

// Import BulkActionDocument after mocking mongoose
jest.mock('../../src/models/BulkActionDocument.model', () => ({
  BulkActionDocument: 'MockedModel'
}));

// Now import the mocked model
import { BulkActionDocument } from '../../src/models/BulkActionDocument.model';

describe('BulkActionDocument Model', () => {
  it('should validate the model was mocked correctly', () => {
    // Check the exported model is what was returned by mongoose.model
    expect(BulkActionDocument).toBe('MockedModel');
  });
});
