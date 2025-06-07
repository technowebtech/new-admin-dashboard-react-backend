const jwt = require("jsonwebtoken")
const db = require("../config/database")

/**
 * Authentication middleware to verify JWT tokens
 */
const authenticateToken = async (req, res, next) => {
  try {
    const authHeader = req.headers["authorization"]
    const token = authHeader && authHeader.split(" ")[1] // Bearer TOKEN

    if (!token) {
      return res.status(401).json({
        status: "error",
        message: "Access token is required",
      })
    }

    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET)

    // Check if user still exists - preserving MySQL timestamp format
    const [users] = await db.execute(
      'SELECT id, email, name, role, status FROM users WHERE id = ? AND status = "active"',
      [decoded.userId],
    )

    if (users.length === 0) {
      return res.status(401).json({
        status: "error",
        message: "User not found or inactive",
      })
    }

    // Add user info to request object
    req.user = {
      id: users[0].id,
      email: users[0].email,
      name: users[0].name,
      role: users[0].role,
    }

    next()
  } catch (error) {
    if (error.name === "JsonWebTokenError") {
      return res.status(401).json({
        status: "error",
        message: "Invalid token",
      })
    }

    if (error.name === "TokenExpiredError") {
      return res.status(401).json({
        status: "error",
        message: "Token expired",
      })
    }

    console.error("Auth middleware error:", error)
    return res.status(500).json({
      status: "error",
      message: "Internal server error",
    })
  }
}

/**
 * Role-based authorization middleware
 */
const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        status: "error",
        message: "Authentication required",
      })
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        status: "error",
        message: "Insufficient permissions",
      })
    }

    next()
  }
}

module.exports = {
  authenticateToken,
  authorize,
}
