const express = require('express');
const classesController = require('../../../controllers/classesController');
const { authenticateToken } = require('../../../middleware/auth');
const router = express.Router();

// Apply authentication middleware to all class routes
router.use(authenticateToken);

router.get('/list', classesController.getAllClasses);
router.get('/:id', classesController.getById);
router.get('/search/:key/:value', classesController.searchClassByKey);

module.exports = router;
