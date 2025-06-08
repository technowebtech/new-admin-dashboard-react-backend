const express = require('express');
const sectionController = require('../../../controllers/sectionController');
const { authenticateToken } = require('../../../middleware/auth');

const router = express.Router();

// Apply authentication middleware to all user routes
router.use(authenticateToken);

router.get('/list', sectionController.getAllSection);
router.get('/:id', sectionController.getById);

module.exports = router;
