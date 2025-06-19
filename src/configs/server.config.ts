import { config } from 'dotenv';
import { toNumber } from 'lodash';

// Initialize environment variables
config();

// Define config interface for better type safety
interface ServerConfig {
  port: number;
  mongoUri: string | undefined;
  csvBatchSize: number;
  kafka: {
    broker: string | undefined;
    topic: string | undefined;
    dlqTopic?: string | undefined;
    retryCOunt?: number;
  };
  redis: {
    uri: string | undefined;
  };
  rateLimit: {
    max: number;
    windowMs: number;
  };
}

// Create and export the config object directly
const serverConfig: ServerConfig = {
  port: toNumber(process.env.PORT) || 3000,
  mongoUri: process.env.MONGO_DB_URI,
  csvBatchSize: toNumber(process.env.BATCH_SIZE) || 100,
  kafka: {
    broker: process.env.KAFKA_BROKER,
    topic: process.env.KAFKA_TOPIC,
    dlqTopic: `${process.env.KAFKA_TOPIC}.DLQ`,
    retryCOunt: toNumber(process.env.KAFKA_RETRY_COUNT) || 3
  },
  redis: {
    uri: process.env.REDIS_URI
  },
  rateLimit: {
    max: toNumber(process.env.RATE_LIMIT_MAX) || 60,
    windowMs: toNumber(process.env.RATE_LIMIT_WINDOW_MS) || 60000
  }
};

export default serverConfig;