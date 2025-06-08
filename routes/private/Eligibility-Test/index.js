const express = require('express');
const eligibilityTestController = require('../../../controllers/eligibilityTestController');
const { authenticateToken } = require('../../../middleware/auth');

const router = express.Router();

// Apply authentication middleware to eligibilityTest user routes
router.use(authenticateToken);
router.get('/list', eligibilityTestController.getAllEligibilityTest);
router.get('/:id', eligibilityTestController.getEligibilityTestById);

module.exports = router;
