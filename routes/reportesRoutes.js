// routes/reportesRoutes.js

const express = require('express');
const router = express.Router();
const reportesController = require('../controllers/reportesController');
const { accessSession } = require('../middleware/accessSession');

router.use(accessSession.requireApiAccess);
router.get('/no-entregados', reportesController.obtenerEstudiantesNoEntregados);

module.exports = router;
