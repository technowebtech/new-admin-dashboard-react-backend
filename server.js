const express = require("express")
const cors = require("cors")
const helmet = require("helmet")
const morgan = require("morgan")
const rateLimit = require("express-rate-limit")
require("dotenv").config()

const { generateSwagger } = require("./config/swagger-auto")
const { autoDocumentAPI } = require("./utils/swagger-decorators")
const RouteScanner = require("./utils/route-scanner")

const dbConnection = require("./config/database")
const errorHandler = require("./middleware/errorHandler")

const app = express()
const PORT = process.env.PORT || 3000

// Security middleware
app.use(helmet())
app.use(
  cors({
    origin: process.env.ALLOWED_ORIGINS?.split(",") || "*",
    credentials: true,
  }),
)

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: {
    error: "Too many requests from this IP, please try again later.",
  },
})
app.use(limiter)

// Body parsing middleware
app.use(express.json({ limit: "10mb" }))
app.use(express.urlencoded({ extended: true }))

// Logging and auto-documentation
app.use(morgan("combined"))
app.use(autoDocumentAPI)

// Auto-scan and register routes
console.log("🔍 Scanning for routes...")
const routeScanner = new RouteScanner(app)
routeScanner.scanRoutes("./routes")
console.log(`✅ Registered ${routeScanner.getRoutes().length} routes`)

// Generate swagger documentation after routes are loaded (only once)
let swaggerGenerated = false
if (!swaggerGenerated) {
  setTimeout(async () => {
    try {
      console.log("🔄 Starting Swagger documentation generation...")
      await generateSwagger(app)
      swaggerGenerated = true
      console.log("✅ Swagger documentation generation completed!")
    } catch (error) {
      console.error("❌ Failed to generate swagger documentation:", error)
    }
  }, 3000) // Increased timeout to ensure routes are fully loaded
}

// Setup swagger UI with proper collapsible schemas
const swaggerUi = require("swagger-ui-express")
app.use("/api-docs", swaggerUi.serve)
app.get(
  "/api-docs",
  swaggerUi.setup(null, {
    swaggerOptions: {
      url: "/swagger.json",
      docExpansion: "none", // Collapse all endpoint sections by default
      defaultModelsExpandDepth: 1, // Show schemas section but keep individual schemas collapsed
      defaultModelExpandDepth: 0, // Don't expand schema properties by default
      defaultModelRendering: "model", // Show model structure
      displayOperationId: false,
      displayRequestDuration: true,
      operationsSorter: "alpha", // Sort operations alphabetically
      tagsSorter: "alpha", // Sort tags alphabetically
      filter: true, // Enable search filter
      tryItOutEnabled: true, // Enable "Try it out" by default
      supportedSubmitMethods: ["get", "post", "put", "delete", "patch"],
      showExtensions: true,
      showCommonExtensions: true,
    },
    customCss: `
      .swagger-ui .topbar { 
        display: none; 
      }
      .swagger-ui .info { 
        margin: 20px 0; 
      }
      .swagger-ui .scheme-container { 
        background: #fafafa; 
        padding: 10px; 
        border-radius: 4px; 
        margin: 20px 0; 
      }
      .swagger-ui .opblock.opblock-post { 
        border-color: #49cc90; 
        background: rgba(73, 204, 144, 0.1); 
      }
      .swagger-ui .opblock.opblock-get { 
        border-color: #61affe; 
        background: rgba(97, 175, 254, 0.1); 
      }
      .swagger-ui .opblock.opblock-put { 
        border-color: #fca130; 
        background: rgba(252, 161, 48, 0.1); 
      }
      .swagger-ui .opblock.opblock-delete { 
        border-color: #f93e3e; 
        background: rgba(249, 62, 62, 0.1); 
      }
      
      /* Ensure schemas section is visible and properly styled */
      .swagger-ui .models {
        display: block !important;
        margin: 20px 0;
        border-radius: 4px;
      }
      
      .swagger-ui .models h4 {
        margin: 0;
        font-size: 16px;
        font-weight: 600;
        cursor: pointer;
      }
      
      .swagger-ui .models h4:hover {
        background: #f0f0f0;
      }
      
      .swagger-ui .model-container {
        display: block !important;
        margin: 0;
        border-bottom: 1px solid #ebebeb;
      }
      
      .swagger-ui .model-container:last-child {
        border-bottom: none;
      }
      
      .swagger-ui .model-box {
        display: block !important;
      }
      
      .swagger-ui .model-title {
        border-bottom: 1px solid #ebebeb;
        font-weight: 600;
        cursor: pointer;
      }
      
      .swagger-ui .model-title:hover {
        background: #f0f0f0;
      }
      
      /* Ensure all sections start collapsed */
      .swagger-ui .opblock-tag-section:not(.is-open) .opblock {
        display: none;
      }
      
      .swagger-ui .opblock-tag {
        cursor: pointer;
        border-bottom: 1px solid rgba(59, 65, 81, 0.3);
      }
    `,
    customSiteTitle: "Auto-Generated API Documentation",
    customfavIcon: "/favicon.ico",
  }),
)

// Serve swagger JSON
app.get("/swagger.json", (req, res) => {
  try {
    const swaggerDoc = require("./config/swagger-output.json")
    res.json(swaggerDoc)
  } catch (error) {
    res.status(500).json({ error: "Swagger documentation not generated yet" })
  }
})

// Health check endpoint (moved after swagger setup to avoid inclusion in docs)
app.get("/health", (req, res) => {
  res.status(200).json({
    status: "success",
    message: "Server is running successfully",
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    availableDatabases: dbConnection.getDatabaseList(),
  })
})

// API metrics endpoint (moved after swagger setup to avoid inclusion in docs)
app.get("/api/metrics", (req, res) => {
  const metrics = global.apiMetrics || []
  const summary = {
    totalCalls: metrics.length,
    averageResponseTime:
      metrics.length > 0 ? metrics.reduce((sum, call) => sum + call.responseTime, 0) / metrics.length : 0,
    statusCodes: metrics.reduce((acc, call) => {
      acc[call.statusCode] = (acc[call.statusCode] || 0) + 1
      return acc
    }, {}),
    topEndpoints: Object.entries(
      metrics.reduce((acc, call) => {
        const key = `${call.method} ${call.path}`
        acc[key] = (acc[key] || 0) + 1
        return acc
      }, {}),
    )
      .sort(([, a], [, b]) => b - a)
      .slice(0, 10),
  }

  res.json({
    status: "success",
    data: {
      summary,
      recentCalls: metrics.slice(-50),
    },
  })
})

// 404 handler
app.use("*", (req, res) => {
  res.status(404).json({
    status: "error",
    message: `Route ${req.originalUrl} not found`,
  })
})

// Global error handler
app.use(errorHandler)

// Start server
const server = app.listen(PORT, async () => {
  console.log(`🚀 Server running on port ${PORT}`)
  console.log(`📚 API Documentation: http://localhost:${PORT}/api-docs`)
  console.log(`📊 API Metrics: http://localhost:${PORT}/api/metrics`)
  console.log(`📋 Swagger JSON: http://localhost:${PORT}/swagger.json`)
  console.log(`🏥 Health Check: http://localhost:${PORT}/health`)

  // Test database connections
  console.log("🔍 Testing database connections...")
})

// Graceful shutdown
const gracefulShutdown = () => {
  console.log("🔄 Shutting down gracefully...")
  server.close(() => {
    console.log("✅ Server closed")
    process.exit(0)
  })
}

process.on("SIGTERM", gracefulShutdown)
process.on("SIGINT", gracefulShutdown)

// Handle uncaught exceptions
process.on("uncaughtException", (err) => {
  console.error("❌ Uncaught Exception:", err)
  gracefulShutdown()
})

process.on("unhandledRejection", (reason, promise) => {
  console.error("❌ Unhandled Rejection at:", promise, "reason:", reason)
  gracefulShutdown()
})
