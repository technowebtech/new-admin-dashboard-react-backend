const express = require("express")
const userController = require("./userController")
const { authenticateToken, authorize } = require("../../../middleware/auth")

const router = express.Router()

// Apply authentication middleware to all user routes
router.use(authenticateToken)
/**
 * @swagger
 * tags:
 *   name: Users
 *   description: User management and profile operations
 */

/**
 * @swagger
 * /api/v1/users/profile:
 *   get:
 *     tags: [Users]
 *     summary: Get current user's profile
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: User profile data
 *       401:
 *         description: Unauthorized
 *
 *   put:
 *     tags: [Users]
 *     summary: Update current user's profile
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               email:
 *                 type: string
 *     responses:
 *       200:
 *         description: Profile updated
 *       400:
 *         description: Bad request
 *       401:
 *         description: Unauthorized
 */
/**
 * @swagger
 * /api/v1/users/list:
 *   get:
 *     tags: [Users]
 *     summary: Get all users (Admin only)
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: Page number for pagination
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *         description: Number of users per page
 *     responses:
 *       200:
 *         description: Paginated list of users
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: object
 *                   properties:
 *                     users:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           id:
 *                             type: integer
 *                           name:
 *                             type: string
 *                           email:
 *                             type: string
 *                           phone:
 *                             type: string
 *                           role:
 *                             type: string
 *                           status:
 *                             type: string
 *                           created_at:
 *                             type: string
 *                           last_login:
 *                             type: string
 *                     pagination:
 *                       type: object
 *                       properties:
 *                         page:
 *                           type: integer
 *                         limit:
 *                           type: integer
 *                         total:
 *                           type: integer
 *                         totalPages:
 *                           type: integer
 *       403:
 *         description: Forbidden - only accessible by admins
 *       500:
 *         description: Internal server error
 */


/**
 * @swagger
 * /api/v1/users/{id}:
 *   get:
 *     tags: [Users]
 *     summary: Get user by ID
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: User ID
 *     responses:
 *       200:
 *         description: User data
 *       404:
 *         description: User not found
 */

/**
 * @swagger
 * /api/v1/users/search/{key}/{value}:
 *   get:
 *     tags: [Users]
 *     summary: Search users by key and value
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: key
 *         required: true
 *         schema:
 *           type: string
 *           enum: [id, school_id, class_name, sort_name, other_name, cps_class_name]
 *         description: Search key field  *id, school_id, class_name, sort_name, other_name, cps_class_name*
 *       - in: path
 *         name: value
 *         required: true
 *         schema:
 *           type: string
 *         description: Value to search for
 *     responses:
 *       200:
 *         description: Matching users
 *       400:
 *         description: Invalid search criteria
 */

router.get("/profile", userController.getProfile)
router.put("/profile",  userController.updateProfile)
router.get("/list", authorize("admin"), userController.getAllUsers)
router.get("/:id",  userController.getUserById)
router.get("/search/:key/:value",  userController.searchByKey)

module.exports = router
