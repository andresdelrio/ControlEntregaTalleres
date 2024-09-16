// controllers/reportesController.js
// controllers/talleresController.js
const connection = require('../config/db');

exports.obtenerEstudiantesNoEntregados = (req, res) => {
    const query = `
      SELECT 
        e.id_estudiante,
        e.nombre,
        e.grado,
        GROUP_CONCAT(m.nombre_materia SEPARATOR ', ') AS materias_no_entregadas
      FROM estudiantes e
      JOIN materias_reprobadas mr ON e.id_estudiante = mr.id_estudiante
      JOIN materias m ON mr.id_materia = m.id_materia
      LEFT JOIN talleres t ON e.id_estudiante = t.id_estudiante AND m.id_materia = t.id_materia
      WHERE t.taller_entregado_estudiante IS NULL OR t.taller_entregado_estudiante = FALSE
      GROUP BY e.id_estudiante, e.nombre, e.grado
      ORDER BY e.nombre;
    `;
  
    connection.query(query, (err, results) => {
      if (err) {
        console.error(err);
        return res.status(500).send('Error al obtener la lista de estudiantes que no han entregado talleres.');
      }
      res.json(results);
    });
  };
  