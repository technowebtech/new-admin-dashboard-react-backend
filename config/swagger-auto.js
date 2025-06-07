const APIAnalyzer = require("../utils/api-analyzer")
const SchemaGenerator = require("../utils/schema-generator")

// Enhanced auto-generation with completely dynamic schemas and tags
const generateSwagger = async () => {
  const outputFile = "./public/swagger.json"

  try {
    //console.log("🔍 Scanning route structure for dynamic schema generation...")

    // Initialize schema generator and scan routes
    const schemaGenerator = new SchemaGenerator()
    schemaGenerator.scanRouteStructure("./routes")

    // Get dynamically generated schemas and tags
    const dynamicSchemas = schemaGenerator.getSchemas()
    const dynamicTags = schemaGenerator.getTags()

    //console.log(`📋 Generated ${Object.keys(dynamicSchemas).length} schemas dynamically`)
    //console.log(`🏷️  Generated ${dynamicTags.length} tags dynamically`)

    // Create base document structure
    const doc = {
      openapi: "3.0.0",
      info: {
        title: "DPS Ghaziabad API Documentation",
        description: "Completely automated API documentation with dynamic schema and tag generation",
        version: "1.0.0",
        contact: {
          name: "API Support",
          email: "support@example.com",
        },
      },
      servers: [
        {
          url: `http://localhost:${process.env.PORT || 3000}`,
          description: "Development server",
        },
      ],
      components: {
        securitySchemes: {
          bearerAuth: {
            type: "http",
            scheme: "bearer",
            bearerFormat: "JWT",
            description: "Enter JWT token in format: Bearer <token>",
          },
        },
        schemas: dynamicSchemas, // Use dynamically generated schemas
      },
      tags: dynamicTags, // Use dynamically generated tags
    }

    // Initialize API analyzer
    const analyzer = new APIAnalyzer()

    // Pass the folder structure to the analyzer
    analyzer.setFolderStructure(schemaGenerator.getFolderStructure())

    // Analyze controllers and routes
    analyzer.analyzeControllers("./controllers")
    analyzer.analyzeRoutes("./routes")

    // Get analyzed data
    const analysisResults = analyzer.getResults()

    // Create properly organized paths with correct tags
    const organizedPaths = {}

    // Process each path and ensure proper tagging
    Object.keys(analysisResults.swaggerPaths).forEach((path) => {
      const pathMethods = analysisResults.swaggerPaths[path]
      organizedPaths[path] = {}

      Object.keys(pathMethods).forEach((method) => {
        const methodData = pathMethods[method]

        // Convert OpenAPI 3.0 format with proper schema references
        const convertedMethodData = {
          ...methodData,
        }

        // Fix schema references for OpenAPI 3.0
        if (convertedMethodData.requestBody) {
          const content = convertedMethodData.requestBody.content
          if (content && content["application/json"] && content["application/json"].schema) {
            const schemaRef = content["application/json"].schema.$ref
            if (schemaRef && schemaRef.startsWith("#/definitions/")) {
              content["application/json"].schema.$ref = schemaRef.replace("#/definitions/", "#/components/schemas/")
            }
          }
        }

        // Fix response schema references
        if (convertedMethodData.responses) {
          Object.keys(convertedMethodData.responses).forEach((statusCode) => {
            const response = convertedMethodData.responses[statusCode]
            if (
              response.content &&
              response.content["application/json"] &&
              response.content["application/json"].schema
            ) {
              const schemaRef = response.content["application/json"].schema.$ref
              if (schemaRef && schemaRef.startsWith("#/definitions/")) {
                response.content["application/json"].schema.$ref = schemaRef.replace(
                  "#/definitions/",
                  "#/components/schemas/",
                )
              }
            }
          })
        }

        organizedPaths[path][method] = convertedMethodData
      })
    })

    // Create the complete swagger document
    const swaggerDoc = {
      ...doc,
      paths: organizedPaths,
    }

    // Write the swagger file directly
    const fs = require("fs")
    fs.writeFileSync(outputFile, JSON.stringify(swaggerDoc, null, 2))

    //console.log("✅ Swagger documentation generated successfully")
    // //console.log("📋 Generated sections:")
    // dynamicTags.forEach((tag) => {
    //   //console.log(`   📁 ${tag.name}: ${tag.description}`)
    // })

    // //console.log("📋 Generated schemas:")
    // Object.keys(dynamicSchemas).forEach((schemaName) => {
    //   //console.log(`   📄 ${schemaName}`)
    // })

    // Log organized paths for debugging
    // //console.log("🔗 Organized paths:")
    // Object.keys(organizedPaths).forEach((path) => {
    //   Object.keys(organizedPaths[path]).forEach((method) => {
    //     const tag = organizedPaths[path][method].tags[0]
    //     //console.log(`   ${method.toUpperCase()} ${path} → ${tag}`)
    //   })
    // })

    return outputFile
  } catch (error) {
    console.error("❌ Error generating swagger documentation:", error)
    throw error
  }
}

module.exports = { generateSwagger }
