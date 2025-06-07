const bcrypt = require("bcryptjs")
const jwt = require("jsonwebtoken")
const { executeQuery, getDatabaseFromContext } = require("../config/database")

/**
 * Register a new user
 */
const register = async (req, res) => {
  try {
    const { name, email, password } = req.body
    const dbName = getDatabaseFromContext(req) // Internal database selection

    // Check if user already exists
    const existingUsers = await executeQuery("SELECT id FROM users WHERE email = ?", [email], dbName)

    if (existingUsers.length > 0) {
      return res.status(409).json({
        status: "error",
        message: "User with this email already exists",
      })
    }

    // Hash password
    const saltRounds = 12
    const hashedPassword = await bcrypt.hash(password, saltRounds)

    // Insert new user
    const result = await executeQuery(
      "INSERT INTO users (name, email, password, role, status, created_at) VALUES (?, ?, ?, ?, ?, NOW())",
      [name, email, hashedPassword, "user", "active"],
      dbName,
    )

    res.status(201).json({
      status: "success",
      message: "User registered successfully",
      data: {
        userId: result.insertId,
        name,
        email,
      },
    })
  } catch (error) {
    console.error("Register error:", error)
    res.status(500).json({
      status: "error",
      message: "Internal server error",
    })
  }
}

/**
 * Login user
 */
const login = async (req, res) => {
  try {
    const { email, password } = req.body
    const dbName = getDatabaseFromContext(req) // Internal database selection

    // Find user by email
    const users = await executeQuery(
      "SELECT id, name, email, password, role, status FROM users WHERE email = ?",
      [email],
      dbName,
    )

    if (users.length === 0) {
      return res.status(401).json({
        status: "error",
        message: "Invalid email or password",
      })
    }

    const user = users[0]

    // Check if user is active
    if (user.status !== "active") {
      return res.status(401).json({
        status: "error",
        message: "Account is not active",
      })
    }

    // Verify password
    const isPasswordValid = await bcrypt.compare(password, user.password)
    if (!isPasswordValid) {
      return res.status(401).json({
        status: "error",
        message: "Invalid email or password",
      })
    }

    // Generate JWT token
    const token = jwt.sign(
      {
        userId: user.id,
        email: user.email,
        role: user.role,
      },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || "7d" },
    )

    // Update last login
    await executeQuery("UPDATE users SET last_login = NOW() WHERE id = ?", [user.id], dbName)

    res.status(200).json({
      status: "success",
      message: "Login successful",
      data: {
        token,
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
        },
      },
    })
  } catch (error) {
    console.error("Login error:", error)
    res.status(500).json({
      status: "error",
      message: "Internal server error",
    })
  }
}

module.exports = {
  register,
  login,
}
