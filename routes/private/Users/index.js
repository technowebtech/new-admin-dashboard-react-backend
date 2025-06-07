const express = require("express")
const userController = require("../../../controllers/userController")
const { validate, schemas } = require("../../../middleware/validation")
const { authenticateToken, authorize } = require("../../../middleware/auth")

const router = express.Router()

// Apply authentication middleware to all user routes
router.use(authenticateToken)

router.get("/profile", userController.getProfile)
router.put("/profile", validate(schemas.updateProfile), userController.updateProfile)
router.get("/list", authorize("admin"), userController.getAllUsers)
router.get("/:id", validate(schemas.getUserById), userController.getUserById)

module.exports = router
