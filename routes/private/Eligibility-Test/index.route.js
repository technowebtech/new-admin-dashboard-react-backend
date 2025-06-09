const express = require('express');
const eligibilityTestController = require('./eligibilityTestController');
const { authenticateToken } = require('../../../middleware/auth');

const router = express.Router();

// Apply authentication middleware to eligibilityTest user routes
router.use(authenticateToken);
/**
 * @swagger
 * /api/v1/eligibility-test/list:
 *   get:
 *     tags: [Eligibility Test]
 *     summary: Get all eligibility tests with pagination
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
 *         description: List of eligibility tests with pagination
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
 *                   items:
 *                     $ref: '#/components/schemas/Eligibility Test'
 */


/**
 * @swagger
 * /api/v1/eligibility-test/create:
 *   post:
 *     tags: [Eligibility Test]
 *     summary: Create a new eligibility test
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - classId
 *               - sectionId
 *               - fileName
 *               - filePath
 *             properties:
 *               classId:
 *                 type: integer
 *                 example: 3
 *               sectionId:
 *                 type: integer
 *                 example: 7
 *               fileName:
 *                 type: string
 *                 example: "EligibilityTest_Math_9A.pdf"
 *               filePath:
 *                 type: string
 *                 example: "/uploads/tests/EligibilityTest_Math_9A.pdf"
 *     responses:
 *       201:
 *         description: Eligibility test created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: Eligibility Test created successfully
 *                 data:
 *                   type: object
 *                   properties:
 *                     EligibilityTestId:
 *                       type: integer
 *                       example: 45
 *       500:
 *         description: Internal server error
 */


/**
 * @swagger
 * /api/v1/eligibility-test/{id}:
 *   get:
 *     tags: [Eligibility Test]
 *     summary: Get eligibility test by ID
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID of the eligibility test
 *     responses:
 *       200:
 *         description: Eligibility test found
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: boolean
 *                 data:
 *                   $ref: '#/components/schemas/Eligibility Test'
 *       404:
 *         description: Eligibility test not found
 */


/**
 * @swagger
 * components:
 *   schemas:
 *     Eligibility Test:
 *       type: object
 *       properties:
 *         id:
 *           type: integer
 *           example: 45
 *         class_id:
 *           type: integer
 *           example: 3
 *         section_id:
 *           type: integer
 *           example: 7
 *         file_name:
 *           type: string
 *           example: "EligibilityTest_Math_9A.pdf"
 *         file_path:
 *           type: string
 *           example: "/uploads/tests/EligibilityTest_Math_9A.pdf"
 *         created_by:
 *           type: integer
 *           example: 1
 *         created_at:
 *           type: string
 *           format: date-time
 */


router.get('/list', eligibilityTestController.getAllEligibilityTest);
router.post('/create', eligibilityTestController.createEligibilityTest);
router.get('/:id', eligibilityTestController.getEligibilityTestById);

module.exports = router;
