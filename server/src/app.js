const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const compression = require('compression');
const cookieParser = require('cookie-parser');

const corsOptions = require('./config/cors');
const requestLogger = require('./middleware/requestLogger.middleware');
const { generalLimiter } = require('./middleware/rateLimiter.middleware');
const errorHandler = require('./middleware/errorHandler.middleware');
const AppError = require('./utils/AppError');
const apiRoutes = require('./routes/index');

const app = express();

// --------------- Global Middleware ---------------

// Security headers
app.use(helmet());

// CORS
app.use(cors(corsOptions));

// Gzip compression
app.use(compression());

// Cookie parser
app.use(cookieParser());

// Body parsers
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// HTTP request logging
app.use(requestLogger);

// General rate limiter
app.use(generalLimiter);

// --------------- Routes ---------------

// Health check
app.get('/api/health', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Server is running',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development',
  });
});

// API v1 routes
app.use('/api/v1', apiRoutes);

// --------------- Error Handling ---------------

// 404 handler for unmatched routes
app.all('*', (req, res, next) => {
  next(AppError.notFound(`Cannot find ${req.method} ${req.originalUrl}`));
});

// Global error handler (must be last)
app.use(errorHandler);

module.exports = app;
