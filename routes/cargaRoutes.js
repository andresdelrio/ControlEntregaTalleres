// routes/cargaRoutes.js
const express = require('express');
const router = express.Router();
const cargaController = require('../controllers/cargaController');
const multer = require('multer');
const upload = multer({ dest: 'uploads/' });

router.post('/carga-unificada', upload.single('file'), cargaController.cargaMasivaUnificada);

module.exports = router;
