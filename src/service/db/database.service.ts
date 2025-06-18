import mongoose from 'mongoose';
import serverConfig from '../../configs/server.config';

class MongoDBConnectionService {
  private static serviceInstance: MongoDBConnectionService;
  private dbConnection: mongoose.Connection | null = null;
  
  private constructor() {
    // Private constructor to enforce singleton pattern
  }
  
  public static getService(): MongoDBConnectionService {
    if (!MongoDBConnectionService.serviceInstance) {
      MongoDBConnectionService.serviceInstance = new MongoDBConnectionService();
    }
    return MongoDBConnectionService.serviceInstance;
  }
  
  public async connect(): Promise<void> {
    if (this.dbConnection) {
      console.log('Database connection already established');
      return;
    }
    
    if (!serverConfig.mongoUri) {
      throw new Error('MongoDB connection URI not provided');
    }
    
    try {
      await mongoose.connect(serverConfig.mongoUri, {
        useNewUrlParser: true,
        useUnifiedTopology: true,
        serverSelectionTimeoutMS: 5000 // 5 seconds timeout
      } as mongoose.ConnectOptions);
      
      this.dbConnection = mongoose.connection;
      
      // Set up connection event listeners
      this.dbConnection.on('error', (err) => {
        console.error('MongoDB connection error:', err);
      });
      
      this.dbConnection.on('disconnected', () => {
        console.warn('MongoDB disconnected');
      });
      
      console.log('MongoDB database connection established');
    } catch (error) {
      console.error('Failed to connect to MongoDB:', error);
      throw error; // Let the caller handle the error
    }
  }
  
  public getConnection(): mongoose.Connection | null {
    return this.dbConnection;
  }
}

export default MongoDBConnectionService.getService();
