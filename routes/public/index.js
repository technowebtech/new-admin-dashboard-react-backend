const express = require("express")
const authRoutes = require("./auth")

const router = express.Router()

// Public routes (no authentication required)
router.use("/auth", authRoutes)

module.exports = router
