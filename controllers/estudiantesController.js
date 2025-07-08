// controllers/estudiantesController.js
const db = require('../config/db').promisePool;

exports.obtenerEstudiantes = async (req, res) => {
  const query = `
    SELECT e.id_estudiante, e.nombre, e.numero_identificacion, e.grado, GROUP_CONCAT(m.nombre_materia) AS materias_reprobadas
    FROM estudiantes e
    LEFT JOIN materias_reprobadas mr ON e.id_estudiante = mr.id_estudiante
    LEFT JOIN materias m ON mr.id_materia = m.id_materia
    GROUP BY e.id_estudiante;
  `;

  try {
    const [results] = await db.query(query);
    res.json(results);
  } catch (err) {
    console.error(err);
    res.status(500).send('Error al obtener los estudiantes.');
  }
};