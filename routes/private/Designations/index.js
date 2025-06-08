const express = require('express');
const designationController = require('../../../controllers/designationController');
const { authenticateToken } = require('../../../middleware/auth');

const router = express.Router();

// Apply authentication middleware to designation user routes
router.use(authenticateToken);
router.get('/list', designationController.getAllDesignations);
router.get('/:id', designationController.getDesignationById);

module.exports = router;
