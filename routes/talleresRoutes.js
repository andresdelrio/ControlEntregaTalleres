// routes/talleresRoutes.js
const express = require('express');
const router = express.Router();
const talleresController = require('../controllers/talleresController');

router.get('/', talleresController.obtenerTalleres);
router.post('/entrega-estudiante', talleresController.registrarEntregaEstudiante);
router.post('/entrega-docente', talleresController.registrarEntregaDocente);
router.post('/actualizar-observaciones', talleresController.actualizarObservaciones);


module.exports = router;
