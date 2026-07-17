// app.js
const express = require('express');
const app = express();
const path = require('path');

function normalizeBasePath(value) {
  if (!value || value === '/') return '';
  return `/${String(value).replace(/^\/+|\/+$/g, '')}`;
}

const APP_BASE_PATH = normalizeBasePath(process.env.APP_BASE_PATH || '/seguimiento-talleres');

// Configuración de middlewares
app.disable('x-powered-by');
app.set('trust proxy', 1);
app.use((req, res, next) => {
  res.set({
    'X-Content-Type-Options': 'nosniff',
    'X-Frame-Options': 'SAMEORIGIN',
    'Referrer-Policy': 'strict-origin-when-cross-origin',
  });
  next();
});
app.use(express.json({ limit: '100kb' }));
app.use(express.urlencoded({ extended: true, limit: '100kb' }));

const publicDirectory = path.join(__dirname, 'public');
const privateDirectory = path.join(__dirname, 'private');
const { accessSession } = require('./middleware/accessSession');

function createFrontendRouter() {
  const router = express.Router();
  const privateFiles = ['index.html', 'cargaMasiva.html', 'reportes.html', 'plantilla_carga_talleres.csv'];

  // La portada pública es exclusivamente la consulta para las familias.
  router.get('/', (req, res) => res.sendFile(path.join(publicDirectory, 'consultaPadres.html')));
  privateFiles.forEach((fileName) => {
    router.get(`/${fileName}`, accessSession.requirePageAccess, (req, res) => {
      res.set('Cache-Control', 'no-store');
      return res.sendFile(path.join(privateDirectory, fileName));
    });
  });
  router.use(express.static(publicDirectory, { index: false }));
  return router;
}

// Importar rutas
const cargaRoutes = require('./routes/cargaRoutes');
const estudiantesRoutes = require('./routes/estudiantesRoutes');
const talleresRoutes = require('./routes/talleresRoutes');
const padresRoutes = require('./routes/padresRoutes');
const reportesRoutes = require('./routes/reportesRoutes');
const accessRoutes = require('./routes/accessRoutes');

// Usar las mismas rutas en la raíz local y bajo el prefijo público de cPanel.
const apiRouter = express.Router();
apiRouter.use('/acceso', accessRoutes);
apiRouter.use('/carga', cargaRoutes);
apiRouter.use('/estudiantes', estudiantesRoutes);
apiRouter.use('/talleres', talleresRoutes);
apiRouter.use('/padres', padresRoutes);
apiRouter.use('/reportes', reportesRoutes);
app.use('/api', apiRouter);
if (APP_BASE_PATH) {
  app.use(`${APP_BASE_PATH}/api`, apiRouter);
}

// Servir las páginas después de las APIs para que ningún archivo estático las omita.
app.use('/', createFrontendRouter());
if (APP_BASE_PATH) {
  app.use(APP_BASE_PATH, createFrontendRouter());
}

app.use((err, req, res, next) => {
  if (err && err.name === 'MulterError') {
    const message = err.code === 'LIMIT_FILE_SIZE'
      ? 'El archivo supera el tamaño máximo permitido de 5 MB.'
      : 'Solo se permite un archivo .xlsx o .csv.';
    return res.status(400).json({ message });
  }

  console.error(err);
  return res.status(500).json({ message: 'Ocurrió un error inesperado en el servidor.' });
});

// Iniciar el servidor
const PORT = process.env.PORT || 3000;
if (require.main === module) {
  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Servidor iniciado en el puerto ${PORT}`);
  });
}

module.exports = app;
module.exports.normalizeBasePath = normalizeBasePath;
