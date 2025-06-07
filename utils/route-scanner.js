const fs = require("fs")
const path = require("path")

class RouteScanner {
  constructor(app) {
    this.app = app
    this.routes = []
    this.swaggerPaths = {}
  }

  // Scan directory for route files with nested structure
  scanRoutes(directory, prefix = "") {
    if (!fs.existsSync(directory)) return

    const files = fs.readdirSync(directory)

    files.forEach((file) => {
      const filePath = path.join(directory, file)
      const stat = fs.statSync(filePath)

      if (stat.isDirectory()) {
        // Handle public/private directories
        if (file === "public" || file === "private") {
          this.scanRoutes(filePath, prefix)
        } else {
          // Handle feature directories (Users, Teachers, etc.)
          const featureName = file.toLowerCase() // Convert to lowercase for route path
          this.scanFeatureDirectory(filePath, featureName, file)
        }
      }
    })
  }

  // Scan feature directory (Users, Teachers, etc.)
  scanFeatureDirectory(directory, routePath, folderName) {
    if (!fs.existsSync(directory)) return

    const files = fs.readdirSync(directory)

    files.forEach((file) => {
      if (file.endsWith(".js")) {
        const filePath = path.join(directory, file)

        try {
          const routeModule = require(path.resolve(filePath))
          const cleanRoutePath = `/${routePath}`

          this.registerRoute(cleanRoutePath, routeModule, folderName)
          //console.log(`📁 Auto-registered route: /api/v1${cleanRoutePath} (Schema: ${folderName})`)
        } catch (error) {
          console.error(`❌ Error loading route ${filePath}:`, error.message)
        }
      }
    })
  }

  // Register a single route
  registerRoute(path, routeModule, schemaName) {
    if (typeof routeModule === "function" || (routeModule && typeof routeModule.router === "function")) {
      // Clean up the path to remove any double slashes
      const cleanPath = `/api/v1${path}`.replace(/\/+/g, "/")
      this.app.use(cleanPath, routeModule.router || routeModule)
      this.routes.push({
        path: cleanPath,
        module: routeModule,
        schemaName: schemaName,
      })
    }
  }

  // Get all discovered routes
  getRoutes() {
    return this.routes
  }
}

module.exports = RouteScanner
