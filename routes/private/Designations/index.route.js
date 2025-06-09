const express = require('express');
const designationController = require('./designationController');
const { authenticateToken } = require('../../../middleware/auth');

const router = express.Router();

// Apply authentication middleware to designation user routes
router.use(authenticateToken);

/**
 * @swagger
 * /api/v1/designations/list:
 *   get:
 *     tags: [Designation]
 *     summary: Get all designations with pagination
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: Page number
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *         description: Number of records per page
 *     responses:
 *       200:
 *         description: List of designations
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: boolean
 *                   example: true
 *                 page:
 *                   type: integer
 *                   example: 1
 *                 limit:
 *                   type: integer
 *                   example: 10
 *                 total:
 *                   type: integer
 *                   example: 50
 *                 totalPages:
 *                   type: integer
 *                   example: 5
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Designation'
 *
 * /api/v1/designations/{id}:
 *   get:
 *     tags: [Designation]
 *     summary: Get designation by ID
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Designation ID
 *     responses:
 *       200:
 *         description: Designation details
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/Designation'
 *       404:
 *         description: Designation not found
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: boolean
 *                   example: false
 *                 message:
 *                   type: string
 *                   example: Designation not found
 */


/**
 * @swagger
 * components:
 *   schemas:
 *     Designation:
 *       type: object
 *       properties:
 *         id:
 *           type: integer
 *           example: 1
 *         title:
 *           type: string
 *           example: Senior Developer
 *         description:
 *           type: string
 *           example: Responsible for backend development
 *         createdAt:
 *           type: string
 *           format: date-time
 *           example: 2025-06-09T12:00:00Z
 *         updatedAt:
 *           type: string
 *           format: date-time
 *           example: 2025-06-10T12:00:00Z
 */


router.get('/list', designationController.getAllDesignations);
router.get('/:id', designationController.getDesignationById);

module.exports = router;
