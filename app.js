// app.js
const express = require('express');
const app = express();
const path = require('path');

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

// Servir archivos estáticos
app.use(express.static(path.join(__dirname, 'public')));

// Importar rutas
const cargaRoutes = require('./routes/cargaRoutes');
const estudiantesRoutes = require('./routes/estudiantesRoutes');
const talleresRoutes = require('./routes/talleresRoutes');
const padresRoutes = require('./routes/padresRoutes');
const reportesRoutes = require('./routes/reportesRoutes');

// Usar rutas
app.use('/api/carga', cargaRoutes);
app.use('/api/estudiantes', estudiantesRoutes);
app.use('/api/talleres', talleresRoutes);
app.use('/api/padres', padresRoutes);
app.use('/api/reportes', reportesRoutes);

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
