import serverConfig from "./configs/server.config";
import app from './app';
import * as http from 'http';
import MongoDBConnectionService from "./service/db/database.service";
import { startBulkUpdateConsumer } from "./service/kafka/consumer.service";
import { startDLQConsumer } from "./service/kafka/dlqConsumer.service";

const { port } = serverConfig;

// Create HTTP server instance
const server = http.createServer(app);

// Start server and initialize services
server.listen(port, async () => {
    console.log(`📊 Bulk Action Service running on port ${port}`);

    try {
        // Initialize database connection
        await MongoDBConnectionService.connect();
        console.log('✅ Database connection established');

        // Start message processing consumer
        startBulkUpdateConsumer();
        console.log('✅ Kafka consumer initialized');
        
        // Start DLQ retry consumer
        startDLQConsumer();
        console.log('✅ DLQ consumer initialized');
    } catch (error) {
        console.error('❌ Service initialization failed:', error);
        process.exit(1);
    }
});

// Handle graceful shutdown
process.on('SIGTERM', () => {
    console.log('🛑 SIGTERM received. Shutting down gracefully...');
    server.close(() => {
        console.log('🛑 HTTP server closed.');
        process.exit(0);
    });
});