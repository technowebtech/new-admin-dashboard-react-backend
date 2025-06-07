const express = require("express")
const { authenticateToken } = require("../../middleware/auth")
const userRoutes = require("./user")
const teacherRoutes = require("./teacher")

const router = express.Router()

// Apply authentication middleware to all private routes
router.use(authenticateToken)

// Private routes (authentication required)
router.use("/user", userRoutes)
router.use("/teacher", teacherRoutes)

module.exports = router
