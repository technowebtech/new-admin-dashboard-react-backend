const express = require("express")
const userController = require("../../../controllers/userController")
const { authenticateToken, authorize } = require("../../../middleware/auth")

const router = express.Router()

// Apply authentication middleware to all user routes
router.use(authenticateToken)

router.get("/profile", userController.getProfile)
router.put("/profile",  userController.updateProfile)
router.get("/list", authorize("admin"), userController.getAllUsers)
router.get("/:id",  userController.getUserById)
router.get("/search/:key/:value",  userController.searchByKey)

module.exports = router
