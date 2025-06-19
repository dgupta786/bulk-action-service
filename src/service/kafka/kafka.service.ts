import { Kafka, Producer, Consumer } from 'kafkajs';
import serverConfig from '../../configs/server.config';
const { kafka } = serverConfig;

class KafkaService {
    private kafka: Kafka;
    private producer: Producer | null = null;
    private consumer: Consumer | null = null;
    private isProducerConnected: boolean = false;

    constructor() {
        this.kafka = new Kafka({
            clientId: 'bulk-processing-service',
            brokers: [kafka.broker],
            connectionTimeout: 60000,
            retry: {
                initialRetryTime: 100,
                retries: 10
            }
        });
    }

    public async getKafkaProducer(topic: string): Promise<{ sendMessage: (value: any, key?: any, options?: any) => Promise<void> }> {
        if (!this.producer) {
            this.producer = this.kafka.producer();
        }
    
        if (!this.isProducerConnected) {
            try {
                await this.producer.connect();
                this.isProducerConnected = true;
                console.log(`Connected to Kafka Producer for topic: ${topic}`);
            } catch (error) {
                console.error('Failed to connect Kafka producer:', error);
                this.isProducerConnected = false;
                throw error; 
            }
        }
    
        const sendMessage = async (value: any, key: string | null = null, options: any = {}) => {
            try {
                if (!this.isProducerConnected) {
                    console.error('Kafka producer is disconnected. Reconnecting...');
                    await this.producer.connect();
                    this.isProducerConnected = true;
                }
                
                // Extract headers if provided in options
                const headers = options.headers || {};
    
                await this.producer.send({
                    topic,
                    messages: [{ 
                        value: typeof value === 'string' ? value : JSON.stringify(value), 
                        ...(key && { key }),
                        headers
                    }]
                });
            } catch (error) {
                console.error('Error sending message to Kafka:', error);
                this.isProducerConnected = false;
            }
        };
    
        return { sendMessage };
    }

    public async getKafkaConsumer(topic: string, groupId: string, callback: (message: string, messageObj?: any) => void) {
        if (!this.consumer) {
            this.consumer = this.kafka.consumer({ groupId });
            await this.consumer.connect();
            await this.consumer.subscribe({ topic, fromBeginning: false });
            console.log(`Connected to Kafka Consumer for topic: ${topic}, group: ${groupId}`);

            await this.consumer.run({
                eachMessage: async ({ message }) => {
                    const messageStr = message.value?.toString() || '';
                    // Pass both the message string and the full message object (for headers)
                    callback(messageStr, message);
                }
            });
        }
    }
}

export default new KafkaService();
