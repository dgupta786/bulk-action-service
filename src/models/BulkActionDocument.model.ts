import mongoose, { Schema } from 'mongoose';
import { BulkActionStatus, BulkActionType } from '../constants/bulkAction.enum';

// Define the schema structure with type enforcement
const bulkActionSchema = new Schema({
  actionType: {
    type: String,
    enum: Object.values(BulkActionType),
    required: true,
    index: true
  },
  entityType: {
    type: String,
    required: true,
    index: true
  },
  status: {
    type: String,
    enum: Object.values(BulkActionStatus),
    default: BulkActionStatus.QUEUED,
    index: true
  },
  filePath: {
    type: String,
    required: true
  },
  totalCount: {
    type: Number,
    required: true
  },
  processedCount: {
    type: Number,
    default: 0
  },
  successCount: {
    type: Number,
    default: 0
  },
  failureCount: {
    type: Number,
    default: 0
  },
  skippedCount: {
    type: Number,
    default: 0
  },
  createdAt: {
    type: Date,
    default: Date.now,
    index: true
  }
});

// Create and export the model
export const BulkActionDocument = mongoose.model('bulk_operations', bulkActionSchema);