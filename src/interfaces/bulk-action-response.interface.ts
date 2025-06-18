interface BulkActionResponse {
    actionId: string;
    actionType: string;
    entityType: string;
    status: string;
    totalCount: number;
    processedCount: number;
    successCount: number;
    failureCount: number;
    skippedCount: number;
    createdAt: Date;
}

const mapToBulkActionResponse = (bulkAction: any): BulkActionResponse => ({
    actionId: bulkAction._id.toString(),
    actionType: bulkAction.actionType,
    entityType: bulkAction.entityType,
    status: bulkAction.status,
    totalCount: bulkAction.totalCount,
    processedCount: bulkAction.processedCount,
    successCount: bulkAction.successCount,
    failureCount: bulkAction.failureCount,
    skippedCount: bulkAction.skippedCount,
    createdAt: bulkAction.createdAt
});

export { BulkActionResponse, mapToBulkActionResponse };