/**
 * Global error handling middleware
 */
const errorHandler = (err, req, res, next) => {
  console.error("Error:", err)

  // Default error
  const error = {
    status: "error",
    message: err.message || "Internal Server Error",
  }

  // MySQL errors
  if (err.code === "ER_DUP_ENTRY") {
    error.message = "Duplicate entry found"
    return res.status(409).json(error)
  }

  if (err.code === "ER_NO_REFERENCED_ROW_2") {
    error.message = "Referenced record not found"
    return res.status(400).json(error)
  }

  // JWT errors
  if (err.name === "JsonWebTokenError") {
    error.message = "Invalid token"
    return res.status(401).json(error)
  }

  if (err.name === "TokenExpiredError") {
    error.message = "Token expired"
    return res.status(401).json(error)
  }

  // Validation errors
  if (err.name === "ValidationError") {
    error.message = "Validation failed"
    return res.status(400).json(error)
  }

  // Default server error
  res.status(500).json(error)
}

module.exports = errorHandler
