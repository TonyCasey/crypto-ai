import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import compression from 'compression';
import cookieParser from 'cookie-parser';
import session from 'express-session';
import rateLimit from 'express-rate-limit';
import { createServer } from 'http';
import { Server as SocketServer } from 'socket.io';
import dotenv from 'dotenv';

import { errorHandler } from './middleware/error-handler';
import { notFoundHandler } from './middleware/not-found-handler';
import { authMiddleware } from './middleware/auth-middleware';

// Route imports
import authRoutes from './routes/auth';
import tradingRoutes from './routes/trading';
import exchangeRoutes from './routes/exchanges';
import strategyRoutes from './routes/strategies';
import portfolioRoutes from './routes/portfolio';
import marketDataRoutes from './routes/market-data';

// Services
import { TradingService } from './services/trading-service';
import { WebSocketService } from './websocket/websocket-service';

// Load environment variables
dotenv.config();

const app = express();
const server = createServer(app);
const io = new SocketServer(server, {
  cors: {
    origin: process.env.FRONTEND_URL || 'http://localhost:3000',
    credentials: true,
  },
});

// Constants
const PORT = process.env.PORT || 5000;
const NODE_ENV = process.env.NODE_ENV || 'development';

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 1000, // Limit each IP to 1000 requests per windowMs
  message: 'Too many requests from this IP, please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
});

// Middleware
app.use(helmet({
  contentSecurityPolicy: NODE_ENV === 'production' ? undefined : false,
}));

app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true,
}));

app.use(compression());
app.use(morgan(NODE_ENV === 'production' ? 'combined' : 'dev'));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(cookieParser());

// Session configuration
app.use(session({
  secret: process.env.SESSION_SECRET || 'crypto-bot-session-secret',
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: NODE_ENV === 'production',
    httpOnly: true,
    maxAge: 24 * 60 * 60 * 1000, // 24 hours
  },
}));

app.use(limiter);

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    environment: NODE_ENV,
    version: process.env.npm_package_version || '1.0.0',
  });
});

// API routes
app.use('/api/auth', authRoutes);
app.use('/api/trading', authMiddleware, tradingRoutes);
app.use('/api/exchanges', authMiddleware, exchangeRoutes);
app.use('/api/strategies', authMiddleware, strategyRoutes);
app.use('/api/portfolio', authMiddleware, portfolioRoutes);
app.use('/api/market-data', marketDataRoutes);

// Error handling
app.use(notFoundHandler);
app.use(errorHandler);

// Initialize services
const tradingService = new TradingService();
const webSocketService = new WebSocketService(io);

// WebSocket connection handling
io.on('connection', (socket) => {
  console.log(\`Client connected: \${socket.id}\`);
  webSocketService.handleConnection(socket);
});

// Graceful shutdown
process.on('SIGTERM', async () => {
  console.log('SIGTERM received, shutting down gracefully');
  
  // Stop trading service
  await tradingService.stop();
  
  // Close server
  server.close(() => {
    console.log('Server closed');
    process.exit(0);
  });
});

process.on('SIGINT', async () => {
  console.log('SIGINT received, shutting down gracefully');
  
  await tradingService.stop();
  
  server.close(() => {
    console.log('Server closed');
    process.exit(0);
  });
});

// Start server
server.listen(PORT, () => {
  console.log(\`🚀 Server running on port \${PORT}\`);
  console.log(\`📊 Environment: \${NODE_ENV}\`);
  console.log(\`🔗 Health check: http://localhost:\${PORT}/health\`);
  
  // Initialize trading service in development
  if (NODE_ENV === 'development') {
    tradingService.initialize().then(() => {
      console.log('🤖 Trading service initialized');
    }).catch(console.error);
  }
});

export default app;