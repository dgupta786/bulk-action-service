import { Router } from "express";
import { createBulkAction, getBulkActionById, getBulkActions, getBulkActionStats } from "../controller/bulkAction.controller";
import { uploadMiddleware } from "../middleware/upload.middleware";
import { rateLimitMiddleware } from "../middleware/rateLimit.middleware";

const routes: Router = Router();

routes.get('/bulk-actions', getBulkActions);
routes.get('/bulk-actions/:actionId', getBulkActionById);
routes.get('/bulk-actions/:actionId/stats', getBulkActionStats);
routes.post('/bulk-actions', rateLimitMiddleware, uploadMiddleware.single('file'), createBulkAction);

export default routes;