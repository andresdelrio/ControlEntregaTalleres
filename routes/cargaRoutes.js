// routes/cargaRoutes.js
const express = require('express');
const router = express.Router();
const cargaController = require('../controllers/cargaController');
const multer = require('multer');
const path = require('path');
const { accessSession } = require('../middleware/accessSession');

const allowedExtensions = new Set(['.xlsx', '.csv']);
const upload = multer({
  dest: path.join(__dirname, '..', 'uploads'),
  limits: {
    fileSize: 5 * 1024 * 1024,
    files: 1,
  },
  fileFilter: (req, file, callback) => {
    const extension = path.extname(file.originalname).toLowerCase();
    if (!allowedExtensions.has(extension)) {
      return callback(new multer.MulterError('LIMIT_UNEXPECTED_FILE', 'file'));
    }
    return callback(null, true);
  },
});

router.use(accessSession.requireApiAccess);
router.post('/carga-unificada', upload.single('file'), cargaController.cargaMasivaUnificada);

module.exports = router;
