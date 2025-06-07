const express = require("express")
const teacherController = require("../../../controllers/teacherController")
const { validate, schemas } = require("../../../middleware/validation")
const { authenticateToken, authorize } = require("../../../middleware/auth")

const router = express.Router()

// Apply authentication middleware to all teacher routes
router.use(authenticateToken)

router.get("/profile", teacherController.getProfile)
router.put("/profile", validate(schemas.updateTeacher), teacherController.updateProfile)
router.get("/list", authorize("admin"), teacherController.getAllTeachers)
router.get("/:id", validate(schemas.getTeacherById), teacherController.getTeacherById)
router.post("/", authorize("admin"), validate(schemas.createTeacher), teacherController.createTeacher)
router.put("/:id", authorize("admin"), validate(schemas.updateTeacher), teacherController.updateTeacher)
router.delete("/:id", authorize("admin"), teacherController.deleteTeacher)

module.exports = router
