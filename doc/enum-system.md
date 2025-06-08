# Hierarchical Enum System

This document explains the hierarchical enum system implemented in the API documentation generator. The system allows you to define enums at different levels of specificity, with more specific definitions overriding more general ones.

## Enum Hierarchy

Enums can be defined at four different levels, from most general to most specific:

1. **Controller Level**: Applies to all methods in a controller
2. **Method Level**: Applies only to a specific controller method
3. **Route Level**: Applies to all endpoints in a route file
4. **Endpoint Level**: Applies only to a specific endpoint in a route file

## Defining Enums

### Controller Level Enums

Place these at the top of your controller file, outside any method:

\`\`\`javascript
/**
 * Controller-level enums (apply to all methods in this controller)
 * @enum status: ['active', 'inactive', 'suspended'] - User status options
 * @enum role: ['admin', 'teacher', 'student', 'user'] - User role options
 * @queryEnum sortBy: ['id', 'name', 'email'] - Sort field options
 * @paramEnum type: ['public', 'private'] - Type parameter options
 */
\`\`\`

### Method Level Enums

Place these in the JSDoc comment for a specific method:

\`\`\`javascript
/**
 * Update user profile
 * Method-level enums (apply only to this method)
 * @enum bio_length: ['short', 'medium', 'long'] - Bio length options
 * @queryEnum status: ['active', 'inactive', 'all'] - Status filter options
 */
const updateProfile = async (req, res) => {
  // Method implementation
}
\`\`\`

### Route Level Enums

Place these at the top of your route file, outside any endpoint definition:

\`\`\`javascript
/**
 * Route-level enums (apply to all endpoints in this route)
 * @routeEnum status: ['active', 'inactive', 'suspended', 'all'] - Filter by status
 * @routeEnum sort: ['asc', 'desc'] - Sort direction
 */
\`\`\`

### Endpoint Level Enums

Place these in the comment right before a specific endpoint:

\`\`\`javascript
/**
 * @endpointEnum sortBy: ['id', 'name', 'email', 'created_at'] - Sort field
 * @endpointEnum format: ['json', 'csv', 'xml'] - Response format
 */
router.get("/list", authorize("admin"), userController.getAllUsers)
\`\`\`

## Enum Types

There are three types of enums you can define:

1. **Body Field Enums**: Use `@enum` for request body fields
2. **Path Parameter Enums**: Use `@paramEnum` for path parameters
3. **Query Parameter Enums**: Use `@queryEnum` for query parameters

For route and endpoint level, use:
1. **Route Enums**: Use `@routeEnum` for route-level enums
2. **Endpoint Enums**: Use `@endpointEnum` for endpoint-level enums

## Syntax

The syntax for defining enums is:

\`\`\`
@<enum_type> <name>: [<value1>, <value2>, ...] - <description>
\`\`\`

For example:
\`\`\`
@enum status: ['active', 'inactive', 'suspended'] - User status options
\`\`\`

## Inline Enums

The system also automatically detects inline enums in your code:

\`\`\`javascript
// Allowed keys array
const allowedKeys = ["id", "school_id", "class_name", "sort_name"]
if (!allowedKeys.includes(key)) {
  return res.status(400).json({ error: "Invalid key" })
}

// Validation check
if (!["asc", "desc"].includes(sort)) {
  return res.status(400).json({ error: "Invalid sort direction" })
}
\`\`\`

## Override Behavior

When the same enum is defined at multiple levels, the most specific definition takes precedence:

1. Endpoint-level enums override route-level enums
2. Method-level enums override controller-level enums
3. When connecting routes to controllers, method-level enums override route-level enums, and endpoint-level enums override all others

## Examples

### Example 1: User Search Endpoint

\`\`\`javascript
// In userController.js
/**
 * @enum status: ['active', 'inactive', 'suspended'] - User status options
 */

/**
 * Search users by key-value pair
 * @paramEnum key: ['id', 'school_id', 'class_name'] - Search key field
 */
const searchUsers = async (req, res) => {
  // Implementation
}

// In routes/users.js
/**
 * @routeEnum format: ['json', 'csv'] - Response format options
 */

/**
 * @endpointEnum format: ['json', 'csv', 'xml', 'pdf'] - Response format
 */
router.get("/search/:key/:value", userController.searchUsers)
\`\`\`

In this example:
- The `status` enum is available to all methods in the controller
- The `key` path parameter enum is specific to the `searchUsers` method
- The endpoint-level `format` enum overrides the route-level one, adding 'xml' and 'pdf' options

### Example 2: Teacher List Endpoint

\`\`\`javascript
// In teacherController.js
/**
 * @enum subject: ['Mathematics', 'Physics', 'Chemistry'] - Subject options
 */

/**
 * Get all teachers
 * @queryEnum department: ['Science', 'Arts', 'Commerce'] - Department filter
 */
const getAllTeachers = async (req, res) => {
  // Implementation
}

// In routes/teachers.js
/**
 * @endpointEnum experience: ['0-1 years', '1-3 years', '3-5 years'] - Experience filter
 */
router.get("/list", authorize("admin"), teacherController.getAllTeachers)
\`\`\`

In this example:
- The `subject` enum is available to all methods in the controller
- The `department` query parameter enum is specific to the `getAllTeachers` method
- The `experience` query parameter enum is specific to the `/list` endpoint

## Benefits

1. **Scoped Definitions**: Define enums exactly where they're needed
2. **DRY Code**: Define common enums once at the controller or route level
3. **Override Capability**: Override general enums with more specific ones when needed
4. **Automatic Detection**: The system automatically detects and applies enums to the right parameters
5. **Improved Documentation**: Enums are automatically added to Swagger UI as dropdown menus
\`\`\`

Let's create a test script to run the enum system:
