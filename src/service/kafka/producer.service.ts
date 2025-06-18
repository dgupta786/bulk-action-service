import KafkaService from './kafka.service';

export const sendToKafka = async (topic: string, message: any, key?: string) => {
    try {
        const { sendMessage } = await KafkaService.getKafkaProducer(topic);
        await sendMessage(message, key);
    } catch (error) {
        console.error('Error sending message to Kafka:', error);
    }
};
