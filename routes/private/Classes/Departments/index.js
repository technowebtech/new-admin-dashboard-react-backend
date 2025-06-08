const express = require('express');
const departmentController = require('../../../controllers/departmentController');
const { authenticateToken } = require('../../../middleware/auth');

const router = express.Router();

// Apply authentication middleware to all user routes
router.use(authenticateToken);
router.get('/list', departmentController.getAllDepartments);
router.get('/:id', departmentController.getDepartmentById);
router.get('/type/list', departmentController.getAllDepartmentsType);
router.get('type/:id', departmentController.getDepartmentTypeById);
router.get('/search/:key/:value', departmentController.searchDepartmentByKey);

module.exports = router;
