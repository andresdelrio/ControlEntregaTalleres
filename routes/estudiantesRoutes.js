// routes/estudiantesRoutes.js
const express = require('express');
const router = express.Router();
const estudiantesController = require('../controllers/estudiantesController');
const { accessSession } = require('../middleware/accessSession');

router.use(accessSession.requireApiAccess);
router.get('/', estudiantesController.obtenerEstudiantes);

module.exports = router;
