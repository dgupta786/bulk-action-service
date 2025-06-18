import * as express from 'express';
import * as cors from 'cors';
import routes from './routes';

const app: express.Application = express();

// Configure middleware
app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true }));

// Register API routes
app.use('/', routes);

// Health check endpoint
app.get('/health', (_req, res) => {
  res.status(200).json({ status: 'UP' });
});

export default app;