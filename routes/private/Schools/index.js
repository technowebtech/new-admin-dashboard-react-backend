const express = require('express');
const schoolController = require('../../../controllers/schoolController');
const { authenticateToken } = require('../../../middleware/auth');

const router = express.Router();

// Apply authentication middleware to all user routes
router.use(authenticateToken);
router.get('/list', schoolController.getAllSchool);
router.get('/:id', schoolController.getById);
router.get('/search/:key/:value', schoolController.searchSchoolByKey);

module.exports = router;
