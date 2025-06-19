import KafkaService from './kafka.service';
import { processBulkUpdate } from '../bulkUpdate.service';
import serverConfig from '../../configs/server.config';

const { topic, dlqTopic = `${topic}.DLQ` } = serverConfig.kafka;
const poisonQueueTopic = `${topic}.POISON`;
const MAX_RETRY_ATTEMPTS = 3;

const processDLQMessage = async (message: string, messageObj?: any): Promise<{ success: boolean, retryCount: number }> => {
    let currentRetryCount = 0;

    if (messageObj && messageObj.headers) {
        const retryCountHeader = messageObj.headers['retry-count'];
        if (retryCountHeader) {
            currentRetryCount = parseInt(Buffer.from(retryCountHeader).toString(), 10);
        }
    }

    const nextRetryCount = currentRetryCount + 1;

    try {
        if (nextRetryCount > MAX_RETRY_ATTEMPTS) {
            console.log(`Message exceeded maximum retry attempts (${MAX_RETRY_ATTEMPTS})`);
            return { success: false, retryCount: nextRetryCount };
        }

        // Try to process the message
        const parsedMessage = JSON.parse(message);
        await processBulkUpdate(parsedMessage);
        return { success: true, retryCount: 0 }; // Reset retry count on success
    } catch (error) {
        console.error('Error processing message from DLQ:', error);
        return { success: false, retryCount: nextRetryCount };
    }
};


export const startDLQConsumer = async () => {
    try {
        const poisonProducer = await KafkaService.getKafkaProducer(poisonQueueTopic);

        await KafkaService.getKafkaConsumer(dlqTopic, 'dlq-retry-group', async (message, messageObj) => {
            try {
                console.log('Processing message from DLQ');
                const { success, retryCount } = await processDLQMessage(message, messageObj);

                if (success) {
                    console.log('Successfully processed message from DLQ');
                } else {
                    if (retryCount > MAX_RETRY_ATTEMPTS) {
                        console.log(`Message failed ${retryCount} times, moving to poison queue`);
                        try {
                            await poisonProducer.sendMessage(message, null, {
                                headers: {
                                    'retry-count': Buffer.from(retryCount.toString()),
                                    'moved-at': Buffer.from(new Date().toISOString()),
                                    'reason': Buffer.from('Max retry attempts exceeded')
                                }
                            });
                            console.log('Message successfully moved to poison queue');
                        } catch (poisonError) {
                            console.error('Failed to move message to poison queue:', poisonError);
                            throw poisonError; // Re-throw to prevent auto-commit
                        }
                    } else {
                        console.log(`Message processing failed (attempt ${retryCount}/${MAX_RETRY_ATTEMPTS}), will retry later`);

                        try {
                            const dlqProducer = await KafkaService.getKafkaProducer(dlqTopic);
                            await dlqProducer.sendMessage(message, null, {
                                headers: {
                                    'retry-count': Buffer.from(retryCount.toString()),
                                    'last-retry': Buffer.from(new Date().toISOString())
                                }
                            });
                        } catch (requeueError) {
                            console.error('Error updating retry count:', requeueError);
                            throw requeueError; // Re-throw to prevent auto-commit
                        }

                        throw new Error('Keeping message in DLQ for future retries');
                    }
                }
            } catch (error) {
                console.error('Error in DLQ consumer:', error);
                throw error;
            }
        });

        console.log(`DLQ Consumer started successfully for topic: ${dlqTopic}`);
    } catch (error) {
        console.error('Error starting DLQ consumer:', error);
    }
};