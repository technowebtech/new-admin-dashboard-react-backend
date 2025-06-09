/**
 * @swagger
 * tags:
 *   name: Server Info
 *   description: Server health and metrics endpoints
 */

/**
 * @swagger
 * /api/v1/serverinfo/heath:
 *   get:
 *     tags: [Server Info]
 *     summary: Check server health status
 *     responses:
 *       200:
 *         description: Server is healthy
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: OK
 */

/**
 * @swagger
 * /api/v1/serverinfo/matrix:
 *   get:
 *     tags: [Server Info]
 *     summary: Get server metrics
 *     responses:
 *       200:
 *         description: Metrics data returned
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               example:
 *                 uptime: 10234
 *                 memoryUsage:
 *                   rss: 12345678
 *                   heapTotal: 9876543
 *                   heapUsed: 8765432
 */

const express = require('express');
const serverInfoController = require('./serverInfoController');

const router = express.Router();
router.get('/heath', serverInfoController.getHeath);
router.get('/matrix', serverInfoController.getMatrix);

module.exports = router;
