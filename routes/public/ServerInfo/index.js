const express = require('express');
const serverInfoController = require('../../../controllers/serverInfoController');

const router = express.Router();
router.get('/heath', serverInfoController.getHeath);
router.get('/matrix', serverInfoController.getMatrix);

module.exports = router;
