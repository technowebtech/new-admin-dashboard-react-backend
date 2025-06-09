const express = require('express');
const schoolController = require('./schoolController');
const { authenticateToken } = require('../../../middleware/auth');

const router = express.Router();

// Apply authentication middleware to all user routes
router.use(authenticateToken);

/**
 * @swagger
 * tags:
 *   name: School
 *   description: Endpoints for managing school data
 */

/**
 * @swagger
 * /api/v1/school/list:
 *   get:
 *     tags: [School]
 *     summary: Get all schools
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
 *         description: List of schools
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
 *                     $ref: '#/components/schemas/School'
 */

/**
 * @swagger
 * /api/v1/school/search/{key}/{value}:
 *   get:
 *     tags: [School]
 *     summary: Search schools by key and value
 *     parameters:
 *       - in: path
 *         name: key
 *         required: true
 *         schema:
 *           type: string
 *           enum: [id, school_name, sort_name, abbr, gr_name, sub_name, state, ci, full_name]
 *         description: Field to search on
 *       - in: path
 *         name: value
 *         required: true
 *         schema:
 *           type: string
 *         description: Value to search for
 *     responses:
 *       200:
 *         description: Matching school(s)
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
 *                     $ref: '#/components/schemas/School'
 *       400:
 *         description: Invalid search key
 *       404:
 *         description: No matching records found
 */

/**
 * @swagger
 * /api/v1/school/{id}:
 *   get:
 *     tags: [School]
 *     summary: Get school by ID
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: School ID
 *     responses:
 *       200:
 *         description: School data
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: boolean
 *                 data:
 *                   $ref: '#/components/schemas/School'
 *       404:
 *         description: School not found
 */

/**
 * @swagger
 * components:
 *   schemas:
 *     School:
 *       type: object
 *       properties:
 *         id:
 *           type: integer
 *         school_name:
 *           type: string
 *         sort_name:
 *           type: string
 *         abbr:
 *           type: string
 *         gr_name:
 *           type: string
 *         sub_name:
 *           type: string
 *         state:
 *           type: string
 *         ci:
 *           type: string
 *         full_name:
 *           type: string
 *         created_at:
 *           type: string
 *           format: date-time
 *         updated_at:
 *           type: string
 *           format: date-time
 */

router.get('/list', schoolController.getAllSchool);
router.get('/search/:key/:value', schoolController.searchSchoolByKey);
router.get('/:id', schoolController.getById);

module.exports = router;
