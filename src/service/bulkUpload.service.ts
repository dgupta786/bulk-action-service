import serverConfig from "../configs/server.config";
import { validationMsg } from "../constants/app.const";
import { BulkActionStatus, BulkActionType } from "../constants/bulkAction.enum";
import { saveBulkAction, updateBulkActionStatus } from "../service/db/bulkActionDB.service";
import { UpdateRequest } from "../interfaces/bulk-action-request.interface";
import { processCsvInBatches } from "../utils/csvParser";
import { sendToKafka } from "./kafka/producer.service";

const { topic } = serverConfig.kafka;

export const handleBulkUpload = async (req, res) => {
    if (!req.file) {
        return res.status(400).json({ error: validationMsg.REQUIRED_CSV_ERR });
    }
    console.log('Received bulk update request');

    try {
        const actionRequest: UpdateRequest = req.body;
        const { entityType } = actionRequest;
        const filePath = req.file.path;

        const { _id: actionId } = await saveBulkActionToDb(entityType, filePath);
        console.log('Saved bulk upload request to database with id:', actionId);
        
        uploadChunksToKafka(filePath, entityType, actionId)
            .then((totalRecords: number) => updateBulkActionStatus(actionId, totalRecords))
            .catch(error => {
                console.error(`Error processing file for action ${actionId}:`, error);
            });
        
        return res.status(201).json({
            actionId,
            status: BulkActionStatus.QUEUED,
            message: validationMsg.SUCCESSFULLY_QUEUED_MSG
        });
    } catch (error) {
        console.error('Failed to process bulk upload request:', error);
        return res.status(500).json({ 
            error: validationMsg.SERVER_ERR 
        });
    }
};

const saveBulkActionToDb = async (entityType: string, filePath: string) => {
    const bulkActionData = {
        actionType: BulkActionType.BULK_UPDATE,
        entityType,
        filePath,
        totalCount: 0
    };
    return await saveBulkAction(bulkActionData);
}

const uploadChunksToKafka = async (filePath: string, entityType: string, actionId) => {
    return processCsvInBatches(filePath, async (records) => {
        try {
            await sendToKafka(topic, { 
                actionId, 
                rows: records, 
                entityType 
            });
            console.log(`Processed ${records.length} records for bulk action ${actionId}`);
        } catch (error) {
            console.error(`Failed to send records to Kafka for action ${actionId}:`, error);
            throw error; // Propagate error up for proper handling
        }
    });
}