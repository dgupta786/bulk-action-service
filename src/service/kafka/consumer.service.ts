import KafkaService from './kafka.service';
import { processBulkUpdate } from '../bulkUpdate.service';
import serverConfig from '../../configs/server.config';

const { topic, dlqTopic = `${topic}.DLQ` } = serverConfig.kafka;

export const startBulkUpdateConsumer = async () => {
    try {
        // Initialize the Kafka producer for sending to DLQ
        const { sendMessage } = await KafkaService.getKafkaProducer(dlqTopic);
        
        await KafkaService.getKafkaConsumer(topic, 'bulk-processing-group', async (message) => {
            try {
                const parsedMessage = JSON.parse(message);
                await processBulkUpdate(parsedMessage);

            } catch (error) {
                console.error('Error processing bulk update:', error);
                // Send to Dead Letter Queue (DLQ) with initial retry count of 0
                try {
                    await sendMessage(message, null, {
                        headers: {
                            'retry-count': Buffer.from('0'),
                            'first-failure': Buffer.from(new Date().toISOString()),
                            'error-message': Buffer.from(error.message || 'Unknown error')
                        }
                    });
                    console.log('Message sent to DLQ for later processing');
                } catch (dlqError) {
                    console.error('Failed to send message to DLQ:', dlqError);
                }
            }
        });
    } catch (error) {
        console.error('Error starting Kafka consumer:', error);
    }
};
