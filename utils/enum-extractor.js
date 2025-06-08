const fs = require("fs")
const path = require("path")

class EnumExtractor {
  constructor() {
    this.extractedEnums = {
      // Store enums with their scope information
      controllers: {}, // Controller-level enums
      routes: {}, // Route-level enums
      methods: {}, // Method-level enums
      endpoints: {}, // Specific endpoint enums
    }
  }

  // Extract enums from controller files
  extractFromControllers(controllersDir = "./controllers") {
    if (!fs.existsSync(controllersDir)) return

    const files = fs.readdirSync(controllersDir)

    files.forEach((file) => {
      if (file.endsWith(".js")) {
        const filePath = path.join(controllersDir, file)
        const content = fs.readFileSync(filePath, "utf8")
        const controllerName = file.replace(".js", "")

        // Extract controller-level enums
        this.parseControllerLevelEnums(content, controllerName)

        // Extract method-level enums
        this.parseMethodLevelEnums(content, controllerName)
      }
    })
  }

  // Extract enums from route files
  extractFromRoutes(routesDir = "./routes") {
    if (!fs.existsSync(routesDir)) return

    this.scanRouteDirectory(routesDir)
  }

  // Recursively scan route directories
  scanRouteDirectory(dir) {
    const files = fs.readdirSync(dir)

    files.forEach((file) => {
      const filePath = path.join(dir, file)
      const stat = fs.statSync(filePath)

      if (stat.isDirectory()) {
        this.scanRouteDirectory(filePath)
      } else if (file.endsWith(".js")) {
        const content = fs.readFileSync(filePath, "utf8")
        const routeName = this.getRouteNameFromPath(filePath)

        // Extract route-level enums
        this.parseRouteLevelEnums(content, routeName, filePath)

        // Extract endpoint-level enums
        this.parseEndpointLevelEnums(content, routeName, filePath)
      }
    })
  }

  // Get route name from file path
  getRouteNameFromPath(filePath) {
    const parts = filePath.split(path.sep)
    const routeIndex = parts.indexOf("routes")

    if (routeIndex !== -1 && routeIndex < parts.length - 1) {
      // Get all parts after "routes" to form the route name
      return parts
        .slice(routeIndex + 1)
        .join("/")
        .replace(".js", "")
    }

    return path.basename(filePath, ".js")
  }

  // Parse controller-level enums (applies to all methods in controller)
  parseControllerLevelEnums(content, controllerName) {
    // Look for controller-level enum comments (outside any method)
    const enumRegex = /\/\*\*(?:[\s\S]*?)@enum\s+(\w+)\s*:\s*\[(.*?)\]\s*-\s*(.*?)(?:[\s\S]*?)\*\//g
    let match

    while ((match = enumRegex.exec(content)) !== null) {
      // Check if this is outside any method (controller level)
      const beforeMatch = content.substring(0, match.index)
      const methodMatch = beforeMatch.match(/const\s+\w+\s*=\s*async\s*$$[^)]*$$\s*=>\s*{[^}]*$/g)

      // If no method is found before this enum, it's controller level
      if (!methodMatch) {
        const [, fieldName, enumValues, description] = match
        const values = enumValues.split(",").map((v) => v.trim().replace(/['"]/g, ""))

        if (!this.extractedEnums.controllers[controllerName]) {
          this.extractedEnums.controllers[controllerName] = {}
        }

        this.extractedEnums.controllers[controllerName][fieldName] = {
          enum: values,
          description: description.trim(),
          source: `controller:${controllerName}`,
        }

        // console.log(`📋 Found controller-level enum in ${controllerName}: ${fieldName} = [${values.join(", ")}]`)
      }
    }

    // Look for controller-level parameter enums
    const paramEnumRegex = /\/\*\*(?:[\s\S]*?)@paramEnum\s+(\w+)\s*:\s*\[(.*?)\]\s*-\s*(.*?)(?:[\s\S]*?)\*\//g
    while ((match = paramEnumRegex.exec(content)) !== null) {
      // Check if this is outside any method (controller level)
      const beforeMatch = content.substring(0, match.index)
      const methodMatch = beforeMatch.match(/const\s+\w+\s*=\s*async\s*$$[^)]*$$\s*=>\s*{[^}]*$/g)

      // If no method is found before this enum, it's controller level
      if (!methodMatch) {
        const [, paramName, enumValues, description] = match
        const values = enumValues.split(",").map((v) => v.trim().replace(/['"]/g, ""))

        if (!this.extractedEnums.controllers[controllerName]) {
          this.extractedEnums.controllers[controllerName] = {}
        }

        this.extractedEnums.controllers[controllerName][`param_${paramName}`] = {
          enum: values,
          description: description.trim(),
          source: `controller:${controllerName}`,
          type: "path",
        }

        // console.log(
        //   `📋 Found controller-level path param enum in ${controllerName}: ${paramName} = [${values.join(", ")}]`,
        // )
      }
    }

    // Look for controller-level query parameter enums
    const queryEnumRegex = /\/\*\*(?:[\s\S]*?)@queryEnum\s+(\w+)\s*:\s*\[(.*?)\]\s*-\s*(.*?)(?:[\s\S]*?)\*\//g
    while ((match = queryEnumRegex.exec(content)) !== null) {
      // Check if this is outside any method (controller level)
      const beforeMatch = content.substring(0, match.index)
      const methodMatch = beforeMatch.match(/const\s+\w+\s*=\s*async\s*$$[^)]*$$\s*=>\s*{[^}]*$/g)

      // If no method is found before this enum, it's controller level
      if (!methodMatch) {
        const [, queryName, enumValues, description] = match
        const values = enumValues.split(",").map((v) => v.trim().replace(/['"]/g, ""))

        if (!this.extractedEnums.controllers[controllerName]) {
          this.extractedEnums.controllers[controllerName] = {}
        }

        this.extractedEnums.controllers[controllerName][`query_${queryName}`] = {
          enum: values,
          description: description.trim(),
          source: `controller:${controllerName}`,
          type: "query",
        }

        // console.log(`📋 Found controller-level query enum in ${controllerName}: ${queryName} = [${values.join(", ")}]`)
      }
    }
  }

  // Parse method-level enums (applies only to specific method)
  parseMethodLevelEnums(content, controllerName) {
    // Extract all methods in the controller
    const methodRegex = /\/\*\*(?:[\s\S]*?)\*\/\s*const\s+(\w+)\s*=\s*async\s*$$[^)]*$$\s*=>\s*{/g
    let methodMatch

    while ((methodMatch = methodRegex.exec(content)) !== null) {
      const methodName = methodMatch[1]
      const methodStart = methodMatch.index

      // Find the end of the method
      let braceCount = 0
      let methodEnd = methodStart

      // Find the opening brace of the method
      const openingBraceIndex = content.indexOf("{", methodStart)
      if (openingBraceIndex !== -1) {
        methodEnd = openingBraceIndex + 1
        braceCount = 1

        // Find the closing brace by counting braces
        for (let i = methodEnd; i < content.length; i++) {
          if (content[i] === "{") braceCount++
          if (content[i] === "}") braceCount--
          if (braceCount === 0) {
            methodEnd = i + 1
            break
          }
        }
      }

      // Extract the method content including its JSDoc
      const methodContent = content.substring(methodStart, methodEnd)

      // Look for method-level enum comments
      const enumRegex = /@enum\s+(\w+)\s*:\s*\[(.*?)\]\s*-\s*(.*?)(?:\n|\r|$)/g
      let enumMatch

      while ((enumMatch = enumRegex.exec(methodContent)) !== null) {
        const [, fieldName, enumValues, description] = enumMatch
        const values = enumValues.split(",").map((v) => v.trim().replace(/['"]/g, ""))

        if (!this.extractedEnums.methods[`${controllerName}.${methodName}`]) {
          this.extractedEnums.methods[`${controllerName}.${methodName}`] = {}
        }

        this.extractedEnums.methods[`${controllerName}.${methodName}`][fieldName] = {
          enum: values,
          description: description.trim(),
          source: `method:${controllerName}.${methodName}`,
        }

        console.log(
          `📋 Found method-level enum in ${controllerName}.${methodName}: ${fieldName} = [${values.join(", ")}]`,
        )
      }

      // Look for method-level parameter enums
      const paramEnumRegex = /@paramEnum\s+(\w+)\s*:\s*\[(.*?)\]\s*-\s*(.*?)(?:\n|\r|$)/g
      while ((enumMatch = paramEnumRegex.exec(methodContent)) !== null) {
        const [, paramName, enumValues, description] = enumMatch
        const values = enumValues.split(",").map((v) => v.trim().replace(/['"]/g, ""))

        if (!this.extractedEnums.methods[`${controllerName}.${methodName}`]) {
          this.extractedEnums.methods[`${controllerName}.${methodName}`] = {}
        }

        this.extractedEnums.methods[`${controllerName}.${methodName}`][`param_${paramName}`] = {
          enum: values,
          description: description.trim(),
          source: `method:${controllerName}.${methodName}`,
          type: "path",
        }

        console.log(
          `📋 Found method-level path param enum in ${controllerName}.${methodName}: ${paramName} = [${values.join(", ")}]`,
        )
      }

      // Look for method-level query parameter enums
      const queryEnumRegex = /@queryEnum\s+(\w+)\s*:\s*\[(.*?)\]\s*-\s*(.*?)(?:\n|\r|$)/g
      while ((enumMatch = queryEnumRegex.exec(methodContent)) !== null) {
        const [, queryName, enumValues, description] = enumMatch
        const values = enumValues.split(",").map((v) => v.trim().replace(/['"]/g, ""))

        if (!this.extractedEnums.methods[`${controllerName}.${methodName}`]) {
          this.extractedEnums.methods[`${controllerName}.${methodName}`] = {}
        }

        this.extractedEnums.methods[`${controllerName}.${methodName}`][`query_${queryName}`] = {
          enum: values,
          description: description.trim(),
          source: `method:${controllerName}.${methodName}`,
          type: "query",
        }

        console.log(
          `📋 Found method-level query enum in ${controllerName}.${methodName}: ${queryName} = [${values.join(", ")}]`,
        )
      }

      // Parse inline enums within method
      this.parseInlineEnums(methodContent, `${controllerName}.${methodName}`)
    }
  }

  // Parse route-level enums (applies to all endpoints in route)
  parseRouteLevelEnums(content, routeName, filePath) {
    const filename = path.basename(filePath)

    // Look for route-level enum comments
    const routeEnumRegex = /\/\*\*(?:[\s\S]*?)@routeEnum\s+(\w+)\s*:\s*\[(.*?)\]\s*-\s*(.*?)(?:[\s\S]*?)\*\//g
    let match

    while ((match = routeEnumRegex.exec(content)) !== null) {
      const [, paramName, enumValues, description] = match
      const values = enumValues.split(",").map((v) => v.trim().replace(/['"]/g, ""))

      // Determine if it's a path param or query param based on context
      const isPathParam = content.includes(`/:${paramName}`) || content.includes(`/{${paramName}}`)
      const paramType = isPathParam ? "path" : "query"
      const paramKey = isPathParam ? `param_${paramName}` : `query_${paramName}`

      if (!this.extractedEnums.routes[routeName]) {
        this.extractedEnums.routes[routeName] = {}
      }

      this.extractedEnums.routes[routeName][paramKey] = {
        enum: values,
        description: description.trim(),
        source: `route:${routeName}`,
        type: paramType,
      }

      console.log(`📋 Found route-level ${paramType} enum in ${routeName}: ${paramName} = [${values.join(", ")}]`)
    }
  }

  // Parse endpoint-level enums (applies only to specific endpoint)
  parseEndpointLevelEnums(content, routeName, filePath) {
    // Extract all endpoint handlers in the route
    const endpointRegex = /router\.(get|post|put|delete|patch)\s*\(\s*["']([^"']+)["']\s*,/g
    let endpointMatch

    while ((endpointMatch = endpointRegex.exec(content)) !== null) {
      const method = endpointMatch[1]
      const path = endpointMatch[2]
      const endpointId = `${method.toUpperCase()} ${path}`

      // Find comments before this endpoint (look backwards from the match)
      const beforeEndpoint = content.substring(0, endpointMatch.index)
      const lines = beforeEndpoint.split('\n')
      
      // Look for the last comment block before this endpoint
      let commentBlock = ""
      for (let i = lines.length - 1; i >= 0; i--) {
        const line = lines[i].trim()
        if (line.includes('/**')) {
          // Found start of comment block, collect it
          for (let j = i; j < lines.length; j++) {
            commentBlock = lines[j] + '\n' + commentBlock
            if (lines[j].includes('*/')) {
              break
            }
          }
          break
        }
        if (line && !line.startsWith('*') && !line.startsWith('//') && !line.includes('*/')) {
          // Hit non-comment code, stop looking
          break
        }
      }

      if (commentBlock) {
        // Look for endpoint-specific enum comments
        const enumRegex = /@endpointEnum\s+(\w+)\s*:\s*\[(.*?)\]\s*-\s*(.*?)(?:\n|\r|$)/g
        let enumMatch

        while ((enumMatch = enumRegex.exec(commentBlock)) !== null) {
          const [, paramName, enumValues, description] = enumMatch
          const values = enumValues.split(",").map((v) => v.trim().replace(/['"]/g, ""))

          // Determine if it's a path param or query param based on context
          const isPathParam = path.includes(`:${paramName}`) || path.includes(`{${paramName}}`)
          const paramType = isPathParam ? "path" : "query"
          const paramKey = isPathParam ? `param_${paramName}` : `query_${paramName}`

          const endpointKey = `${routeName}:${endpointId}`
          if (!this.extractedEnums.endpoints[endpointKey]) {
            this.extractedEnums.endpoints[endpointKey] = {}
          }

          this.extractedEnums.endpoints[endpointKey][paramKey] = {
            enum: values,
            description: description.trim(),
            source: `endpoint:${endpointKey}`,
            type: paramType,
          }

          console.log(
            `📋 Found endpoint-level ${paramType} enum in ${endpointKey}: ${paramName} = [${values.join(", ")}]`,
          )
        }
      }
    }
  }

  // Parse inline enum definitions
  parseInlineEnums(content, scopeKey, isEndpoint = false) {
    // Look for allowedKeys arrays
    const allowedKeysRegex = /const\s+allowed(\w+)\s*=\s*\[(.*?)\]/gs
    let match

    while ((match = allowedKeysRegex.exec(content)) !== null) {
      const [, fieldType, enumValues] = match
      const fieldName = fieldType.toLowerCase().replace("keys", "key")

      // Clean up the enum values
      const values = enumValues
        .split(",")
        .map((v) => v.trim().replace(/['"]/g, ""))
        .filter((v) => v.length > 0)

      if (values.length > 0) {
        const scopeCollection = isEndpoint ? this.extractedEnums.endpoints : this.extractedEnums.methods

        if (!scopeCollection[scopeKey]) {
          scopeCollection[scopeKey] = {}
        }

        scopeCollection[scopeKey][`param_${fieldName}`] = {
          enum: values,
          description: `Allowed ${fieldName} values`,
          source: `inline:${scopeKey}`,
          type: "path",
        }

        console.log(`📋 Found inline enum in ${scopeKey}: ${fieldName} = [${values.join(", ")}]`)
      }
    }

    // Look for validation arrays
    const validationRegex = /if\s*$$\s*!\s*\[(.*?)\]\.includes\s*\(\s*(\w+)\s*$$\s*\)/gs
    while ((match = validationRegex.exec(content)) !== null) {
      const [, enumValues, paramName] = match
      const values = enumValues
        .split(",")
        .map((v) => v.trim().replace(/['"]/g, ""))
        .filter((v) => v.length > 0)

      if (values.length > 0) {
        const scopeCollection = isEndpoint ? this.extractedEnums.endpoints : this.extractedEnums.methods

        if (!scopeCollection[scopeKey]) {
          scopeCollection[scopeKey] = {}
        }

        // Determine if it's likely a path param or query param based on context
        const isLikelyPathParam =
          content.includes(`req.params.${paramName}`) ||
          content.includes(`/:${paramName}`) ||
          content.includes(`/{${paramName}}`)
        const paramType = isLikelyPathParam ? "path" : "query"
        const paramKey = isLikelyPathParam ? `param_${paramName}` : `query_${paramName}`

        scopeCollection[scopeKey][paramKey] = {
          enum: values,
          description: `Valid ${paramName} values`,
          source: `inline:${scopeKey}`,
          type: paramType,
        }

        console.log(`📋 Found validation enum in ${scopeKey}: ${paramName} = [${values.join(", ")}]`)
      }
    }
  }

  // Get all extracted enums
  getExtractedEnums() {
    return this.extractedEnums
  }

  // Get enums for a specific controller method
  getEnumsForMethod(controllerName, methodName) {
    const result = {
      pathParams: {},
      queryParams: {},
      bodyFields: {},
    }

    // Add controller-level enums
    if (this.extractedEnums.controllers[controllerName]) {
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

    // Add method-level enums (overriding controller-level if duplicates)
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

    return result
  }

  // Get enums for a specific route
  getEnumsForRoute(routeName) {
    const result = {
      pathParams: {},
      queryParams: {},
    }

    // Add route-level enums
    if (this.extractedEnums.routes[routeName]) {
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

    return result
  }

  // Get enums for a specific endpoint
  getEnumsForEndpoint(routeName, method, path) {
    const result = {
      pathParams: {},
      queryParams: {},
    }

    // First add route-level enums
    const routeEnums = this.getEnumsForRoute(routeName)
    Object.assign(result.pathParams, routeEnums.pathParams)
    Object.assign(result.queryParams, routeEnums.queryParams)

    // Then add endpoint-specific enums (overriding route-level if duplicates)
    const endpointKey = `${routeName}:${method.toUpperCase()} ${path}`
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

    return result
  }

  // Get enums for a specific API path
  getEnumsForApiPath(apiPath, method, controllerMethod) {
    const result = {
      pathParams: {},
      queryParams: {},
      bodyFields: {},
    }

    // Extract controller and method names from controllerMethod
    const [controllerName, methodName] = controllerMethod.split(".")

    // Get controller and method level enums
    if (controllerName && methodName) {
      const methodEnums = this.getEnumsForMethod(controllerName, methodName)
      Object.assign(result.pathParams, methodEnums.pathParams)
      Object.assign(result.queryParams, methodEnums.queryParams)
      Object.assign(result.bodyFields, methodEnums.bodyFields)
    }

    // Extract route name from apiPath
    const routeParts = apiPath.split("/")
    let routeName = ""

    // Skip /api/v1 prefix
    if (routeParts.length > 3) {
      routeName = routeParts.slice(3).join("/")
    }

    // Get route and endpoint level enums
    if (routeName) {
      const endpointEnums = this.getEnumsForEndpoint(routeName, method, apiPath)
      Object.assign(result.pathParams, endpointEnums.pathParams)
      Object.assign(result.queryParams, endpointEnums.queryParams)
    }

    return result
  }

  // Merge with default enums
  mergeWithDefaults(defaultEnums) {
    const result = {
      pathParams: { ...defaultEnums.pathParams },
      queryParams: { ...defaultEnums.queryParams },
      bodyFields: { ...defaultEnums.bodyFields },
    }

    // Merge controller-level enums
    Object.values(this.extractedEnums.controllers).forEach((controllerEnums) => {
      Object.entries(controllerEnums).forEach(([key, value]) => {
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
    })

    // Merge method-level enums
    Object.values(this.extractedEnums.methods).forEach((methodEnums) => {
      Object.entries(methodEnums).forEach(([key, value]) => {
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
    })

    // Merge route-level enums
    Object.values(this.extractedEnums.routes).forEach((routeEnums) => {
      Object.entries(routeEnums).forEach(([key, value]) => {
        if (key.startsWith("param_")) {
          const paramName = key.replace("param_", "")
          result.pathParams[paramName] = value
        } else if (key.startsWith("query_")) {
          const queryName = key.replace("query_", "")
          result.queryParams[queryName] = value
        }
      })
    })

    // Merge endpoint-level enums
    Object.values(this.extractedEnums.endpoints).forEach((endpointEnums) => {
      Object.entries(endpointEnums).forEach(([key, value]) => {
        if (key.startsWith("param_")) {
          const paramName = key.replace("param_", "")
          result.pathParams[paramName] = value
        } else if (key.startsWith("query_")) {
          const queryName = key.replace("query_", "")
          result.queryParams[queryName] = value
        }
      })
    })

    return result
  }

  // Clear extracted enums
  clear() {
    this.extractedEnums = {
      controllers: {},
      routes: {},
      methods: {},
      endpoints: {},
    }
  }
}

module.exports = EnumExtractor
