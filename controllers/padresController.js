// controllers/padresController.js
const connection = require('../config/db');

exports.consultarTalleres = (req, res) => {
  const { numero_identificacion } = req.query;

  const query = `
    SELECT e.nombre, e.grado, m.nombre_materia,
      t.taller_entregado_estudiante, t.fecha_entrega_estudiante,
      t.taller_entregado_docente, t.fecha_entrega_docente, t.observaciones
    FROM estudiantes e
    JOIN materias_reprobadas mr ON e.id_estudiante = mr.id_estudiante
    JOIN materias m ON mr.id_materia = m.id_materia
    LEFT JOIN talleres t ON e.id_estudiante = t.id_estudiante AND m.id_materia = t.id_materia
    WHERE e.numero_identificacion = ?;
  `;

  connection.query(query, [numero_identificacion], (err, results) => {
    if (err) {
      console.error(err);
      return res.status(500).send('Error al consultar los talleres.');
    }
    if (results.length === 0) {
      return res.status(404).send('No se encontraron registros para este estudiante.');
    }
    res.json(results);
  });
};
