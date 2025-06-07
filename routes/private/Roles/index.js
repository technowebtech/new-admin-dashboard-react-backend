const express = require('express');
const roleController = require('../../../controllers/roleController');
const { authenticateToken } = require('../../../middleware/auth');

const router = express.Router();

// Apply authentication middleware to all user routes
router.use(authenticateToken);

router.get('/', roleController.getAllRoles);
// router.get('/list', roleController.getAllRoles);
router.get('/:id', roleController.getById);

module.exports = router;
