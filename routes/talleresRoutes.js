// routes/talleresRoutes.js
const express = require('express');
const router = express.Router();
const talleresController = require('../controllers/talleresController');
const { createEditCodeGuard } = require('../middleware/requireEditCode');

const requireEditCode = createEditCodeGuard();

router.get('/', talleresController.obtenerTalleres);
router.post('/verificar-codigo', requireEditCode, (req, res) => {
  res.json({ message: 'Edición habilitada.' });
});
router.post('/entrega-estudiante', requireEditCode, talleresController.registrarEntregaEstudiante);
router.post('/entrega-docente', requireEditCode, talleresController.registrarEntregaDocente);
router.post('/actualizar-observaciones', requireEditCode, talleresController.actualizarObservaciones);

module.exports = router;
