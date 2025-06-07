/**
 * Swagger decorators for automatic API documentation
 */

// Route decorator for automatic swagger generation
const SwaggerRoute = (config) => {
  return (target, propertyName, descriptor) => {
    const originalMethod = descriptor.value

    descriptor.value = function (...args) {
      const req = args[0]
      const res = args[1]

      // Add swagger metadata to request
      req.swaggerConfig = {
        ...config,
        method: req.method,
        path: req.route?.path || req.path,
        timestamp: new Date().toISOString(),
      }

      return originalMethod.apply(this, args)
    }

    return descriptor
  }
}

// Auto-generate swagger comments for routes
const generateSwaggerComment = (method, path, config) => {
  const {
    summary = `${method} ${path}`,
    description = `Auto-generated endpoint for ${path}`,
    tags = ["API"],
    security = [],
    parameters = [],
    requestBody = null,
    responses = {},
  } = config

  let comment = `
  /**
   * @swagger
   * ${path}:
   *   ${method.toLowerCase()}:
   *     summary: ${summary}
   *     description: ${description}
   *     tags: [${tags.map((tag) => `"${tag}"`).join(", ")}]`

  if (security.length > 0) {
    comment += `
   *     security:`
    security.forEach((sec) => {
      comment += `
   *       - ${sec}:`
    })
  }

  if (parameters.length > 0) {
    comment += `
   *     parameters:`
    parameters.forEach((param) => {
      comment += `
   *       - in: ${param.in}
   *         name: ${param.name}
   *         required: ${param.required || false}
   *         schema:
   *           type: ${param.type || "string"}
   *         description: ${param.description || ""}`
    })
  }

  if (requestBody) {
    comment += `
   *     requestBody:
   *       required: ${requestBody.required || true}
   *       content:
   *         application/json:
   *           schema:
   *             $ref: '#/definitions/${requestBody.schema}'`
  }

  comment += `
   *     responses:`

  Object.keys(responses).forEach((code) => {
    const response = responses[code]
    comment += `
   *       ${code}:
   *         description: ${response.description}
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/definitions/${response.schema}'`
  })

  comment += `
   */`

  return comment
}

// Middleware to auto-document API calls
const autoDocumentAPI = (req, res, next) => {
  const originalSend = res.send
  const startTime = Date.now()

  res.send = function (data) {
    const endTime = Date.now()
    const responseTime = endTime - startTime

    // Log API call for documentation
    console.log(`📝 API Call: ${req.method} ${req.originalUrl} - ${res.statusCode} (${responseTime}ms)`)

    // Store API metrics
    if (!global.apiMetrics) global.apiMetrics = []
    global.apiMetrics.push({
      method: req.method,
      path: req.originalUrl,
      statusCode: res.statusCode,
      responseTime,
      timestamp: new Date().toISOString(),
      userAgent: req.get("User-Agent"),
      ip: req.ip,
    })

    // Keep only last 1000 metrics to prevent memory issues
    if (global.apiMetrics.length > 1000) {
      global.apiMetrics = global.apiMetrics.slice(-1000)
    }

    return originalSend.call(this, data)
  }

  next()
}

module.exports = {
  SwaggerRoute,
  generateSwaggerComment,
  autoDocumentAPI,
}
