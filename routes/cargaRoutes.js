// routes/cargaRoutes.js
const express = require('express');
const router = express.Router();
const cargaController = require('../controllers/cargaController');
const multer = require('multer');
const upload = multer({ dest: 'uploads/' });

router.post('/estudiantes', upload.single('file'), cargaController.cargaMasivaEstudiantes);
router.post('/materias-reprobadas', upload.single('file'), cargaController.cargaMasivaMateriasReprobadas);

module.exports = router;
