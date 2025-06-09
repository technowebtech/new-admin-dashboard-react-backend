const express = require('express');
const classesController = require('./classesController');
const { authenticateToken } = require('../../../middleware/auth');
const router = express.Router();

// Apply authentication middleware to all class routes
router.use(authenticateToken);
/**
 * @swagger
 * /api/v1/classes/list:
 *   get:
 *     tags: [Classes]
 *     summary: Get all classes with pagination
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
 *         description: Number of records per page
 *     responses:
 *       200:
 *         description: List of classes
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
 *                   example: 100
 *                 totalPages:
 *                   type: integer
 *                   example: 10
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Class'
 *
 * /api/v1/classes/search/{key}/{value}:
 *   get:
 *     tags: [Classes]
 *     summary: Search classes by key and value
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: key
 *         required: true
 *         schema:
 *           type: string
 *           enum: [id, school_id, class_name, sort_name, other_name, cps_class_name]
 *         description: Key to search by
 *       - in: path
 *         name: value
 *         required: true
 *         schema:
 *           type: string
 *         description: Value to search for
 *     responses:
 *       200:
 *         description: Search results
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Class'
 *       404:
 *         description: No classes found
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
 *                   example: No data found
 *
 * /api/v1/classes/{id}:
 *   get:
 *     tags: [Classes]
 *     summary: Get class by ID
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Class ID
 *     responses:
 *       200:
 *         description: Class details
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/Class'
 *       404:
 *         description: Class not found
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
 *                   example: Class not found
 */

/**
 * @swagger
 * components:
 *   schemas:
 *     Class:
 *       type: object
 *       properties:
 *         id:
 *           type: integer
 *           example: 1
 *         school_id:
 *           type: integer
 *           example: 10
 *         class_name:
 *           type: string
 *           example: "10th Grade"
 *         sort_name:
 *           type: string
 *           example: "X"
 *         other_name:
 *           type: string
 *           example: "Senior Secondary"
 *         cps_class_name:
 *           type: string
 *           example: "CPS10"
 */

router.get('/list', classesController.getAllClasses);
router.get('/search/:key/:value', classesController.searchClassByKey);
router.get('/:id', classesController.getById);

module.exports = router;
