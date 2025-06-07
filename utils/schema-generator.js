const fs = require("fs")
const path = require("path")

class SchemaGenerator {
  constructor() {
    this.schemas = {}
    this.tags = []
    this.folderStructure = {}
  }

  // Scan routes folder to discover all feature folders
  scanRouteStructure(routesDir = "./routes") {
    if (!fs.existsSync(routesDir)) return

    this.scanDirectory(routesDir)
    this.generateSchemasFromStructure()
    this.generateTagsFromStructure()
  }

  // Recursively scan directories to find feature folders
  scanDirectory(dir, level = 0) {
    const files = fs.readdirSync(dir)

    files.forEach((file) => {
      const filePath = path.join(dir, file)
      const stat = fs.statSync(filePath)

      if (stat.isDirectory()) {
        // Skip public/private directories, look for feature folders inside them
        if (file === "public" || file === "private") {
          this.scanDirectory(filePath, level + 1)
        } else if (level > 0) {
          // This is a feature folder (Users, Teachers, etc.)
          this.folderStructure[file] = {
            name: file,
            path: filePath,
            schemaName: file,
            tagName: file,
            routePath: file.toLowerCase(),
          }
          //console.log(`📁 Discovered feature folder: ${file}`)
        }
      }
    })
  }

  // Generate schemas dynamically based on discovered folders
  generateSchemasFromStructure() {
    Object.keys(this.folderStructure).forEach((folderName) => {
      const folder = this.folderStructure[folderName]
      this.generateSchemasForFeature(folder)
    })

    // Add common schemas that are always needed
    this.addCommonSchemas()
  }

  // Generate schemas for a specific feature
  generateSchemasForFeature(folder) {
    const featureName = folder.name
    const singularName = this.getSingularName(featureName)

    // Base entity schema
    this.schemas[singularName] = this.generateBaseSchema(singularName)

    // Create schema
    this.schemas[`${singularName}Create`] = this.generateCreateSchema(singularName)

    // Update schema
    this.schemas[`${singularName}Update`] = this.generateUpdateSchema(singularName)

    // Paginated response schema
    this.schemas[`Paginated${featureName}`] = this.generatePaginatedSchema(singularName, featureName)

    // //console.log(
    //   `📋 Generated schemas for ${featureName}: ${singularName}, ${singularName}Create, ${singularName}Update, Paginated${featureName}`,
    // )
  }

  // Generate base schema for an entity
  generateBaseSchema(entityName) {
    const baseProperties = {
      id: { type: "integer", example: 1 },
      created_at: { type: "string", format: "date-time", example: "2024-01-01T00:00:00Z" },
      updated_at: { type: "string", format: "date-time", example: "2024-01-01T00:00:00Z" },
    }

    // Add entity-specific properties based on name
    const specificProperties = this.getEntitySpecificProperties(entityName)

    return {
      type: "object",
      properties: {
        ...baseProperties,
        ...specificProperties,
      },
    }
  }

  // Generate create schema for an entity
  generateCreateSchema(entityName) {
    const specificProperties = this.getEntitySpecificProperties(entityName)
    const requiredFields = this.getRequiredFields(entityName)

    // Remove id and timestamps from create schema
    const createProperties = { ...specificProperties }
    delete createProperties.id
    delete createProperties.created_at
    delete createProperties.updated_at

    return {
      type: "object",
      required: requiredFields,
      properties: createProperties,
    }
  }

  // Generate update schema for an entity
  generateUpdateSchema(entityName) {
    const specificProperties = this.getEntitySpecificProperties(entityName)

    // Remove id and timestamps from update schema, make all fields optional
    const updateProperties = { ...specificProperties }
    delete updateProperties.id
    delete updateProperties.created_at
    delete updateProperties.updated_at

    return {
      type: "object",
      properties: updateProperties,
    }
  }

  // Generate paginated response schema
  generatePaginatedSchema(singularName, pluralName) {
    return {
      type: "object",
      properties: {
        status: { type: "string", example: "success" },
        data: {
          type: "object",
          properties: {
            [pluralName.toLowerCase()]: {
              type: "array",
              items: { $ref: `#/components/schemas/${singularName}` },
            },
            pagination: {
              type: "object",
              properties: {
                page: { type: "integer", example: 1 },
                limit: { type: "integer", example: 10 },
                total: { type: "integer", example: 100 },
                totalPages: { type: "integer", example: 10 },
              },
            },
          },
        },
      },
    }
  }

  // Get entity-specific properties based on entity name
  getEntitySpecificProperties(entityName) {
    const commonProperties = {
      name: { type: "string", example: `${entityName} Name` },
      email: { type: "string", format: "email", example: `${entityName.toLowerCase()}@example.com` },
      status: { type: "string", enum: ["active", "inactive"], example: "active" },
    }

    // Entity-specific properties
    const entityProperties = {
      User: {
        ...commonProperties,
        phone: { type: "string", example: "1234567890" },
        bio: { type: "string", example: "User biography" },
        role: { type: "string", enum: ["user", "admin"], example: "user" },
      },

    }

    return (
      entityProperties[entityName] || {
        name: { type: "string", example: `${entityName} Name` },
        description: { type: "string", example: `${entityName} description` },
        status: { type: "string", enum: ["active", "inactive"], example: "active" },
      }
    )
  }

  // Get required fields for create operations
  getRequiredFields(entityName) {
    const requiredFieldsMap = {
    }

    return requiredFieldsMap[entityName] || ["name"]
  }

  // Add common schemas that are always needed
  addCommonSchemas() {
    // Authentication schemas
    this.schemas.UserRegistration = {
      type: "object",
      required: ["name", "email", "password", "confirmPassword"],
      properties: {
        name: { type: "string", minLength: 2, maxLength: 50, example: "John Doe" },
        email: { type: "string", format: "email", example: "john@example.com" },
        password: { type: "string", minLength: 6, example: "password123" },
        confirmPassword: { type: "string", example: "password123" },
      },
    }

    this.schemas.UserLogin = {
      type: "object",
      required: ["email", "password"],
      properties: {
        email: { type: "string", format: "email", example: "payalk.vnd@dpsgs.org" },
        password: { type: "string", example: "Khanna@12345" },
      },
    }

    // Response schemas
    this.schemas.LoginResponse = {
      type: "object",
      properties: {
        status: { type: "string", example: "success" },
        message: { type: "string", example: "Login successful" },
        data: {
          type: "object",
          properties: {
            token: { type: "string", example: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..." },
            user: {
              type: "object",
              properties: {
                id: { type: "integer", example: 1 },
                name: { type: "string", example: "John Doe" },
                email: { type: "string", example: "john@example.com" },
                role: { type: "string", example: "user" },
              },
            },
          },
        },
      },
    }

    this.schemas.SuccessResponse = {
      type: "object",
      properties: {
        status: { type: "string", example: "success" },
        message: { type: "string", example: "Operation successful" },
        data: { type: "object" },
      },
    }

    this.schemas.ErrorResponse = {
      type: "object",
      properties: {
        status: { type: "string", example: "error" },
        message: { type: "string", example: "Error message" },
      },
    }
  }

  // Generate tags dynamically based on discovered folders
  generateTagsFromStructure() {
    // Always include Authentication tag
    this.tags.push({
      name: "Authentication",
      description: "User authentication and authorization endpoints",
    })

    // Add tags for each discovered feature
    Object.keys(this.folderStructure).forEach((folderName) => {
      const folder = this.folderStructure[folderName]
      this.tags.push({
        name: folder.tagName,
        description: `${folder.tagName} management endpoints`,
      })
    })

    //console.log(`🏷️  Generated ${this.tags.length} tags: ${this.tags.map((t) => t.name).join(", ")}`)
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

  // Get all generated schemas
  getSchemas() {
    return this.schemas
  }

  // Get all generated tags
  getTags() {
    return this.tags
  }

  // Get folder structure
  getFolderStructure() {
    return this.folderStructure
  }
}

module.exports = SchemaGenerator
