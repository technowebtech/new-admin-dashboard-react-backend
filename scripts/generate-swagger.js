const { generateSwagger } = require("../config/swagger-auto")

// Generate swagger documentation
console.log("🔄 Generating Swagger documentation...")

generateSwagger()
  .then(() => {
    console.log("✅ Swagger documentation generated successfully!")
    console.log("📚 You can now view the documentation at /api-docs")
  })
  .catch((err) => {
    console.error("❌ Error generating swagger documentation:", err)
    process.exit(1)
  })
