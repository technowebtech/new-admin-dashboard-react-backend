const express = require("express")
const userController = require("../../controllers/userController")
const { validate, schemas } = require("../../middleware/validation")
const { authorize } = require("../../middleware/auth")

const router = express.Router()

router.get("/profile", userController.getProfile)
router.put("/profile", validate(schemas.updateProfile), userController.updateProfile)
router.get("/all", authorize("admin"), userController.getAllUsers)
router.get("/:id", validate(schemas.getUserById), userController.getUserById)

module.exports = router
