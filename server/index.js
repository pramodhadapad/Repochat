require('dotenv').config();
const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const helmet = require('helmet');
const cookieParser = require('cookie-parser');
const compression = require('compression');
const rateLimit = require('express-rate-limit');
const logger = require('./config/logger');
const passport = require('passport');

// Config
const connectDB = require('./config/db');
const { connectRedis } = require('./config/redis');

// Initialize Express
const app = express();
const httpServer = http.createServer(app);
const io = new Server(httpServer, {
  cors: {
    origin: process.env.CLIENT_URL || 'http://localhost:3000',
    methods: ['GET', 'POST']
  }
});

// Rate Limiting: DISABLED

// Routes
const authRoutes = require('./routes/auth.routes');
const keyRoutes = require('./routes/key.routes');
const repoRoutes = require('./routes/repo.routes');
const chatRoutes = require('./routes/chat.routes');
const shareRoutes = require('./routes/share.routes');
const healthRoutes = require('./routes/health.routes');
const usageRoutes = require('./routes/usage.routes');
const CollaborationService = require('./services/CollaborationService');
const errorHandler = require('./middleware/errorHandler');

// Initialize Services
const collabService = new CollaborationService(io);

// Middleware
app.use(helmet());
app.use(compression());
app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (server-to-server, Postman, etc.)
    if (!origin) return callback(null, true);
    // Allow any localhost/127.0.0.1 origin (any port)
    if (/^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(origin)) {
      return callback(null, true);
    }
    console.warn(`[CORS] Blocked origin: ${origin}`);
    callback(new Error('Not allowed by CORS'));
  },
  credentials: true
}));
app.use(express.json());
app.use(cookieParser());
app.use(passport.initialize());

// Route Handlers
app.use('/api/auth', authRoutes);
app.use('/api/key', keyRoutes);
app.use('/api/repo', repoRoutes);
app.use('/api/chat', chatRoutes);
app.use('/api/share', shareRoutes);
app.use('/api/health', healthRoutes);
app.use('/api/usage', usageRoutes);

// Database & Cache Connection
connectDB();
connectRedis();

// Connections handled above

// Socket.io Setup
io.on('connection', (socket) => {
  collabService.handleConnection(socket);
});

// Error Handling
app.use(errorHandler);

// Start Server
const PORT = process.env.PORT || 5000;
httpServer.listen(PORT, () => {
  logger.info(`Server running on port ${PORT}`);
});

module.exports = { app, io, logger };
