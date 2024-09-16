// routes/reportesRoutes.js

const express = require('express');
const router = express.Router();
const reportesController = require('../controllers/reportesController');

router.get('/no-entregados', reportesController.obtenerEstudiantesNoEntregados);

module.exports = router;
