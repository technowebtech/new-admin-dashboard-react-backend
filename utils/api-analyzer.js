const fs = require("fs")
const path = require("path")
const EnumExtractor = require("./enum-extractor")

class APIAnalyzer {
  constructor() {
    this.endpoints = []
    this.schemas = {}
    this.tags = new Set()
    this.swaggerPaths = {}
    this.routeStructure = {}
    this.folderStructure = {}
    this.enumExtractor = new EnumExtractor()
    this.parameterEnums = this.initializeDefaultEnums()
  }

  // Initialize default parameter enums (fallback)
  initializeDefaultEnums() {
    return {
      pathParams: {
        id: {
          enum: null, // No enum for IDs
          description: "Unique identifier",
        },
      },
      queryParams: {
        page: {
          enum: null,
          description: "Page number for pagination",
        },
        limit: {
          enum: null,
          description: "Number of items per page",
        },
      },
      bodyFields: {},
    }
  }

  // Extract dynamic enums from controllers and routes
  extractDynamicEnums() {
    console.log("🔍 Extracting dynamic enums from controllers and routes...")

    // Clear previous extractions
    this.enumExtractor.clear()

    // Extract from controllers and routes
    this.enumExtractor.extractFromControllers("./controllers")
    this.enumExtractor.extractFromRoutes("./routes")

    console.log("✅ Dynamic enum extraction completed")
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

    // First extract dynamic enums
    this.extractDynamicEnums()

    // Then scan routes
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
      this.extractRoutesFromFile(content, routePath, schemaName, filePath)
    } catch (error) {
      console.error(`Error analyzing route file ${filePath}:`, error.message)
    }
  }

  // Extract routes from route file content with proper path building and tagging
  extractRoutesFromFile(content, routePath, schemaName, filePath) {
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
        this.createSwaggerPath(fullPath, method.toUpperCase(), endpoint, tag, schemaName, controllerMethod, filePath)
      } else {
        // Create basic endpoint info if not found in controller
        this.createBasicSwaggerPath(fullPath, method.toUpperCase(), controllerMethod, tag, schemaName, filePath)
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
  createSwaggerPath(path, method, endpoint, tag, schemaName, controllerMethod, filePath) {
    // Convert Express path params (:id) to Swagger path params ({id})
    const swaggerPath = path.replace(/:([^/]+)/g, "{$1}")

    if (!this.swaggerPaths[swaggerPath]) {
      this.swaggerPaths[swaggerPath] = {}
    }

    this.tags.add(tag)

    // Get scoped enums for this specific endpoint
    const scopedEnums = this.getScopedEnumsForEndpoint(path, method, controllerMethod, filePath)

    this.swaggerPaths[swaggerPath][method.toLowerCase()] = {
      tags: [tag],
      summary: endpoint.summary,
      description: endpoint.description,
      parameters: this.generateParameters(path, endpoint, scopedEnums),
      responses: this.generateOpenAPIResponses(endpoint.responses, schemaName),
      security: endpoint.security,
      ...(this.needsRequestBody(method) && {
        requestBody: this.generateRequestBody(endpoint, schemaName, scopedEnums),
      }),
    }
  }

  // Create basic swagger path for unanalyzed endpoints with proper tagging
  createBasicSwaggerPath(path, method, controllerMethod, tag, schemaName, filePath) {
    // Convert Express path params (:id) to Swagger path params ({id})
    const swaggerPath = path.replace(/:([^/]+)/g, "{$1}")

    if (!this.swaggerPaths[swaggerPath]) {
      this.swaggerPaths[swaggerPath] = {}
    }

    this.tags.add(tag)

    const methodName = controllerMethod.split(".").pop()

    // Get scoped enums for this specific endpoint
    const scopedEnums = this.getScopedEnumsForEndpoint(path, method, controllerMethod, filePath)

    this.swaggerPaths[swaggerPath][method.toLowerCase()] = {
      tags: [tag],
      summary: this.generateSummary(methodName),
      description: `Auto-generated endpoint for ${methodName}`,
      parameters: this.generateParametersFromPath(path, scopedEnums),
      responses: this.getDefaultOpenAPIResponses(schemaName),
      security: this.needsAuthentication(path, methodName) ? [{ bearerAuth: [] }] : [],
      ...(this.needsRequestBody(method) && {
        requestBody: this.generateBasicRequestBody(schemaName, methodName, scopedEnums),
      }),
    }
  }

  // Get scoped enums for a specific endpoint with proper hierarchy
  getScopedEnumsForEndpoint(apiPath, method, controllerMethod, filePath) {
    const result = {
      pathParams: {},
      queryParams: {},
      bodyFields: {},
    }

    // Extract controller and method names from controllerMethod
    const [controllerName, methodName] = controllerMethod.split(".")

    // 1. Start with controller-level enums (most general)
    if (controllerName && this.extractedEnums.controllers[controllerName]) {
      Object.entries(this.extractedEnums.controllers[controllerName]).forEach(([key, value]) => {
        if (key.startsWith("param_")) {
          const paramName = key.replace("param_", "")
          result.pathParams[paramName] = value
        } else if (key.startsWith("query_")) {
          const queryName = key.replace("query_", "")
          result.queryParams[queryName] = value
        } else {
          result.bodyFields[key] = value
        }
      })
    }

    // 2. Override with method-level enums (more specific)
    if (controllerName && methodName) {
      const methodKey = `${controllerName}.${methodName}`
      if (this.extractedEnums.methods[methodKey]) {
        Object.entries(this.extractedEnums.methods[methodKey]).forEach(([key, value]) => {
          if (key.startsWith("param_")) {
            const paramName = key.replace("param_", "")
            result.pathParams[paramName] = value
          } else if (key.startsWith("query_")) {
            const queryName = key.replace("query_", "")
            result.queryParams[queryName] = value
          } else {
            result.bodyFields[key] = value
          }
        })
      }
    }

    // 3. Get route name from file path for route-level enums
    const routeName = this.getRouteNameFromFilePath(filePath)
    if (routeName && this.extractedEnums.routes[routeName]) {
      Object.entries(this.extractedEnums.routes[routeName]).forEach(([key, value]) => {
        if (key.startsWith("param_")) {
          const paramName = key.replace("param_", "")
          result.pathParams[paramName] = value
        } else if (key.startsWith("query_")) {
          const queryName = key.replace("query_", "")
          result.queryParams[queryName] = value
        }
      })
    }

    // 4. Override with endpoint-level enums (most specific)
    const endpointKey = `${routeName}:${method.toUpperCase()} ${this.getPathFromApiPath(apiPath)}`
    if (this.extractedEnums.endpoints[endpointKey]) {
      Object.entries(this.extractedEnums.endpoints[endpointKey]).forEach(([key, value]) => {
        if (key.startsWith("param_")) {
          const paramName = key.replace("param_", "")
          result.pathParams[paramName] = value
        } else if (key.startsWith("query_")) {
          const queryName = key.replace("query_", "")
          result.queryParams[queryName] = value
        }
      })
    }

    // 5. Only apply enums to parameters that actually exist in this endpoint
    const filteredResult = this.filterEnumsForEndpoint(result, apiPath, method)

    // console.log(`🎯 Applied scoped enums for ${method} ${apiPath}:`)
    // console.log(`   Path params: ${Object.keys(filteredResult.pathParams).join(", ") || "none"}`)
    // console.log(`   Query params: ${Object.keys(filteredResult.queryParams).join(", ") || "none"}`)
    // console.log(`   Body fields: ${Object.keys(filteredResult.bodyFields).join(", ") || "none"}`)

    return filteredResult
  }

  // Get route name from file path
  getRouteNameFromFilePath(filePath) {
    const parts = filePath.split(path.sep)
    const routeIndex = parts.indexOf("routes")

    if (routeIndex !== -1 && routeIndex < parts.length - 1) {
      return parts
        .slice(routeIndex + 1)
        .join("/")
        .replace(".js", "")
    }

    return path.basename(filePath, ".js")
  }

  // Get path from API path (remove /api/v1 prefix)
  getPathFromApiPath(apiPath) {
    return apiPath.replace(/^\/api\/v1/, "") || "/"
  }

  // Filter enums to only apply to parameters that exist in this endpoint
  filterEnumsForEndpoint(enums, apiPath, method) {
    const result = {
      pathParams: {},
      queryParams: {},
      bodyFields: {},
    }

    // Extract actual path parameters from the API path
    const pathParamRegex = /:([^/]+)/g
    const actualPathParams = []
    let match
    while ((match = pathParamRegex.exec(apiPath)) !== null) {
      actualPathParams.push(match[1])
    }

    // Only include path param enums for parameters that actually exist in this path
    Object.entries(enums.pathParams).forEach(([paramName, enumData]) => {
      if (actualPathParams.includes(paramName)) {
        result.pathParams[paramName] = enumData
        // console.log(`   ✓ Applied path param enum '${paramName}': [${enumData.enum.join(", ")}]`)
      } else {
        // console.log(`   ✗ Skipped path param enum '${paramName}' (not in path)`)
      }
    })

    // For query parameters, we can be more permissive but still filter based on method type
    Object.entries(enums.queryParams).forEach(([queryName, enumData]) => {
      // Only apply query params to GET requests or specific cases
      if (method === "GET" || this.isQueryParamRelevant(queryName, method)) {
        result.queryParams[queryName] = enumData
        console.log(`   ✓ Applied query param enum '${queryName}': [${enumData.enum.join(", ")}]`)
      } else {
        console.log(`   ✗ Skipped query param enum '${queryName}' (not relevant for ${method})`)
      }
    })

    // For body fields, only apply to methods that have request bodies
    if (this.needsRequestBody(method)) {
      Object.entries(enums.bodyFields).forEach(([fieldName, enumData]) => {
        result.bodyFields[fieldName] = enumData
        // console.log(`   ✓ Applied body field enum '${fieldName}': [${enumData.enum.join(", ")}]`)
      })
    }

    return result
  }

  // Check if a query parameter is relevant for a specific method
  isQueryParamRelevant(queryName, method) {
    // Common query parameters that are relevant for multiple methods
    const commonQueryParams = ["page", "limit", "sort", "sortBy", "format", "status"]
    return commonQueryParams.includes(queryName)
  }

  // Get extracted enums (for access by other methods)
  get extractedEnums() {
    return this.enumExtractor.getExtractedEnums()
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

  // Generate parameters from path and endpoint analysis with dynamic enum support
  generateParameters(path, endpoint, scopedEnums) {
    const parameters = []

    // Path parameters (without the colon) with dynamic enum support
    const pathParamRegex = /:([^/]+)/g
    let match
    while ((match = pathParamRegex.exec(path)) !== null) {
      const paramName = match[1]
      const enumConfig = scopedEnums.pathParams[paramName] || this.parameterEnums.pathParams[paramName]

      const parameter = {
        in: "path",
        name: paramName,
        required: true,
        description: enumConfig ? enumConfig.description : `${this.capitalizeFirst(paramName)} identifier`,
        schema: {
          type: paramName.includes("id") ? "integer" : "string",
        },
      }

      // Add enum if configured
      if (enumConfig && enumConfig.enum) {
        parameter.schema.enum = enumConfig.enum
        parameter.schema.example = enumConfig.enum[0]
        console.log(`🎯 Applied enum to path param '${paramName}': [${enumConfig.enum.join(", ")}]`)
      } else {
        parameter.schema.example = paramName.includes("id") ? 1 : ``
      }

      parameters.push(parameter)
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

    // Add dynamic query enums (only the ones that are scoped to this endpoint)
    Object.keys(scopedEnums.queryParams).forEach((queryName) => {
      const enumConfig = scopedEnums.queryParams[queryName]
      if (enumConfig && enumConfig.enum) {
        // Check if this parameter already exists
        const existingParam = parameters.find((p) => p.name === queryName)
        if (!existingParam) {
          parameters.push({
            in: "query",
            name: queryName,
            required: false,
            schema: {
              type: "string",
              enum: enumConfig.enum,
              default: enumConfig.enum[0],
            },
            description: enumConfig.description,
          })
          // console.log(`🎯 Applied enum to query param '${queryName}': [${enumConfig.enum.join(", ")}]`)
        }
      }
    })

    return parameters
  }

  // Generate parameters from path only with dynamic enum support
  generateParametersFromPath(path, scopedEnums) {
    const parameters = []

    // Extract path parameters (without the colon) with dynamic enum support
    const pathParamRegex = /:([^/]+)/g
    let match
    while ((match = pathParamRegex.exec(path)) !== null) {
      const paramName = match[1]
      const enumConfig = scopedEnums.pathParams[paramName] || this.parameterEnums.pathParams[paramName]

      const parameter = {
        in: "path",
        name: paramName,
        required: true,
        description: enumConfig ? enumConfig.description : `${this.capitalizeFirst(paramName)} identifier`,
        schema: {
          type: paramName.includes("id") ? "integer" : "string",
        },
      }

      // Add enum if configured
      if (enumConfig && enumConfig.enum) {
        parameter.schema.enum = enumConfig.enum
        parameter.schema.example = enumConfig.enum[0]
        // console.log(`🎯 Applied enum to path param '${paramName}': [${enumConfig.enum.join(", ")}]`)
      } else {
        parameter.schema.example = paramName.includes("id") ? 1 : ``
      }

      parameters.push(parameter)
    }

    // Add common query parameters for list endpoints with dynamic enums
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

    // Add dynamic query enums (only the ones that are scoped to this endpoint)
    Object.keys(scopedEnums.queryParams).forEach((queryName) => {
      const enumConfig = scopedEnums.queryParams[queryName]
      if (enumConfig && enumConfig.enum) {
        // Check if this parameter already exists
        const existingParam = parameters.find((p) => p.name === queryName)
        if (!existingParam) {
          parameters.push({
            in: "query",
            name: queryName,
            required: false,
            schema: {
              type: "string",
              enum: enumConfig.enum,
              default: enumConfig.enum[0],
            },
            description: enumConfig.description,
          })
          // console.log(`🎯 Applied enum to query param '${queryName}': [${enumConfig.enum.join(", ")}]`)
        }
      }
    })

    return parameters
  }

  // Generate request body schema based on schema name (now dynamic)
  generateRequestBody(endpoint, schemaName, scopedEnums) {
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
  generateBasicRequestBody(schemaName, methodName, scopedEnums) {
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

        const parameter = {
          in: "query",
          name: paramName,
          required: false,
          description: `${this.capitalizeFirst(paramName)} query parameter`,
          schema: { type: "string" },
        }

        parameters.push(parameter)
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
