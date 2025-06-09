const express = require('express');
const departmentController = require('./departmentController');
const { authenticateToken } = require('../../../middleware/auth');

const router = express.Router();

// Apply authentication middleware to all user routes
router.use(authenticateToken);

/**
 * @swagger
 * /api/v1/department/list:
 *   get:
 *     tags: [Department]
 *     summary: Get all departments with pagination
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
 *         description: List of departments
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
 *                     $ref: '#/components/schemas/Department'
 *
 * /api/v1/department/type/list:
 *   get:
 *     tags: [Department]
 *     summary: Get all department types
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of department types
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
 *                     $ref: '#/components/schemas/DepartmentType'
 *
 * /api/v1/department/type/{id}:
 *   get:
 *     tags: [Department]
 *     summary: Get department type by ID
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Department type ID
 *     responses:
 *       200:
 *         description: Department type details
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/DepartmentType'
 *       404:
 *         description: Department type not found
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
 *                   example: Department type not found
 *
 * /api/v1/department/search/{key}/{value}:
 *   get:
 *     tags: [Department]
 *     summary: Search department by key and value
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: key
 *         required: true
 *         schema:
 *           type: string
 *           enum: [id, department_name]
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
 *                     $ref: '#/components/schemas/Department'
 *       404:
 *         description: No matching departments found
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
 * /api/v1/department/{id}:
 *   get:
 *     tags: [Department]
 *     summary: Get department by ID
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Department ID
 *     responses:
 *       200:
 *         description: Department details
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/Department'
 *       404:
 *         description: Department not found
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
 *                   example: Department not found
 */

/**
 * @swagger
 * components:
 *   schemas:
 *     Department:
 *       type: object
 *       properties:
 *         id:
 *           type: integer
 *           example: 1
 *         department_name:
 *           type: string
 *           example: Human Resources
 *
 *     DepartmentType:
 *       type: object
 *       properties:
 *         id:
 *           type: integer
 *           example: 10
 *         type_name:
 *           type: string
 *           example: Academic
 */


router.get('/list', departmentController.getAllDepartments);
router.get('/type/list', departmentController.getAllDepartmentsType);
router.get('type/:id', departmentController.getDepartmentTypeById);
router.get('/search/:key/:value', departmentController.searchDepartmentByKey);
router.get('/:id', departmentController.getDepartmentById);

module.exports = router;
