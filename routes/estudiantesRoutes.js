// routes/estudiantesRoutes.js
const express = require('express');
const router = express.Router();
const estudiantesController = require('../controllers/estudiantesController');

router.get('/', estudiantesController.obtenerEstudiantes);

module.exports = router;
