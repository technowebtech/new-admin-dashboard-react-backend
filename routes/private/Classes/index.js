const express = require('express');
const classesController = require('../../../controllers/classesController');
const { authenticateToken, validate } = require('../../../middleware/auth');
const classSchemasValidation = require('../../../schemas/classSchemasValidation');
const router = express.Router();

// Apply authentication middleware to all user routes
router.use(authenticateToken);

router.get('/list', classesController.getAllClasses);
router.get('/:id', classesController.getById);
router.get('/search/:key/:value',validate(classSchemasValidation.searchByKey),classesController.searchByKey);

module.exports = router;
