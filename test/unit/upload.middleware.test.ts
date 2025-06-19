import { uploadMiddleware } from '../../src/middleware/upload.middleware';

// Skip this test file's multer mock in favor of the global one
jest.mock('multer');

// Mock fs and path
jest.mock('fs', () => ({
  existsSync: jest.fn(),
  mkdirSync: jest.fn()
}));

jest.mock('path', () => ({
  join: jest.fn().mockReturnValue('/mock/upload/path')
}));

describe('Upload Middleware', () => {
  // We need to import these modules inside the test to access the mocks
  let fs, path, multer;
  
  beforeAll(() => {
    // Import all needed mocked modules
    fs = require('fs');
    path = require('path');
    multer = require('multer');
  });
  
  beforeEach(() => {
    jest.clearAllMocks();
  });
  
  describe('upload directory setup', () => {
    it('should create upload directory if it does not exist', () => {
      // Arrange
      fs.existsSync.mockReturnValueOnce(false);
      
      // Act - Re-require the module to trigger the directory check logic
      jest.isolateModules(() => {
        require('../../src/middleware/upload.middleware');
      });
      
      // Assert
      expect(fs.existsSync).toHaveBeenCalled(); 
      expect(fs.mkdirSync).toHaveBeenCalledWith('/mock/upload/path', { recursive: true });
    });
    
    it('should not create upload directory if it already exists', () => {
      // Arrange
      fs.existsSync.mockReturnValueOnce(true);
      
      // Act
      jest.isolateModules(() => {
        require('../../src/middleware/upload.middleware');
      });
      
      // Assert
      expect(fs.existsSync).toHaveBeenCalled();
      expect(fs.mkdirSync).not.toHaveBeenCalled();
    });
  });
});
