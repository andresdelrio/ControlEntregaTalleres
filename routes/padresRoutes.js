// routes/padresRoutes.js
const express = require('express');
const router = express.Router();
const padresController = require('../controllers/padresController');

router.get('/consultar-talleres', padresController.consultarTalleres);

module.exports = router;
