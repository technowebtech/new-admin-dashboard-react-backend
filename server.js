// app.js
const express = require("express");
const cors = require("cors");
const path = require("path");
const helmet = require("helmet");
const morgan = require("morgan");
const rateLimit = require("express-rate-limit");
require("dotenv").config();
const { autoLoadRoutes } = require("./utils/autoLoadRoutes");
const { generateSwaggerJson } = require("./utils/generate-swagger-json");
const errorHandler = require("./middleware/errorHandler");

const app = express();
const PORT = process.env.PORT || 3000;

// Security middleware
app.use(helmet());
app.use(
  cors({
    origin: process.env.ALLOWED_ORIGINS?.split(",") || "*",
    credentials: true,
  })
);
// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: {
    error: "Too many requests from this IP, please try again later.",
  },
});
app.use(limiter);

app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true }));

app.use("/", express.static(path.join(__dirname, "public")));
// Logging and auto-documentation
if (process.env.NODE_ENV !== "production") {
  app.use(morgan("dev"));
}
// Load private routes
autoLoadRoutes(app, path.join(__dirname, "routes", "private"));

// Load public routes
autoLoadRoutes(app, path.join(__dirname, "routes", "public"));

if (process.env.NODE_ENV === "development") {
  // const swaggerJsPath = path.join(publicDir, "swagger-init.js");
  // fs.writeFileSync(swaggerJsPath, swaggerHtmlContent.swiggerJs, 'utf8');
  // fs.writeFileSync(htmlFilePath, swaggerHtmlContent.swaggerHtmlContent, 'utf8');

  // Generate swagger documentation after routes are loaded (only once)
  let swaggerGenerated = false;
  if (!swaggerGenerated) {
    setTimeout(async () => {
      try {
        //console.log('🔄 Starting Swagger documentation generation...');
        await generateSwaggerJson(app);
        swaggerGenerated = true;
        //console.log('✅ Swagger documentation generation completed!');
      } catch (error) {
        console.error("❌ Failed to generate swagger documentation:", error);
      }
    }, 500); // Increased timeout to ensure routes are fully loaded
  }
}

// Serve Swagger UI HTML
app.get("/docs", (req, res) => {
  res.setHeader(
    "Content-Security-Policy",
    "default-src 'self'; " +
      "script-src 'self' 'unsafe-inline' https://unpkg.com; " +
      "style-src 'self' 'unsafe-inline' https://unpkg.com; " +
      "img-src 'self' data: https://unpkg.com; " +
      "font-src 'self' https://unpkg.com; " +
      "object-src 'none';"
  );
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

// Serve the Swagger JSON file
app.get("/swagger.json", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "swagger.json"));
});

// Global error handler
app.use(errorHandler);
// Start Server
app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
  console.log(`Swagger docs at http://localhost:${PORT}/docs`);
});

// Graceful shutdown
const gracefulShutdown = () => {
  //console.log('🔄 Shutting down gracefully...');
  server.close(() => {
    //console.log('✅ Server closed');
    process.exit(0);
  });
};

process.on("SIGTERM", gracefulShutdown);
process.on("SIGINT", gracefulShutdown);

// Handle uncaught exceptions
process.on("uncaughtException", (err) => {
  console.error("❌ Uncaught Exception:", err);
  gracefulShutdown();
});

process.on("unhandledRejection", (reason, promise) => {
  console.error("❌ Unhandled Rejection at:", promise, "reason:", reason);
  gracefulShutdown();
});
