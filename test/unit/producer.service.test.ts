import { sendToKafka } from '../../src/service/kafka/producer.service';
import KafkaService from '../../src/service/kafka/kafka.service';

// We'll use the global mock from jest.setup.ts instead of creating a new one
jest.mock('../../src/service/kafka/kafka.service');

describe('Kafka Producer Service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should send a message to Kafka topic', async () => {
    // Arrange
    const topic = 'test-topic';
    const message = { id: '123', data: 'test data' };
    const key = 'test-key';
    const mockSendMessage = jest.fn().mockResolvedValue(undefined);
    
    (KafkaService.getKafkaProducer as jest.Mock).mockResolvedValueOnce({
      sendMessage: mockSendMessage
    });

    // Act
    await sendToKafka(topic, message, key);

    // Assert
    expect(KafkaService.getKafkaProducer).toHaveBeenCalledWith(topic);
    expect(mockSendMessage).toHaveBeenCalledWith(message, key);
  });

  it('should handle errors when sending a message', async () => {
    // Arrange
    const topic = 'test-topic';
    const message = { id: '123', data: 'test data' };
    const mockError = new Error('Failed to send message');
    
    // Mock the getKafkaProducer to throw an error
    (KafkaService.getKafkaProducer as jest.Mock).mockRejectedValueOnce(mockError);

    // Spy on console.error
    const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

    // Act
    await sendToKafka(topic, message);

    // Assert
    expect(KafkaService.getKafkaProducer).toHaveBeenCalledWith(topic);
    expect(consoleErrorSpy).toHaveBeenCalledWith('Error sending message to Kafka:', mockError);
    
    // Restore console.error
    consoleErrorSpy.mockRestore();
  });

  it('should handle errors from the sendMessage function', async () => {
    // Arrange
    const topic = 'test-topic';
    const message = { id: '123', data: 'test data' };
    const mockSendMessage = jest.fn().mockRejectedValue(new Error('Send failed'));
    
    (KafkaService.getKafkaProducer as jest.Mock).mockResolvedValueOnce({
      sendMessage: mockSendMessage
    });

    // Spy on console.error
    const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

    // Act
    await sendToKafka(topic, message);

    // Assert
    expect(KafkaService.getKafkaProducer).toHaveBeenCalledWith(topic);
    expect(mockSendMessage).toHaveBeenCalledWith(message, undefined);
    expect(consoleErrorSpy).toHaveBeenCalled();
    
    // Restore console.error
    consoleErrorSpy.mockRestore();
  });
});
