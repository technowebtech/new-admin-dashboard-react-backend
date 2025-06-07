const express = require("express")
const authController = require("../../../controllers/authController")
const { validate, schemas } = require("../../../middleware/validation")

const router = express.Router()

router.post("/register", validate(schemas.register), authController.register)
router.post("/login", validate(schemas.login), authController.login)

module.exports = router
