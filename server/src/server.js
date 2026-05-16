const app = require('./app');
const env = require('./config/env');
const db = require('./config/database');
const testConnection = db.testConnection;
const logger = require('./utils/logger');

let server;

async function startServer() {
  // Test database connectivity
  const dbConnected = await testConnection();
  if (!dbConnected) {
    logger.warn(
      'Server starting without database connection. Some features will be unavailable.'
    );
  }

  server = app.listen(env.PORT, () => {
    logger.info(`Server running in ${env.NODE_ENV} mode on port ${env.PORT}`);
    logger.info(`Health check: http://localhost:${env.PORT}/api/health`);
  });

  // Handle unhandled promise rejections
  process.on('unhandledRejection', (reason) => {
    logger.error('UNHANDLED REJECTION! Shutting down...', reason);
    gracefulShutdown(1);
  });

  // Handle uncaught exceptions
  process.on('uncaughtException', (error) => {
    logger.error('UNCAUGHT EXCEPTION! Shutting down...', error);
    gracefulShutdown(1);
  });

  // Graceful shutdown signals
  process.on('SIGTERM', () => {
    logger.info('SIGTERM received. Shutting down gracefully...');
    gracefulShutdown(0);
  });

  process.on('SIGINT', () => {
    logger.info('SIGINT received. Shutting down gracefully...');
    gracefulShutdown(0);
  });
}

function gracefulShutdown(exitCode) {
  if (server) {
    server.close(() => {
      logger.info('HTTP server closed');
      process.exit(exitCode);
    });

    // Force shutdown after 10 seconds
    setTimeout(() => {
      logger.error('Forced shutdown after timeout');
      process.exit(1);
    }, 10000);
  } else {
    process.exit(exitCode);
  }
}

startServer();
