const fs = require("fs")
const path = require("path")

class APIAnalyzer {
  constructor() {
    this.endpoints = []
    this.schemas = {}
    this.tags = new Set()
    this.swaggerPaths = {}
    this.routeStructure = {}
    this.folderStructure = {}
  }

  // Set folder structure from schema generator
  setFolderStructure(folderStructure) {
    this.folderStructure = folderStructure
  }

  // Analyze controller files to extract endpoint information
  analyzeControllers(controllersDir = "./controllers") {
    if (!fs.existsSync(controllersDir)) return

    const files = fs.readdirSync(controllersDir)

    files.forEach((file) => {
      if (file.endsWith(".js")) {
        const filePath = path.join(controllersDir, file)
        const content = fs.readFileSync(filePath, "utf8")
        this.extractEndpointsFromController(content, file)
      }
    })
  }

  // Analyze route files to map endpoints to paths with proper folder structure
  analyzeRoutes(routesDir = "./routes") {
    if (!fs.existsSync(routesDir)) return

    this.scanRouteDirectory(routesDir, "", "")
  }

  // Recursively scan route directories with proper path building
  scanRouteDirectory(dir, basePath, currentSchema) {
    const files = fs.readdirSync(dir)

    files.forEach((file) => {
      const filePath = path.join(dir, file)
      const stat = fs.statSync(filePath)

      if (stat.isDirectory()) {
        // Handle public/private directories
        if (file === "public" || file === "private") {
          this.scanRouteDirectory(filePath, basePath, currentSchema)
        } else {
          // Handle feature directories (Users, Teachers, etc.)
          const featureName = file.toLowerCase() // Use lowercase for route path
          const schemaName = file // Use original case for schema name
          this.scanRouteDirectory(filePath, `/${featureName}`, schemaName)
        }
      } else if (file.endsWith(".js")) {
        // Skip health and metrics routes from documentation
        if (filePath.includes("health") || filePath.includes("metrics")) {
          return
        }
        this.analyzeRouteFile(filePath, basePath, currentSchema)
      }
    })
  }

  // Analyze individual route file with proper path mapping
  analyzeRouteFile(filePath, routePath, schemaName) {
    try {
      const content = fs.readFileSync(filePath, "utf8")
      this.extractRoutesFromFile(content, routePath, schemaName)
    } catch (error) {
      console.error(`Error analyzing route file ${filePath}:`, error.message)
    }
  }

  // Extract routes from route file content with proper path building and tagging
  extractRoutesFromFile(content, routePath, schemaName) {
    // Handle special case for auth routes
    if (routePath.includes("auth") || schemaName === "Auth") {
      routePath = "/auth"
      schemaName = "Authentication"
    }

    // Skip health and metrics endpoints
    if (routePath.includes("/health") || routePath.includes("/metrics")) {
      return
    }

    // Extract router method calls (get, post, put, delete, etc.)
    const routeRegex = /router\.(get|post|put|delete|patch)\s*\(\s*["']([^"']+)["']\s*,.*?(\w+\.\w+)/g
    let match

    while ((match = routeRegex.exec(content)) !== null) {
      const [, method, path, controllerMethod] = match

      // Build the full API path
      const fullPath = `/api/v1${routePath}${path === "/" ? "" : path}`.replace(/\/+/g, "/")

      // Determine the correct tag based on schema name
      const tag = this.getTagFromSchema(schemaName)

      // console.log(`🏷️  Tagging: ${method.toUpperCase()} ${fullPath} → ${tag} (Schema: ${schemaName})`)

      // Find corresponding endpoint from controller analysis
      const endpoint = this.findEndpointByMethod(controllerMethod)

      if (endpoint) {
        this.createSwaggerPath(fullPath, method.toUpperCase(), endpoint, tag, schemaName)
      } else {
        // Create basic endpoint info if not found in controller
        this.createBasicSwaggerPath(fullPath, method.toUpperCase(), controllerMethod, tag, schemaName)
      }
    }
  }

  // Get tag from schema name (now dynamic)
  getTagFromSchema(schemaName) {
    // Special case for authentication
    if (schemaName === "Auth" || schemaName === "Authentication") {
      return "Authentication"
    }

    // Check if this schema exists in our folder structure
    if (this.folderStructure[schemaName]) {
      return this.folderStructure[schemaName].tagName
    }

    // Fallback to the schema name itself
    return schemaName
  }

  // Find endpoint by controller method name
  findEndpointByMethod(methodName) {
    const cleanMethodName = methodName.split(".").pop()
    return this.endpoints.find((ep) => ep.name === cleanMethodName)
  }

  // Create swagger path from endpoint analysis with proper tagging
  createSwaggerPath(path, method, endpoint, tag, schemaName) {
    // Convert Express path params (:id) to Swagger path params ({id})
    const swaggerPath = path.replace(/:([^/]+)/g, "{$1}")

    if (!this.swaggerPaths[swaggerPath]) {
      this.swaggerPaths[swaggerPath] = {}
    }

    this.tags.add(tag)

    this.swaggerPaths[swaggerPath][method.toLowerCase()] = {
      tags: [tag],
      summary: endpoint.summary,
      description: endpoint.description,
      parameters: this.generateParameters(path, endpoint),
      responses: this.generateOpenAPIResponses(endpoint.responses, schemaName),
      security: endpoint.security,
      ...(this.needsRequestBody(method) && {
        requestBody: this.generateRequestBody(endpoint, schemaName),
      }),
    }
  }

  // Create basic swagger path for unanalyzed endpoints with proper tagging
  createBasicSwaggerPath(path, method, controllerMethod, tag, schemaName) {
    // Convert Express path params (:id) to Swagger path params ({id})
    const swaggerPath = path.replace(/:([^/]+)/g, "{$1}")

    if (!this.swaggerPaths[swaggerPath]) {
      this.swaggerPaths[swaggerPath] = {}
    }

    this.tags.add(tag)

    const methodName = controllerMethod.split(".").pop()

    this.swaggerPaths[swaggerPath][method.toLowerCase()] = {
      tags: [tag],
      summary: this.generateSummary(methodName),
      description: `Auto-generated endpoint for ${methodName}`,
      parameters: this.generateParametersFromPath(path),
      responses: this.getDefaultOpenAPIResponses(schemaName),
      security: this.needsAuthentication(path, methodName) ? [{ bearerAuth: [] }] : [],
      ...(this.needsRequestBody(method) && {
        requestBody: this.generateBasicRequestBody(schemaName, methodName),
      }),
    }
  }

  // Check if endpoint needs authentication
  needsAuthentication(path, methodName) {
    // Auth endpoints typically don't need authentication except for logout
    if (path.includes("/auth") && !methodName.includes("logout")) {
      return false
    }

    // These methods typically don't need authentication
    const publicMethods = ["login", "register", "forgotPassword", "resetPassword", "verifyEmail"]
    if (publicMethods.some((m) => methodName.includes(m))) {
      return false
    }

    // Default to requiring authentication
    return true
  }

  // Generate OpenAPI 3.0 compatible responses with schema-specific responses
  generateOpenAPIResponses(responses, schemaName) {
    const openAPIResponses = {}

    Object.keys(responses || {}).forEach((statusCode) => {
      const response = responses[statusCode]
      openAPIResponses[statusCode] = {
        description: response.description,
        content: {
          "application/json": {
            schema: { $ref: `#/components/schemas/${this.getResponseSchemaName(statusCode, schemaName)}` },
          },
        },
      }
    })

    return Object.keys(openAPIResponses).length > 0 ? openAPIResponses : this.getDefaultOpenAPIResponses(schemaName)
  }

  // Get default OpenAPI 3.0 responses with schema-specific responses
  getDefaultOpenAPIResponses(schemaName) {
    const successSchema = this.getSuccessSchemaName(schemaName)

    return {
      200: {
        description: "Success",
        content: {
          "application/json": {
            schema: { $ref: `#/components/schemas/${successSchema}` },
          },
        },
      },
      400: {
        description: "Bad Request",
        content: {
          "application/json": {
            schema: { $ref: "#/components/schemas/ErrorResponse" },
          },
        },
      },
      401: {
        description: "Unauthorized",
        content: {
          "application/json": {
            schema: { $ref: "#/components/schemas/ErrorResponse" },
          },
        },
      },
      500: {
        description: "Internal Server Error",
        content: {
          "application/json": {
            schema: { $ref: "#/components/schemas/ErrorResponse" },
          },
        },
      },
    }
  }

  // Get response schema name based on status code and schema (now dynamic)
  getResponseSchemaName(statusCode, schemaName) {
    if (statusCode.startsWith("2")) {
      return this.getSuccessSchemaName(schemaName)
    }
    return "ErrorResponse"
  }

  // Get success schema name based on schema (now dynamic)
  getSuccessSchemaName(schemaName) {
    // Special case for authentication
    if (schemaName === "Authentication") {
      return "LoginResponse"
    }

    // For other schemas, use the singular form
    const singularName = this.getSingularName(schemaName)
    return singularName
  }

  // Convert plural to singular
  getSingularName(pluralName) {
    // Simple pluralization rules
    if (pluralName.endsWith("ies")) {
      return pluralName.slice(0, -3) + "y"
    }
    if (pluralName.endsWith("s")) {
      return pluralName.slice(0, -1)
    }
    return pluralName
  }

  // Generate parameters from path and endpoint analysis
  generateParameters(path, endpoint) {
    const parameters = []

    // Path parameters (without the colon)
    const pathParamRegex = /:([^/]+)/g
    let match
    while ((match = pathParamRegex.exec(path)) !== null) {
      const paramName = match[1]
      parameters.push({
        in: "path",
        name: paramName,
        required: true,
        schema: {
          type: paramName.includes("id") ? "integer" : "string",
          example: paramName.includes("id") ? 1 : `example-${paramName}`,
        },
        description: `${this.capitalizeFirst(paramName)} identifier`,
      })
    }

    // Query parameters from endpoint analysis
    if (endpoint && endpoint.parameters) {
      parameters.push(...endpoint.parameters.filter((p) => p.in === "query"))
    }

    // Add common query parameters for GET endpoints with "list" in path
    if (path.includes("/list") || path.includes("/all")) {
      parameters.push(
        {
          in: "query",
          name: "page",
          required: false,
          schema: { type: "integer", minimum: 1, default: 1 },
          description: "Page number for pagination",
        },
        {
          in: "query",
          name: "limit",
          required: false,
          schema: { type: "integer", minimum: 1, maximum: 100, default: 10 },
          description: "Number of items per page",
        },
      )
    }

    return parameters
  }

  // Generate parameters from path only
  generateParametersFromPath(path) {
    const parameters = []

    // Extract path parameters (without the colon)
    const pathParamRegex = /:([^/]+)/g
    let match
    while ((match = pathParamRegex.exec(path)) !== null) {
      const paramName = match[1]
      parameters.push({
        in: "path",
        name: paramName,
        required: true,
        schema: { type: "string" },
        description: `${this.capitalizeFirst(paramName)} identifier`,
      })
    }

    // Add common query parameters for list endpoints
    if (path.includes("/list") || path.includes("/all")) {
      parameters.push(
        {
          in: "query",
          name: "page",
          required: false,
          schema: { type: "integer", minimum: 1, default: 1 },
          description: "Page number for pagination",
        },
        {
          in: "query",
          name: "limit",
          required: false,
          schema: { type: "integer", minimum: 1, maximum: 100, default: 10 },
          description: "Number of items per page",
        },
      )
    }

    return parameters
  }

  // Generate request body schema based on schema name (now dynamic)
  generateRequestBody(endpoint, schemaName) {
    const requestSchemaName = this.getRequestSchemaName(endpoint.name, schemaName)

    return {
      required: true,
      content: {
        "application/json": {
          schema: { $ref: `#/components/schemas/${requestSchemaName}` },
        },
      },
    }
  }

  // Generate basic request body for unanalyzed endpoints (now dynamic)
  generateBasicRequestBody(schemaName, methodName) {
    const requestSchemaName = this.getRequestSchemaName(methodName, schemaName)

    return {
      required: true,
      content: {
        "application/json": {
          schema: { $ref: `#/components/schemas/${requestSchemaName}` },
        },
      },
    }
  }

  // Get request schema name based on method and schema (now dynamic)
  getRequestSchemaName(methodName, schemaName) {
    const method = methodName.toLowerCase()

    // Authentication schemas
    if (schemaName === "Authentication") {
      if (method.includes("register")) return "UserRegistration"
      if (method.includes("login")) return "UserLogin"
    }

    // Other schemas - use singular form
    const baseSchema = this.getSingularName(schemaName)

    if (method.includes("create") || method.includes("add")) {
      return `${baseSchema}Create`
    }

    if (method.includes("update") || method.includes("edit")) {
      return `${baseSchema}Update`
    }

    return `${baseSchema}Create`
  }

  // Check if method needs request body
  needsRequestBody(method) {
    return ["POST", "PUT", "PATCH"].includes(method)
  }

  // Extract endpoint information from controller content
  extractEndpointsFromController(content, filename) {
    const controllerName = filename.replace(".js", "")

    // Extract function names and analyze them
    const functionRegex = /const\s+(\w+)\s*=\s*async\s*$$[^)]*$$\s*=>\s*{/g
    let match

    while ((match = functionRegex.exec(content)) !== null) {
      const functionName = match[1]
      const functionContent = this.extractFunctionContent(content, functionName)
      const endpoint = this.analyzeFunction(functionName, functionContent, controllerName)

      if (endpoint) {
        this.endpoints.push(endpoint)
      }
    }
  }

  // Extract function content for analysis
  extractFunctionContent(content, functionName) {
    const startRegex = new RegExp(`const\\s+${functionName}\\s*=\\s*async\\s*\$$[^)]*\$$\\s*=>\\s*{`, "g")
    const match = startRegex.exec(content)

    if (!match) return ""

    let braceCount = 0
    const startIndex = match.index + match[0].length - 1
    let endIndex = startIndex

    for (let i = startIndex; i < content.length; i++) {
      if (content[i] === "{") braceCount++
      if (content[i] === "}") braceCount--
      if (braceCount === 0) {
        endIndex = i
        break
      }
    }

    return content.substring(startIndex, endIndex + 1)
  }

  // Analyze function to determine endpoint details
  analyzeFunction(functionName, content, controllerName) {
    return {
      name: functionName,
      controller: controllerName,
      tag: this.capitalizeFirst(controllerName.replace("Controller", "")),
      method: this.inferHTTPMethod(functionName, content),
      summary: this.generateSummary(functionName),
      description: this.generateDescription(functionName, content),
      parameters: this.extractParameters(content),
      responses: this.generateResponses(content),
      security: this.requiresAuth(content) ? [{ bearerAuth: [] }] : [],
    }
  }

  // Infer HTTP method from function name and content
  inferHTTPMethod(functionName, content) {
    const name = functionName.toLowerCase()

    if (name.includes("create") || name.includes("register") || name.includes("add")) return "POST"
    if (name.includes("update") || name.includes("edit") || name.includes("modify")) return "PUT"
    if (name.includes("delete") || name.includes("remove")) return "DELETE"
    if (name.includes("get") || name.includes("find") || name.includes("list")) return "GET"

    // Analyze content for clues
    if (content.includes("res.status(201)") || content.includes("INSERT INTO")) return "POST"
    if (content.includes("UPDATE") || content.includes("SET")) return "PUT"
    if (content.includes("DELETE FROM")) return "DELETE"

    return "GET"
  }

  // Generate summary from function name
  generateSummary(functionName) {
    return functionName
      .replace(/([A-Z])/g, " $1")
      .replace(/^./, (str) => str.toUpperCase())
      .trim()
  }

  // Generate description
  generateDescription(functionName, content) {
    const summaries = {
    
    }

    return summaries[functionName] || `Auto-generated endpoint for ${functionName}`
  }

  // Extract parameters from function content
  extractParameters(content) {
    const parameters = []

    // Extract query parameters
    const queryMatches = content.match(/req\.query\.(\w+)/g)
    if (queryMatches) {
      ;[...new Set(queryMatches)].forEach((match) => {
        const paramName = match.replace("req.query.", "")
        parameters.push({
          in: "query",
          name: paramName,
          required: false,
          schema: { type: "string" },
          description: `${this.capitalizeFirst(paramName)} query parameter`,
        })
      })
    }

    return parameters
  }

  // Generate responses based on content analysis
  generateResponses(content) {
    const responses = {}

    // Extract status codes from content
    const statusMatches = content.match(/res\.status$$(\d+)$$/g)
    if (statusMatches) {
      ;[...new Set(statusMatches)].forEach((match) => {
        const statusCode = match.match(/\d+/)[0]
        responses[statusCode] = {
          description: this.getStatusDescription(statusCode),
          content: {
            "application/json": {
              schema: {
                $ref: statusCode.startsWith("2")
                  ? "#/components/schemas/SuccessResponse"
                  : "#/components/schemas/ErrorResponse",
              },
            },
          },
        }
      })
    }

    // Default responses if none found
    if (Object.keys(responses).length === 0) {
      return this.getDefaultResponses()
    }

    return responses
  }

  // Get default responses
  getDefaultResponses() {
    return {
      200: {
        description: "Success",
        content: {
          "application/json": {
            schema: { $ref: "#/components/schemas/SuccessResponse" },
          },
        },
      },
      400: {
        description: "Bad Request",
        content: {
          "application/json": {
            schema: { $ref: "#/components/schemas/ErrorResponse" },
          },
        },
      },
      500: {
        description: "Internal Server Error",
        content: {
          "application/json": {
            schema: { $ref: "#/components/schemas/ErrorResponse" },
          },
        },
      },
    }
  }

  // Check if endpoint requires authentication
  requiresAuth(content) {
    return content.includes("req.user") || content.includes("authenticateToken")
  }

  // Get status code description
  getStatusDescription(code) {
    const descriptions = {
      200: "Success",
      201: "Created successfully",
      400: "Bad Request - Invalid input",
      401: "Unauthorized - Authentication required",
      403: "Forbidden - Insufficient permissions",
      404: "Not Found - Resource not found",
      409: "Conflict - Resource already exists",
      500: "Internal Server Error",
    }
    return descriptions[code] || "Response"
  }

  // Capitalize first letter
  capitalizeFirst(str) {
    return str.charAt(0).toUpperCase() + str.slice(1)
  }

  // Get analysis results
  getResults() {
    return {
      endpoints: this.endpoints,
      tags: Array.from(this.tags),
      schemas: this.schemas,
      swaggerPaths: this.swaggerPaths,
    }
  }
}

module.exports = APIAnalyzer
