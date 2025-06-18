import KafkaService from './kafka.service';
import { processBulkUpdate } from '../bulkUpdate.service';
import serverConfig from '../../configs/server.config';

const { topic } = serverConfig.kafka;

export const startBulkUpdateConsumer = async () => {
    try {
        await KafkaService.getKafkaConsumer(topic, 'bulk-processing-group', async (message) => {
            try {
                const parsedMessage = JSON.parse(message);
                await processBulkUpdate(parsedMessage);

            } catch (error) {
                console.error('Error processing bulk update:', error);
                // send to a Dead Letter Queue (DLQ)
            }
        });
    } catch (error) {
        console.error('Error starting Kafka consumer:', error);
    }
};
