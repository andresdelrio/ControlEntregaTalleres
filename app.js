// app.js
const express = require('express');
const app = express();
const cors = require('cors');
const path = require('path');

// Configuración de middlewares
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

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

// Iniciar el servidor
const PORT = process.env.PORT || 3000;
app.listen(PORT, '0.0.0.0', () => {
  console.log(`Servidor iniciado en el puerto ${PORT}`);
});
