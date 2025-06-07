# Node.js Backend API with MySQL

A complete Node.js REST API with Express.js, MySQL database, JWT authentication, and **fully automatic Swagger documentation generation**.

## 🚀 Features

- ✅ **Express.js** - Fast, unopinionated web framework
- ✅ **MySQL Database** - Reliable relational database
- ✅ **JWT Authentication** - Secure token-based authentication
- ✅ **Auto Swagger Documentation** - Zero-config API documentation
- ✅ **Folder-based Routing** - Organized route structure (v1/user, etc.)
- ✅ **Input Validation** - Request validation using Joi
- ✅ **Error Handling** - Centralized error handling
- ✅ **Security Middleware** - Helmet, CORS, Rate limiting
- ✅ **Code Formatting** - Prettier and ESLint configuration
- ✅ **Public/Private Routes** - Separate authentication levels

## 🤖 **Automatic Swagger Generation**

This project features **completely automatic Swagger documentation** with:

### **Zero Manual Work Required**
- ❌ No `@swagger` comments needed in routes
- ❌ No manual documentation writing
- ❌ No schema definitions required
- ✅ Just write your routes and controllers!

### **Smart Auto-Detection**
- 🔍 **Route Discovery**: Automatically finds all your routes
- 🧠 **Code Analysis**: Analyzes controller functions to understand purpose
- 📝 **Parameter Detection**: Auto-detects path, query, and body parameters
- 🔒 **Security Detection**: Identifies protected vs public routes
- 📊 **Response Analysis**: Determines response types from your code
- 🏷️ **Tag Generation**: Automatically categorizes endpoints

### **What Gets Auto-Generated**
- **Complete API Documentation** at `/api-docs`
- **Interactive Swagger UI** with testing capabilities
- **Request/Response Schemas** based on your validation rules
- **Authentication Requirements** for protected routes
- **Parameter Documentation** with types and descriptions
- **Error Response Documentation** with proper status codes
- **Real-time API Metrics** at `/api/metrics`

## 📋 **How It Works**

1. **Code Analysis**: Scans your controller files to understand function purposes
2. **Route Mapping**: Maps controller functions to actual API endpoints
3. **Schema Generation**: Creates request/response schemas from validation rules
4. **Documentation Building**: Builds comprehensive Swagger documentation
5. **Live Updates**: Updates automatically when you add new routes

## 🛠 **Installation**

1. **Install dependencies:**
\`\`\`bash
npm install
\`\`\`

2. **Set up environment variables:**
Create a `.env` file:
\`\`\`env
PORT=3000
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=your_password
DB_NAME=your_database_name
JWT_SECRET=your_super_secret_jwt_key
\`\`\`

3. **Set up MySQL database:**
- Create a MySQL database
- Run the SQL script in `scripts/create-database.sql`

4. **Start the server:**
\`\`\`bash
# Development mode (auto-generates docs)
npm run dev

# Production mode
npm start
\`\`\`

## 📚 **API Documentation**

Once running, visit:
- **📖 Swagger UI**: http://localhost:3000/api-docs
- **📊 API Metrics**: http://localhost:3000/api/metrics
- **🔍 Health Check**: http://localhost:3000/health
- **📋 Raw Swagger**: http://localhost:3000/swagger.json

## 🎯 **Clean Route Files**

Your route files are now completely clean - no documentation comments needed:

\`\`\`js
// routes/private/user.js
const express = require("express")
const userController = require("../../controllers/userController")
const { validate, schemas } = require("../../middleware/validation")

const router = express.Router()

router.get("/profile", userController.getProfile)
router.put("/profile", validate(schemas.updateProfile), userController.updateProfile)
router.get("/all", authorize("admin"), userController.getAllUsers)
router.get("/:id", validate(schemas.getUserById), userController.getUserById)

module.exports = router
\`\`\`

**That's it!** The system automatically generates:
- Complete Swagger documentation
- Parameter detection from validation schemas
- Response documentation from controller analysis
- Security requirements from middleware usage

## 🔧 **Commands**

\`\`\`bash
npm run dev          # Start with auto-documentation
npm run start        # Production start
npm run swagger      # Generate docs manually
npm run format       # Format code
npm run lint         # Check code quality
\`\`\`

## 🎉 **Benefits**

- **Zero Maintenance**: Documentation updates automatically
- **Always Accurate**: Docs match your actual code
- **Professional**: Interactive Swagger UI with testing
- **Fast Development**: Focus on code, not documentation
- **Team Friendly**: New developers can understand APIs instantly

The documentation is **completely hands-off** - just write your routes and controllers, and get professional API documentation automatically!
