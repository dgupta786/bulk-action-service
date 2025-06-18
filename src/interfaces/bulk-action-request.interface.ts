interface BulkActionRequest {
    entityType: string;
    actionType: string;
}

interface UpdateRequest extends BulkActionRequest {
    file: any;
}

export { BulkActionRequest, UpdateRequest };