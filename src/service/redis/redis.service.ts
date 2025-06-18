import { createClient } from 'redis';
import serverConfig from '../../configs/server.config';

/**
 * Redis service to manage Redis client connections
 */
class RedisService {
  private client: any = null;
  private initialized = false;
  private connecting = false;

  /**
   * Initializes and returns a Redis client
   */
  async getClient(): Promise<any> {
    if (this.client && this.initialized) {
      return this.client;
    }

    if (this.connecting) {
      // If already connecting, wait for it to complete
      while (this.connecting && !this.initialized) {
        await new Promise(resolve => setTimeout(resolve, 100));
      }
      return this.client!;
    }

    try {
      this.connecting = true;
      
      this.client = createClient({
        url: `redis://${serverConfig.redis.uri}`
      });

      // Set up event listeners
      this.client.on('error', (err) => {
        console.error('Redis client error:', err);
        this.initialized = false;
      });

      this.client.on('connect', () => {
        console.log('Connected to Redis');
      });

      this.client.on('reconnecting', () => {
        console.log('Reconnecting to Redis');
      });

      this.client.on('end', () => {
        console.log('Redis connection ended');
        this.initialized = false;
      });

      // Connect to Redis server
      await this.client.connect();
      this.initialized = true;
      
      return this.client;
    } catch (error) {
      console.error('Failed to connect to Redis:', error);
      throw error;
    } finally {
      this.connecting = false;
    }
  }

  /**
   * Closes the Redis connection
   */
  async close(): Promise<void> {
    if (this.client) {
      await this.client.quit();
      this.client = null;
      this.initialized = false;
    }
  }
}

// Create and export a singleton instance
const redisService = new RedisService();
export default redisService;
