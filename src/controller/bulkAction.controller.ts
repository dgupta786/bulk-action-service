import { validationMsg } from '../constants/app.const';
import { BulkActionType } from '../constants/bulkAction.enum';
import {
    getAllBulkActions,
    getBulkAction,
    getBulkActionStatistics
} from '../service/db/bulkActionDB.service';
import { BulkActionRequest } from '../interfaces/bulk-action-request.interface';
import { handleBulkUpload } from '../service/bulkUpload.service';

/**
 * Process a new bulk action request
 */
export const createBulkAction = async (req, res) => {
    try {
        const { entityType, actionType } = req.body as BulkActionRequest;

        // Validate required fields
        if (!(entityType && actionType)) {
            return res.status(400).json({
                error: validationMsg.REQUIRED_FIELD_ERR
            });
        }

        console.log('Processing new bulk action submission');

        // Route to appropriate handler based on action type
        if (actionType === BulkActionType.BULK_UPDATE) {
            return await handleBulkUpload(req, res);
        } else {
            return res.status(400).json({
                error: validationMsg.INVALID_ACTION_TYPE
            });
        }
    } catch (err) {
        console.error(`Error creating bulk action: ${err}`);
        return res.status(500).json({
            error: validationMsg.SERVER_ERR
        });
    }
};

/**
 * Retrieve all bulk actions
 */
export const getBulkActions = async (req, res) => {
    try {
        const results = await getAllBulkActions();
        return res.json(results);
    } catch (err) {
        console.error(`Failed to fetch bulk actions: ${err}`);
        return res.status(500).json({
            error: validationMsg.SERVER_ERR
        });
    }
};

/**
 * Retrieve a specific bulk action by ID
 */
export const getBulkActionById = async (req, res) => {
    try {
        const actionId = req.params.actionId;
        const result = await getBulkAction(actionId);

        if (!result) {
            return res.status(404).json({
                error: 'Bulk action not found'
            });
        }

        return res.json(result);
    } catch (err) {
        console.error(`Failed to fetch bulk action details: ${err}`);
        return res.status(500).json({
            error: validationMsg.SERVER_ERR
        });
    }
};

/**
 * Retrieve statistics for a specific bulk action
 */
export const getBulkActionStats = async (req, res) => {
    try {
        const actionId = req.params.actionId;
        const statistics = await getBulkActionStatistics(actionId);

        if (!statistics) {
            return res.status(404).json({
                error: 'Bulk action not found'
            });
        }

        return res.json(statistics);
    } catch (err) {
        console.error(`Failed to fetch bulk action statistics: ${err}`);
        return res.status(500).json({
            error: validationMsg.SERVER_ERR
        });
    }
};