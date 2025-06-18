import * as multer from 'multer';
import * as path from 'path';
import * as fs from 'fs';

// Create uploads directory if it doesn't exist
const UPLOAD_DIRECTORY = path.join(__dirname, '../../uploads');
if (!fs.existsSync(UPLOAD_DIRECTORY)) {
    fs.mkdirSync(UPLOAD_DIRECTORY, { recursive: true });
}

// Configure storage options
const fileStorage = multer.diskStorage({
    destination: (_req, _file, callback) => {
        callback(null, UPLOAD_DIRECTORY);
    },
    filename: (_req, file, callback) => {
        const timestamp = new Date().getTime();
        callback(null, `${timestamp}-${file.originalname}`);
    }
});

// Export configured middleware
export const uploadMiddleware = multer({
    storage: fileStorage,
    limits: {
        fileSize: 100 * 1024 * 1024 // 100MB file size limit
    },
    fileFilter: (_req, _file, callback) => {
        // Accept all files (could add CSV validation here)
        callback(null, true);
    }
});