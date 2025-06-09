const fs = require("fs");
const path = require("path");
const swaggerSpec = require("../swagger/swagger.config");

async function generateSwaggerJson() {
  const outputPath = path.join(path.resolve("."), "public", "swagger.json");

  fs.mkdirSync(path.dirname(outputPath), { recursive: true });
  fs.writeFileSync(outputPath, JSON.stringify(swaggerSpec, null, 2), "utf-8");
  console.log(`Swagger JSON written to ${outputPath}`);
}
module.exports = { generateSwaggerJson };
