const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const path = require('path');
const fs = require('fs');
const rateLimit = require('express-rate-limit');
require('dotenv').config();

const { generateSwagger } = require('./config/swagger-auto');
const { autoDocumentAPI } = require('./utils/swagger-decorators');
const RouteScanner = require('./utils/route-scanner');
const errorHandler = require('./middleware/errorHandler');
const swaggerHtmlContent = require('./utils/ApiDocGen');
const publicDir = path.join(__dirname, 'public');
const htmlFilePath = path.join(__dirname, 'public/api-docs.html');
if (!fs.existsSync(publicDir)) {
  fs.mkdirSync(publicDir);
}
const app = express();
const PORT = process.env.PORT || 3000;
app.use(express.static(publicDir));
// Security middleware
app.use(helmet());
app.use(
  cors({
    origin: process.env.ALLOWED_ORIGINS?.split(',') || '*',
    credentials: true
  })
);

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: {
    error: 'Too many requests from this IP, please try again later.'
  }
});
app.use(limiter);

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Logging and auto-documentation
if (process.env.NODE_ENV !== 'production') {
  app.use(morgan('dev'));
}
app.use(autoDocumentAPI);

// Auto-scan and register routes
//console.log('🔍 Scanning for routes...');
const routeScanner = new RouteScanner(app);
routeScanner.scanRoutes('./routes');
//console.log(`✅ Registered ${routeScanner.getRoutes().length} routes`);

if (process.env.NODE_ENV === 'development') {
  const swaggerJsPath = path.join(publicDir, 'swagger-init.js');
  fs.writeFileSync(swaggerJsPath, swaggerHtmlContent.swiggerJs, 'utf8');
  fs.writeFileSync(htmlFilePath, swaggerHtmlContent.swaggerHtmlContent, 'utf8');

  // Generate swagger documentation after routes are loaded (only once)
  let swaggerGenerated = false;
  if (!swaggerGenerated) {
    setTimeout(async () => {
      try {
        //console.log('🔄 Starting Swagger documentation generation...');
        await generateSwagger(app);
        swaggerGenerated = true;
        //console.log('✅ Swagger documentation generation completed!');
      } catch (error) {
        console.error('❌ Failed to generate swagger documentation:', error);
      }
    }, 500); // Increased timeout to ensure routes are fully loaded
  }
}
app.get('/api-docs', (req, res) => {
  res.setHeader(
    'Content-Security-Policy',
    "default-src 'self'; script-src 'self' https://cdnjs.cloudflare.com; style-src 'self' 'unsafe-inline' https://cdnjs.cloudflare.com; object-src 'none';"
  );
  res.sendFile(htmlFilePath);
});
app.get('/', (req, res) => {
  res.setHeader(
    'Content-Security-Policy',
    "default-src 'self'; script-src 'self' https://cdnjs.cloudflare.com; style-src 'self' 'unsafe-inline' https://cdnjs.cloudflare.com; object-src 'none';"
  );
  res.sendFile(htmlFilePath);
});

// Serve swagger JSON
app.get('/swagger.json', (req, res) => {
  try {
    const swaggerDoc = require('./swagger.json');
    res.json(swaggerDoc);
  } catch (error) {
    res.status(500).json({ error: 'Swagger documentation not generated yet' });
  }
});
// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    status: 'error',
    message: `Route ${req.originalUrl} not found`
  });
});

// Global error handler
app.use(errorHandler);

// Start server
const server = app.listen(PORT, async () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📚 API Documentation: http://localhost:${PORT}/api-docs`);
  console.log(`📊 API Metrics: http://localhost:${PORT}/api/metrics`);
  console.log(`📋 Swagger JSON: http://localhost:${PORT}/swagger.json`);
  console.log(`🏥 Health Check: http://localhost:${PORT}/health`);

  // Test database connections
  console.log('🔍 Testing database connections...');
});

// Graceful shutdown
const gracefulShutdown = () => {
  //console.log('🔄 Shutting down gracefully...');
  server.close(() => {
    //console.log('✅ Server closed');
    process.exit(0);
  });
};

process.on('SIGTERM', gracefulShutdown);
process.on('SIGINT', gracefulShutdown);

// Handle uncaught exceptions
process.on('uncaughtException', (err) => {
  console.error('❌ Uncaught Exception:', err);
  gracefulShutdown();
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('❌ Unhandled Rejection at:', promise, 'reason:', reason);
  gracefulShutdown();
});
