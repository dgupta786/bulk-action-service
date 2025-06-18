import mongoose from 'mongoose';
import { collectionMapping } from '../models/entityCollections.const';
import { UpdateMessage } from '../interfaces/update-message.interface';
import { updateBulkActionProgress } from './db/bulkActionDB.service';

/**
 * Process a batch of entities for bulk update operation
 * @param message The update message containing entities to update
 */
export const processBulkUpdate = async (message: UpdateMessage): Promise<void> => {
    const { actionId, rows, entityType } = message;
    console.log(`Starting update operation for ${rows.length} entries in action ${actionId}`);

    try {
        // Execute the database operations
        const operationResults = await updateEntitiesBatch(entityType, rows);
        
        // Calculate success count from operation results
        const successCount = operationResults.upsertedCount + operationResults.modifiedCount;
        
        // Update tracking information
        await updateBulkActionProgress(actionId, rows.length, successCount);
        
        console.log(`Successfully ${rows.length} records for bulk action ${actionId}`);
    } catch (error) {
        console.error(`Failed to process batch for action ${actionId}:`, error);
        throw error; // Rethrow for consumer error handling
    }
};

/**
 * Performs database operations to update a batch of entities
 * @param entityType The type of entity being updated
 * @param rows Array of entity records to update
 * @returns Results of the bulk write operation
 */
const updateEntitiesBatch = async (entityType: string, rows: Record<string, any>[]) => {
    // Get target collection name
    const collectionName = collectionMapping[entityType];
    if (!collectionName) {
        throw new Error(`Unsupported entity type: ${entityType}`);
    }

    // Access database and collection
    const database = mongoose.connection.db;
    const targetCollection = database.collection(collectionName);

    // Prepare bulk operations
    const operations = rows.map(record => ({
        updateOne: {
            filter: { id: record.id },
            update: { $set: record },
            upsert: true
        }
    }));

    // Execute bulk write operation
    return await targetCollection.bulkWrite(operations);
};