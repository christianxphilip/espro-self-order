import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';
import helmet from 'helmet';
import compression from 'compression';
import http from 'http';
import connectDB from './config/db.js';
import { initializeSocket } from './services/socketService.js';

// Import routes
import authRoutes from './routes/auth.js';
import tableRoutes from './routes/tables.js';
import menuRoutes from './routes/menu.js';
import billingGroupRoutes from './routes/billingGroups.js';
import orderRoutes from './routes/orders.js';
import baristaRoutes from './routes/barista.js';
import billRoutes from './routes/bills.js';
import settingsRoutes from './routes/settings.js';

// ES6 module fix for __dirname
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config();

const app = express();
const server = http.createServer(app);

// Connect to MongoDB
let dbConnected = false;

// Configure allowed origins for CORS
const allowedOrigins = [
  process.env.FRONTEND_URL || 'http://localhost:5176',
  process.env.SELF_ORDER_URL || 'http://localhost:5176',
  process.env.BARISTA_URL || 'http://localhost:5177',
  'http://localhost:5176',
  'http://localhost:5177',
  'http://localhost:7001',
  ...(process.env.CORS_ORIGINS ? process.env.CORS_ORIGINS.split(',').map(origin => origin.trim()) : []),
].filter(Boolean);

const uniqueOrigins = [...new Set(allowedOrigins)];

console.log('[Server] CORS allowed origins:', uniqueOrigins);

// Ensure upload directories exist
const uploadDirs = [
  path.join(__dirname, '../uploads/qrcodes'),
];

uploadDirs.forEach(dir => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
});

// Security Middleware
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:", "http:"],
      connectSrc: ["'self'"],
      fontSrc: ["'self'"],
      objectSrc: ["'none'"],
      mediaSrc: ["'self'"],
      frameSrc: ["'none'"],
    },
  },
  crossOriginEmbedderPolicy: false,
  crossOriginResourcePolicy: false,
}));

// CORS configuration
app.use(cors({
  origin: function (origin, callback) {
    if (!origin) {
      return callback(null, true);
    }
    
    const normalizedOrigin = origin.replace(/\/$/, '');
    const isAllowed = uniqueOrigins.some(allowed => {
      const normalizedAllowed = allowed.replace(/\/$/, '');
      return normalizedOrigin === normalizedAllowed;
    });
    
    if (isAllowed) {
      callback(null, true);
    } else {
      console.warn(`[CORS] Blocked origin: ${normalizedOrigin}`);
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

// Response compression
app.use(compression());

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Serve uploaded files
const uploadsPath = path.join(__dirname, '../uploads');
console.log(`[Server] Serving static files from: ${uploadsPath}`);
console.log(`[Server] Uploads directory exists: ${fs.existsSync(uploadsPath)}`);

// Log upload requests for debugging (before static middleware)
app.use('/uploads', (req, res, next) => {
  console.log(`[Server] Static file request: ${req.path}`);
  next();
});

app.use('/uploads', express.static(uploadsPath, {
  setHeaders: (res) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS, HEAD');
  },
  dotfiles: 'ignore', // Ignore dotfiles
  index: false, // Don't serve directory listings
}));

// Health check route
app.get('/api/health', (req, res) => {
  res.json({
    success: true,
    message: 'Server is running',
    timestamp: new Date().toISOString(),
  });
});

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/tables', tableRoutes);
app.use('/api/menu', menuRoutes);
app.use('/api/billing-groups', billingGroupRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/barista', baristaRoutes);
app.use('/api/bills', billRoutes);
app.use('/api/settings', settingsRoutes);

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(err.status || 500).json({
    success: false,
    message: err.message || 'Internal Server Error',
  });
});

// 404 handler (only for API routes, not static files)
app.use((req, res) => {
  // Don't return JSON for non-API routes that might be static file requests
  if (req.path.startsWith('/uploads')) {
    return res.status(404).send('File not found');
  }
  res.status(404).json({
    success: false,
    message: 'Route not found',
  });
});

const PORT = process.env.PORT || 7001;

// Start server after MongoDB connection
async function startServer() {
  try {
    console.log('[Server] Connecting to MongoDB...');
    await connectDB();
    dbConnected = true;
    console.log('[Server] MongoDB connected successfully');

    // Initialize settings if they don't exist
    try {
      const Settings = (await import('./models/Settings.js')).default;
      await Settings.getSettings();
      console.log('[Server] Settings initialized');
    } catch (error) {
      console.warn('[Server] Warning: Could not initialize settings:', error.message);
    }

    // Initialize Socket.io if feature is enabled
    if (process.env.ENABLE_WEBSOCKET === 'true') {
      initializeSocket(server);
    } else {
      console.log('[Server] WebSocket feature is disabled (polling mode)');
    }
    
    // Start the Express server
    server.listen(PORT, () => {
      console.log(`[Server] Server running on port ${PORT}`);
      console.log(`[Server] Environment: ${process.env.NODE_ENV || 'development'}`);
      console.log(`[Server] WebSocket: ${process.env.ENABLE_WEBSOCKET === 'true' ? 'Enabled' : 'Disabled (Polling)'}`);
    });
  } catch (error) {
    console.error('[Server] Failed to start server:', error);
    process.exit(1);
  }
}

// Handle unhandled promise rejections
process.on('unhandledRejection', (err) => {
  console.error('[Server] Unhandled Promise Rejection:', err);
  if (process.env.NODE_ENV === 'production') {
    console.error('[Server] Continuing despite unhandled rejection');
  } else {
    process.exit(1);
  }
});

// Handle uncaught exceptions
process.on('uncaughtException', (err) => {
  console.error('[Server] Uncaught Exception:', err);
  process.exit(1);
});

// Start the server
startServer();
