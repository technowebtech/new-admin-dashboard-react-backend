const express = require('express');
const sectionController = require('./sectionController');
const { authenticateToken } = require('../../../middleware/auth');

const router = express.Router();

// Apply authentication middleware to all user routes
router.use(authenticateToken);
/**
 * @swagger
 * tags:
 *   name: Class Sections
 *   description: Endpoints for managing class sections
 */

/**
 * @swagger
 * /api/v1/sections/list:
 *   get:
 *     tags: [Class Sections]
 *     summary: Get all class sections
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
 *         description: List of sections
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
 *                   example: 42
 *                 totalPages:
 *                   type: integer
 *                   example: 5
 *                 data:
 *                   type: array
 *                  
 */

/**
 * @swagger
 * /api/v1/sections/{id}:
 *   get:
 *     tags: [Class Sections]
 *     summary: Get a section by ID
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Section ID
 *     responses:
 *       200:
 *         description: Section data
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: boolean
 *                 data:
 *                   $ref: '#/components/schemas/Class Sections'
 *       404:
 *         description: Section not found
 */

/**
 * @swagger
 * /api/v1/sections/class/{id}:
 *   get:
 *     tags: [Class Sections]
 *     summary: Get sections by class ID
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Class ID
 *     responses:
 *       200:
 *         description: List of sections for the class
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: boolean
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Class Sections'
 *       404:
 *         description: No sections found
 */

/**
 * @swagger
 * /api/v1/sections/search/{key}/{value}:
 *   get:
 *     tags: [Class Sections]
 *     summary: Search sections by key and value
 *     parameters:
 *       - in: path
 *         name: key
 *         required: true
 *         schema:
 *           type: string
 *           enum: [id, class_id, Class Sections_name]
 *       - in: path
 *         name: value
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Matching section(s)
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: boolean
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Class Sections'
 *       400:
 *         description: Invalid search key
 *       404:
 *         description: No data found
 */

/**
 * @swagger
 * components:
 *   schemas:
 *     Class Sections:
 *       type: object
 *       properties:
 *         id:
 *           type: integer
 *         class_id:
 *           type: integer
 *         Class Sections_name:
 *           type: string
 *         created_at:
 *           type: string
 *           format: date-time
 *         updated_at:
 *           type: string
 *           format: date-time
 */

router.get('/list', sectionController.getAllSection);
router.get('/class/:id', sectionController.getSectionByClassId);
router.get("/search/:key/:value",  sectionController.searchSectionByKey)
router.get('/:id', sectionController.getById);

module.exports = router;
